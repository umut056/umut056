import {
  authRest,
  hasSupabaseConfig,
  isProductionMode,
  supabaseRest,
} from "../../lib/production.js";

export const hashText = async (text = "") => {
  try {
    const data = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return [...new Uint8Array(hash)]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return `plain-${btoa(unescape(encodeURIComponent(text)))}`;
  }
};

export const withPassword = async (user, password) => ({
  ...user,
  password: "",
  passwordHash: await hashText(password),
});

export const profileFromSupabase = (profile, session) => ({
  id: profile.id,
  role: profile.role,
  name: profile.name,
  email: profile.email,
  status: profile.status,
  coachId: profile.coach_id,
  refCode: profile.ref_code,
  avatarUrl: profile.avatar_url,
  avatarMedia: profile.avatar_media || null,
  avatarMediaId: profile.avatar_media?.mediaId,
  profilePhotoLocked: profile.profile_photo_locked,
  programStartDate: profile.program_start_date,
  programEndDate: profile.program_end_date,
  supabaseToken: session.access_token,
  refreshToken: session.refresh_token,
  tasks: [],
  compliance: 0,
});

export function cleanRegistrationForm(form = {}) {
  return {
    name: String(form.name || "").trim(),
    email: String(form.email || "").trim().toLowerCase(),
    password: String(form.password || ""),
    refCode: String(form.refCode || "").trim().toUpperCase(),
    clientCode: String(form.clientCode || "").trim().toUpperCase(),
  };
}

export function validateRegistrationBase({ role, form = {}, users = [] }) {
  const clean = cleanRegistrationForm(form);

  if (!role) return { ok: false, error: "Hesap türü seçin.", clean };
  if (!clean.name || !clean.email || !clean.password) {
    return { ok: false, error: "Tüm alanları doldurun.", clean };
  }
  if (clean.password.length < 6) {
    return { ok: false, error: "Şifre en az 6 karakter olmalı.", clean };
  }
  if (users.some((user) => String(user.email || "").toLowerCase() === clean.email)) {
    return { ok: false, error: "Bu e-posta zaten kayıtlı.", clean };
  }

  return { ok: true, clean };
}

export function validateRegistration({ role, form = {}, users = [], coachCodes = [] }) {
  const base = validateRegistrationBase({ role, form, users });
  if (!base.ok) return base;
  const { clean } = base;

  if (role === "coach") {
    const code = coachCodes.find((item) => item.code === clean.refCode && item.status === "active" && !item.usedBy);
    const refCode = clean.clientCode || `CT-${clean.name.slice(0, 2).toUpperCase()}${Date.now().toString().slice(-4)}`;
    if (!code) return { ok: false, error: "Geçersiz veya kullanılmış koç aktivasyon kodu.", clean };
    if (users.some((user) => user.role === "coach" && user.refCode === refCode)) {
      return { ok: false, error: "Bu danışan kodu başka koçta kullanılıyor.", clean };
    }
    return { ok: true, clean, refCode, activationCode: clean.refCode };
  }

  const coach = users.find((user) => user.role === "coach" && user.refCode === clean.refCode);
  if (!coach) return { ok: false, error: "Geçersiz koç referans kodu.", clean };

  return { ok: true, clean, coach };
}

export function registrationPayload({ role, form = {} }) {
  const clean = cleanRegistrationForm(form);
  return {
    role,
    name: clean.name,
    email: clean.email,
    password: clean.password,
    activationCode: clean.refCode,
    coachRef: clean.refCode,
    desiredRefCode: clean.clientCode,
  };
}

export function buildLocalCoachRegistration({ clean, refCode, date, isoTime }) {
  return {
    id: `c${Date.now()}`,
    role: "coach",
    name: clean.name,
    email: clean.email,
    refCode,
    createdAt: date,
    createdAtTime: isoTime,
    startedAt: isoTime,
    programStartDate: date,
    programEndDate: "",
    status: "active",
    clients: [],
  };
}

export function buildLocalClientRegistration({ clean, coach, date, isoTime }) {
  return {
    id: `cl${Date.now()}`,
    role: "client",
    name: clean.name,
    email: clean.email,
    coachId: coach.id,
    coachRef: coach.refCode,
    program: "Program atanmadı",
    createdAt: date,
    createdAtTime: isoTime,
    startedAt: isoTime,
    status: "active",
    compliance: 0,
    tasks: [],
    pendingToday: 0,
    missedToday: 0,
    photoPendingToday: 0,
  };
}

export async function authenticateUser({
  email,
  password,
  users = [],
  seedUsers = [],
  setUsers = () => {},
}) {
  const clean = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (isProductionMode() && hasSupabaseConfig()) {
    try {
      const session = await authRest("token?grant_type=password", {
        email: clean,
        password: cleanPassword,
      });
      const rows = await supabaseRest("profiles", {
        token: session.access_token,
        query: `?id=eq.${session.user.id}&select=*`,
      });
      const profile = rows?.[0];
      if (!profile) return null;
      return profileFromSupabase(profile, session);
    } catch (error) {
      console.warn("cloud-auth-fallback", error);
    }
  }

  const user = users.find((u) => (u.email || "").toLowerCase() === clean);
  const hash = await hashText(cleanPassword);

  if (user) {
    if (user.passwordHash === hash) return user;
    if (user.password && user.password === cleanPassword) {
      const migrated = { ...user, passwordHash: hash, password: "" };
      setUsers(users.map((u) => (u.id === user.id ? migrated : u)));
      return migrated;
    }
  }

  const seed = seedUsers.find(
    (u) => (u.email || "").toLowerCase() === clean && u.password === cleanPassword,
  );
  if (seed) {
    const repaired = await withPassword({ ...seed }, cleanPassword);
    const nextUsers = users.some((u) => u.id === seed.id)
      ? users.map((u) => (u.id === seed.id ? { ...u, ...repaired } : u))
      : [...users, repaired];
    setUsers(nextUsers);
    return repaired;
  }

  return null;
}
