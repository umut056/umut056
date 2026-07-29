import { daysBetween, milestoneFor, weightDelta } from "../../shared/lib/format.js";

export function getCoachDashboardSummary({
  coach,
  users = [],
  hasAssignedProgram = () => false,
  currentPendingCount = () => 0,
  currentCompliance = (client) => client.compliance || 0,
  coachProofActions = () => [],
  isRiskClient = () => false,
}) {
  const clients = users.filter((user) => user.role === "client" && user.coachId === coach.id);
  const assignedClients = clients.filter(hasAssignedProgram);
  const avg = assignedClients.length
    ? Math.round(
        assignedClients.reduce((total, client) => total + (currentCompliance(client) || 0), 0) /
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

const clampScore = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
};

const weightProgressScore = (body) => {
  const start = Number(body.start) || 0;
  const current = Number(body.current) || 0;
  const target = Number(body.target) || 0;
  if (!start || !current || !target || start === target) return 35;
  const total = Math.abs(start - target);
  const moved = Math.abs(start - current);
  return clampScore((moved / total) * 100);
};

export function getClientWellnessSnapshot({
  client,
  taskPlan = [],
  dailyState = { tasks: [] },
}) {
  const done = (dailyState.tasks || []).filter(Boolean).length;
  const taskScore = taskPlan.length ? clampScore((done / taskPlan.length) * 100) : 0;
  const body = { ...clientBodyDefaults, ...(client.body || {}) };
  const compliance = clampScore(client.compliance || taskScore);
  const progressScore = weightProgressScore(body);
  const waterScore = Number(body.water) > 0 ? clampScore(body.water) : clampScore(compliance * 0.55);
  const nutritionScore = clampScore(compliance * 0.55 + taskScore * 0.45);
  const activityScore = clampScore(Math.max(taskScore, (Number(client.streakDays) || 0) * 12));
  const healthScore = clampScore(
    taskScore * 0.28 +
      nutritionScore * 0.24 +
      waterScore * 0.18 +
      activityScore * 0.12 +
      progressScore * 0.18,
  );
  const aiInsight =
    healthScore >= 75
      ? "Ritmin güçlü. Bugün su ve görev düzenini korursan hedef çizgin sağlam kalır."
      : healthScore >= 45
        ? "Bugün bir ana görev ve su takibini tamamlamak genel skoru hızlı toparlar."
        : "Küçük başla: ilk görev, tartı kaydı ve kısa yürüyüş bugün için yeterli bir başlangıç.";

  return {
    healthScore,
    taskScore,
    waterScore,
    nutritionScore,
    activityScore,
    progressScore,
    aiInsight,
    modules: [
      { id: "nutrition", label: "Beslenme", score: nutritionScore },
      { id: "water", label: "Su", score: waterScore },
      { id: "activity", label: "Aktivite", score: activityScore },
      { id: "progress", label: "İlerleme", score: progressScore },
    ],
    actionCards: [
      {
        id: "ai-coach",
        label: "AI Koç",
        value: `${healthScore}/100`,
        text: aiInsight,
        tone: healthScore >= 70 ? "good" : healthScore >= 45 ? "warn" : "risk",
      },
      {
        id: "nutrition",
        label: "Beslenme",
        value: `%${nutritionScore}`,
        text: taskPlan.length
          ? "Bugünkü program öğünleri ve ürün kullanımı görevlerinden takip ediliyor."
          : "Program atanınca beslenme rutini burada dolacak.",
        tone: nutritionScore >= 70 ? "good" : "warn",
      },
      {
        id: "body",
        label: "Vücut Takibi",
        value: `${progressScore}/100`,
        text: Number(body.current) > 0
          ? `Güncel kilo ${body.current} kg. Hedefe ilerleme skoru hesaplandı.`
          : "Başlangıç, güncel ve hedef kilo girildiğinde analiz açılır.",
        tone: progressScore >= 55 ? "good" : "neutral",
      },
      {
        id: "hydration",
        label: "Su",
        value: `%${waterScore}`,
        text: "Su yüzdesi ve günlük takip ilerleyen modülde ayrı grafik olarak büyütülecek.",
        tone: waterScore >= 50 ? "good" : "warn",
      },
      {
        id: "activity",
        label: "Aktivite",
        value: `%${activityScore}`,
        text: "Seri, yürüyüş ve hareket görevleri aktivite skorunu besler.",
        tone: activityScore >= 50 ? "good" : "neutral",
      },
      {
        id: "products",
        label: "Ürün",
        value: taskPlan.length ? `${taskPlan.length}` : "0",
        text: "Ürün kullanımı program görevleri ve video anlatımları ile takip edilir.",
        tone: taskPlan.length ? "good" : "neutral",
      },
    ],
  };
}

export function getCoachV2Snapshot({
  clients = [],
  avg = 0,
  activeTasks = 0,
  proofActions = [],
  riskClients = [],
}) {
  const riskRatio = clients.length ? (riskClients.length / clients.length) * 100 : 0;
  const proofLoadScore = Math.max(0, 100 - proofActions.length * 8);
  const taskLoadScore = Math.max(0, 100 - activeTasks * 2);
  const healthScore = clampScore(
    (Number(avg) || 0) * 0.45 + (100 - riskRatio) * 0.25 + proofLoadScore * 0.2 + taskLoadScore * 0.1,
  );
  const aiBrief =
    riskClients.length > 0
      ? `${riskClients[0].name} bugün öncelikli takip edilmeli. Risk sinyali yüksek.`
      : proofActions.length > 0
        ? `${proofActions.length} fotoğraf onayı bekliyor. Onayları kapatınca günlük akış netleşir.`
        : "Danışan akışı dengeli görünüyor. Bugün kısa motivasyon notları iyi etki eder.";

  return {
    healthScore,
    riskRatio: clampScore(riskRatio),
    proofLoad: proofActions.length,
    aiBrief,
    focusItems: [
      { label: "Danışan", value: clients.length },
      { label: "Risk", value: riskClients.length },
      { label: "Onay", value: proofActions.length },
    ],
  };
}

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
