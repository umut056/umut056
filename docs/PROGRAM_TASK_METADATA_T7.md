# Program Task Metadata T7

## Scope

T7 keeps program task schedule metadata intact across Supabase create, update,
import, and workspace restore flows.

## Problem

Program tasks can contain schedule rules such as the 3-day atomlu / 2-day
atomsuz cycle. The previous cloud mapping stored only basic task fields and
restored every cloud task as `daily`, which could break the actual assigned
program flow after sync.

## Database Migration

New columns on `public.program_tasks`:

- `repeat_type`
- `repeat_days`
- `cycle_length`
- `cycle_days`

The migration only adds columns with `if not exists`; no existing table or row is
deleted.

## App Changes

- Cloud task mapping reads repeat/cycle metadata.
- Program create/update writes repeat/cycle metadata.
- Admin workspace import preserves repeat/cycle metadata.
- Unit tests verify app-to-cloud and cloud-to-app task mapping.

## Verification

```bash
npm test -- src/lib/production.test.js
```

## Follow-Up

Daily task status should eventually reference `program_task_id` instead of only
`task_index` so task completion survives task reorder/edit operations.
