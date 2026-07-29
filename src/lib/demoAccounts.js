export const TEST_LOGIN_ACCOUNTS = [
  {
    key: "coach",
    role: "coach",
    label: "Koç",
    email: "koc.test0306@stepwiseplus.app",
    password: "test123",
    colorKey: "emerald",
  },
  {
    key: "client1",
    role: "client",
    label: "Danışan 1",
    email: "danisan.test0306@stepwiseplus.app",
    password: "test123",
    colorKey: "blue",
  },
  {
    key: "client2",
    role: "client",
    label: "Danışan 2",
    email: "elif.test0306@stepwiseplus.app",
    password: "test123",
    colorKey: "jade",
  },
  {
    key: "client3",
    role: "client",
    label: "Danışan 3",
    email: "mert.test0306@stepwiseplus.app",
    password: "test123",
    colorKey: "warn",
  },
];

export const TEST_LOGIN_BY_KEY = Object.fromEntries(
  TEST_LOGIN_ACCOUNTS.map((account) => [account.key, account]),
);

export const DEMO_ACCOUNTS = TEST_LOGIN_ACCOUNTS.map(({ label, email, password, colorKey }) => ({
  role: label,
  email,
  password,
  colorKey,
}));

export function testLoginAccountReadiness(users = [], accounts = TEST_LOGIN_ACCOUNTS) {
  const userEmails = new Set(
    (Array.isArray(users) ? users : [])
      .map((user) => String(user?.email || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const missing = accounts.filter((account) => !userEmails.has(account.email.toLowerCase()));

  return {
    ready: missing.length === 0,
    total: accounts.length,
    missing: missing.map((account) => account.email),
  };
}
