import { weightDelta } from "../../shared/lib/format.js";

export function coachReportClients(users = [], coachId) {
  return (Array.isArray(users) ? users : []).filter(
    (user) => user?.role === "client" && user.coachId === coachId,
  );
}

export function averageCompliance(clients = []) {
  if (!clients.length) return 0;
  return Math.round(
    clients.reduce((total, client) => total + (Number(client.compliance) || 0), 0) / clients.length,
  );
}

export function totalLostWeight(clients = []) {
  return clients.reduce((total, client) => total + Math.max(0, weightDelta(client.body || {})), 0);
}

export function riskClients(clients = [], isRiskClient) {
  return clients.filter((client) => {
    try {
      return isRiskClient(client);
    } catch {
      return false;
    }
  });
}

export function reportTrendBars(avg = 0) {
  return [45, 60, 55, 70, avg || 0, 75, avg || 0];
}

export function clientProgressBars({ compliance = 0, weekly = 0 } = {}) {
  return [52, 64, weekly || 60, 70, compliance, 75, compliance];
}

export function clientProgressBody(body = {}) {
  return {
    height: 0,
    age: 0,
    gender: "female",
    start: 0,
    current: 0,
    target: 0,
    water: 0,
    fat: 0,
    muscle: 0,
    bmi: 0,
    waist: 0,
    hip: 0,
    chest: 0,
    ideal: "-",
    ...body,
  };
}

export function topClientProgressClients(users = [], limit = 6) {
  return clientsByMonthlyScore((Array.isArray(users) ? users : []).filter((user) => user.role === "client"))
    .slice(0, limit);
}

export function recentTaskLogsForClients(taskLogs = [], clients = [], limit = 8) {
  const clientIds = new Set(clients.map((client) => client.id));
  return taskLogs.filter((log) => clientIds.has(log.clientId)).slice(0, limit);
}

export function clientsByCompliance(clients = []) {
  return [...clients].sort((a, b) => (Number(b.compliance) || 0) - (Number(a.compliance) || 0));
}

export function clientsByMonthlyScore(clients = []) {
  return [...clients].sort(
    (a, b) =>
      ((b.compliance || 0) + (b.weeklyAverage || 0)) -
      ((a.compliance || 0) + (a.weeklyAverage || 0)),
  );
}
