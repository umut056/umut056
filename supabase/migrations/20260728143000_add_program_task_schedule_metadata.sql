alter table public.program_tasks
  add column if not exists repeat_type text not null default 'daily',
  add column if not exists repeat_days jsonb not null default '[1,2,3,4,5,6,7]'::jsonb,
  add column if not exists cycle_length integer,
  add column if not exists cycle_days jsonb not null default '[]'::jsonb;
