# StepWise Plus V2 - Full Project Audit

Date: 2026-07-21

Scope: No feature development. No behavior changes. This audit reviews the current repository for architecture, code quality, UX consistency, AI readiness, production readiness, documentation, security, and release risk.

## Executive Summary

The project is usable and has an active product direction, Supabase-backed production work, Android alarm integration, media handling, program/task flows, role-based screens, and a strong documentation foundation.

The main risk is not missing ideas. The main risk is maintainability and release discipline. The app still depends heavily on one very large `src/App.jsx` file, lacks automated lint/test scripts, has incomplete production observability/legal readiness, and has several flows that should be guarded by automated tests before public release.

Current release status: not ready for public store release.

Recommended next state: stabilize core flows, add test/lint gates, then continue modular refactor screen by screen without rewriting working screens.

## Highest Priority Findings

| Severity | Area | Finding | Evidence | Recommendation |
| --- | --- | --- | --- | --- |
| Critical | QA | No lint/test scripts exist in `package.json`. | Scripts include build/doctor/android, but no lint/test/typecheck. | Add lightweight lint and smoke tests before more feature work. |
| High | Architecture | `src/App.jsx` is a monolith. | 2224 lines, about 265 KB. Contains auth, admin, coach, client, messaging, profile, reports, task UI. | Extract one feature screen at a time into feature folders. Do not rewrite all at once. |
| High | Android alarms | Alarm receiver can continue after logout if scheduled alarms remain active. | `MainActivity` stores `stepwise_session.active`; `StepWiseAlarmReceiver` checks alarm active state but not session active state. | Gate alarm repeat/notification by session state or cancel all alarms on logout. |
| High | Data reliability | Program assignment, messages, reports, profile, media, and alarms need regression tests. | User testing repeatedly found white screens and mismatched data flows. | Add smoke tests for role login, program assignment, messaging, report rendering, task proof, and alarm scheduling. |
| Medium | Security/privacy | `android:allowBackup="true"` should be reviewed for health/wellness data. | `android/app/src/main/AndroidManifest.xml`. | Disable or explicitly justify backup behavior before public release. |
| Medium | Security | Demo/local seed accounts remain in source. | `src/App.jsx`, `src/lib/demoAccounts.js`. | Keep for test builds, hide behind explicit demo/dev flag for release builds. |
| Medium | Architecture | Feature services directly import infrastructure services. | Examples: feature services import `src/lib/production.js` and local session. | Add repository boundary and dependency injection gradually. |
| Medium | UX | UI primitives exist, but many screens still use inline styles and native `alert/confirm`. | Repeated style objects and browser dialogs in `src/App.jsx`. | Standardize modal, button, input, card, avatar, sheet primitives. |
| Medium | Performance | Broad workspace loading can become expensive. | `production.js` is 772 lines and centralizes large Supabase fetch/merge flows. | Add pagination, selective loading, caching, and query limits. |
| Medium | Documentation | Strong planning docs exist, but operational runbooks are still incomplete. | Many master specs exist; go-live operational checklist was missing. | Use `GO_LIVE_CHECKLIST.md` as release gate. |

## Code Quality Audit

### Duplicate Code

Detected repeated or near-repeated logic:

- Coach and client message screens both define `sendFile`, `startRecord`, `sendVoiceDraft`, and audio draft UI.
- Admin web/mobile flows duplicate user edit/delete/reset behaviors.
- Program edit, video upload, assignment, delete, and custom program state are still tightly coupled inside `App.jsx`.
- Inline button/input/card styles repeat even though shared primitives exist.
- Demo account definitions exist in more than one place.

Recommendation:

Extract shared hooks/services in this order:

1. `useVoiceRecorder`
2. `MessageComposer`
3. `ProgramEditor`
4. `UserEditorSheet`
5. `ConfirmDialog`

### Unused or Risky Files

- `dist/` is generated output and should not be manually edited.
- `tmp/icon-options/` is a design/build artifact and should stay outside release logic.
- `.codex-backups/` and `.codex-remote-attachments/` are development artifacts.
- Android copied web assets can become stale if `npm run android:sync` is not run after each web build.
- Android test package names should be reviewed for stale default naming.

### Large Components

`src/App.jsx` is the largest technical debt item. It currently owns too many responsibilities:

- Role routing
- Screen rendering
- Data mutation
- Local state
- Media handling
- Messaging
- Program editing
- Admin management
- Alerts/confirms

This should be decomposed gradually. Each extraction must keep the app buildable.

## Architecture Audit

### Layers

Partially established:

- `src/features/*` exists and contains growing domain services.
- `src/shared/*` exists for tokens, UI primitives, and helpers.
- `src/lib/*` still contains infrastructure and app-wide data access.

Problem:

The UI layer still directly coordinates too much business logic through `App.jsx`.

### Domain Boundaries

Current domain folders are useful but not yet strict. Features such as messages/media/profile/programs/tasks still cross-call low-level production and session utilities.

Recommendation:

Introduce stable repository interfaces:

- `authRepository`
- `profileRepository`
- `programRepository`
- `messageRepository`
- `mediaRepository`
- `taskRepository`
- `reportRepository`

### Circular Dependencies

No obvious circular dependency was found from import review, but there is no automated circular dependency check. Add a cycle checker before deeper refactor.

### Dependency Injection

Dependency injection is not mature yet. Services import concrete modules directly. For production-grade architecture, pass dependencies through a thin app service container or repository factory.

### State Management

State is mostly React local state plus browser/local storage/Supabase merge flows. It works, but screens are too stateful. Derived selectors have started moving into feature files, which is good. Continue that pattern.

### File Structure

Direction is correct, but incomplete:

- Good: `features`, `shared`, `lib`, `supabase`, `android`, `docs`.
- Needs work: screen components and modal editors still live inside `App.jsx`.

## UX Audit

The visual direction is now recognizable: soft wellness background, rounded cards, green gradient hero cards, large readable typography, bottom navigation.

Issues:

- Some card radii and spacing are inconsistent with the documented design system.
- Same intent buttons sometimes appear as inline custom styles instead of shared button primitives.
- Native browser `alert`/`confirm` breaks the premium mobile feel.
- Some icons are custom string paths while the design system should define a single icon style.
- Modal/bottom-sheet overflow has historically caused horizontal scroll and hidden close controls.
- Dark mode support is documented but not complete in the visible implementation.

Recommendation:

Before more UI changes, create a small enforced component set:

- `AppScreen`
- `AppCard`
- `PrimaryButton`
- `SecondaryButton`
- `IconButton`
- `AppInput`
- `AppModal`
- `BottomSheet`
- `EmptyState`
- `ErrorState`
- `LoadingState`

## AI Audit

AI is currently planned well in documentation, but runtime AI is not production-ready yet.

Findings:

- Prompt master documentation exists.
- Prompt versioning is documented but not implemented in runtime/database.
- No AI orchestration service is active yet.
- No token budget control exists.
- No AI safety/error handling tests exist.
- No user consent flow for AI analysis of health, nutrition, images, or messages exists.
- No context permission model exists for deciding what AI may read.

Recommendation:

Do not expose AI to users until:

1. Prompt library is versioned.
2. AI calls are server-side.
3. Rate limits exist.
4. User consent exists.
5. Audit logs exist.
6. AI output is stored with model/prompt version.

## Security Audit

Main points:

- Supabase service role must never ship to client. Current docs warn about this; release builds must verify it.
- Admin functions should require server-side authorization checks.
- Media storage policies must be tested for cross-user access.
- Exact alarm, camera, microphone, notification, and full-screen intent permissions must be justified for Play Store review.
- `allowBackup` should be reviewed because the app processes sensitive personal/wellness data.
- Local demo accounts should not be visible in public release unless a test/demo mode is intentionally enabled.

## Performance Audit

Potential risks:

- Large `App.jsx` causes broad re-render risk.
- Broad workspace sync/load can become slow with many coaches/clients/messages/media.
- Base64/local media can grow storage quickly.
- Images/videos need thumbnail and compression strategy.
- No automated bundle size budget exists.

Recommendations:

- Add route/screen-level lazy loading after components are extracted.
- Paginate messages, task logs, proofs, reports, and audit logs.
- Generate thumbnails for media.
- Cache profile/program metadata separately from heavy media.
- Add bundle size and production doctor checks.

## Test Coverage Audit

Missing:

- Unit tests
- Component tests
- E2E/smoke tests
- Android alarm tests
- Supabase RLS tests
- Media upload/download tests
- Messaging realtime tests
- Program assignment regression tests
- Report white-screen regression tests

Minimum before public beta:

1. Auth login by role.
2. Coach adds client.
3. Coach assigns program.
4. Client sees tasks.
5. Client submits proof photo.
6. Coach sees proof notification.
7. Coach approves proof.
8. Client/coach exchange messages.
9. Reports render without crash.
10. Logout cancels/guards alarms.

## Documentation Audit

Strong documents exist:

- `PROJECT_GOVERNANCE.md`
- `STEPWISE_ANALYSIS.md`
- `STEPWISE_PLUS_V2_PLAN.md`
- `docs/*MASTER_SPECIFICATION.md`
- `docs/DATABASE_SCHEMA.sql`
- `docs/OPENAPI.yaml`
- `docs/AI_PROMPTS.md`
- `docs/BUSINESS_RULES.md`

Still needed:

- Environment setup guide
- Supabase deployment runbook
- Android release signing runbook
- Backup/restore runbook
- Incident response guide
- Data deletion/export procedure

## Production Readiness Verdict

Not ready for public App Store / Play Store release yet.

Ready for internal test APK only if:

- Build passes.
- Production doctor passes.
- Known white-screen screens are manually checked.
- Demo/test mode is clearly understood.

Public beta should wait until:

- Lint/test gate exists.
- Alarm logout/session behavior is fixed and tested.
- Program assignment and messaging regressions are covered.
- Reports/profile screens have smoke tests.
- Legal/privacy documents are ready.
- Crash reporting and analytics are installed.

## Recommended Remediation Order

1. Add lint/test infrastructure and smoke tests.
2. Fix alarm session/logout behavior and add Android alarm checks.
3. Extract message composer and voice recorder duplication.
4. Extract program editor and program assignment logic.
5. Add repository boundaries around production data access.
6. Add report/profile white-screen regression tests.
7. Standardize modal/dialog/input/button primitives.
8. Add production observability and legal release docs.
9. Prepare closed beta release pipeline.

## Commit Suggestion

`docs: add full project audit and go-live checklist`

