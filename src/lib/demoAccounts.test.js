import { describe, expect, it } from "vitest";
import { authenticateUser } from "../features/auth/authService.js";
import {
  DEMO_ACCOUNTS,
  TEST_LOGIN_ACCOUNTS,
  TEST_LOGIN_BY_KEY,
  testLoginAccountReadiness,
} from "./demoAccounts.js";

describe("demoAccounts", () => {
  it("keeps login cards and canonical test accounts aligned", () => {
    expect(DEMO_ACCOUNTS.map((account) => account.email)).toEqual(
      TEST_LOGIN_ACCOUNTS.map((account) => account.email),
    );
    expect(TEST_LOGIN_BY_KEY.coach.email).toBe("koc.test0306@stepwiseplus.app");
    expect(TEST_LOGIN_BY_KEY.client1.email).toBe("danisan.test0306@stepwiseplus.app");
    expect(TEST_LOGIN_BY_KEY.client2.email).toBe("elif.test0306@stepwiseplus.app");
    expect(TEST_LOGIN_BY_KEY.client3.email).toBe("mert.test0306@stepwiseplus.app");
  });

  it("reports missing ready-test users before a tester tries to sign in", () => {
    const readiness = testLoginAccountReadiness([
      { email: TEST_LOGIN_BY_KEY.coach.email },
      { email: TEST_LOGIN_BY_KEY.client1.email },
    ]);

    expect(readiness.ready).toBe(false);
    expect(readiness.missing).toEqual([
      TEST_LOGIN_BY_KEY.client2.email,
      TEST_LOGIN_BY_KEY.client3.email,
    ]);
  });

  it("lets every canonical test account repair from seed credentials", async () => {
    const seedUsers = TEST_LOGIN_ACCOUNTS.map((account) => ({
      id: account.key,
      role: account.role,
      email: account.email,
      password: account.password,
    }));
    let savedUsers = [];

    for (const account of TEST_LOGIN_ACCOUNTS) {
      const user = await authenticateUser({
        email: account.email,
        password: account.password,
        users: savedUsers,
        seedUsers,
        setUsers: (next) => {
          savedUsers = next;
        },
      });

      expect(user?.email).toBe(account.email);
      expect(user?.password).toBe("");
      expect(user?.passwordHash).toBeTruthy();
    }

    expect(testLoginAccountReadiness(savedUsers).ready).toBe(true);
  });
});
