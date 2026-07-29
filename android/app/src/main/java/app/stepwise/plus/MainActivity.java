package app.stepwise.plus;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.webkit.JavascriptInterface;
import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;
import java.util.Calendar;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new StepWiseNative(this), "StepWiseNative");
        }
        if (android.os.Build.VERSION.SDK_INT >= 33) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, 3001);
        }
        FirebaseMessaging.getInstance().getToken().addOnSuccessListener(token ->
            getSharedPreferences("stepwise_push", Context.MODE_PRIVATE)
                .edit()
                .putString("fcm_token", token)
                .apply()
        );
    }

    public static class StepWiseNative {
        private final Context context;

        StepWiseNative(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public void scheduleTaskAlarms(String json) {
            try {
                JSONArray alarms = new JSONArray(json);
                context.getSharedPreferences("stepwise_alarms", Context.MODE_PRIVATE)
                    .edit()
                    .putString("task_alarms", json)
                    .apply();
                scheduleTaskAlarmArray(context, alarms);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public boolean canScheduleExactAlarms() {
            if (android.os.Build.VERSION.SDK_INT < 31) return true;
            AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            return manager != null && manager.canScheduleExactAlarms();
        }

        @JavascriptInterface
        public void openExactAlarmSettings() {
            if (android.os.Build.VERSION.SDK_INT < 31) return;
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }

        @JavascriptInterface
        public boolean canUseFullScreenIntent() {
            if (android.os.Build.VERSION.SDK_INT < 34) return true;
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            return manager != null && manager.canUseFullScreenIntent();
        }

        @JavascriptInterface
        public void openFullScreenIntentSettings() {
            if (android.os.Build.VERSION.SDK_INT < 34) return;
            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
            intent.setData(Uri.parse("package:" + context.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }

        @JavascriptInterface
        public void cancelTaskAlarm(int id) {
            cancelSingleTaskAlarm(context, id);
        }

        @JavascriptInterface
        public void setSessionActive(boolean active) {
            context.getSharedPreferences("stepwise_session", Context.MODE_PRIVATE)
                .edit()
                .putBoolean("active", active)
                .apply();
        }

        @JavascriptInterface
        public String getFcmToken() {
            return context.getSharedPreferences("stepwise_push", Context.MODE_PRIVATE)
                .getString("fcm_token", "");
        }

        static void scheduleTaskAlarmArray(Context context, JSONArray alarms) {
            try {
                AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
                if (manager == null) return;
                cancelAllTaskAlarms(context);
                for (int i = 0; i < alarms.length(); i++) {
                    JSONObject item = alarms.getJSONObject(i);
                    int id = item.optInt("id", i);
                    String time = item.optString("time", "09:00");
                    long repeatDelayMs = item.optLong("repeatDelayMs", 60 * 1000);
                    String[] parts = time.split(":");
                    Calendar calendar = Calendar.getInstance();
                    calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(parts[0]));
                    calendar.set(Calendar.MINUTE, Integer.parseInt(parts[1]) + 5);
                    calendar.set(Calendar.SECOND, 0);
                    calendar.set(Calendar.MILLISECOND, 0);
                    if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                        calendar.add(Calendar.DATE, 1);
                    }

                    Intent intent = new Intent(context, StepWiseAlarmReceiver.class);
                    intent.putExtra("title", item.optString("title", "StepWise Plus görevi"));
                    intent.putExtra("time", time);
                    intent.putExtra("alarmId", id);
                    intent.putExtra("repeatDelayMs", repeatDelayMs);
                    PendingIntent pending = PendingIntent.getBroadcast(
                        context,
                        42000 + id,
                        intent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );

                    Intent showIntent = new Intent(context, MainActivity.class);
                    showIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    PendingIntent showPending = PendingIntent.getActivity(
                        context,
                        45000 + id,
                        showIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );

                    if (android.os.Build.VERSION.SDK_INT >= 21) {
                        AlarmManager.AlarmClockInfo alarmClockInfo = new AlarmManager.AlarmClockInfo(calendar.getTimeInMillis(), showPending);
                        manager.setAlarmClock(alarmClockInfo, pending);
                    } else if (android.os.Build.VERSION.SDK_INT >= 23) {
                        manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pending);
                    } else {
                        manager.setExact(AlarmManager.RTC_WAKEUP, calendar.getTimeInMillis(), pending);
                    }
                }
            } catch (Exception ignored) {}
        }
        @JavascriptInterface
        public void cancelTaskAlarms() {
            context.getSharedPreferences("stepwise_alarms", Context.MODE_PRIVATE)
                .edit()
                .remove("task_alarms")
                .apply();
            cancelAllTaskAlarms(context);
        }

        static void cancelSingleTaskAlarm(Context context, int id) {
            removeSavedTaskAlarm(context, id);
            AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            Intent intent = new Intent(context, StepWiseAlarmReceiver.class);
            PendingIntent pending = PendingIntent.getBroadcast(
                context,
                42000 + id,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pending != null) {
                manager.cancel(pending);
                pending.cancel();
            }
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(44000 + id);
                notificationManager.cancel(45000 + id);
            }
        }

        static void cancelAllTaskAlarms(Context context) {
            AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            for (int i = 0; i < 240; i++) {
                Intent intent = new Intent(context, StepWiseAlarmReceiver.class);
                PendingIntent pending = PendingIntent.getBroadcast(
                    context,
                    42000 + i,
                    intent,
                    PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
                );
                if (pending != null) {
                    manager.cancel(pending);
                    pending.cancel();
                }
                if (notificationManager != null) {
                    notificationManager.cancel(44000 + i);
                    notificationManager.cancel(45000 + i);
                }
            }
        }

        static void removeSavedTaskAlarm(Context context, int id) {
            try {
                SharedPreferences prefs = context.getSharedPreferences("stepwise_alarms", Context.MODE_PRIVATE);
                JSONArray alarms = new JSONArray(prefs.getString("task_alarms", "[]"));
                JSONArray next = new JSONArray();
                for (int i = 0; i < alarms.length(); i++) {
                    JSONObject item = alarms.getJSONObject(i);
                    if (item.optInt("id", -1) != id) {
                        next.put(item);
                    }
                }
                prefs.edit().putString("task_alarms", next.toString()).apply();
            } catch (Exception ignored) {}
        }

        static void restoreSavedTaskAlarms(Context context) {
            try {
                SharedPreferences prefs = context.getSharedPreferences("stepwise_alarms", Context.MODE_PRIVATE);
                String json = prefs.getString("task_alarms", "[]");
                scheduleTaskAlarmArray(context, new JSONArray(json));
            } catch (Exception ignored) {}
        }
    }
}


