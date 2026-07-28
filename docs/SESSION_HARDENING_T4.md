# StepWise Plus V2 - T4 Session Hardening

## Scope

This document records the T4 session persistence hardening change.

## Changes

- Session persistence now stores a small safe snapshot instead of the full user object.
- Sensitive and bulky fields such as `password`, `passwordHash`, `body`, `tasks`, `messages`, and local program state are not written to the session object.
- The legacy `ct_u` session key is still cleared on logout for backward compatibility.
- Production Supabase sessions can be restored from the stored token even when the cloud profile is not present in local cached users yet.

## Why

The previous session model saved the whole user object. That made reload/background behavior fragile and stored more local data than needed for authentication. The new model keeps enough data to restore the app shell and cloud token, then live sync refreshes the full workspace.

## Verification

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 8 test files and 27 tests.

## Status

- [x] T4 - Session persistence hardened and restore behavior made cloud-safe.
