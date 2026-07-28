# Message Unread Summary T11

## Scope

Unread message calculations now include sender-level summaries.

## Service Contract

`unreadConversationSummaries(messages, userId, participants, getPreviewText)` returns:

- `senderId`
- `senderName`
- `count`
- `lastMessage`
- `lastText`
- `lastTime`

The newest unread sender is returned first.

## Why This Matters

Coach screens need to show who sent unread messages, not only a generic red badge. Keeping this calculation in `notificationService` avoids duplicating unread grouping logic in UI components.

## Next UI Integration

Use this helper in coach dashboard and message list surfaces when App-level refactor reaches the message shell. The current task intentionally keeps App screen edits out of the commit because `App.jsx` already contains unrelated pending work.

## Verification

Run:

```bash
npm test
npm run lint
npm run build
```
