const isoDate = (date) => date.toISOString().split("T")[0];

export function todayIsoDate(date = new Date()) {
  return isoDate(date);
}

export function weekDateItems(baseDate = new Date(), weekOffset = 0) {
  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() - ((baseDate.getDay() + 6) % 7) + weekOffset * 7);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return {
      iso: isoDate(date),
      day: date.getDate(),
      label: date.toLocaleDateString("tr-TR", { weekday: "short" }).slice(0, 2),
    };
  });
}

export function sessionsForCoach(sessions = [], coachId) {
  return sessions.filter((session) => session.coachId === coachId);
}

export function sessionsForClient(sessions = [], clientId) {
  return sessions.filter((session) => session.clientId === clientId);
}

export function sessionsForDate(sessions = [], date) {
  return sessions.filter((session) => session.date === date);
}

export function applySessionPatch(sessions = [], id, patch = {}) {
  const current = sessions.find((session) => session.id === id);
  const updated = { ...(current || {}), ...patch };
  return {
    current,
    updated,
    sessions: sessions.map((session) => (session.id === id ? updated : session)),
  };
}

export function buildCoachSession({ coachId, form = {} }) {
  return {
    id: `s${Date.now()}`,
    coachId,
    clientId: form.clientId,
    type: form.type || "Görüşme",
    date: form.date,
    time: form.time || "10:00",
    duration: form.duration || "30 dk",
    status: form.status || "confirmed",
    decidedBy: "coach",
  };
}

export function buildClientSessionRequest({ coachId, clientId, request = {} }) {
  return {
    id: `s${Date.now()}`,
    coachId,
    clientId,
    type: request.type || "Görüşme talebi",
    date: request.date,
    time: request.time || "10:00",
    duration: request.duration || "30 dk",
    status: "pending",
    requestedBy: "client",
  };
}

export function coachSessionNotice(session, patch = {}) {
  if (!session?.clientId) return null;
  if (patch.status === "confirmed") return `Randevun onaylandı: ${session.date} ${session.time}`;
  if (patch.status === "proposed") return `Koçun yeni randevu saati önerdi: ${session.date} ${session.time}`;
  return null;
}

export function clientSessionConfirmedNotice(clientName, session) {
  return `${clientName} randevu saatini onayladı: ${session.date} ${session.time}`;
}

export function clientSessionRequestNotice(clientName, session) {
  return `${clientName} randevu talep etti: ${session.date} ${session.time}`;
}

export function coachCreatedSessionNotice(session) {
  return `Koçun randevu saatini belirledi: ${session.date} ${session.time}`;
}
