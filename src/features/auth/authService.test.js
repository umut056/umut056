import { describe, expect, it } from "vitest";
import {
  authenticateUser,
  buildLocalClientRegistration,
  cleanRegistrationForm,
  createPasswordHash,
  hashText,
  isModernPasswordHash,
  validateRegistration,
  validateRegistrationBase,
  verifyPasswordHash,
  withPassword,
} from "./authService.js";

describe("authService password hardening", () => {
  it("creates salted password hashes instead of reusable plain SHA hashes", async () => {
    const first = await createPasswordHash("test123");
    const second = await createPasswordHash("test123");

    expect(first).not.toBe(second);
    expect(isModernPasswordHash(first)).toBe(true);
    expect(await verifyPasswordHash("test123", first)).toBe(true);
    expect(await verifyPasswordHash("wrong", first)).toBe(false);
  });

  it("stores users with a modern hash through withPassword", async () => {
    const user = await withPassword({ id: "u1", password: "test123" }, "test123");

    expect(user.password).toBe("");
    expect(isModernPasswordHash(user.passwordHash)).toBe(true);
    expect(await verifyPasswordHash("test123", user.passwordHash)).toBe(true);
  });

  it("migrates legacy SHA hashes after a successful local login", async () => {
    const legacyHash = await hashText("test123");
    const users = [{ id: "u1", email: "client@test.app", passwordHash: legacyHash, password: "" }];
    let savedUsers = users;

    const user = await authenticateUser({
      email: "client@test.app",
      password: "test123",
      users,
      setUsers: (next) => {
        savedUsers = next;
      },
    });

    expect(user?.id).toBe("u1");
    expect(user.passwordHash).not.toBe(legacyHash);
    expect(isModernPasswordHash(user.passwordHash)).toBe(true);
    expect(savedUsers[0].passwordHash).toBe(user.passwordHash);
  });

  it("migrates plain local passwords after a successful local login", async () => {
    const users = [{ id: "u1", email: "client@test.app", password: "test123" }];
    let savedUsers = users;

    const user = await authenticateUser({
      email: "client@test.app",
      password: "test123",
      users,
      setUsers: (next) => {
        savedUsers = next;
      },
    });

    expect(user?.id).toBe("u1");
    expect(user.password).toBe("");
    expect(isModernPasswordHash(user.passwordHash)).toBe(true);
    expect(savedUsers[0].password).toBe("");
  });

  it("repairs seed users with a modern hash when no local user exists", async () => {
    const seedUsers = [{ id: "seed1", email: "seed@test.app", password: "test123" }];
    let savedUsers = [];

    const user = await authenticateUser({
      email: "seed@test.app",
      password: "test123",
      users: [],
      seedUsers,
      setUsers: (next) => {
        savedUsers = next;
      },
    });

    expect(user?.id).toBe("seed1");
    expect(isModernPasswordHash(user.passwordHash)).toBe(true);
    expect(savedUsers).toHaveLength(1);
  });
});

describe("authService registration guards", () => {
  const existingCoach = {
    id: "coach-1",
    role: "coach",
    name: "Test Koc",
    email: "coach@test.app",
    refCode: "TK2026",
  };

  it("normalizes registration input before validation", () => {
    const clean = cleanRegistrationForm({
      name: "  Elif Yilmaz  ",
      email: "  ELIF@TEST.APP ",
      password: "test123",
      refCode: " tk2026 ",
      clientCode: " ey2026 ",
    });

    expect(clean).toEqual({
      name: "Elif Yilmaz",
      email: "elif@test.app",
      password: "test123",
      refCode: "TK2026",
      clientCode: "EY2026",
    });
  });

  it("rejects incomplete, weak or duplicate base registration data", () => {
    expect(validateRegistrationBase({ role: "", form: {} }).ok).toBe(false);
    expect(validateRegistrationBase({ role: "client", form: { name: "Elif", email: "", password: "test123" } }).ok).toBe(false);
    expect(validateRegistrationBase({ role: "client", form: { name: "Elif", email: "elif@test.app", password: "123" } }).ok).toBe(false);
    expect(
      validateRegistrationBase({
        role: "client",
        form: { name: "Elif", email: "COACH@TEST.APP", password: "test123" },
        users: [existingCoach],
      }).ok,
    ).toBe(false);
  });

  it("requires an active unused coach activation code and unique client ref code", () => {
    const form = {
      name: "Yeni Koc",
      email: "new.coach@test.app",
      password: "test123",
      refCode: "ADMIN2026",
      clientCode: "TK2026",
    };

    expect(validateRegistration({ role: "coach", form, users: [existingCoach], coachCodes: [] }).ok).toBe(false);
    expect(
      validateRegistration({
        role: "coach",
        form,
        users: [existingCoach],
        coachCodes: [{ code: "ADMIN2026", status: "active", usedBy: "" }],
      }).ok,
    ).toBe(false);

    const result = validateRegistration({
      role: "coach",
      form: { ...form, clientCode: "YK2026" },
      users: [existingCoach],
      coachCodes: [{ code: "ADMIN2026", status: "active", usedBy: "" }],
    });

    expect(result.ok).toBe(true);
    expect(result.refCode).toBe("YK2026");
    expect(result.activationCode).toBe("ADMIN2026");
  });

  it("links client registration to the selected coach", () => {
    const form = {
      name: "Elif Yilmaz",
      email: "elif@test.app",
      password: "test123",
      refCode: "tk2026",
    };

    expect(validateRegistration({ role: "client", form, users: [] }).ok).toBe(false);

    const validation = validateRegistration({ role: "client", form, users: [existingCoach] });
    const localUser = buildLocalClientRegistration({
      clean: validation.clean,
      coach: validation.coach,
      date: "2026-07-28",
      isoTime: "2026-07-28T10:00:00.000Z",
    });

    expect(validation.ok).toBe(true);
    expect(localUser.coachId).toBe("coach-1");
    expect(localUser.coachRef).toBe("TK2026");
    expect(localUser.program).toBe("Program atanmadı");
    expect(localUser.tasks).toEqual([]);
  });
});
