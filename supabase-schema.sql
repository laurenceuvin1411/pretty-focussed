-- ─────────────────────────────────────────────────────────────────────────
-- Laurence OS — Supabase Schema
-- Plak dit volledig in de Supabase SQL Editor en klik "Run"
-- Veilig om meerdere keren te draaien (idempotent)
-- ─────────────────────────────────────────────────────────────────────────

-- HABITS
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  category text not null default 'physical',
  icon text not null default '⭐',
  target_frequency text not null default 'daily',
  custom_days integer[],
  color text not null default '#D4A96A',
  "order" integer not null default 0,
  active boolean not null default true
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  habit_id uuid references habits(id) on delete cascade not null,
  date date not null,
  completed boolean not null default true,
  note text,
  unique(user_id, habit_id, date)
);

-- TASKS
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  business text not null default 'personal',
  category text not null default 'operations',
  priority integer not null default 2,
  needle_mover boolean not null default false,
  status text not null default 'backlog',
  due_date date,
  scheduled_date date,
  estimated_minutes integer,
  completed_at timestamptz,
  created_at timestamptz default now(),
  tags text[] default '{}'
);

-- LEADS
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  channel text not null,
  temperature text not null default 'Warm',
  program text not null,
  status text not null default 'new',
  last_contact date not null default current_date,
  next_follow_up date,
  value numeric not null default 0,
  probability integer not null default 10,
  notes text default '',
  won_at timestamptz,
  lost_at timestamptz,
  created_at date default current_date
);

-- Extra kolommen (voor het geval leads al bestond zonder deze velden)
alter table leads add column if not exists probability integer not null default 10;
alter table leads add column if not exists won_at timestamptz;
alter table leads add column if not exists lost_at timestamptz;

-- LEAD ACTIVITIES (timeline per lead)
create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  lead_id uuid references leads(id) on delete cascade not null,
  type text not null default 'note', -- note | contact | call | email | meeting | status_change
  content text not null,
  created_at timestamptz default now()
);

-- FINANCE
create table if not exists revenue_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  amount numeric not null,
  business text not null,
  type text not null,
  offer text not null,
  client_name text,
  status text not null default 'pending',
  notes text
);

create table if not exists expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  amount numeric not null,
  business text not null,
  category text not null,
  description text not null,
  recurring boolean not null default false,
  vat_deductible boolean not null default false
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  last_updated date default current_date
);

-- PLANNER
create table if not exists planner_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  title text not null,
  type text not null,
  color text not null,
  start_time text,
  end_time text,
  notes text
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  area text not null,
  category text not null,
  icon text not null default '🎯',
  business text,
  horizon text not null default 'annual',
  quarter text,
  target_number numeric not null default 0,
  current_number numeric not null default 0,
  unit text not null default '',
  target_date date,
  status text not null default 'active',
  why_it_matters text default '',
  milestones jsonb default '[]',
  xp_reward integer not null default 100,
  color text not null default '#D4A96A'
);

create table if not exists week_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  day text not null,
  start_time text not null,
  end_time text not null,
  type text not null,
  label text not null,
  notes text,
  business text
);

-- RECURRING TASKS
create table if not exists recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  business text not null,
  category text not null,
  priority integer not null default 2,
  needle_mover boolean not null default false,
  days integer[] not null default '{}',
  active boolean not null default true,
  estimated_minutes integer,
  tags text[] default '{}'
);

create table if not exists recurring_generated_dates (
  user_id uuid references auth.users not null,
  date date not null,
  primary key (user_id, date)
);

-- VISION (één rij per user, als JSONB)
create table if not exists user_vision (
  user_id uuid primary key references auth.users not null,
  data jsonb not null default '{}'
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table tasks enable row level security;
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table revenue_entries enable row level security;
alter table expense_entries enable row level security;
alter table accounts enable row level security;
alter table planner_events enable row level security;
alter table goals enable row level security;
alter table week_blocks enable row level security;
alter table recurring_tasks enable row level security;
alter table recurring_generated_dates enable row level security;
alter table user_vision enable row level security;

-- Policies (drop-eerst zodat dit script herhaalbaar is)
drop policy if exists "own" on habits;
create policy "own" on habits for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on habit_logs;
create policy "own" on habit_logs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on tasks;
create policy "own" on tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on leads;
create policy "own" on leads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on lead_activities;
create policy "own" on lead_activities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on revenue_entries;
create policy "own" on revenue_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on expense_entries;
create policy "own" on expense_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on accounts;
create policy "own" on accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on planner_events;
create policy "own" on planner_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on goals;
create policy "own" on goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on week_blocks;
create policy "own" on week_blocks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on recurring_tasks;
create policy "own" on recurring_tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on recurring_generated_dates;
create policy "own" on recurring_generated_dates for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own" on user_vision;
create policy "own" on user_vision for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
