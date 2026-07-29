package app.stepwise.plus;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;

public class StepWiseAlarmReceiver extends BroadcastReceiver {
    private static final String CHANNEL_ID = "stepwise_task_alarm_v7";
    private static final long REPEAT_DELAY_MS = 60 * 1000;
    private static final long[] ALARM_VIBRATION_PATTERN = new long[]{0, 1200, 250, 1200, 250, 1600, 350, 1600, 500};

    @Override
    public void onReceive(Context context, Intent intent) {
        String title = intent.getStringExtra("title");
        String time = intent.getStringExtra("time");
        int alarmId = intent.getIntExtra("alarmId", 0);
        if (!isAlarmStillActive(context, alarmId)) return;
        if (title == null || title.trim().isEmpty()) title = "StepWise Plus g\u00f6revi";
        if (time == null) time = "";

        Uri alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarmSound == null) {
            alarmSound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes audio = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "StepWise Plus g\u00f6rev alarmlar\u0131",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("G\u00f6rev zaman\u0131 geldi\u011finde kilit ekran\u0131nda sesli alarm verir.");
            channel.setSound(alarmSound, audio);
            channel.enableVibration(true);
            channel.setVibrationPattern(ALARM_VIBRATION_PATTERN);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            channel.setBypassDnd(true);
            manager.createNotificationChannel(channel);
        }

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent openPending = PendingIntent.getActivity(
            context,
            43000 + alarmId,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String text = (time.isEmpty() ? "" : time + " \u00b7 ") + title;
        NotificationCompat.Builder notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("StepWise Plus g\u00f6rev zaman\u0131")
            .setContentText(text)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setSound(alarmSound)
            .setVibrate(ALARM_VIBRATION_PATTERN)
            .setDefaults(Notification.DEFAULT_LIGHTS)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOnlyAlertOnce(false)
            .setAutoCancel(false)
            .setOngoing(true)
            .setContentIntent(openPending)
            .setFullScreenIntent(openPending, true);

        Notification alarmNotification = notification.build();
        alarmNotification.flags |= Notification.FLAG_INSISTENT;
        manager.notify(44000 + alarmId, alarmNotification);

        Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        if (vibrator != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vibrator.vibrate(VibrationEffect.createWaveform(ALARM_VIBRATION_PATTERN, -1));
            } else {
                vibrator.vibrate(ALARM_VIBRATION_PATTERN, -1);
            }
        }
        scheduleRepeatIfStillActive(context, alarmId, title, time);
    }

    private void scheduleRepeatIfStillActive(Context context, int alarmId, String title, String time) {
        try {
            if (!isAlarmStillActive(context, alarmId)) return;
            AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (manager == null) return;
            long triggerAt = System.currentTimeMillis() + REPEAT_DELAY_MS;

            Intent repeatIntent = new Intent(context, StepWiseAlarmReceiver.class);
            repeatIntent.putExtra("title", title);
            repeatIntent.putExtra("time", time);
            repeatIntent.putExtra("alarmId", alarmId);
            PendingIntent pending = PendingIntent.getBroadcast(
                context,
                42000 + alarmId,
                repeatIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Intent showIntent = new Intent(context, MainActivity.class);
            showIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent showPending = PendingIntent.getActivity(
                context,
                45000 + alarmId,
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= 21) {
                manager.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAt, showPending), pending);
            } else {
                manager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pending);
            }
        } catch (Exception ignored) {}
    }

    private boolean isAlarmStillActive(Context context, int alarmId) {
        try {
            String json = context.getSharedPreferences("stepwise_alarms", Context.MODE_PRIVATE)
                .getString("task_alarms", "[]");
            JSONArray alarms = new JSONArray(json);
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject item = alarms.getJSONObject(i);
                if (item.optInt("id", -1) == alarmId) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }
}
