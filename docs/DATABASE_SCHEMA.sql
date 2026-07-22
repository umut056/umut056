-- StepWise Plus V2 - Database Schema Contract
-- This file is a planning contract, not an auto-run migration.
-- Existing production tables must not be dropped. New changes should be
-- converted into timestamped Supabase migrations after review.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Existing core tables kept as source of truth
-- ---------------------------------------------------------------------

-- Existing tables in supabase/schema.sql:
-- profiles, coach_codes, programs, program_tasks, client_programs,
-- body_metrics, task_logs, daily_task_status, messages, appointments,
-- media_files, notifications, device_tokens, audit_logs.

-- ---------------------------------------------------------------------
-- Tenant and configuration layer
-- ---------------------------------------------------------------------

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active',
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  key text not null,
  enabled boolean not null default false,
  scope text not null default 'global',
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key, scope)
);

create table if not exists public.remote_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key, version)
);

-- ---------------------------------------------------------------------
-- User, coach and client domain extensions
-- ---------------------------------------------------------------------

create table if not exists public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  tenant_id uuid references public.tenants(id),
  title text,
  bio text,
  specialties text[] not null default '{}',
  public_ref_code text unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  tenant_id uuid references public.tenants(id),
  start_date date,
  target_date date,
  goal_type text,
  lifestyle jsonb not null default '{}'::jsonb,
  consent jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Tracking domains
-- ---------------------------------------------------------------------

create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  entry_date date not null,
  weight_kg numeric(6,2) not null,
  source text not null default 'manual',
  note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (client_id, entry_date, source)
);

create table if not exists public.measurement_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  entry_date date not null,
  height_cm numeric(6,2),
  waist_cm numeric(6,2),
  hip_cm numeric(6,2),
  chest_cm numeric(6,2),
  arm_cm numeric(6,2),
  leg_cm numeric(6,2),
  body_fat_estimate numeric(5,2),
  extra_weight_estimate numeric(6,2),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (client_id, entry_date)
);

create table if not exists public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  media_file_id uuid references public.media_files(id) on delete set null,
  category text not null default 'progress',
  status text not null default 'pending',
  note text,
  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.nutrition_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  meal_type text not null,
  title text,
  calories numeric(8,2),
  protein_g numeric(8,2),
  carb_g numeric(8,2),
  fat_g numeric(8,2),
  media_file_id uuid references public.media_files(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  amount_ml integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  activity_type text not null,
  duration_minutes integer,
  steps integer,
  calories numeric(8,2),
  note text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Product, AI, reporting and event domains
-- ---------------------------------------------------------------------

create table if not exists public.product_catalogs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  plugin_key text not null,
  name text not null,
  version text not null default '1.0.0',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, plugin_key, version)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  catalog_id uuid references public.product_catalogs(id) on delete cascade,
  name text not null,
  category text,
  units jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id),
  log_date date not null,
  amount numeric(8,2),
  unit text,
  task_log_id uuid references public.task_logs(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_prompt_library (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  version integer not null,
  module text not null,
  locale text not null default 'tr-TR',
  prompt text not null,
  input_schema jsonb not null default '{}'::jsonb,
  output_schema jsonb not null default '{}'::jsonb,
  safety_rules jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (key, version, locale)
);

create table if not exists public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  module text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  role text not null,
  content text not null,
  prompt_key text,
  prompt_version integer,
  model text,
  token_usage jsonb not null default '{}'::jsonb,
  safety_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  client_id uuid references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  type text not null,
  period_start date,
  period_end date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.domain_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id),
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  actor_id uuid references public.profiles(id),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.health_scores (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  score_date date not null,
  score integer not null check (score between 0 and 100),
  components jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (client_id, score_date)
);

-- ---------------------------------------------------------------------
-- Index and RLS contract
-- ---------------------------------------------------------------------

create index if not exists weight_entries_client_date_idx on public.weight_entries(client_id, entry_date desc);
create index if not exists measurement_entries_client_date_idx on public.measurement_entries(client_id, entry_date desc);
create index if not exists progress_photos_client_status_idx on public.progress_photos(client_id, status, created_at desc);
create index if not exists domain_events_type_created_idx on public.domain_events(event_type, created_at desc);
create index if not exists reports_client_type_period_idx on public.reports(client_id, type, period_start desc);

-- Every new table above must enable RLS in the actual migration.
-- Policies must follow the same profile/coach/admin scope used by current schema.

