-- StepWise Plus production database schema
-- Run this in Supabase SQL editor before enabling production mode.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','coach','client')),
  name text not null,
  email text not null unique,
  status text not null default 'active' check (status in ('active','banned','deleted')),
  coach_id uuid references public.profiles(id),
  ref_code text unique,
  avatar_url text,
  avatar_media jsonb,
  profile_photo_locked boolean not null default false,
  client_messages_open boolean not null default true,
  cover_bg text,
  schedule_prefs jsonb not null default '{}'::jsonb,
  schedule_prefs_locked boolean not null default false,
  program_start_date date,
  program_end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_codes (
  code text primary key,
  status text not null default 'active' check (status in ('active','used','revoked')),
  created_by uuid references public.profiles(id),
  used_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles(id),
  name text not null,
  description text,
  duration text,
  banned_foods jsonb not null default '[]'::jsonb,
  product_video jsonb,
  is_template boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.program_tasks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  section text,
  task_type text,
  scheduled_time time,
  note text,
  photo_required boolean not null default true,
  snooze_enabled boolean not null default true,
  snooze_options jsonb not null default '[15,30,60]'::jsonb,
  repeat_type text not null default 'daily',
  repeat_days jsonb not null default '[1,2,3,4,5,6,7]'::jsonb,
  cycle_length integer,
  cycle_days jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0
);

create table if not exists public.client_programs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id),
  program_id uuid not null references public.programs(id),
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  measured_at date not null default current_date,
  height_cm numeric,
  weight_kg numeric,
  body_fat numeric,
  bmi numeric,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.task_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  program_task_id uuid references public.program_tasks(id),
  action text not null,
  proof_url text,
  proof_status text check (proof_status in ('pending','approved','rejected')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_task_status (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid references public.profiles(id),
  program_task_id uuid references public.program_tasks(id),
  task_index integer,
  task_title text,
  task_date date not null default current_date,
  completed boolean not null default false,
  proof_url text,
  proof_status text check (proof_status in ('pending','approved','rejected')),
  snooze_used integer not null default 0,
  next_alarm time,
  note text,
  updated_at timestamptz not null default now(),
  unique (client_id, task_date, task_index)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid references public.profiles(id) on delete cascade,
  room text,
  message_type text not null default 'text' check (message_type in ('text','photo','audio','system')),
  text text,
  media_url text,
  media_storage_bucket text,
  media_storage_path text,
  media_name text,
  media_expires_at timestamptz,
  read_by jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id),
  client_id uuid not null references public.profiles(id),
  type text not null default 'Görüşme',
  date date not null,
  time time not null,
  duration text not null default '30 dk',
  status text not null default 'pending' check (status in ('pending','confirmed','proposed','cancelled')),
  requested_by text not null check (requested_by in ('coach','client')),
  created_at timestamptz not null default now()
);

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete cascade,
  media_type text not null check (media_type in ('profile','task_photo','product_video','message_photo','message_audio')),
  url text not null,
  storage_bucket text,
  storage_path text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  text text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null default 'android',
  token text not null unique,
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_table text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.coach_codes enable row level security;
alter table public.programs enable row level security;
alter table public.program_tasks enable row level security;
alter table public.client_programs enable row level security;
alter table public.body_metrics enable row level security;
alter table public.task_logs enable row level security;
alter table public.daily_task_status enable row level security;
alter table public.messages enable row level security;
alter table public.appointments enable row level security;
alter table public.media_files enable row level security;
alter table public.notifications enable row level security;
alter table public.device_tokens enable row level security;
alter table public.audit_logs enable row level security;

alter table if exists public.profiles add column if not exists avatar_media jsonb;
alter table if exists public.programs add column if not exists product_video jsonb;
alter table if exists public.messages add column if not exists media_storage_bucket text;
alter table if exists public.messages add column if not exists media_storage_path text;
alter table if exists public.messages add column if not exists media_name text;
alter table if exists public.messages add column if not exists media_expires_at timestamptz;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin'
$$;

create or replace function public.is_my_coach(coach uuid, client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = client and coach_id = coach
  )
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  clean_name text;
  activation_code text;
  coach_ref text;
  coach_profile uuid;
  new_ref text;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  clean_name := nullif(trim(coalesce(new.raw_user_meta_data->>'name', '')), '');

  if requested_role = 'admin' then
    if exists(select 1 from public.profiles where role = 'admin') then
      raise exception 'Initial admin already exists';
    end if;
    if lower(new.email) <> 'admin@stepwiseplus.app' then
      raise exception 'Initial admin email is not allowed';
    end if;

    insert into public.profiles(id, role, name, email)
    values (new.id, 'admin', coalesce(clean_name, 'StepWise Plus Admin'), new.email);

    return new;
  end if;

  if requested_role = 'coach' then
    activation_code := upper(trim(coalesce(new.raw_user_meta_data->>'activation_code', '')));
    if not exists(select 1 from public.coach_codes where code = activation_code and status = 'active') then
      raise exception 'Invalid or used coach activation code';
    end if;

    new_ref := upper(trim(coalesce(new.raw_user_meta_data->>'ref_code', '')));
    if new_ref = '' then
      new_ref := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    end if;
    if exists(select 1 from public.profiles where ref_code = new_ref) then
      raise exception 'Coach reference code already exists';
    end if;

    insert into public.profiles(id, role, name, email, ref_code)
    values (new.id, 'coach', coalesce(clean_name, split_part(new.email, '@', 1)), new.email, new_ref);

    update public.coach_codes
    set status = 'used', used_by = new.id, used_at = now()
    where code = activation_code;

    return new;
  end if;

  if requested_role = 'client' then
    coach_ref := upper(trim(coalesce(new.raw_user_meta_data->>'coach_ref', '')));
    select id into coach_profile
    from public.profiles
    where role = 'coach' and status = 'active' and ref_code = coach_ref
    limit 1;

    if coach_profile is null then
      raise exception 'Coach reference code not found';
    end if;

    insert into public.profiles(id, role, name, email, coach_id)
    values (new.id, 'client', coalesce(clean_name, split_part(new.email, '@', 1)), new.email, coach_profile);

    return new;
  end if;

  raise exception 'Unsupported account role';
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at();

drop policy if exists "profiles_select_scoped" on public.profiles;
drop policy if exists "profiles_update_self_or_admin" on public.profiles;
drop policy if exists "profiles_insert_admin_only" on public.profiles;
drop policy if exists "coach_codes_admin_all" on public.coach_codes;
drop policy if exists "programs_scoped" on public.programs;
drop policy if exists "program_tasks_scoped" on public.program_tasks;
drop policy if exists "client_programs_scoped" on public.client_programs;
drop policy if exists "body_metrics_scoped" on public.body_metrics;
drop policy if exists "task_logs_scoped" on public.task_logs;
drop policy if exists "daily_task_status_scoped" on public.daily_task_status;
drop policy if exists "messages_scoped" on public.messages;
drop policy if exists "appointments_scoped" on public.appointments;
drop policy if exists "media_scoped" on public.media_files;
drop policy if exists "notifications_scoped" on public.notifications;
drop policy if exists "device_tokens_scoped" on public.device_tokens;
drop policy if exists "audit_admin_read" on public.audit_logs;
drop policy if exists "audit_admin_insert" on public.audit_logs;

create policy "profiles_select_scoped" on public.profiles
for select using (
  public.is_admin()
  or id = auth.uid()
  or coach_id = auth.uid()
  or public.is_my_coach(id, auth.uid())
);

create policy "profiles_update_self_or_admin" on public.profiles
for update using (public.is_admin() or id = auth.uid());

create policy "profiles_insert_admin_only" on public.profiles
for insert with check (public.is_admin());

create policy "coach_codes_admin_all" on public.coach_codes
for all using (public.is_admin()) with check (public.is_admin());

create policy "programs_scoped" on public.programs
for all using (public.is_admin() or coach_id is null or coach_id = auth.uid())
with check (public.is_admin() or coach_id = auth.uid());

create policy "program_tasks_scoped" on public.program_tasks
for all using (
  public.is_admin()
  or exists(select 1 from public.programs p where p.id = program_id and (p.coach_id is null or p.coach_id = auth.uid()))
);

create policy "client_programs_scoped" on public.client_programs
for all using (
  public.is_admin()
  or coach_id = auth.uid()
  or client_id = auth.uid()
);

create policy "body_metrics_scoped" on public.body_metrics
for all using (
  public.is_admin()
  or coach_id = auth.uid()
  or client_id = auth.uid()
);

create policy "task_logs_scoped" on public.task_logs
for all using (
  public.is_admin()
  or coach_id = auth.uid()
  or client_id = auth.uid()
);

create policy "daily_task_status_scoped" on public.daily_task_status
for all using (
  public.is_admin()
  or coach_id = auth.uid()
  or client_id = auth.uid()
);

create policy "messages_scoped" on public.messages
for all using (
  public.is_admin()
  or sender_id = auth.uid()
  or receiver_id = auth.uid()
  or room = 'coaches' and public.current_role() = 'coach'
);

create policy "appointments_scoped" on public.appointments
for all using (
  public.is_admin()
  or coach_id = auth.uid()
  or client_id = auth.uid()
);

create policy "media_scoped" on public.media_files
for all using (
  public.is_admin()
  or owner_id = auth.uid()
  or client_id = auth.uid()
  or public.is_my_coach(auth.uid(), client_id)
);

create policy "notifications_scoped" on public.notifications
for all using (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = public.notifications.user_id
      and p.coach_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = public.notifications.user_id
      and p.coach_id = auth.uid()
  )
);

create policy "device_tokens_scoped" on public.device_tokens
for all using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

create policy "audit_admin_read" on public.audit_logs
for select using (public.is_admin());

create policy "audit_admin_insert" on public.audit_logs
for insert with check (public.is_admin());

create or replace function public.admin_bootstrap(owner_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set role = 'admin', status = 'active'
  where email = owner_email;
end;
$$;

revoke execute on function public.admin_bootstrap(text) from public, anon, authenticated;

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_coach_id_idx on public.profiles(coach_id);
create index if not exists messages_sender_receiver_idx on public.messages(sender_id, receiver_id, created_at desc);
create index if not exists appointments_coach_date_idx on public.appointments(coach_id, date, time);
create index if not exists appointments_client_date_idx on public.appointments(client_id, date, time);
create index if not exists task_logs_client_created_idx on public.task_logs(client_id, created_at desc);
create index if not exists daily_task_status_client_date_idx on public.daily_task_status(client_id, task_date desc);
create index if not exists media_files_owner_idx on public.media_files(owner_id, created_at desc);
create index if not exists media_files_client_idx on public.media_files(client_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, created_at desc);
create index if not exists device_tokens_user_idx on public.device_tokens(user_id, enabled);

insert into storage.buckets (id, name, public)
values ('stepwise-media', 'stepwise-media', false)
on conflict (id) do nothing;

drop policy if exists "storage_stepwise_read_scoped" on storage.objects;
drop policy if exists "storage_stepwise_insert_own" on storage.objects;
drop policy if exists "storage_stepwise_update_own_or_admin" on storage.objects;
drop policy if exists "storage_stepwise_delete_own_or_admin" on storage.objects;

create policy "storage_stepwise_read_scoped" on storage.objects
for select using (
  bucket_id = 'stepwise-media'
  and (
    public.is_admin()
    or owner = auth.uid()
    or exists (
      select 1
      from public.media_files mf
      where mf.storage_bucket = bucket_id
        and mf.storage_path = name
        and (mf.owner_id = auth.uid() or mf.client_id = auth.uid() or public.is_my_coach(auth.uid(), mf.client_id))
    )
  )
);

create policy "storage_stepwise_insert_own" on storage.objects
for insert with check (
  bucket_id = 'stepwise-media'
  and owner = auth.uid()
);

create policy "storage_stepwise_update_own_or_admin" on storage.objects
for update using (
  bucket_id = 'stepwise-media'
  and (owner = auth.uid() or public.is_admin())
);

create policy "storage_stepwise_delete_own_or_admin" on storage.objects
for delete using (
  bucket_id = 'stepwise-media'
  and (owner = auth.uid() or public.is_admin())
);
