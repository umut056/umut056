import { daysBetween } from "../../shared/lib/format.js";

export const UNASSIGNED_PROGRAM = "Program atanmadı";

export function templateTasks(templates = [], templateId) {
  return templates.find((program) => program.id === templateId)?.tasks || templates[0]?.tasks || [];
}

export function taskTitles(templates = [], templateId) {
  return templateTasks(templates, templateId).map((task) => task.title);
}

export function programKey(program = {}) {
  return `${program.coachId || "system"}::${(program.name || "").trim().toLocaleLowerCase("tr-TR")}`;
}

export function uniquePrograms(programs = []) {
  const seen = new Set();
  return programs.filter((program) => {
    const key = programKey(program);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function editableProgramForCoach(program = {}, coachId) {
  if (!program?.id || !coachId) return { ...program };
  if (program.coachId === coachId) return { ...program };
  return {
    ...program,
    id: `cp-${coachId}-${program.id}`,
    coachId,
    variantNote: "Ozel",
    sourceTemplateId: program.id,
  };
}

export function programTasksToRows(tasks = []) {
  return tasks
    .map((task) => [task.title, task.scheduledTime, task.section, task.note].filter(Boolean).join(" | "))
    .join("\n");
}

export function parseProgramTaskRows(text = "", fallbackTasks = []) {
  const tasks = String(text)
    .split("\n")
    .map((line) => {
      const [title, time, section, note] = line.split("|").map((part) => (part || "").trim());
      if (!title) return null;
      return {
        title,
        type: "meal",
        section: section || "Genel",
        scheduledTime: time || "09:00",
        repeatType: "daily",
        repeatDays: [1, 2, 3, 4, 5, 6, 7],
        buttonLabel: "Fotoğraf Ekle",
        photoRequired: true,
        snoozeEnabled: true,
        snoozeOptions: [15, 30, 60],
        note: note || title,
      };
    })
    .filter(Boolean);

  return normalizeProgramTasksForCycle(tasks.length ? tasks : fallbackTasks.map((task) => ({ ...task })));
}

export function buildProgramRemovalState({ program, programs = [], users = [], coachId }) {
  if (!program?.id || !coachId) return { programs, users };

  if (program.coachId !== coachId) {
    return {
      programs,
      users: users.map((user) =>
        user.id === coachId
          ? { ...user, hiddenProgramIds: [...new Set([...(user.hiddenProgramIds || []), program.id])] }
          : user,
      ),
    };
  }

  return {
    programs: programs.filter((item) => item.id !== program.id),
    users: users.map((user) =>
      user.programTemplateId === program.id
        ? {
            ...user,
            program: UNASSIGNED_PROGRAM,
            programTemplateId: "",
            programDraft: null,
            tasks: [],
            pendingToday: 0,
            photoPendingToday: 0,
            missedToday: 0,
            compliance: 0,
          }
        : user,
    ),
  };
}

export function hiddenProgramIdsFor(users = [], coachId) {
  return new Set((users.find((user) => user.id === coachId)?.hiddenProgramIds || []).filter(Boolean));
}

export function allPrograms({ coachId, templates = [], programs = [], users = [] }) {
  const hidden = coachId ? hiddenProgramIdsFor(users, coachId) : new Set();
  return uniquePrograms([
    ...templates,
    ...programs.filter((program) => !program.coachId || program.coachId === coachId),
  ]).filter((program) => !hidden.has(program.id));
}

export function programById({ id, coachId, templates = [], programs = [], users = [] }) {
  return (
    allPrograms({ coachId, templates, programs, users }).find((program) => program.id === id) ||
    templates.find((program) => program.id === id) ||
    templates[0]
  );
}

export function hasAssignedProgram(client) {
  return !!(
    client?.programDraft ||
    client?.programTemplateId ||
    (client?.program && client.program !== UNASSIGNED_PROGRAM)
  );
}

export function getTemplateByClient({ client, templates = [], programs = [], users = [] }) {
  return (
    allPrograms({ coachId: client?.coachId, templates, programs, users }).find(
      (program) => program.id === client?.programTemplateId || program.name === client?.program,
    ) ||
    templates[0]
  );
}

export function displayProgram({ client, templates = [], programs = [], users = [] }) {
  if (!hasAssignedProgram(client)) return UNASSIGNED_PROGRAM;
  return (
    client.programDraft?.name ||
    programById({ id: client.programTemplateId, coachId: client.coachId, templates, programs, users })?.name ||
    client.program ||
    UNASSIGNED_PROGRAM
  );
}

export function clientStartAt(user, fallbackDate) {
  return user?.programStartDate || user?.startedAt || user?.createdAtTime || user?.createdAt || fallbackDate;
}

export function clientHasStarted(client, fallbackDate) {
  return !!clientStartAt(client, fallbackDate) && daysBetween(clientStartAt(client, fallbackDate)) > 0;
}

export function isRiskClient(client, fallbackDate) {
  if (client?.status === "banned") return false;
  if (!hasAssignedProgram(client)) return false;
  if (daysBetween(clientStartAt(client, fallbackDate)) <= 1 && (client.compliance || 0) === 0 && !(client.missedToday || 0)) {
    return false;
  }
  return (client.missedToday || 0) > 0 || ((client.compliance || 0) > 0 && (client.compliance || 0) < 70);
}

export function videoActive(video) {
  return (video?.url || video?.mediaId) && daysBetween(video.assignedAt) <= 7;
}

export function programVideoForAssignment(program, assignedAt) {
  return program?.productVideo
    ? {
        ...program.productVideo,
        assignedAt,
        sourceProgramId: program.id,
        sourceProgramName: program.name,
      }
    : null;
}

export function buildProgramHistoryEntry({ template, date, productVideo, bodyAnalysis }) {
  return {
    name: template.name,
    date,
    duration: template.duration,
    tasks: template.tasks,
    bannedFoods: template.bannedFoods,
    ...(productVideo ? { productVideo } : {}),
    ...(bodyAnalysis ? { bodyAnalysis } : {}),
  };
}

export function buildAssignedProgramClient({
  client,
  template,
  activeTasks = [],
  productVideo = null,
  date,
  historyLimit = 5,
  keepTaskChecks = false,
  keepProgress = false,
}) {
  const taskChecks = activeTasks.map((_, index) => (keepTaskChecks ? !!client.tasks?.[index] : false));
  const history = [
    buildProgramHistoryEntry({ template, date, productVideo }),
    ...(client.programHistory || []),
  ].slice(0, historyLimit);
  return {
    ...client,
    program: template.name,
    programTemplateId: template.id,
    programDraft: { ...template, tasks: template.tasks },
    goal: client.goal || template.desc,
    tasks: taskChecks,
    pendingToday: activeTasks.length,
    photoPendingToday: activeTasks.filter((task) => task.photoRequired).length,
    missedToday: keepProgress ? client.missedToday || 0 : 0,
    compliance: keepProgress ? client.compliance || 0 : 0,
    programHistory: history,
    ...(productVideo
      ? {
          productVideo,
          productVideoDraft: productVideo,
          productVideos: [productVideo, ...(client.productVideos || [])].slice(0, 5),
        }
      : {}),
  };
}

export function buildProgramSaveState({
  program,
  previousProgramId = program?.id,
  programs = [],
  users = [],
  coachId,
  date,
  historyLimit = 8,
}) {
  if (!program?.id || !coachId) return { programs, users };

  const savedPrograms = uniquePrograms([
    ...programs.filter((item) => item.id !== previousProgramId && item.id !== program.id),
    program,
  ]);

  return {
    programs: savedPrograms,
    users: users.map((user) => {
      if (user?.programTemplateId !== previousProgramId && user?.programTemplateId !== program.id) return user;
      if (user.coachId !== coachId) return user;
      const activeTasks = normalizeProgramTasksForCycle(program.tasks || []).filter((task) =>
        isTaskActiveToday(task, user, date),
      );
      return buildAssignedProgramClient({
        client: user,
        template: program,
        activeTasks,
        productVideo: programVideoForAssignment(program, date),
        date,
        historyLimit,
        keepTaskChecks: true,
        keepProgress: true,
      });
    }),
  };
}

export function normalizeProgramTasksForCycle(tasks = []) {
  return tasks.map((task) => {
    const text = `${task.title || ""} ${task.note || ""}`.toLocaleLowerCase("tr-TR");
    if (text.includes("atomsuz")) return { ...task, repeatType: "cycle", cycleLength: 5, cycleDays: [3, 4] };
    if (text.includes("atomlu")) return { ...task, repeatType: "cycle", cycleLength: 5, cycleDays: [0, 1, 2] };
    return task;
  });
}

export function isTaskActiveToday(task, user, fallbackDate) {
  if (task?.repeatType !== "cycle") return true;
  const len = Number(task.cycleLength) || 5;
  const idx = (daysBetween(clientStartAt(user, fallbackDate)) - 1) % len;
  return (task.cycleDays || []).map(Number).includes(idx);
}

export function proofTaskPlan({ client, templates = [], programs = [], users = [] }) {
  const template = client?.programDraft || getTemplateByClient({ client, templates, programs, users }) || {};
  return Array.isArray(template.tasks) && template.tasks.length ? template.tasks : templateTasks(templates, client?.programTemplateId);
}
