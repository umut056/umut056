import { describe, expect, it } from "vitest";
import {
  getWellnessDay,
  updateActivityLog,
  updateMeasurementLog,
  updateNutritionLog,
  updateWaterLog,
  updateWeightLog,
  wellnessHealthScore,
  wellnessModuleStatus,
} from "./wellnessService.js";

describe("wellnessService", () => {
  it("updates daily water, nutrition and activity without mutating the user", () => {
    const user = { id: "client-1", wellnessLogs: {} };
    const withWater = updateWaterLog(user, { date: "2026-07-23", deltaMl: 500 });
    const withFood = updateNutritionLog(withWater, {
      date: "2026-07-23",
      key: "breakfast",
      value: true,
    });
    const withActivity = updateActivityLog(withFood, {
      date: "2026-07-23",
      deltaMinutes: 20,
    });

    expect(user.wellnessLogs).toEqual({});
    expect(getWellnessDay(withActivity, "2026-07-23")).toMatchObject({
      waterMl: 500,
      activityMinutes: 20,
      nutrition: { breakfast: true },
    });
  });

  it("records weight and body measurements through existing body shape", () => {
    const user = { id: "client-1", body: { start: 72, current: 70 } };
    const withWeight = updateWeightLog(user, { weight: 68.5 });
    const withMeasurements = updateMeasurementLog(withWeight, {
      date: "2026-07-23",
      measurements: { waist: 82, hip: 96, chest: 91 },
    });

    expect(withMeasurements.body.current).toBe(68.5);
    expect(withMeasurements.body.waist).toBe(82);
    expect(withMeasurements.weightLogs[0].weight).toBe(68.5);
    expect(withMeasurements.measurementLogs[0]).toMatchObject({
      date: "2026-07-23",
      waist: 82,
      hip: 96,
      chest: 91,
    });
  });

  it("derives V2 module status and health score", () => {
    const user = {
      body: { start: 72, current: 68, waist: 82 },
      assignedProgramName: "6 Temel Program",
      dailyTasks: {
        "2026-07-23": { photoProofs: { 0: { status: "pending" } } },
      },
      wellnessLogs: {
        "2026-07-23": {
          waterMl: 1500,
          activityMinutes: 30,
          nutrition: { breakfast: true, lunch: true },
        },
      },
    };

    const modules = wellnessModuleStatus(user, "2026-07-23");
    expect(modules.map((module) => module.id)).toEqual([
      "weight",
      "measurement",
      "photos",
      "nutrition",
      "water",
      "activity",
      "products",
      "ai",
    ]);
    expect(wellnessHealthScore(user, "2026-07-23")).toBeGreaterThan(40);
  });
});
