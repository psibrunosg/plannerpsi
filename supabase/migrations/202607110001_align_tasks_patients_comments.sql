-- Align the PlannerPsi schema with the task, patient and collaboration modules.
-- Apply with the Supabase CLI or Dashboard SQL editor after reviewing the policies.

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  document text,
  birth_date date,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.patients enable row level security;

drop policy if exists "Users manage their own patients" on public.patients;
create policy "Users manage their own patients"
  on public.patients for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists patients_user_id_name_idx on public.patients (user_id, name);

alter table public.tasks
  add column if not exists patient_id uuid references public.patients(id) on delete set null;
create index if not exists tasks_patient_id_idx on public.tasks (patient_id) where patient_id is not null;

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

alter table public.task_comments enable row level security;

drop policy if exists "Users read comments on their tasks" on public.task_comments;
create policy "Users read comments on their tasks"
  on public.task_comments for select
  using (exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()));

drop policy if exists "Users add comments to their tasks" on public.task_comments;
create policy "Users add comments to their tasks"
  on public.task_comments for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

create index if not exists task_comments_task_created_idx on public.task_comments (task_id, created_at);
