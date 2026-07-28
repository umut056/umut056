# Weight & Measurement Rules - T20

## Purpose

This hardening pass prevents empty or invalid body metric values from leaking into
client progress, coach reports, and wellness summaries.

## Rules

- Weight updates accept only finite positive values.
- Invalid weight updates preserve the existing normalized body and do not create a
  new weight log.
- The first valid weight becomes both `body.start` and `body.current`, so the app
  never reports a fake loss from missing data.
- Weight delta is calculated only when both start and current weight exist.
- Weight labels use a safe fallback instead of rendering `undefined kg`.
- Body measurements are normalized through one shared service before they are
  used by profile, reports, wellness, or dashboard flows.

## Covered Regression Areas

- Client progress cards should not show `undefined kg`.
- Coach reports should not count missing current weights as lost weight.
- Body analysis/profile screens should survive missing, empty, or invalid numeric
  fields.
- First-time users should start at `0 kg` change until a second valid weight is
  entered.
