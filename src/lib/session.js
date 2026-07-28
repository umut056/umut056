const SESSION_STORAGE_KEY = "ct_session";
const LEGACY_SESSION_STORAGE_KEY = "ct_u";

export const sessionSnapshot = (user = {}) => {
  if (!user?.id) return null;
  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status,
    coachId: user.coachId,
    refCode: user.refCode,
    avatarUrl: user.avatarUrl,
    avatarMedia: user.avatarMedia,
    avatarMediaId: user.avatarMediaId,
    supabaseToken: user.supabaseToken,
    refreshToken: user.refreshToken,
    savedAt: new Date().toISOString(),
  };
};

export const storedSession = () => {
  try {
    return localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(LEGACY_SESSION_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

export const saveSession = (user) => {
  try {
    const snapshot = sessionSnapshot(user);
    if (!snapshot) return;
    const serialized = JSON.stringify(snapshot);
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
    sessionStorage.setItem(LEGACY_SESSION_STORAGE_KEY, serialized);
    if (typeof window !== "undefined") window.StepWiseNative?.setSessionActive?.(true);
  } catch {}
};

export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
    if (typeof window !== "undefined") {
      window.StepWiseNative?.cancelTaskAlarms?.();
      window.StepWiseNative?.setSessionActive?.(false);
    }
  } catch {}
};
