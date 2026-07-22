-- Adds persistent media metadata used by the production app after initial schema setup.

alter table if exists public.profiles add column if not exists avatar_media jsonb;
alter table if exists public.programs add column if not exists product_video jsonb;
alter table if exists public.messages add column if not exists media_storage_bucket text;
alter table if exists public.messages add column if not exists media_storage_path text;
alter table if exists public.messages add column if not exists media_name text;
alter table if exists public.messages add column if not exists media_expires_at timestamptz;
