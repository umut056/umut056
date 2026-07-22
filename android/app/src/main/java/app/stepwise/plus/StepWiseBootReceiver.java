package app.stepwise.plus;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class StepWiseBootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())
            || Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())
            || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(intent.getAction())) {
            MainActivity.StepWiseNative.restoreSavedTaskAlarms(context.getApplicationContext());
        }
    }
}
