# Auth Registration Regression T10

## Scope

This checkpoint protects the existing registration flow without changing runtime behavior.

## Covered Rules

- Registration form values are trimmed and normalized before validation.
- Base registration rejects missing role, incomplete fields, short passwords and duplicate emails.
- Coach registration requires an active unused admin activation code.
- Coach registration cannot reuse another coach's client reference code.
- Client registration must resolve to an existing coach reference code.
- Local client fallback records keep coach linkage, empty task state and the default unassigned program label.

## Why This Matters

Recent Supabase and RLS work made auth flows more sensitive to profile shape and role metadata. These tests keep local/demo registration behavior stable while the app moves toward the V2 production auth model.

## Verification

Run:

```bash
npm test
npm run lint
npm run build
```
