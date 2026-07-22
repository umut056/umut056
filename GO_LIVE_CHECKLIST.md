# StepWise Plus V2 - Go Live Checklist

Status: Not ready for public release until all critical sections are complete.

Use this checklist before closed beta, open beta, Play Store, or App Store release.

## 1. Build and Release

- [ ] `npm install` completes on a clean machine.
- [ ] `npm run build` passes.
- [ ] Production doctor passes.
- [ ] Android sync is run after the final web build.
- [ ] Release APK builds successfully.
- [ ] Release AAB builds successfully.
- [ ] `versionName` and `versionCode` are updated.
- [ ] App icon is final in all Android densities.
- [ ] Splash screen is final.
- [ ] Debug logs are removed or gated.
- [ ] Demo/test accounts are hidden or clearly gated for test builds.
- [ ] No service role key is bundled in client code.
- [ ] Release signing key is backed up securely.

## 2. Google Play Store

- [ ] Package name is final: `app.stepwise.plus`.
- [ ] App name is final: StepWise Plus.
- [ ] Short description is prepared.
- [ ] Full description is prepared.
- [ ] Screenshots are prepared for phone.
- [ ] Feature graphic is prepared.
- [ ] App icon meets Play requirements.
- [ ] Content rating questionnaire is completed.
- [ ] Data Safety form is completed.
- [ ] Privacy Policy URL is live.
- [ ] Account deletion instructions are live.
- [ ] Camera permission justification is written.
- [ ] Microphone permission justification is written.
- [ ] Notification permission justification is written.
- [ ] Exact alarm permission justification is written.
- [ ] Full-screen intent permission justification is reviewed.
- [ ] Closed testing users are configured.
- [ ] Release notes are prepared.

## 3. App Store Readiness

- [ ] Apple Developer account is ready.
- [ ] Bundle ID is reserved.
- [ ] App Store screenshots are planned.
- [ ] Privacy nutrition labels are prepared.
- [ ] Account deletion requirement is covered.
- [ ] Health/wellness disclaimers are reviewed.
- [ ] Push notification usage is documented.
- [ ] In-app purchase/premium policy is reviewed before payments launch.

## 4. KVKK and GDPR

- [ ] Privacy Policy is written.
- [ ] Terms of Use are written.
- [ ] Explicit consent screen is implemented for sensitive data.
- [ ] User can request account deletion.
- [ ] User can request data export.
- [ ] Data retention policy is documented.
- [ ] Data processor/subprocessor list is documented.
- [ ] Coach/admin data access responsibilities are documented.
- [ ] AI processing consent is prepared before AI launch.
- [ ] Photo/video/audio consent is covered.
- [ ] Backup retention is documented.

## 5. Security

- [ ] Supabase RLS policies are tested.
- [ ] Admin-only operations are enforced server-side.
- [ ] Coach can access only their own clients.
- [ ] Client can access only their own data.
- [ ] Storage objects cannot be read across users.
- [ ] Signed URLs expire correctly.
- [ ] Service role key is used only server-side.
- [ ] Secrets are stored in environment variables.
- [ ] Rate limits are configured for auth and edge functions.
- [ ] Input validation exists for forms and APIs.
- [ ] Audit logs exist for admin/coach sensitive actions.
- [ ] `android:allowBackup` is reviewed for sensitive data.

## 6. Notifications and Alarms

- [ ] Local task alarms work offline.
- [ ] Alarms work when app is backgrounded.
- [ ] Alarms work after device reboot.
- [ ] Logout cancels or blocks user-specific alarms.
- [ ] Completed tasks stop repeating alarms.
- [ ] Snooze limit works correctly.
- [ ] Push notification token registration works.
- [ ] Message notification shows sender identity.
- [ ] Notification badge count is accurate.
- [ ] Android notification channels are named correctly.

## 7. Core QA

- [ ] Admin login works.
- [ ] Coach login works.
- [ ] Client login works.
- [ ] Coach creates client.
- [ ] Coach edits client.
- [ ] Coach assigns program.
- [ ] Client sees assigned program.
- [ ] Client task list resets daily.
- [ ] Completed tasks disappear or advance as designed.
- [ ] Client proof photo opens camera.
- [ ] Proof photo is saved.
- [ ] Coach sees proof notification on summary.
- [ ] Coach can approve/reject proof.
- [ ] Message send/receive works both directions.
- [ ] Photo message works.
- [ ] Voice message works.
- [ ] Reports screen does not white-screen.
- [ ] Profile screen does not white-screen.
- [ ] Calendar appointment request/approval works.
- [ ] Product video assignment works.
- [ ] Program add/edit/delete works.

## 8. UX and Accessibility

- [ ] All screens use the same design language.
- [ ] Buttons use shared button styles.
- [ ] Cards use shared card styles.
- [ ] Inputs use shared input styles.
- [ ] Empty states exist.
- [ ] Error states exist.
- [ ] Loading states exist.
- [ ] Text does not overflow on small screens.
- [ ] No unintended horizontal scroll.
- [ ] Bottom navigation is reachable.
- [ ] Tap targets are large enough.
- [ ] Contrast is acceptable.
- [ ] Screen reader labels exist for icon-only actions.

## 9. Observability

- [ ] Crash reporting is installed.
- [ ] Analytics is installed.
- [ ] Performance monitoring is installed.
- [ ] Server logs are monitored.
- [ ] Edge function errors are monitored.
- [ ] Alarm failures are logged.
- [ ] Media upload failures are logged.
- [ ] Auth failures are logged safely.
- [ ] Admin actions are auditable.

## 10. Backup and Disaster Recovery

- [ ] Supabase database backups are enabled.
- [ ] Storage backup plan exists.
- [ ] Restore process is documented.
- [ ] Restore test has been performed.
- [ ] Rollback plan exists for app release.
- [ ] Rollback plan exists for database migration.
- [ ] Incident contact list exists.

## 11. CI/CD

- [ ] CI installs dependencies.
- [ ] CI runs build.
- [ ] CI runs lint.
- [ ] CI runs tests.
- [ ] CI runs production doctor.
- [ ] CI builds Android artifact.
- [ ] CI stores APK/AAB artifacts.
- [ ] Release notes are generated.
- [ ] Changelog is updated.
- [ ] Roadmap is updated.

## 12. Final Sign-Off

- [ ] Product owner approves core flows.
- [ ] QA approves regression suite.
- [ ] Security review is complete.
- [ ] Legal/privacy review is complete.
- [ ] Store assets are approved.
- [ ] Closed beta is complete.
- [ ] Open beta is complete.
- [ ] Production release is approved.

