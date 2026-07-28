import { describe, expect, it } from "vitest";
import { buildWeightUpdate, safeNumber } from "./weightService.js";
import { formatWeightKg, hasWeightPair, weightDelta } from "../../shared/lib/format.js";

describe("weightService", () => {
  it("creates the first weight update without producing a false delta", () => {
    const update = buildWeightUpdate({ id: "client-1" }, 72);

    expect(update.body.start).toBe(72);
    expect(update.body.current).toBe(72);
    expect(update.weightLogs).toHaveLength(1);
    expect(hasWeightPair(update.body)).toBe(true);
    expect(weightDelta(update.body)).toBe(0);
  });

  it("keeps the original start weight and records a valid current weight", () => {
    const update = buildWeightUpdate(
      {
        body: { start: 72, current: 70, target: 63 },
        weightLogs: [{ date: "2026-06-01", weight: 70 }],
      },
      67.5,
    );

    expect(update.body.start).toBe(72);
    expect(update.body.current).toBe(67.5);
    expect(update.body.target).toBe(63);
    expect(update.weightLogs[0].weight).toBe(67.5);
    expect(update.weightLogs).toHaveLength(2);
    expect(weightDelta(update.body)).toBe(4.5);
  });

  it("ignores invalid weight values and preserves a normalized body", () => {
    const update = buildWeightUpdate(
      {
        body: { start: "72", current: "bad", target: "63" },
        weightLogs: [{ date: "2026-06-01", weight: 72 }],
      },
      "not-a-weight",
    );

    expect(update.body.start).toBe(72);
    expect(update.body.current).toBe(0);
    expect(update.body.target).toBe(63);
    expect(update.weightLogs).toEqual([{ date: "2026-06-01", weight: 72 }]);
    expect(weightDelta(update.body)).toBe(0);
  });

  it("formats missing and decimal weight values safely", () => {
    expect(safeNumber("bad", 12)).toBe(12);
    expect(hasWeightPair({ start: 72 })).toBe(false);
    expect(formatWeightKg(undefined)).toBe("Henüz girilmedi");
    expect(formatWeightKg(67.5)).toBe("67.5 kg");
    expect(formatWeightKg(72)).toBe("72 kg");
  });
});
