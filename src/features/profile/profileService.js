import { isProductionMode, saveProfilePatch } from "../../lib/production.js";

export async function resolveProfilePatch({ user, patch, logLabel = "cloud-profile" }) {
  let updated = { ...user, ...patch };

  if (isProductionMode() && user?.id && user?.supabaseToken) {
    try {
      updated = {
        ...updated,
        ...((await saveProfilePatch(user.id, updated, user.supabaseToken)) || {}),
      };
    } catch (err) {
      console.warn(logLabel, err);
    }
  }

  return updated;
}
