import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildTaskAlarms,
  isTaskOverdue,
  msUntilTodayTime,
  reminderPermissionWarnings,
  taskAlarmTime,
} from "./taskAlarmService.js";

describe("taskAlarmService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds alarms only for active tasks and keeps original task ids", () => {
    const alarms = buildTaskAlarms(
      [
        { idx: 7, l: "Sabah tartisi", alarm: "07:00" },
        { idx: 8, l: "Kahvalti", alarm: "07:15" },
        { idx: 9, l: "Gecersiz saat", alarm: "sabah" },
      ],
      [false, true, false],
      { 0: { nextAlarm: "07:30" } },
    );

    expect(alarms).toEqual([
      {
        id: 7,
        title: "Sabah tartisi",
        time: "07:30",
        done: false,
        repeatDelayMs: 60 * 1000,
        graceMinutes: 5,
        requiresAcknowledgement: true,
      },
    ]);
  });

  it("normalizes task alarm time from snooze, task alarm, or scheduled time", () => {
    expect(taskAlarmTime({ alarm: "07:00" }, { 0: { nextAlarm: "07:45" } }, 0)).toBe("07:45");
    expect(taskAlarmTime({ scheduledTime: "08:15" }, {}, 0)).toBe("08:15");
    expect(taskAlarmTime({ scheduledTime: "sabah" }, {}, 0)).toBeNull();
  });

  it("calculates milliseconds until a same-day alarm time", () => {
    const now = new Date("2026-07-22T09:00:00");

    expect(msUntilTodayTime("09:05", now)).toBe(5 * 60 * 1000);
    expect(msUntilTodayTime("08:55", now)).toBe(-5 * 60 * 1000);
    expect(msUntilTodayTime("bad", now)).toBeNull();
  });

  it("marks tasks overdue only after the five minute grace period", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-22T09:04:59"));

    expect(isTaskOverdue({ alarm: "09:00" }, false, {}, 0, Date.now())).toBe(false);

    vi.setSystemTime(new Date("2026-07-22T09:05:01"));

    expect(isTaskOverdue({ alarm: "09:00" }, false, {}, 0, Date.now())).toBe(true);
    expect(isTaskOverdue({ alarm: "09:00" }, true, {}, 0, Date.now())).toBe(false);
  });

  it("returns permission warnings for weakened Android alarm permissions", () => {
    const warnings = reminderPermissionWarnings({ exact: false, fullScreen: false });

    expect(warnings).toHaveLength(2);
    expect(warnings[0]).toContain("Kesin alarm");
    expect(warnings[1]).toContain("Kilit ekran");
  });
});
