# Message Sync Hardening T6

## Scope

T6 strengthens message identity, unread state, and cloud/local merge behavior.

## Problem

Coach/client chat can receive the same message from local cache and cloud sync.
If those records are merged naively, read state and media metadata can be lost.
Cloud messages also need a stable timestamp for sorting and notifications should
show readable Turkish copy.

## Change

- Local message records now include `readBy` and `senderName`.
- Cloud message mapping now includes numeric `createdAt` for stable ordering.
- Cloud/local message merge combines duplicate records by id instead of dropping
  read state, media URL, file name, or sender name.
- Message media preview text and push notification text use clean Turkish copy.

## Verification

New/updated unit coverage:

```bash
npm test -- src/features/messages/messageService.test.js src/features/sync/workspaceService.test.js
```

Covered cases:

- media preview labels stay stable,
- room messages sort by `createdAt`,
- duplicate cloud/local messages keep both users in `readBy`,
- local media metadata survives a cloud merge.

## Follow-Up

The next messaging layer should add a durable outbound queue for offline text,
photo, and audio messages.
