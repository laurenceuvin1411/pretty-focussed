-- ============================================================
-- LAURENCE OS — Supabase Migrations
-- Run this in Supabase > SQL Editor
-- ============================================================

-- 1. Extra kolommen op leads tabel
alter table leads add column if not exists photo_url text;
alter table leads add column if not exists instagram_handle text;
alter table leads add column if not exists next_action text;
alter table leads add column if not exists next_action_priority text;
alter table leads add column if not exists paid_at timestamptz;

-- 2. sales_finance_records tabel
create table if not exists sales_finance_records (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  lead_id             text,
  client_name         text not null default '',
  company_name        text not null default '',
  email               text not null default '',
  service             text not null default '',
  channel             text not null default '',
  invoice_number      text not null default '',
  amount_excl_vat     numeric not null default 0,
  vat_rate            numeric not null default 21,
  vat_amount          numeric not null default 0,
  total_incl_vat      numeric not null default 0,
  invoiced            boolean not null default false,
  invoiced_at         timestamptz,
  paid                boolean not null default false,
  paid_at             timestamptz,
  vat_received        boolean not null default false,
  vat_received_at     timestamptz,
  kmo_requested       boolean not null default false,
  kmo_requested_at    timestamptz,
  kmo_approved        boolean not null default false,
  kmo_approved_at     timestamptz,
  kmo_received        boolean not null default false,
  kmo_received_at     timestamptz,
  kmo_amount          numeric not null default 0,
  won_at              timestamptz,
  notes               text not null default '',
  created_at          timestamptz not null default now()
);

-- RLS voor sales_finance_records
alter table sales_finance_records enable row level security;

drop policy if exists "Users can manage own finance records" on sales_finance_records;
create policy "Users can manage own finance records"
  on sales_finance_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Zorg dat RLS op alle andere tabellen correct staat
-- (al geconfigureerd, maar veilig om te bevestigen)
alter table leads enable row level security;
alter table lead_activities enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table tasks enable row level security;

-- 4. Recurring tasks: frequency + monthly_day kolommen
alter table recurring_tasks add column if not exists frequency text not null default 'weekly';
alter table recurring_tasks add column if not exists monthly_day integer;

-- 5. BTW-gegevens klant op finance records
alter table sales_finance_records add column if not exists vat_number text not null default '';
alter table sales_finance_records add column if not exists vat_regime text not null default 'normaal';
