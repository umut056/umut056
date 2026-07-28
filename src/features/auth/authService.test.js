import { describe, expect, it } from "vitest";
import {
  authenticateUser,
  createPasswordHash,
  hashText,
  isModernPasswordHash,
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
