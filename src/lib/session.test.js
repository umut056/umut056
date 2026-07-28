import { afterEach, describe, expect, it, vi } from "vitest";
import { clearSession, saveSession, sessionSnapshot, storedSession } from "./session.js";

const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
  };
};

describe("session", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
    delete globalThis.window;
  });

  it("stores only a safe session snapshot", () => {
    const snapshot = sessionSnapshot({
      id: "u1",
      role: "client",
      name: "Test Client",
      email: "client@test.app",
      password: "test123",
      passwordHash: "secret-hash",
      body: { current: 70 },
      tasks: [true, false],
      supabaseToken: "token",
      refreshToken: "refresh",
    });

    expect(snapshot).toMatchObject({
      id: "u1",
      role: "client",
      name: "Test Client",
      email: "client@test.app",
      supabaseToken: "token",
      refreshToken: "refresh",
    });
    expect(snapshot.password).toBeUndefined();
    expect(snapshot.passwordHash).toBeUndefined();
    expect(snapshot.body).toBeUndefined();
    expect(snapshot.tasks).toBeUndefined();
  });

  it("persists the safe snapshot to local and session storage", () => {
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
    globalThis.window = { StepWiseNative: { setSessionActive: vi.fn() } };

    saveSession({
      id: "u1",
      role: "coach",
      email: "coach@test.app",
      passwordHash: "secret-hash",
      supabaseToken: "token",
    });

    const parsed = JSON.parse(storedSession());
    expect(parsed).toMatchObject({ id: "u1", role: "coach", email: "coach@test.app", supabaseToken: "token" });
    expect(parsed.passwordHash).toBeUndefined();
    expect(globalThis.window.StepWiseNative.setSessionActive).toHaveBeenCalledWith(true);
  });

  it("clears both current and legacy session keys", () => {
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
    globalThis.window = {
      StepWiseNative: {
        cancelTaskAlarms: vi.fn(),
        setSessionActive: vi.fn(),
      },
    };

    saveSession({ id: "u1", role: "client" });
    clearSession();

    expect(storedSession()).toBe("");
    expect(globalThis.window.StepWiseNative.cancelTaskAlarms).toHaveBeenCalled();
    expect(globalThis.window.StepWiseNative.setSessionActive).toHaveBeenCalledWith(false);
  });
});
