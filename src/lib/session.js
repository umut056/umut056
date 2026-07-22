export const storedSession = () => {
  try {
    return localStorage.getItem("ct_session") || sessionStorage.getItem("ct_u") || "";
  } catch {
    return "";
  }
};

export const saveSession = (user) => {
  try {
    localStorage.setItem("ct_session", JSON.stringify(user));
    sessionStorage.setItem("ct_u", JSON.stringify(user));
    window.StepWiseNative?.setSessionActive?.(true);
  } catch {}
};

export const clearSession = () => {
  try {
    localStorage.removeItem("ct_session");
    sessionStorage.removeItem("ct_u");
    window.StepWiseNative?.cancelTaskAlarms?.();
    window.StepWiseNative?.setSessionActive?.(false);
  } catch {}
};
