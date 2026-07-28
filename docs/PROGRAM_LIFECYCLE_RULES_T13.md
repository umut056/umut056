# Program Lifecycle Rules T13

## Scope

Program edit, clone and delete decisions were moved into reusable program service helpers.

## Added Helpers

- `editableProgramForCoach(program, coachId)`
- `programTasksToRows(tasks)`
- `parseProgramTaskRows(text, fallbackTasks)`
- `buildProgramRemovalState({ program, programs, users, coachId })`

## Rules

- System templates are not edited directly. A coach-owned editable copy is created instead.
- Task rows are parsed with the existing 3-day atomlu / 2-day atomsuz cycle normalizer.
- Coach-owned custom programs can be removed from the program list.
- Clients assigned to a deleted custom program are reset to `Program atanmadı`.
- System templates are hidden per coach instead of being globally deleted.

## Why This Matters

The coach profile program UI already needs add/edit/delete behavior. Keeping these rules in `programService` prevents duplicate business logic as the large App shell is gradually split into feature modules.

## Verification

Run:

```bash
npm test
npm run lint
npm run build
```
