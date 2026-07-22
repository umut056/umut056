# StepWise Plus Supabase Setup

## Files

- `schema.sql`: PostgreSQL tables, RLS policies, storage bucket, indexes.
- `migrations/20260531110000_stepwise_plus_schema.sql`: Same schema prepared for Supabase CLI `db push`.
- `functions/admin-create-user`: Admin creates coach/client accounts through service role.
- `functions/coach-create-client`: Coach creates own client account through service role.
- `functions/admin-import-workspace`: Imports local test JSON backup into cloud.
- `functions/notify-user`: Creates notification rows and sends Firebase FCM push.

## Required Function Secrets

```powershell
supabase secrets set SUPABASE_URL="https://PROJECT_ID.supabase.co"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="SERVICE_ROLE_KEY"
supabase secrets set FIREBASE_SERVICE_ACCOUNT_JSON="PASTE_FIREBASE_SERVICE_ACCOUNT_JSON"
```

## Deploy

```powershell
supabase db push
supabase functions deploy admin-create-user
supabase functions deploy coach-create-client
supabase functions deploy admin-import-workspace
supabase functions deploy notify-user
```

If `supabase db push` is not used, run `schema.sql` in Supabase SQL Editor.

## Security Notes

- Service role key is only for Supabase Edge Functions.
- APK uses only anon key.
- Storage bucket is private.
- Media opens with signed URLs.
- Admin creation is not public.
- Coach signup requires active admin-generated code.
- Client signup requires active coach reference code.
