import { normalizeBody } from "../measurements/measurementService.js";

export const safeNumber = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const todayIsoDate = () => new Date().toISOString().split("T")[0];

const localTime = () =>
  new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });

export function buildWeightUpdate(client, weight) {
  const value = Number(weight);
  const currentClient = client || {};
  const existingBody = normalizeBody(currentClient.body || {});
  const startedAt =
    currentClient.startedAt || currentClient.createdAtTime || new Date().toISOString();

  if (!Number.isFinite(value) || value <= 0) {
    return {
      startedAt,
      createdAtTime: currentClient.createdAtTime || startedAt,
      body: existingBody,
      weightLogs: Array.isArray(currentClient.weightLogs)
        ? currentClient.weightLogs.slice(0, 90)
        : [],
    };
  }

  const hasStart = Number(existingBody.start) > 0;
  const body = {
    ...existingBody,
    start: hasStart ? existingBody.start : value,
    current: value,
  };
  const weightLogs = [
    {
      date: todayIsoDate(),
      weight: value,
      time: localTime(),
      createdAt: new Date().toISOString(),
    },
    ...(Array.isArray(currentClient.weightLogs) ? currentClient.weightLogs : []),
  ].slice(0, 90);

  return {
    startedAt,
    createdAtTime: currentClient.createdAtTime || startedAt,
    body,
    weightLogs,
  };
}
