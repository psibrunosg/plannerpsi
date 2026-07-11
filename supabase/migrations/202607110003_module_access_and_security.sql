-- Initial role/module access model. Existing users retain Personal access;
-- legacy hierarchy levels bootstrap admin/professional/collaborator roles.

alter table public.profiles
  add column if not exists app_role text not null default 'personal'
  check (app_role in ('admin', 'professional', 'collaborator', 'learner', 'personal'));

update public.profiles
set app_role = case
  when level >= 7 then 'admin'
  when level >= 4 then 'professional'
  when level >= 2 then 'collaborator'
  else 'personal'
end
where app_role = 'personal';

create table if not exists public.user_module_access (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null check (module_key in ('personal', 'operation', 'study', 'clinical')),
  created_at timestamptz not null default now(),
  primary key (user_id, module_key)
);

alter table public.user_module_access enable row level security;
drop policy if exists "Users read their module access" on public.user_module_access;
create policy "Users read their module access"
  on public.user_module_access for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.can_access_module(p_module text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid()) is not null and (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (
          p.app_role = 'admin'
          or (p.app_role = 'professional' and p_module in ('personal', 'operation', 'study', 'clinical'))
          or (p.app_role = 'collaborator' and p_module in ('personal', 'operation'))
          or (p.app_role = 'learner' and p_module in ('personal', 'study'))
          or (p.app_role = 'personal' and p_module = 'personal')
        )
    )
    or exists (
      select 1 from public.user_module_access a
      where a.user_id = (select auth.uid()) and a.module_key = p_module
    )
  );
$$;

revoke all on function public.can_access_module(text) from public, anon;
grant execute on function public.can_access_module(text) to authenticated;

-- Clinical records remain owner-only and additionally require the clinical module.
drop policy if exists "Users manage their own patients" on public.patients;
create policy "Clinical users manage their own patients"
  on public.patients for all to authenticated
  using ((select public.can_access_module('clinical')) and (select auth.uid()) = user_id)
  with check ((select public.can_access_module('clinical')) and (select auth.uid()) = user_id);

create or replace function public.increment_xp(user_id uuid, amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null or user_id <> (select auth.uid()) or amount not between 1 and 100 then
    raise exception 'not authorized to increment XP';
  end if;
  update public.profiles set xp = xp + amount where id = user_id;
end;
$$;

alter function public.handle_new_user() set search_path = public;
alter function public.update_updated_at_column() set search_path = public;
revoke all on function public.increment_xp(uuid, integer) from public, anon;
grant execute on function public.increment_xp(uuid, integer) to authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
