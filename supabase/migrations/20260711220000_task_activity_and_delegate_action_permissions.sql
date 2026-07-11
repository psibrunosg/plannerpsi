-- Task history and least-privilege delegation.
-- Owners keep full task editing rights. Delegates can only change progress through
-- the RPC below, so they cannot change scheduling, ownership, clinical links, or content.

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('created', 'progress_updated', 'status_changed', 'completed', 'reopened')),
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.task_activity enable row level security;

create index if not exists task_activity_task_created_idx
  on public.task_activity (task_id, created_at desc);

drop policy if exists "Task participants can read activity" on public.task_activity;
create policy "Task participants can read activity"
  on public.task_activity for select to authenticated
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id
      and ((select auth.uid()) = t.user_id or (select auth.uid()) = t.assignee_id)
  ));

-- Activity is written exclusively by the database trigger. No client can forge it.
revoke all on public.task_activity from anon, authenticated;
grant select on public.task_activity to authenticated;

create or replace function public.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  payload jsonb := '{}'::jsonb;
  event_action text;
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, actor_id, action, changes)
    values (new.id, (select auth.uid()), 'created', jsonb_build_object('status', new.status));
    return new;
  end if;

  if new.status is distinct from old.status then
    payload := payload || jsonb_build_object('status', jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  if new.completion_percentage is distinct from old.completion_percentage then
    payload := payload || jsonb_build_object('completion_percentage', jsonb_build_object('from', old.completion_percentage, 'to', new.completion_percentage));
  end if;
  if new.actual_minutes is distinct from old.actual_minutes then
    payload := payload || jsonb_build_object('actual_minutes', jsonb_build_object('from', old.actual_minutes, 'to', new.actual_minutes));
  end if;

  if payload = '{}'::jsonb then
    return new;
  end if;

  event_action := case
    when old.status <> 'done' and new.status = 'done' then 'completed'
    when old.status = 'done' and new.status <> 'done' then 'reopened'
    when new.status is distinct from old.status then 'status_changed'
    else 'progress_updated'
  end;

  insert into public.task_activity (task_id, actor_id, action, changes)
  values (new.id, (select auth.uid()), event_action, payload);
  return new;
end;
$$;

drop trigger if exists tasks_log_activity on public.tasks;
create trigger tasks_log_activity
  after insert or update on public.tasks
  for each row execute function public.log_task_activity();

-- Remove the broad delegate update policy introduced with task delegation.
-- This policy otherwise lets a delegate edit any column exposed by the API.
drop policy if exists "Users can update owned or assigned tasks" on public.tasks;
drop policy if exists "Task owners can update tasks" on public.tasks;
create policy "Task owners can update tasks"
  on public.tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.update_delegated_task_progress(
  p_task_id uuid,
  p_status text default null,
  p_completion_percentage integer default null,
  p_actual_minutes integer default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  task_row public.tasks;
  next_status text;
  next_completion integer;
  next_minutes integer;
begin
  if (select auth.uid()) is null then
    raise exception 'authentication required';
  end if;
  if p_status is not null and p_status not in ('backlog', 'todo', 'in_progress', 'done', 'archived') then
    raise exception 'invalid task status';
  end if;
  if p_completion_percentage is not null and p_completion_percentage not between 0 and 100 then
    raise exception 'completion percentage must be between 0 and 100';
  end if;
  if p_actual_minutes is not null and p_actual_minutes < 0 then
    raise exception 'actual minutes cannot be negative';
  end if;
  if p_status is null and p_completion_percentage is null and p_actual_minutes is null then
    raise exception 'at least one progress field is required';
  end if;

  select * into task_row
  from public.tasks
  where id = p_task_id and assignee_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'task not found or delegate access denied';
  end if;

  next_status := coalesce(p_status, task_row.status);
  next_completion := coalesce(p_completion_percentage, task_row.completion_percentage, 0);
  next_minutes := coalesce(p_actual_minutes, task_row.actual_minutes);

  if next_status = 'done' then
    next_completion := 100;
  elsif p_completion_percentage = 100 and p_status is null then
    next_status := 'done';
  end if;

  update public.tasks
  set status = next_status,
      kanban_column = next_status,
      completion_percentage = next_completion,
      actual_minutes = next_minutes,
      completed_at = case when next_status = 'done' then coalesce(task_row.completed_at, now()) else null end,
      updated_at = now()
  where id = task_row.id
  returning * into task_row;

  return task_row;
end;
$$;

revoke all on function public.log_task_activity() from public, anon, authenticated;
revoke all on function public.update_delegated_task_progress(uuid, text, integer, integer) from public, anon;
grant execute on function public.update_delegated_task_progress(uuid, text, integer, integer) to authenticated;
