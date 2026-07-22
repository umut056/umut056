export const rankIcon = (index) => (index === 0 ? "🏆" : index === 1 ? "🥈" : index === 2 ? "🥉" : "⭐");

export const milestoneFor = (delta = 0) => Math.min(50, Math.floor(Math.abs(Number(delta) || 0)));

export const daysBetween = (from, to = new Date()) => {
  const start = new Date(from || to);
  const end = new Date(to);
  return Math.max(1, Math.floor((end - start) / 86400000) + 1);
};

export const maskName = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .map((part) => (part[0] ? `${part[0]}${"*".repeat(Math.max(3, part.length - 1))}` : ""))
    .join(" ");

export const weightDelta = (body = {}) =>
  +((Number(body.start) || 0) - (Number(body.current) || 0)).toFixed(1);

export const monthlyBadge = (client, rank = 0) => {
  const score = Math.round(((client.compliance || 0) + (client.weeklyAverage || 0) + (client.streakDays || 0) * 3) / 2.1);
  const level = Math.max(1, Math.min(12, Math.floor(score / 10) + 1));
  const badge = rank === 0 ? "Altın" : rank === 1 ? "Gümüş" : rank === 2 ? "Bronz" : score >= 70 ? "Yükselen" : "Takipte";
  return { score: Math.min(100, score), level, badge };
};

export const ini = (name = "") =>
  name
    .split(" ")
    .map((word) => word[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
