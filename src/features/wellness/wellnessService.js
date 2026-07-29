import { buildWeightUpdate, safeNumber } from "../weight/weightService.js";
import { normalizeBody } from "../measurements/measurementService.js";

const todayIsoDate = () => new Date().toISOString().split("T")[0];

const localTime = () =>
  new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));

const latestForDate = (logs = [], date, key) =>
  (Array.isArray(logs) ? logs : []).find((log) => log?.date === date && log[key] !== undefined);

export function getWellnessDay(user = {}, date = todayIsoDate()) {
  const daily = user.wellnessLogs?.[date] || {};
  const nutrition = {
    breakfast: Boolean(daily.nutrition?.breakfast),
    lunch: Boolean(daily.nutrition?.lunch),
    dinner: Boolean(daily.nutrition?.dinner),
    snacks: Boolean(daily.nutrition?.snacks),
  };

  return {
    date,
    waterMl: safeNumber(daily.waterMl, 0),
    activityMinutes: safeNumber(daily.activityMinutes, 0),
    nutrition,
    notes: daily.notes || "",
  };
}

export function updateWellnessDay(user = {}, date, patch = {}) {
  const day = getWellnessDay(user, date);
  return {
    ...user,
    wellnessLogs: {
      ...(user.wellnessLogs || {}),
      [date]: {
        ...day,
        ...patch,
        nutrition: { ...day.nutrition, ...(patch.nutrition || {}) },
        updatedAt: new Date().toISOString(),
      },
    },
  };
}

export function updateWaterLog(user = {}, { date = todayIsoDate(), deltaMl = 0, valueMl } = {}) {
  const day = getWellnessDay(user, date);
  const waterMl = Math.max(0, valueMl ?? day.waterMl + safeNumber(deltaMl, 0));
  return updateWellnessDay(user, date, { waterMl });
}

export function updateActivityLog(user = {}, { date = todayIsoDate(), deltaMinutes = 0, valueMinutes } = {}) {
  const day = getWellnessDay(user, date);
  const activityMinutes = Math.max(
    0,
    valueMinutes ?? day.activityMinutes + safeNumber(deltaMinutes, 0),
  );
  return updateWellnessDay(user, date, { activityMinutes });
}

export function updateNutritionLog(user = {}, { date = todayIsoDate(), key, value } = {}) {
  if (!key) return user;
  const day = getWellnessDay(user, date);
  return updateWellnessDay(user, date, {
    nutrition: { ...day.nutrition, [key]: value ?? !day.nutrition[key] },
  });
}

export function updateWeightLog(user = {}, { weight } = {}) {
  const value = safeNumber(weight, 0);
  if (value <= 0) return user;
  const patch = buildWeightUpdate(user, value);
  return { ...user, ...patch };
}

export function updateMeasurementLog(user = {}, { date = todayIsoDate(), measurements = {} } = {}) {
  const body = normalizeBody({ ...(user.body || {}), ...measurements });
  const cleaned = {
    waist: safeNumber(measurements.waist, body.waist),
    hip: safeNumber(measurements.hip, body.hip),
    chest: safeNumber(measurements.chest, body.chest),
  };
  const measurementLogs = [
    { date, time: localTime(), ...cleaned, createdAt: new Date().toISOString() },
    ...(user.measurementLogs || []),
  ].slice(0, 120);

  return {
    ...user,
    body: { ...body, ...cleaned },
    measurementLogs,
  };
}

export function wellnessModuleStatus(user = {}, date = todayIsoDate()) {
  const day = getWellnessDay(user, date);
  const body = normalizeBody(user.body);
  const nutritionDone = Object.values(day.nutrition).filter(Boolean).length;
  const photoProofs = user.dailyTasks?.[date]?.photoProofs || user.photoProofs || {};
  const weightLog = latestForDate(user.weightLogs, date, "weight");
  const measurementLog = latestForDate(user.measurementLogs, date, "waist");

  return [
    {
      id: "weight",
      label: "Kilo",
      value: body.current > 0 ? `${body.current} kg` : "Eksik",
      score: body.current > 0 || weightLog ? 100 : 0,
    },
    {
      id: "measurement",
      label: "Ölçüm",
      value: measurementLog ? "Bugün girildi" : body.waist > 0 ? `${body.waist} cm bel` : "Eksik",
      score: measurementLog ? 100 : body.waist > 0 ? 60 : 0,
    },
    {
      id: "photos",
      label: "Fotoğraf",
      value: `${Object.keys(photoProofs).length} kanıt`,
      score: clamp(Object.keys(photoProofs).length * 35),
    },
    {
      id: "nutrition",
      label: "Beslenme",
      value: `${nutritionDone}/4`,
      score: clamp((nutritionDone / 4) * 100),
    },
    {
      id: "water",
      label: "Su",
      value: `${day.waterMl} ml`,
      score: clamp((day.waterMl / 2500) * 100),
    },
    {
      id: "activity",
      label: "Aktivite",
      value: `${day.activityMinutes} dk`,
      score: clamp((day.activityMinutes / 45) * 100),
    },
    {
      id: "products",
      label: "Ürün",
      value: user.assignedProgramName || user.programName || "Program bekliyor",
      score: user.assignedProgramId || user.programName ? 75 : 0,
    },
    {
      id: "ai",
      label: "AI Koç",
      value: "Hazır",
      score: 65,
    },
  ];
}

export function wellnessHealthScore(user = {}, date = todayIsoDate()) {
  const modules = wellnessModuleStatus(user, date);
  if (!modules.length) return 0;
  return clamp(modules.reduce((total, module) => total + module.score, 0) / modules.length);
}
