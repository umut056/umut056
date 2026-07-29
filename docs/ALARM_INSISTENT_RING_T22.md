# Alarm Insistent Ring - T22

## Purpose

Task alarms must remain noticeable when the phone is locked, the app is in the
background, or there is no internet connection.

## Changes

- Android task alarm notifications are now marked with `Notification.FLAG_INSISTENT`.
- The native notification remains high priority, ongoing, full screen, public on
  lock screen, and uses the alarm audio stream.
- The WebView fallback alarm tone now plays a longer multi-round sequence instead
  of a short single pulse.
- Existing saved alarms still live in native `SharedPreferences`, so internet is
  not required after scheduling.

## Expected Behavior

- A pending task alarm should keep alerting more aggressively until the user opens
  the app or completes/cancels the task.
- Completing a task still cancels the related native alarm.
- Logging out still cancels all scheduled native task alarms.
