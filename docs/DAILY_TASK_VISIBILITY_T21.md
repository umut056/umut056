# Daily Task Visibility - T21

## Purpose

Client task screens should focus on the next unfinished work instead of keeping
completed items in the main list.

## Rules

- Daily state is scoped by date and is not reused across another day.
- Completed tasks are filtered out of the active client list.
- A day is considered complete only when the assigned task plan is non-empty and
  every task is checked.
- Empty or invalid task inputs are tolerated by the service and return an empty
  visible list.

## Product Impact

- The client sees the next remaining task more clearly.
- Completed tasks do not visually compete with pending tasks.
- Tomorrow's task list starts fresh through the existing date-scoped daily state.
