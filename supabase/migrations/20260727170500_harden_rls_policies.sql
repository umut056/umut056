-- StepWise Plus V2 T1
-- Harden public table RLS with separate role-aware read/write policies.

create or replace function public.is_client_of_current_coach(client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = client
      and p.coach_id = auth.uid()
      and p.status = 'active'
  )
$$;

create or replace function public.can_access_pair(coach uuid, client uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or auth.uid() = coach
    or auth.uid() = client
    or public.is_client_of_current_coach(client)
$$;

create or replace function public.can_message_between(sender uuid, receiver uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or (
      sender = auth.uid()
      and exists (
        select 1
        from public.profiles s
        join public.profiles r on r.id = receiver
        where s.id = sender
          and (
            (s.role = 'coach' and r.role = 'client' and r.coach_id = sender)
            or (s.role = 'client' and r.role = 'coach' and s.coach_id = receiver)
            or (s.role = 'coach' and r.role = 'coach')
          )
      )
    )
$$;

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

drop policy if exists "profiles_select_v2" on public.profiles;
drop policy if exists "profiles_insert_admin_v2" on public.profiles;
drop policy if exists "profiles_update_self_coach_admin_v2" on public.profiles;
drop policy if exists "profiles_delete_admin_v2" on public.profiles;

create policy "profiles_select_v2" on public.profiles
for select using (
  public.is_admin()
  or id = auth.uid()
  or coach_id = auth.uid()
  or public.is_my_coach(id, auth.uid())
);

create policy "profiles_insert_admin_v2" on public.profiles
for insert with check (public.is_admin());

create policy "profiles_update_self_coach_admin_v2" on public.profiles
for update using (
  public.is_admin()
  or id = auth.uid()
  or (role = 'client' and coach_id = auth.uid())
) with check (
  public.is_admin()
  or (id = auth.uid() and role = public.current_role())
  or (role = 'client' and coach_id = auth.uid())
);

create policy "profiles_delete_admin_v2" on public.profiles
for delete using (public.is_admin());

drop policy if exists "coach_codes_select_admin_v2" on public.coach_codes;
drop policy if exists "coach_codes_write_admin_v2" on public.coach_codes;

create policy "coach_codes_select_admin_v2" on public.coach_codes
for select using (public.is_admin());

create policy "coach_codes_write_admin_v2" on public.coach_codes
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "programs_select_v2" on public.programs;
drop policy if exists "programs_insert_coach_admin_v2" on public.programs;
drop policy if exists "programs_update_owner_admin_v2" on public.programs;
drop policy if exists "programs_delete_owner_admin_v2" on public.programs;

create policy "programs_select_v2" on public.programs
for select using (
  public.is_admin()
  or coach_id is null
  or coach_id = auth.uid()
  or exists (
    select 1
    from public.client_programs cp
    where cp.program_id = public.programs.id
      and (cp.client_id = auth.uid() or cp.coach_id = auth.uid())
  )
);

create policy "programs_insert_coach_admin_v2" on public.programs
for insert with check (
  public.is_admin()
  or (public.current_role() = 'coach' and coach_id = auth.uid())
);

create policy "programs_update_owner_admin_v2" on public.programs
for update using (
  public.is_admin()
  or (public.current_role() = 'coach' and coach_id = auth.uid())
) with check (
  public.is_admin()
  or (public.current_role() = 'coach' and coach_id = auth.uid())
);

create policy "programs_delete_owner_admin_v2" on public.programs
for delete using (
  public.is_admin()
  or (public.current_role() = 'coach' and coach_id = auth.uid())
);

drop policy if exists "program_tasks_select_v2" on public.program_tasks;
drop policy if exists "program_tasks_insert_owner_admin_v2" on public.program_tasks;
drop policy if exists "program_tasks_update_owner_admin_v2" on public.program_tasks;
drop policy if exists "program_tasks_delete_owner_admin_v2" on public.program_tasks;

create policy "program_tasks_select_v2" on public.program_tasks
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.programs p
    left join public.client_programs cp on cp.program_id = p.id
    where p.id = public.program_tasks.program_id
      and (
        p.coach_id is null
        or p.coach_id = auth.uid()
        or cp.client_id = auth.uid()
        or cp.coach_id = auth.uid()
      )
  )
);

create policy "program_tasks_insert_owner_admin_v2" on public.program_tasks
for insert with check (
  public.is_admin()
  or exists (
    select 1 from public.programs p
    where p.id = program_id and p.coach_id = auth.uid()
  )
);

create policy "program_tasks_update_owner_admin_v2" on public.program_tasks
for update using (
  public.is_admin()
  or exists (
    select 1 from public.programs p
    where p.id = program_id and p.coach_id = auth.uid()
  )
) with check (
  public.is_admin()
  or exists (
    select 1 from public.programs p
    where p.id = program_id and p.coach_id = auth.uid()
  )
);

create policy "program_tasks_delete_owner_admin_v2" on public.program_tasks
for delete using (
  public.is_admin()
  or exists (
    select 1 from public.programs p
    where p.id = program_id and p.coach_id = auth.uid()
  )
);

drop policy if exists "client_programs_select_v2" on public.client_programs;
drop policy if exists "client_programs_insert_coach_admin_v2" on public.client_programs;
drop policy if exists "client_programs_update_coach_admin_v2" on public.client_programs;
drop policy if exists "client_programs_delete_coach_admin_v2" on public.client_programs;

create policy "client_programs_select_v2" on public.client_programs
for select using (public.can_access_pair(coach_id, client_id));

create policy "client_programs_insert_coach_admin_v2" on public.client_programs
for insert with check (
  public.is_admin()
  or (
    public.current_role() = 'coach'
    and coach_id = auth.uid()
    and public.is_my_coach(coach_id, client_id)
  )
);

create policy "client_programs_update_coach_admin_v2" on public.client_programs
for update using (
  public.is_admin()
  or (public.current_role() = 'coach' and coach_id = auth.uid())
) with check (
  public.is_admin()
  or (
    public.current_role() = 'coach'
    and coach_id = auth.uid()
    and public.is_my_coach(coach_id, client_id)
  )
);

create policy "client_programs_delete_coach_admin_v2" on public.client_programs
for delete using (
  public.is_admin()
  or (public.current_role() = 'coach' and coach_id = auth.uid())
);

drop policy if exists "body_metrics_select_v2" on public.body_metrics;
drop policy if exists "body_metrics_insert_client_coach_admin_v2" on public.body_metrics;
drop policy if exists "body_metrics_update_client_coach_admin_v2" on public.body_metrics;
drop policy if exists "body_metrics_delete_admin_v2" on public.body_metrics;

create policy "body_metrics_select_v2" on public.body_metrics
for select using (public.can_access_pair(coach_id, client_id));

create policy "body_metrics_insert_client_coach_admin_v2" on public.body_metrics
for insert with check (
  public.is_admin()
  or client_id = auth.uid()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
);

create policy "body_metrics_update_client_coach_admin_v2" on public.body_metrics
for update using (
  public.is_admin()
  or client_id = auth.uid()
  or coach_id = auth.uid()
) with check (
  public.is_admin()
  or client_id = auth.uid()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
);

create policy "body_metrics_delete_admin_v2" on public.body_metrics
for delete using (public.is_admin());

drop policy if exists "task_logs_select_v2" on public.task_logs;
drop policy if exists "task_logs_insert_client_coach_admin_v2" on public.task_logs;
drop policy if exists "task_logs_update_coach_admin_v2" on public.task_logs;
drop policy if exists "task_logs_delete_admin_v2" on public.task_logs;

create policy "task_logs_select_v2" on public.task_logs
for select using (public.can_access_pair(coach_id, client_id));

create policy "task_logs_insert_client_coach_admin_v2" on public.task_logs
for insert with check (
  public.is_admin()
  or client_id = auth.uid()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
);

create policy "task_logs_update_coach_admin_v2" on public.task_logs
for update using (
  public.is_admin()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
) with check (
  public.is_admin()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
);

create policy "task_logs_delete_admin_v2" on public.task_logs
for delete using (public.is_admin());

drop policy if exists "daily_task_status_select_v2" on public.daily_task_status;
drop policy if exists "daily_task_status_insert_client_coach_admin_v2" on public.daily_task_status;
drop policy if exists "daily_task_status_update_client_coach_admin_v2" on public.daily_task_status;
drop policy if exists "daily_task_status_delete_admin_v2" on public.daily_task_status;

create policy "daily_task_status_select_v2" on public.daily_task_status
for select using (public.can_access_pair(coach_id, client_id));

create policy "daily_task_status_insert_client_coach_admin_v2" on public.daily_task_status
for insert with check (
  public.is_admin()
  or client_id = auth.uid()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
);

create policy "daily_task_status_update_client_coach_admin_v2" on public.daily_task_status
for update using (
  public.is_admin()
  or client_id = auth.uid()
  or coach_id = auth.uid()
) with check (
  public.is_admin()
  or client_id = auth.uid()
  or (coach_id = auth.uid() and public.is_my_coach(coach_id, client_id))
);

create policy "daily_task_status_delete_admin_v2" on public.daily_task_status
for delete using (public.is_admin());

drop policy if exists "messages_select_v2" on public.messages;
drop policy if exists "messages_insert_sender_v2" on public.messages;
drop policy if exists "messages_update_participant_admin_v2" on public.messages;
drop policy if exists "messages_delete_admin_v2" on public.messages;

create policy "messages_select_v2" on public.messages
for select using (
  public.is_admin()
  or sender_id = auth.uid()
  or receiver_id = auth.uid()
  or (room = 'coaches' and public.current_role() = 'coach')
);

create policy "messages_insert_sender_v2" on public.messages
for insert with check (
  public.is_admin()
  or (
    sender_id = auth.uid()
    and (
      public.can_message_between(sender_id, receiver_id)
      or (room = 'coaches' and public.current_role() = 'coach')
    )
  )
);

create policy "messages_update_participant_admin_v2" on public.messages
for update using (
  public.is_admin()
  or sender_id = auth.uid()
  or receiver_id = auth.uid()
  or (room = 'coaches' and public.current_role() = 'coach')
) with check (
  public.is_admin()
  or (sender_id = auth.uid() and public.can_message_between(sender_id, receiver_id))
  or receiver_id = auth.uid()
  or (room = 'coaches' and public.current_role() = 'coach')
);

create policy "messages_delete_admin_v2" on public.messages
for delete using (public.is_admin());

drop policy if exists "appointments_select_v2" on public.appointments;
drop policy if exists "appointments_insert_participant_v2" on public.appointments;
drop policy if exists "appointments_update_participant_v2" on public.appointments;
drop policy if exists "appointments_delete_admin_v2" on public.appointments;

create policy "appointments_select_v2" on public.appointments
for select using (public.can_access_pair(coach_id, client_id));

create policy "appointments_insert_participant_v2" on public.appointments
for insert with check (
  public.is_admin()
  or (
    (coach_id = auth.uid() or client_id = auth.uid())
    and public.is_my_coach(coach_id, client_id)
  )
);

create policy "appointments_update_participant_v2" on public.appointments
for update using (public.can_access_pair(coach_id, client_id))
with check (
  public.is_admin()
  or (
    (coach_id = auth.uid() or client_id = auth.uid())
    and public.is_my_coach(coach_id, client_id)
  )
);

create policy "appointments_delete_admin_v2" on public.appointments
for delete using (public.is_admin());

drop policy if exists "media_files_select_v2" on public.media_files;
drop policy if exists "media_files_insert_owner_v2" on public.media_files;
drop policy if exists "media_files_update_owner_admin_v2" on public.media_files;
drop policy if exists "media_files_delete_owner_admin_v2" on public.media_files;

create policy "media_files_select_v2" on public.media_files
for select using (
  public.is_admin()
  or owner_id = auth.uid()
  or client_id = auth.uid()
  or public.is_client_of_current_coach(client_id)
);

create policy "media_files_insert_owner_v2" on public.media_files
for insert with check (
  public.is_admin()
  or (
    owner_id = auth.uid()
    and (
      client_id is null
      or client_id = auth.uid()
      or public.is_client_of_current_coach(client_id)
    )
  )
  or (client_id is not null and public.is_client_of_current_coach(client_id))
);

create policy "media_files_update_owner_admin_v2" on public.media_files
for update using (
  public.is_admin()
  or owner_id = auth.uid()
) with check (
  public.is_admin()
  or owner_id = auth.uid()
);

create policy "media_files_delete_owner_admin_v2" on public.media_files
for delete using (
  public.is_admin()
  or owner_id = auth.uid()
);

drop policy if exists "notifications_select_v2" on public.notifications;
drop policy if exists "notifications_insert_self_coach_admin_v2" on public.notifications;
drop policy if exists "notifications_update_self_admin_v2" on public.notifications;
drop policy if exists "notifications_delete_admin_v2" on public.notifications;

create policy "notifications_select_v2" on public.notifications
for select using (
  public.is_admin()
  or user_id = auth.uid()
  or public.is_client_of_current_coach(user_id)
);

create policy "notifications_insert_self_coach_admin_v2" on public.notifications
for insert with check (
  public.is_admin()
  or user_id = auth.uid()
  or public.is_client_of_current_coach(user_id)
);

create policy "notifications_update_self_admin_v2" on public.notifications
for update using (
  public.is_admin()
  or user_id = auth.uid()
) with check (
  public.is_admin()
  or user_id = auth.uid()
);

create policy "notifications_delete_admin_v2" on public.notifications
for delete using (public.is_admin());

drop policy if exists "device_tokens_select_v2" on public.device_tokens;
drop policy if exists "device_tokens_insert_self_v2" on public.device_tokens;
drop policy if exists "device_tokens_update_self_v2" on public.device_tokens;
drop policy if exists "device_tokens_delete_self_admin_v2" on public.device_tokens;

create policy "device_tokens_select_v2" on public.device_tokens
for select using (public.is_admin() or user_id = auth.uid());

create policy "device_tokens_insert_self_v2" on public.device_tokens
for insert with check (user_id = auth.uid());

create policy "device_tokens_update_self_v2" on public.device_tokens
for update using (public.is_admin() or user_id = auth.uid())
with check (public.is_admin() or user_id = auth.uid());

create policy "device_tokens_delete_self_admin_v2" on public.device_tokens
for delete using (public.is_admin() or user_id = auth.uid());

drop policy if exists "audit_logs_select_admin_v2" on public.audit_logs;
drop policy if exists "audit_logs_insert_authenticated_v2" on public.audit_logs;
drop policy if exists "audit_logs_update_none_v2" on public.audit_logs;
drop policy if exists "audit_logs_delete_admin_v2" on public.audit_logs;

create policy "audit_logs_select_admin_v2" on public.audit_logs
for select using (public.is_admin());

create policy "audit_logs_insert_authenticated_v2" on public.audit_logs
for insert with check (
  auth.uid() is not null
  and (actor_id is null or actor_id = auth.uid() or public.is_admin())
);

create policy "audit_logs_update_none_v2" on public.audit_logs
for update using (false) with check (false);

create policy "audit_logs_delete_admin_v2" on public.audit_logs
for delete using (public.is_admin());
