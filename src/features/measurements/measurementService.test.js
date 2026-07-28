import { describe, expect, it } from "vitest";
import { applyBodyEstimateToDraft, normalizeBody } from "./measurementService.js";

describe("measurementService", () => {
  it("normalizes missing and invalid body measurements to stable defaults", () => {
    const body = normalizeBody({
      height: "170",
      age: "bad",
      start: "72",
      current: undefined,
      waist: "84.5",
      gender: "",
      ideal: "",
    });

    expect(body.height).toBe(170);
    expect(body.age).toBe(0);
    expect(body.start).toBe(72);
    expect(body.current).toBe(0);
    expect(body.waist).toBe(84.5);
    expect(body.gender).toBe("female");
    expect(body.ideal).toBe("-");
  });

  it("applies body estimates while preserving draft target fallback", () => {
    const draft = normalizeBody({ start: 72, current: 67.5, target: 63 });

    const withTarget = applyBodyEstimateToDraft(draft, {
      bmi: 24.2,
      fat: 28,
      water: 52,
      muscle: 31,
      target: 62,
      ideal: "60-64 kg",
      excess: 5.5,
    });

    expect(withTarget.target).toBe(62);
    expect(withTarget.ideal).toBe("60-64 kg");
    expect(withTarget.excess).toBe(5.5);

    const withoutTarget = applyBodyEstimateToDraft(draft, {
      bmi: 24.2,
      fat: 28,
      water: 52,
      muscle: 31,
      ideal: "60-64 kg",
      excess: 5.5,
    });

    expect(withoutTarget.target).toBe(63);
  });
});
