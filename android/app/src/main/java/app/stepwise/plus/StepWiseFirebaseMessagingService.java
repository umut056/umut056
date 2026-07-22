package app.stepwise.plus;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class StepWiseFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "stepwise_general";

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        getSharedPreferences("stepwise_push", Context.MODE_PRIVATE)
            .edit()
            .putString("fcm_token", token)
            .apply();
    }

    @Override
    public void onMessageReceived(RemoteMessage message) {
        super.onMessageReceived(message);

        String title = "StepWise Plus";
        String body = "";

        if (message.getNotification() != null) {
            if (message.getNotification().getTitle() != null) {
                title = message.getNotification().getTitle();
            }
            if (message.getNotification().getBody() != null) {
                body = message.getNotification().getBody();
            }
        }

        if (message.getData() != null) {
            if (message.getData().containsKey("title") && !message.getData().get("title").isEmpty()) {
                title = message.getData().get("title");
            }
            if (message.getData().containsKey("body") && !message.getData().get("body").isEmpty()) {
                body = message.getData().get("body");
            } else if (message.getData().containsKey("text") && !message.getData().get("text").isEmpty()) {
                body = message.getData().get("text");
            }
        }

        if (body == null || body.trim().isEmpty()) {
            body = "Yeni bildirimin var.";
        }
        showNotification(title, body);
    }

    private void showNotification(String title, String body) {
        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "StepWise Plus bildirimleri",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Mesaj, randevu ve koç-danışan bildirimleri");
            manager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setSound(sound)
            .setVibrate(new long[] { 0, 220, 120, 220 })
            .setContentIntent(pendingIntent);

        manager.notify((int) (System.currentTimeMillis() % Integer.MAX_VALUE), builder.build());
    }
}

