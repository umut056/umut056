const localTime = () =>
  new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });

const asArray = (value) => (Array.isArray(value) ? value : []);

export function getCoachProofActions({
  coachId,
  users = [],
  getTaskPlan = () => [],
  todayKey,
}) {
  return asArray(users)
    .filter((user) => user?.role === "client" && user.coachId === coachId)
    .flatMap((client) => {
      const plan = getTaskPlan(client);
      const day = client.dailyTasks?.[todayKey] || {};
      const proofs = day.photoProofs || client.photoProofs || {};
      return Object.entries(proofs).map(([idx, proof]) => {
        const taskIndex = Number(idx) || 0;
        return {
          client,
          idx: taskIndex,
          task: plan[taskIndex]?.title || `Görev ${taskIndex + 1}`,
          ...(proof || {}),
        };
      });
    })
    .filter((proof) => (proof.status || "pending") === "pending" && !proof.coachHiddenAt)
    .sort((a, b) =>
      (b.localSavedAt || b.date || "").localeCompare(a.localSavedAt || a.date || ""),
    );
}

export function applyCoachProofStatus({
  users = [],
  coachId,
  clientId,
  idx,
  status,
  todayKey,
  getTaskPlan = () => [],
}) {
  let taskTitle = "Görev fotoğrafı";

  const nextUsers = asArray(users).map((user) => {
    if (user.id !== clientId) return user;

    const day = user.dailyTasks?.[todayKey] || {
      date: todayKey,
      tasks: user.tasks || [],
      photoProofs: user.photoProofs || {},
      snoozedTasks: user.snoozedTasks || {},
    };
    const current = day.photoProofs?.[idx] || user.photoProofs?.[idx] || {};
    taskTitle = getTaskPlan(user)[idx]?.title || taskTitle;
    const patch =
      status === "dismissed"
        ? { coachHiddenAt: new Date().toISOString(), coachHiddenBy: coachId }
        : {
            status,
            reviewedAt: localTime(),
            reviewedBy: coachId,
            coachHiddenAt: null,
          };
    const proof = { ...current, ...patch };

    return {
      ...user,
      photoProofs: { ...(user.photoProofs || {}), [idx]: proof },
      dailyTasks: {
        ...(user.dailyTasks || {}),
        [todayKey]: {
          ...day,
          photoProofs: { ...(day.photoProofs || {}), [idx]: proof },
        },
      },
    };
  });

  return { users: nextUsers, taskTitle };
}

export const createProofReviewLog = ({ coachId, clientId, taskTitle, status, todayKey }) => ({
  id: `log${Date.now()}`,
  clientId,
  coachId,
  taskTitle,
  action:
    status === "approved"
      ? "proof_approved"
      : status === "rejected"
        ? "proof_rejected"
        : "proof_dismissed",
  date: todayKey,
  time: localTime(),
});
