import { clearSession, saveSession, storedSession } from "../../lib/session.js";

export function restoreStoredUser(users = []) {
  try {
    const stored = storedSession();
    if (!stored) return null;

    const sessionUser = JSON.parse(stored);
    const fresh = users.find((user) => user.id === sessionUser.id);

    if (!fresh) {
      clearSession();
      return null;
    }

    const restored = {
      ...fresh,
      supabaseToken: sessionUser.supabaseToken,
      refreshToken: sessionUser.refreshToken,
    };

    saveSession(restored);
    return restored;
  } catch {
    clearSession();
    return null;
  }
}
