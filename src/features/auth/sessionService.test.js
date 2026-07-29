import { afterEach, describe, expect, it, vi } from "vitest";
import { saveSession, storedSession } from "../../lib/session.js";
import { restoreStoredUser } from "./sessionService.js";

const memoryStorage = () => {
  const store = new Map();
  return {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
  };
};

describe("restoreStoredUser", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete globalThis.localStorage;
    delete globalThis.sessionStorage;
    delete globalThis.window;
  });

  it("keeps the stored session when workspace users are not ready yet", () => {
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
    globalThis.window = { StepWiseNative: { setSessionActive: vi.fn(), cancelTaskAlarms: vi.fn() } };

    saveSession({ id: "client-1", role: "client", name: "Elif", email: "elif@test.app" });

    const restored = restoreStoredUser([]);

    expect(restored).toMatchObject({ id: "client-1", role: "client", email: "elif@test.app" });
    expect(storedSession()).not.toBe("");
    expect(globalThis.window.StepWiseNative.cancelTaskAlarms).not.toHaveBeenCalled();
  });

  it("hydrates the stored tokens onto the fresh workspace user", () => {
    globalThis.localStorage = memoryStorage();
    globalThis.sessionStorage = memoryStorage();
    globalThis.window = { StepWiseNative: { setSessionActive: vi.fn() } };

    saveSession({
      id: "coach-1",
      role: "coach",
      name: "Old Name",
      email: "coach@test.app",
      supabaseToken: "token",
      refreshToken: "refresh",
    });

    const restored = restoreStoredUser([
      { id: "coach-1", role: "coach", name: "Fresh Coach", email: "coach@test.app" },
    ]);

    expect(restored).toMatchObject({
      id: "coach-1",
      name: "Fresh Coach",
      supabaseToken: "token",
      refreshToken: "refresh",
    });
  });
});
