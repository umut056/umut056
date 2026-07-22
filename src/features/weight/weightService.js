export const safeNumber = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const todayIsoDate = () => new Date().toISOString().split("T")[0];

const localTime = () =>
  new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });

export function buildWeightUpdate(client, weight) {
  const value = Number(weight);
  const currentClient = client || {};
  const hasStart = Number(currentClient.body?.start) > 0;
  const startedAt =
    currentClient.startedAt || currentClient.createdAtTime || new Date().toISOString();
  const body = {
    ...(currentClient.body || {}),
    start: hasStart ? currentClient.body.start : value,
    current: value,
  };
  const weightLogs = [
    {
      date: todayIsoDate(),
      weight: value,
      time: localTime(),
      createdAt: new Date().toISOString(),
    },
    ...(currentClient.weightLogs || []),
  ].slice(0, 90);

  return {
    startedAt,
    createdAtTime: currentClient.createdAtTime || startedAt,
    body,
    weightLogs,
  };
}
