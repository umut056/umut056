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
  const rows = await supabaseFetch(`/rest/v1/profiles?id=eq.${authUser.id}&select=id,role,status`);
  return rows?.[0] || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!supabaseUrl || !serviceRoleKey) return json({ error: "Server env is missing" }, 500);

  try {
    const caller = await callerProfile(req);
    if (!caller || caller.role !== "admin" || caller.status !== "active") {
      return json({ error: "Admin authorization required" }, 403);
    }

    const body = await req.json();
    const role = body.role === "coach" ? "coach" : body.role === "client" ? "client" : "";
    if (!role) return json({ error: "Invalid role" }, 400);
    if (!body.email || !body.password || !body.name) return json({ error: "Missing required fields" }, 400);

    const created = await supabaseFetch("/auth/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: {
          role,
          name: body.name,
          activation_code: body.activationCode,
          coach_ref: body.coachRef,
          ref_code: body.refCode,
        },
      }),
    });

    await supabaseFetch("/rest/v1/audit_logs", {
      method: "POST",
      body: JSON.stringify([{
        actor_id: caller.id,
        action: "admin_create_user",
        target_table: "profiles",
        target_id: created?.id,
        metadata: { role, email: body.email },
      }]),
    });

    return json({ id: created?.id, email: created?.email });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
