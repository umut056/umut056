import { clearSession, saveSession, storedSession } from "../../lib/session.js";
import { isProductionMode } from "../../lib/production.js";

export function restoreStoredUser(users = []) {
  try {
    const stored = storedSession();
    if (!stored) return null;

    const sessionUser = JSON.parse(stored);
    const fresh = users.find((user) => user.id === sessionUser.id);

    if (!fresh) {
      if (isProductionMode() && sessionUser?.supabaseToken) {
        saveSession(sessionUser);
        return sessionUser;
      }
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
