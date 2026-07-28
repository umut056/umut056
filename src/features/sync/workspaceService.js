import { normalizeBody } from "../measurements/measurementService.js";

const numeric = (value, fallback = 0) =>
  Number.isFinite(Number(value)) ? Number(value) : fallback;

const bodyNumberKeys = [
  "height",
  "age",
  "start",
  "current",
  "target",
  "water",
  "fat",
  "muscle",
  "bmi",
  "waist",
  "hip",
  "chest",
  "excess",
];

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const hasNonZeroLocal = (localBody, key) => Number(localBody?.[key] || 0) !== 0;

const mergeBody = (localBody = {}, cloudBody = {}) => {
  const merged = { ...localBody, ...cloudBody };

  bodyNumberKeys.forEach((key) => {
    const cloudValue = cloudBody?.[key];
    if (Number(cloudValue || 0) === 0 && hasNonZeroLocal(localBody, key)) {
      merged[key] = localBody[key];
    }
  });

  if ((!hasValue(cloudBody.gender) || cloudBody.gender === "female") && hasValue(localBody.gender)) {
    merged.gender = localBody.gender;
  }
  if ((!hasValue(cloudBody.ideal) || cloudBody.ideal === "-") && hasValue(localBody.ideal)) {
    merged.ideal = localBody.ideal;
  }

  return merged;
};

const sameProgramAssignment = (local = {}, cloud = {}) =>
  !!local.programTemplateId &&
  !!cloud.programTemplateId &&
  local.programTemplateId === cloud.programTemplateId;

const hasCloudDailyState = (user = {}) =>
  Object.keys(user.dailyTasks || {}).length > 0 ||
  Object.keys(user.photoProofs || {}).length > 0 ||
  (Array.isArray(user.tasks) && user.tasks.some(Boolean));

const hasLocalDailyState = (user = {}) =>
  hasCloudDailyState(user) ||
  Number(user.compliance || 0) > 0 ||
  Number(user.weeklyAverage || 0) > 0 ||
  Number(user.missedToday || 0) > 0;

const localProgressPatch = (local = {}, cloud = {}) => {
  if (!sameProgramAssignment(local, cloud) || hasCloudDailyState(cloud) || !hasLocalDailyState(local)) return {};

  return {
    tasks: Array.isArray(local.tasks) ? local.tasks : cloud.tasks,
    pendingToday: local.pendingToday,
    photoPendingToday: local.photoPendingToday,
    missedToday: local.missedToday,
    compliance: local.compliance,
    weeklyAverage: local.weeklyAverage,
  };
};

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
      body: mergeBody(local.body || {}, user.body || {}),
      dailyTasks: { ...(local.dailyTasks || {}), ...(user.dailyTasks || {}) },
      photoProofs: { ...(local.photoProofs || {}), ...(user.photoProofs || {}) },
      productVideos: (user.productVideos?.length ? user.productVideos : local.productVideos) || [],
      productVideo: user.productVideo || local.productVideo,
      productVideoDraft: user.productVideoDraft || local.productVideoDraft,
      ...localProgressPatch(local, user),
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
