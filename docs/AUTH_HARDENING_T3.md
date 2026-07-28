# StepWise Plus V2 - T3 Auth Hardening

## Scope

This document records the T3 authentication hardening change.

## Changes

- Local/demo password storage now uses salted PBKDF2-SHA256 hashes.
- Existing local SHA-256 hashes are still accepted once and migrated after successful login.
- Existing plain local passwords are still accepted once and migrated after successful login.
- Seed users are repaired into the modern hash format when used in non-production test mode.
- Production mode no longer falls back to local users after a Supabase Auth failure.

## Hash Model

- Preferred format: `pbkdf2-sha256-v1$iterations$salt$hash`
- Iterations: `120000`
- Fallback format when PBKDF2 is unavailable: `sha256-salted-v1$salt$hash`
- Legacy format support: raw SHA-256 hash, migrated after successful login.

## Security Notes

- Supabase Auth remains the source of truth in production.
- Local seed/demo credentials are for non-production testing only.
- No service role key is bundled in the client.

## Verification

- `npm run lint` passed.
- `npm run build` passed.
- `npm test` passed with 7 test files and 24 tests.

## Status

- [x] T3 - Local auth hash storage hardened and production local fallback disabled.
