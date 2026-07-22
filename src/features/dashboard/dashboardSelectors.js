import { daysBetween, milestoneFor, weightDelta } from "../../shared/lib/format.js";

export function getCoachDashboardSummary({
  coach,
  users = [],
  hasAssignedProgram = () => false,
  currentPendingCount = () => 0,
  coachProofActions = () => [],
  isRiskClient = () => false,
}) {
  const clients = users.filter((user) => user.role === "client" && user.coachId === coach.id);
  const assignedClients = clients.filter(hasAssignedProgram);
  const avg = assignedClients.length
    ? Math.round(
        assignedClients.reduce((total, client) => total + (client.compliance || 0), 0) /
          assignedClients.length,
      )
    : 0;
  const activeTasks = assignedClients.reduce(
    (total, client) => total + currentPendingCount(client),
    0,
  );
  const proofActions = coachProofActions(coach.id, users);
  const riskClients = clients.filter(isRiskClient);

  return {
    clients,
    assignedClients,
    avg,
    activeTasks,
    proofActions,
    photoPending: proofActions.length,
    riskClients,
  };
}

const clientBodyDefaults = {
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
};

export const dashboardWeightText = (value) =>
  Number(value) > 0 ? `${Number(value)} kg` : "Henüz girilmedi";

export function getClientDashboardSummary({
  client,
  taskPlan = [],
  dailyState = { tasks: [] },
  clientStartAt = () => new Date().toISOString().split("T")[0],
}) {
  const done = (dailyState.tasks || []).filter(Boolean).length;
  const pct = Math.round((done / (taskPlan.length || 1)) * 100);
  const body = { ...clientBodyDefaults, ...(client.body || {}) };
  const delta = weightDelta(client.body || {});
  const absDelta = +Math.abs(delta).toFixed(1);
  const deltaLabel = Number.isInteger(absDelta) ? String(absDelta) : absDelta.toFixed(1);
  const elapsed = daysBetween(clientStartAt(client));
  const milestone = milestoneFor(delta);
  const isGain = (body.target || 0) > (body.start || 0);

  return {
    done,
    pct,
    body,
    delta,
    deltaLabel,
    elapsed,
    milestone,
    isGain,
  };
}
