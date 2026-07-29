# Program Save Propagation - T25

## Purpose

Coach program edits should update both the registered program list and clients
who already use that program.

## Rules

- Saving a coach program replaces the previous program id in the program list.
- Affected clients are limited to the same coach.
- Assigned clients receive a refreshed `programDraft`.
- Program product videos are copied to the assigned client with assignment
  metadata.
- Existing task checks and compliance can be preserved during edit propagation.
- Other coaches' clients are never changed by this operation.

## Product Impact

This keeps program edit, video attach, and client assignment behavior consistent
without duplicating the same logic inside UI screens.
