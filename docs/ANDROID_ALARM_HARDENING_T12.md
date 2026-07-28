# Android Alarm Hardening T12

## Scope

Native task alarms were strengthened for offline and locked-device use.

## Changes

- Alarm notification channel moved to `stepwise_task_alarm_v7` so Android applies the updated sound and vibration behavior.
- Repeat reminder delay reduced from 2 minutes to 1 minute while the task remains active.
- Vibration pattern lengthened and shared by both the notification channel and fallback vibrator call.
- Alarm notifications remain high-priority, public on lock screen, ongoing and full-screen capable.

## Behavior

If a task is not completed, Android keeps rescheduling the alarm receiver every minute. Completing the task or cancelling alarms removes the native pending alarm and its notification.

## Verification

Web checks:

```bash
npm run lint
npm run build
npm test
```

Android manual check:

1. Install the next APK.
2. Log in as a client.
3. Open Tasks and enable reminders.
4. Set a near task time or snooze to 1-2 minutes during testing.
5. Lock the phone and wait for the alarm.
6. Leave the task incomplete and confirm it alerts again roughly every minute.
