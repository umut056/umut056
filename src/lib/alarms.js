import { buildTaskAlarms, msUntilTodayTime } from "../features/tasks/taskAlarmService.js";

export const playAlarmTone = () => {
  try {
    if (navigator.vibrate) navigator.vibrate([350, 120, 350, 120, 500]);
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [880, 1175, 988].forEach((freq, index) =>
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.value = 0.16;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => osc.stop(), 260);
      }, index * 310),
    );
    setTimeout(() => ctx.close(), 1300);
  } catch {}
};

export const scheduleNativeAlarms = (tasks = [], checks = [], snoozed = {}) => {
  const alarms = buildTaskAlarms(tasks, checks, snoozed);
  try {
    if (window.StepWiseNative?.scheduleTaskAlarms) {
      window.StepWiseNative.scheduleTaskAlarms(JSON.stringify(alarms));
      return alarms.length;
    }
  } catch {}
  return 0;
};

export const cancelNativeAlarm = (id) => {
  try {
    window.StepWiseNative?.cancelTaskAlarm?.(id);
  } catch {}
};

export const cancelAllNativeAlarms = () => {
  try {
    window.StepWiseNative?.cancelTaskAlarms?.();
  } catch {}
};

export const canUseExactNativeAlarms = () => {
  try {
    if (!window.StepWiseNative?.canScheduleExactAlarms) return true;
    return !!window.StepWiseNative.canScheduleExactAlarms();
  } catch {
    return true;
  }
};

export const canUseFullScreenNativeAlarms = () => {
  try {
    if (!window.StepWiseNative?.canUseFullScreenIntent) return true;
    return !!window.StepWiseNative.canUseFullScreenIntent();
  } catch {
    return true;
  }
};

export const openExactAlarmSettings = () => {
  try {
    window.StepWiseNative?.openExactAlarmSettings?.();
  } catch {}
};

export const openFullScreenAlarmSettings = () => {
  try {
    window.StepWiseNative?.openFullScreenIntentSettings?.();
  } catch {}
};

export const scheduleInAppReminders = async (tasks = []) => {
  const nativeCount = scheduleNativeAlarms(tasks);
  if (typeof window === "undefined" || !("Notification" in window)) return nativeCount;
  const permission =
    Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
  if (permission !== "granted") return nativeCount;
  const now = new Date();
  let count = 0;
  tasks.forEach((task) => {
    const delay = msUntilTodayTime(task.alarm, now);
    if (delay > 0 && delay < 86400000) {
      count++;
      setTimeout(() => {
        playAlarmTone();
        new Notification("StepWise Plus görev zamanı", {
          body: `${task.alarm} · ${task.l}`,
          tag: `stepwise-${task.alarm}-${task.l}`,
          requireInteraction: true,
        });
      }, delay);
    }
  });
  return Math.max(count, nativeCount);
};
