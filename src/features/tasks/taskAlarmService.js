export function normalizeAlarmTime(time) {
  return /^\d{2}:\d{2}$/.test(String(time || "")) ? time : null;
}

export function taskAlarmTime(task, snoozed = {}, index = 0) {
  return normalizeAlarmTime(snoozed[index]?.nextAlarm || task?.alarm || task?.scheduledTime);
}

export function buildTaskAlarms(tasks = [], checks = [], snoozed = {}) {
  return tasks
    .map((task, index) => ({
      id: task.idx ?? index,
      title: task.l || task.title || `Görev ${index + 1}`,
      time: taskAlarmTime(task, snoozed, index),
      done: !!checks[index],
      repeatDelayMs: 60 * 1000,
      graceMinutes: 5,
      requiresAcknowledgement: true,
    }))
    .filter((task) => task.time && !task.done);
}

export function msUntilTodayTime(time, now = new Date()) {
  const clean = normalizeAlarmTime(time);
  if (!clean) return null;
  const [hours, minutes] = clean.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  return target.getTime() - now.getTime();
}

export function dueAlarmTime(task, snoozed = {}, index = 0) {
  return taskAlarmTime(task, snoozed, index);
}

export function isTaskOverdue(task, completed, snoozed = {}, index = 0, now = Date.now()) {
  if (completed) return false;
  const time = dueAlarmTime(task, snoozed, index);
  if (!time) return false;
  const [hours, minutes] = time.split(":").map(Number);
  const due = new Date();
  due.setHours(hours, minutes + 5, 0, 0);
  return now > due.getTime();
}

export function reminderPermissionWarnings({ exact = true, fullScreen = true }) {
  return [
    !exact ? "Kesin alarm izni kapalıysa cihaz alarmı geciktirebilir." : "",
    !fullScreen ? "Kilit ekranında tam ekran alarm izni kapalı görünüyor." : "",
  ].filter(Boolean);
}
