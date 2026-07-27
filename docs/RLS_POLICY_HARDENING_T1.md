# StepWise Plus V2 - T1 RLS Policy Hardening

## Scope

This document records the T1 security foundation change from the Codex work instruction.

## Migration

- `supabase/migrations/20260727170500_harden_rls_policies.sql`

## Tables Covered

- `profiles`
- `coach_codes`
- `programs`
- `program_tasks`
- `client_programs`
- `body_metrics`
- `task_logs`
- `daily_task_status`
- `messages`
- `appointments`
- `media_files`
- `notifications`
- `device_tokens`
- `audit_logs`

## Policy Model

- RLS is enabled for all listed tables.
- Broad legacy `for all` policies are replaced with role-aware policies.
- SELECT, INSERT, UPDATE and DELETE permissions are separated where the table supports the operation.
- Admin can inspect and manage all records.
- Coaches can access only their own client network.
- Clients can access only their own data and create/update only allowed self-owned records.

## Notes

- T2 verified these policies against staging Supabase with real anon key + role JWTs.
- Storage object policy hardening is already present in the base schema and remains compatible with this table-level migration.

## Verification

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 6 test files and 19 tests.

## Status

- [x] T1 - Supabase RLS policies hardened in a new migration.
- [x] T2 - Staging role/JWT verification passed with `npm run test:rls:staging`.
