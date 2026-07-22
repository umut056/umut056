const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const firebaseServiceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") || "";

const b64url = (input: ArrayBuffer | string) => {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

async function supabaseFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

async function callerProfile(req: Request) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const user = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!user.ok) return null;
  const authUser = await user.json();
  const rows = await supabaseFetch(`/rest/v1/profiles?id=eq.${authUser.id}&select=id,role,status,coach_id`);
  return rows?.[0] || null;
}

async function firebaseAccessToken() {
  if (!firebaseServiceAccountJson) return "";
  const account = JSON.parse(firebaseServiceAccountJson);
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const pem = account.private_key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const assertion = `${unsigned}.${b64url(signature)}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!tokenRes.ok) throw new Error(await tokenRes.text());
  const tokenData = await tokenRes.json();
  return { accessToken: tokenData.access_token, projectId: account.project_id };
}

async function sendFcm(token: string, title: string, body: string, data: Record<string, string>) {
  const auth = await firebaseAccessToken();
  if (!auth) return { skipped: true };
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${auth.projectId}/messages:send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data,
        android: {
          priority: "HIGH",
          notification: {
            channel_id: "stepwise_general",
            sound: "default",
          },
        },
      },
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server env is missing" }, 500);

  try {
    const caller = await callerProfile(req);
    if (!caller || caller.status !== "active") return json({ error: "Authorization required" }, 403);

    const body = await req.json();
    const userId = body.userId;
    const title = body.title || "StepWise Plus";
    const text = body.text || "";
    const type = body.type || "info";
    if (!userId || !text) return json({ error: "Missing userId/text" }, 400);

    const allowed =
      caller.role === "admin" ||
      caller.id === userId ||
      caller.coach_id === userId ||
      (await supabaseFetch(`/rest/v1/profiles?id=eq.${userId}&coach_id=eq.${caller.id}&select=id`))?.length > 0;
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const notice = await supabaseFetch("/rest/v1/notifications", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify([{ user_id: userId, type, text }]),
    });
    const tokens = await supabaseFetch(`/rest/v1/device_tokens?user_id=eq.${userId}&enabled=eq.true&select=token`);
    const results = [];
    for (const row of tokens || []) {
      try {
        results.push(await sendFcm(row.token, title, text, { type, userId }));
      } catch (error) {
        results.push({ error: error instanceof Error ? error.message : "FCM error" });
      }
    }

    return json({ notification: notice?.[0] || null, sent: results.length, results });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
