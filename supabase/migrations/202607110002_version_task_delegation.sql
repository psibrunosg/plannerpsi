-- Version the task delegation and proposal model. Review and apply after the
-- base task schema migration in this repository.

alter table public.tasks
  add column if not exists assignee_id uuid references auth.users(id) on delete set null;
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id) where assignee_id is not null;

alter table public.tasks enable row level security;
drop policy if exists "Users can manage their own tasks" on public.tasks;
drop policy if exists "Users can view owned or assigned tasks" on public.tasks;
drop policy if exists "Users can update owned or assigned tasks" on public.tasks;
drop policy if exists "Users can insert their own tasks" on public.tasks;
drop policy if exists "Users can delete their own tasks" on public.tasks;

create policy "Users can view owned or assigned tasks"
  on public.tasks for select
  using (auth.uid() = user_id or auth.uid() = assignee_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update owned or assigned tasks"
  on public.tasks for update
  using (auth.uid() = user_id or auth.uid() = assignee_id)
  with check (auth.uid() = user_id or auth.uid() = assignee_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create table if not exists public.task_proposals (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_email text not null,
  receiver_email text not null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.task_proposals enable row level security;
create index if not exists task_proposals_receiver_pending_idx
  on public.task_proposals (lower(receiver_email), created_at desc) where status = 'pending';

drop policy if exists "Users read sent or received proposals" on public.task_proposals;
drop policy if exists "Users can view proposals sent to their email" on public.task_proposals;
drop policy if exists "Users can view proposals they sent" on public.task_proposals;
create policy "Users read sent or received proposals"
  on public.task_proposals for select
  using (auth.uid() = sender_id or lower(receiver_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Users send proposals" on public.task_proposals;
drop policy if exists "Users can insert proposals" on public.task_proposals;
create policy "Users send proposals"
  on public.task_proposals for insert
  with check (auth.uid() = sender_id and lower(sender_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "Recipients decide pending proposals" on public.task_proposals;
drop policy if exists "Users can update proposals sent to them (to accept/reject)" on public.task_proposals;
create policy "Recipients decide pending proposals"
  on public.task_proposals for update
  using (status = 'pending' and lower(receiver_email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  with check (lower(receiver_email) = lower(coalesce(auth.jwt() ->> 'email', '')) and status in ('accepted', 'rejected'));

-- Keep this migration independently runnable when the comments migration was
-- not applied beforehand.
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

drop policy if exists "Delegates read task comments" on public.task_comments;
create policy "Delegates read task comments"
  on public.task_comments for select
  using (exists (
    select 1 from public.tasks t
    where t.id = task_id and (t.user_id = auth.uid() or t.assignee_id = auth.uid())
  ));

drop policy if exists "Delegates add task comments" on public.task_comments;
create policy "Delegates add task comments"
  on public.task_comments for insert
  with check (
    auth.uid() = user_id and exists (
      select 1 from public.tasks t
      where t.id = task_id and (t.user_id = auth.uid() or t.assignee_id = auth.uid())
    )
  );
