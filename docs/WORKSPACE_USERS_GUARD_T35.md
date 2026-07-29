# Workspace Users Guard - T35

## Context

Several screens received `allUsers` from the app shell and assumed it was always an array. During cloud refresh, login recovery, or partial local state restores, that prop can be missing for a render frame. Direct `.filter()` or `.find()` calls can then crash the screen and show the app error fallback.

## Change

- Added a shared `workspaceUsers()` guard in `App.jsx`.
- Replaced direct `allUsers.filter/find` access in coach/client profile, reports, calendar, and messaging screens.
- Screens now fall back to `DB.users()` when the prop is unavailable.

## Verification

- `npm run lint`
- `npm run build`
- `npm test`

