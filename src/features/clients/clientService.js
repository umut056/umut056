import { bodyDefaults } from "../measurements/measurementService.js";
import { UNASSIGNED_PROGRAM } from "../programs/programService.js";

export function buildNewClientProfile({ id, form = {}, coach, createdAt, createdAtTime }) {
  const cleanEmail = (form.email || "").trim().toLowerCase();
  return {
    id,
    role: "client",
    name: (form.name || "").trim(),
    email: cleanEmail,
    coachId: coach?.id,
    coachRef: coach?.refCode,
    phone: (form.phone || "").trim(),
    program: UNASSIGNED_PROGRAM,
    goal: (form.goal || "").trim() || "Hedef henüz girilmedi",
    createdAt,
    createdAtTime,
    startedAt: createdAtTime,
    programStartDate: form.programStartDate || createdAt,
    programEndDate: form.programEndDate || "",
    status: "active",
    compliance: 0,
    tasks: [],
    pendingToday: 0,
    missedToday: 0,
    photoPendingToday: 0,
    weeklyAverage: 0,
    streakDays: 0,
    body: { ...bodyDefaults, start: 0, current: 0, target: 0, ideal: "-" },
    programHistory: [],
  };
}

export function attachClientToCoach(users = [], coachId, clientId) {
  return users.map((user) =>
    user.id === coachId ? { ...user, clients: [...new Set([...(user.clients || []), clientId])] } : user,
  );
}
