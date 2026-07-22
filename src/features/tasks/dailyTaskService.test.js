import { describe, expect, it } from "vitest";
import { dailyStateFor, mergeDailyUser } from "./dailyTaskService.js";

describe("dailyTaskService", () => {
  it("creates a fresh daily state for the requested date", () => {
    const state = dailyStateFor({}, [{ title: "A" }, { title: "B" }], "2026-07-22");

    expect(state).toEqual({
      date: "2026-07-22",
      tasks: [false, false],
      photoProofs: {},
      snoozedTasks: {},
      note: "",
    });
  });

  it("does not reuse a previous day when the date changes", () => {
    const user = {
      dailyTasks: {
        "2026-07-21": {
          date: "2026-07-21",
          tasks: [true],
          photoProofs: { 0: { url: "old" } },
          snoozedTasks: {},
          note: "old",
        },
      },
    };

    const state = dailyStateFor(user, [{ title: "A" }], "2026-07-22");

    expect(state.date).toBe("2026-07-22");
    expect(state.tasks).toEqual([false]);
    expect(state.photoProofs).toEqual({});
  });

  it("merges daily state and recalculates compliance and pending counts", () => {
    const tasks = [{ title: "A", photoRequired: true }, { title: "B" }];
    const merged = mergeDailyUser(
      { id: "client-1", dailyTasks: {} },
      tasks,
      { date: "2026-07-22", tasks: [true, false], photoProofs: {}, snoozedTasks: {}, note: "done" },
    );

    expect(merged.compliance).toBe(50);
    expect(merged.pendingToday).toBe(1);
    expect(merged.photoPendingToday).toBe(0);
    expect(merged.dailyTasks["2026-07-22"].tasks).toEqual([true, false]);
  });
});

