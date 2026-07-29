# Coach Note App Shell Removal - T34

## Context

Coach notes were removed from the client summary experience because the coach-client messaging area already covers direct communication. Keeping a second note surface on the client home screen created duplicate behavior and extra visual noise.

## Change

- Removed the unused App shell helpers that could create or dismiss client-facing coach notes.
- Kept the notification service legacy helpers intact so existing persisted `coachNotes` data remains backward compatible.
- Calendar/session notifications continue to use the regular notice flow.

## Verification

- `npm run lint`
- `npm run build`
- `npm test`

