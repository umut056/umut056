import { normalizeBody } from "../measurements/measurementService.js";

const numeric = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

export const normalizeUserDefaults = (user = {}) => {
  const tasks = Array.isArray(user.tasks) ? user.tasks : [];

  if (user.role === "client") {
    const body = normalizeBody(user.body || {});

    return {
      ...user,
      tasks,
      compliance: numeric(user.compliance),
      weeklyAverage: numeric(user.weeklyAverage),
      pendingToday: numeric(user.pendingToday, Math.max(0, tasks.filter((x) => !x).length)),
      photoPendingToday: numeric(user.photoPendingToday),
      missedToday: numeric(user.missedToday),
      body,
      productVideos: Array.isArray(user.productVideos) ? user.productVideos : [],
      notifications: Array.isArray(user.notifications) ? user.notifications : [],
      coachNotes: Array.isArray(user.coachNotes) ? user.coachNotes : [],
      dismissedCoachNoteKeys: Array.isArray(user.dismissedCoachNoteKeys)
        ? user.dismissedCoachNoteKeys
        : [],
      program: user.program || "Program atanmadı",
      goal: user.goal || user.email || "",
    };
  }

  return {
    ...user,
    tasks,
    compliance: numeric(user.compliance),
    weeklyAverage: numeric(user.weeklyAverage),
    notifications: Array.isArray(user.notifications) ? user.notifications : [],
  };
};

export const normalizeUsers = (users = []) => users.map(normalizeUserDefaults);

export function mergeCloudUsersWithLocal(
  cloudUsers = [],
  localUsers = [],
  { hasAssignedProgram = () => false } = {},
) {
  const localById = new Map(localUsers.map((user) => [user.id, user]));

  return cloudUsers.map((user) => {
    const local = localById.get(user.id);
    if (!local) return user;

    const localAssigned = hasAssignedProgram(local);
    const cloudAssigned = hasAssignedProgram(user);

    return normalizeUserDefaults({
      ...local,
      ...user,
      body: { ...(local.body || {}), ...(user.body || {}) },
      dailyTasks: { ...(local.dailyTasks || {}), ...(user.dailyTasks || {}) },
      photoProofs: { ...(local.photoProofs || {}), ...(user.photoProofs || {}) },
      productVideos: (user.productVideos?.length ? user.productVideos : local.productVideos) || [],
      productVideo: user.productVideo || local.productVideo,
      productVideoDraft: user.productVideoDraft || local.productVideoDraft,
      ...(localAssigned && !cloudAssigned
        ? {
            program: local.program,
            programTemplateId: local.programTemplateId,
            programDraft: local.programDraft,
            tasks: local.tasks,
            pendingToday: local.pendingToday,
            photoPendingToday: local.photoPendingToday,
            compliance: local.compliance,
            programHistory: local.programHistory,
          }
        : {}),
    });
  });
}

export const mergeMessages = (cloudMsgs = [], localMsgs = []) => {
  const byId = new Map();
  [...cloudMsgs, ...localMsgs].forEach((message) => {
    if (message?.id && !byId.has(message.id)) byId.set(message.id, message);
  });
  return [...byId.values()].sort(
    (a, b) =>
      (a.createdAt || 0) - (b.createdAt || 0) ||
      String(a.time || "").localeCompare(String(b.time || "")),
  );
};
