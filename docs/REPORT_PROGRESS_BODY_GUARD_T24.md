# Report Progress Body Guard - T24

## Purpose

Progress and report screens must not crash or render `undefined kg` when a client
has incomplete body metrics.

## Change

- `clientProgressBody` now delegates to the shared `normalizeBody` service.
- Report selectors now use the same body defaults as profile, measurement, and
  wellness flows.

## Expected Behavior

- Missing current/target weight renders as safe defaults.
- Invalid numeric strings normalize to `0`.
- Empty gender and ideal range values fall back to stable defaults.
- Coach report and client progress screens can render incomplete clients without
  throwing.
