import fs from "node:fs";

const ENV_FILE = ".env.production";

function loadEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

const fileEnv = loadEnvFile(ENV_FILE);
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || fileEnv.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const PASSWORD = process.env.STEPWISE_RLS_TEST_PASSWORD || "test123";
const COACH_REF = "RLSCOACH";
const COACH_CODE = "RLS-COACH-2026";

const accounts = {
  admin: {
    email: "admin@stepwiseplus.app",
    name: "StepWise Plus Admin",
    role: "admin",
  },
  coach: {
    email: "rls.coach@stepwiseplus.app",
    name: "RLS Test Koc",
    role: "coach",
    metadata: { role: "coach", name: "RLS Test Koc", activation_code: COACH_CODE, ref_code: COACH_REF },
  },
  client1: {
    email: "rls.client1@stepwiseplus.app",
    name: "RLS Test Danisan 1",
    role: "client",
    metadata: { role: "client", name: "RLS Test Danisan 1", coach_ref: COACH_REF },
  },
  client2: {
    email: "rls.client2@stepwiseplus.app",
    name: "RLS Test Danisan 2",
    role: "client",
    metadata: { role: "client", name: "RLS Test Danisan 2", coach_ref: COACH_REF },
  },
};

const required = [
  ["VITE_SUPABASE_URL", SUPABASE_URL],
  ["VITE_SUPABASE_ANON_KEY", ANON_KEY],
  ["SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY],
];

for (const [key, value] of required) {
  if (!value) {
    console.error(`Missing ${key}.`);
    process.exit(1);
  }
}

async function request(path, { method = "GET", key = ANON_KEY, token = key, body, prefer } = {}) {
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message = typeof data === "string" ? data.slice(0, 180) : JSON.stringify(data).slice(0, 180);
    throw new Error(`${method} ${path} failed (${response.status}): ${message}`);
  }
  return data;
}

async function service(path, options = {}) {
  return request(path, {
    ...options,
    key: SERVICE_ROLE_KEY,
    token: SERVICE_ROLE_KEY,
  });
}

async function listAuthUsers() {
  const users = [];
  for (let page = 1; page <= 20; page += 1) {
    const data = await service(`/auth/v1/admin/users?page=${page}&per_page=100`);
    const pageUsers = data?.users || [];
    users.push(...pageUsers);
    if (pageUsers.length < 100) break;
  }
  return users;
}

async function ensureCoachCode() {
  await service("/rest/v1/coach_codes?on_conflict=code", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: [
      {
        code: COACH_CODE,
        status: "active",
        used_by: null,
        used_at: null,
      },
    ],
  });
}

async function ensureAuthUser(existingUsers, account) {
  const existing = existingUsers.find((user) => user.email?.toLowerCase() === account.email.toLowerCase());
  const body = {
    email: account.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: account.metadata || { role: account.role, name: account.name },
  };

  if (existing?.id) {
    await service(`/auth/v1/admin/users/${existing.id}`, { method: "PUT", body });
    return existing.id;
  }

  const created = await service("/auth/v1/admin/users", { method: "POST", body });
  return created?.id;
}

async function upsertProfiles(ids) {
  const rows = [
    {
      id: ids.admin,
      role: "admin",
      name: accounts.admin.name,
      email: accounts.admin.email,
      status: "active",
      coach_id: null,
      ref_code: null,
      program_start_date: null,
      program_end_date: null,
    },
    {
      id: ids.coach,
      role: "coach",
      name: accounts.coach.name,
      email: accounts.coach.email,
      status: "active",
      coach_id: null,
      ref_code: COACH_REF,
      program_start_date: null,
      program_end_date: null,
    },
    {
      id: ids.client1,
      role: "client",
      name: accounts.client1.name,
      email: accounts.client1.email,
      status: "active",
      coach_id: ids.coach,
      ref_code: null,
      program_start_date: "2026-07-28",
      program_end_date: "2026-08-28",
    },
    {
      id: ids.client2,
      role: "client",
      name: accounts.client2.name,
      email: accounts.client2.email,
      status: "active",
      coach_id: ids.coach,
      ref_code: null,
      program_start_date: "2026-07-28",
      program_end_date: "2026-08-28",
    },
  ];

  await service("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: rows,
  });
}

async function seedData(ids) {
  await service("/rest/v1/body_metrics", {
    method: "POST",
    prefer: "return=minimal",
    body: [
      {
        client_id: ids.client1,
        coach_id: ids.coach,
        measured_at: "2026-07-28",
        height_cm: 170,
        weight_kg: 72,
        bmi: 24.9,
        note: "RLS verification seed",
      },
      {
        client_id: ids.client2,
        coach_id: ids.coach,
        measured_at: "2026-07-28",
        height_cm: 168,
        weight_kg: 80,
        bmi: 28.3,
        note: "RLS verification seed",
      },
    ],
  });

  await service("/rest/v1/messages", {
    method: "POST",
    prefer: "return=minimal",
    body: [
      {
        sender_id: ids.coach,
        receiver_id: ids.client1,
        message_type: "text",
        text: "RLS verification message",
      },
    ],
  });
}

async function login(email) {
  const session = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: { email, password: PASSWORD },
  });
  return session.access_token;
}

async function restWithToken(token, path, options = {}) {
  const data = await request(`/rest/v1/${path}`, { ...options, token });
  return Array.isArray(data) ? data : [];
}

function assertScenario(results, name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name} - ${detail}`);
}

async function verify(ids) {
  const tokens = {
    admin: await login(accounts.admin.email),
    coach: await login(accounts.coach.email),
    client1: await login(accounts.client1.email),
    client2: await login(accounts.client2.email),
  };

  const results = [];

  const client1Client2Profile = await restWithToken(tokens.client1, `profiles?id=eq.${ids.client2}&select=id`);
  assertScenario(results, "client_cannot_read_other_client_profile", client1Client2Profile.length === 0, `${client1Client2Profile.length} rows`);

  const client1Client2Body = await restWithToken(tokens.client1, `body_metrics?client_id=eq.${ids.client2}&select=id`);
  assertScenario(results, "client_cannot_read_other_client_body_metrics", client1Client2Body.length === 0, `${client1Client2Body.length} rows`);

  const coachClient1 = await restWithToken(tokens.coach, `profiles?id=eq.${ids.client1}&select=id`);
  assertScenario(results, "coach_can_read_own_client_profile", coachClient1.length === 1, `${coachClient1.length} rows`);

  const coachBody = await restWithToken(tokens.coach, `body_metrics?client_id=eq.${ids.client1}&select=id`);
  assertScenario(results, "coach_can_read_own_client_body_metrics", coachBody.length > 0, `${coachBody.length} rows`);

  const clientAudit = await restWithToken(tokens.client1, "audit_logs?select=id&limit=1");
  assertScenario(results, "client_cannot_read_audit_logs", clientAudit.length === 0, `${clientAudit.length} rows`);

  const adminAudit = await restWithToken(tokens.admin, "audit_logs?select=id&limit=1");
  assertScenario(results, "admin_can_query_audit_logs", Array.isArray(adminAudit), `${adminAudit.length} rows`);

  const clientMessages = await restWithToken(tokens.client1, `messages?receiver_id=eq.${ids.client1}&select=id`);
  assertScenario(results, "client_can_read_own_messages", clientMessages.length > 0, `${clientMessages.length} rows`);

  const otherMessages = await restWithToken(tokens.client2, `messages?receiver_id=eq.${ids.client1}&select=id`);
  assertScenario(results, "client_cannot_read_other_client_messages", otherMessages.length === 0, `${otherMessages.length} rows`);

  return results;
}

async function main() {
  console.log("Preparing staging RLS users without printing secrets...");
  await ensureCoachCode();

  const existingUsers = await listAuthUsers();
  const ids = {};
  ids.admin = await ensureAuthUser(existingUsers, accounts.admin);

  const afterAdminUsers = await listAuthUsers();
  ids.coach = await ensureAuthUser(afterAdminUsers, accounts.coach);

  const afterCoachUsers = await listAuthUsers();
  ids.client1 = await ensureAuthUser(afterCoachUsers, accounts.client1);
  ids.client2 = await ensureAuthUser(afterCoachUsers, accounts.client2);

  if (Object.values(ids).some((id) => !id)) {
    throw new Error("Could not prepare all auth users.");
  }

  await upsertProfiles(ids);
  await seedData(ids);
  const results = await verify(ids);
  const failed = results.filter((result) => !result.pass);
  if (failed.length) {
    console.error(`RLS verification failed: ${failed.map((result) => result.name).join(", ")}`);
    process.exit(1);
  }
  console.log("RLS verification PASS.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
