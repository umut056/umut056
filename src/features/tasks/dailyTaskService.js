const todayIsoDate = () => new Date().toISOString().split("T")[0];

export function dailyStateFor(user, tasks = [], date = todayIsoDate()) {
  const existing = user.dailyTasks?.[date];
  if (existing && existing.tasks?.length === tasks.length) return existing;
  return {
    date,
    tasks: tasks.map(() => false),
    photoProofs: {},
    snoozedTasks: {},
    note: "",
  };
}

export function mergeDailyUser(user, tasks = [], state, extra = {}, date = todayIsoDate()) {
  const done = (state.tasks || []).filter(Boolean).length;
  const stateDate = state.date || date;
  const dailyTasks = { ...(user.dailyTasks || {}), [stateDate]: { ...state, date: stateDate } };

  return {
    ...user,
    ...extra,
    dailyTasks,
    tasks: state.tasks || [],
    photoProofs: state.photoProofs || {},
    snoozedTasks: state.snoozedTasks || {},
    lastTaskNote: state.note || "",
    compliance: Math.round((done / (tasks.length || 1)) * 100),
    pendingToday: Math.max(tasks.length - done, 0),
    photoPendingToday: tasks.filter((task, index) => (task.photoRequired || task.photo) && !state.tasks?.[index])
      .length,
  };
}

export function visibleDailyTasks(tasks = [], state = {}) {
  const checks = Array.isArray(state.tasks) ? state.tasks : [];
  return (Array.isArray(tasks) ? tasks : [])
    .map((task, index) => ({ task, index }))
    .filter(({ index }) => !checks[index]);
}

export function dailyTasksComplete(tasks = [], state = {}) {
  return visibleDailyTasks(tasks, state).length === 0 && (Array.isArray(tasks) ? tasks.length : 0) > 0;
}
