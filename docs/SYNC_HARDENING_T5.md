# Sync Hardening T5

## Scope

T5 strengthens the cloud/local workspace merge path without changing screens.

## Problem

Production workspace refresh can return partial cloud snapshots:

- a profile without active program assignment,
- body metrics with default zero values,
- assigned program tasks without daily completion state,
- media rows not yet available after an offline or local upload.

Before this change, those partial snapshots could make the app look like a
client lost their assigned program, measurements, daily task progress, or
product video.

## Change

- Local assigned program data is preserved when cloud does not have an active assignment.
- Local body values are preserved when cloud only carries default zero values.
- Local daily progress is preserved when cloud returns the same program assignment but no daily state.
- Real cloud reassignment still replaces stale local program/progress.
- Local product videos remain visible until cloud media rows are available.

## Verification

New unit coverage:

```bash
npm test -- src/features/sync/workspaceService.test.js
```

Covered cases:

- cloud profile without assignment does not wipe local assignment,
- cloud default body values do not wipe local metrics,
- same assignment without cloud daily state does not reset local progress,
- different cloud assignment replaces stale local progress,
- missing cloud media rows do not remove local product videos.

## Follow-Up

The next sync layer should add durable offline queues and explicit conflict
metadata for tasks, media, body metrics, and messages.
