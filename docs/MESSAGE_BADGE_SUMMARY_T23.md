# Message Badge Summary - T23

## Purpose

Coach message notifications should answer two questions quickly:

- Who sent the latest unread message?
- How many unread messages/conversations are waiting?

## Rules

- Unread messages are grouped by sender.
- The newest unread conversation becomes the top sender.
- One sender uses a direct label: `Sender Name: count`.
- Multiple senders use a compact label: `senderCount kisi - total mesaj`.
- The helper returns raw counts and sender metadata so UI can render badges,
  inbox rows, or coach overview alerts without recomputing message state.

## Product Impact

This keeps the bottom navigation badge lightweight while enabling richer coach
message indicators in the message list or coach overview.
