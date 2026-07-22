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
      Prefer: "return=representation",
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

const cleanEmail = (value: string) => value.trim().toLowerCase();
const tempPassword = () => `StepWise-${crypto.randomUUID().slice(0, 8)}!`;

async function ensureAuthUser(user: any, coachRefByOldId: Map<string, string>) {
  const role = user.role === "coach" ? "coach" : user.role === "client" ? "client" : "";
  if (!role || !user.email || !user.name) return null;
  const email = cleanEmail(user.email);
  const existingProfiles = await supabaseFetch(`/rest/v1/profiles?email=eq.${encodeURIComponent(email)}&select=id,email,role,ref_code`);
  if (existingProfiles?.[0]) return existingProfiles[0];

  const metadata: Record<string, string> = { role, name: user.name };
  if (role === "coach") {
    const activationCode = `IMPORT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    await supabaseFetch("/rest/v1/coach_codes", {
      method: "POST",
      body: JSON.stringify([{ code: activationCode, status: "active" }]),
    });
    metadata.activation_code = activationCode;
    metadata.ref_code = user.refCode || `REF-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  }
  if (role === "client") {
    metadata.coach_ref = coachRefByOldId.get(user.coachId) || user.coachRef || "";
  }

  const created = await supabaseFetch("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: user.password || tempPassword(),
      email_confirm: true,
      user_metadata: metadata,
    }),
  });
  const rows = await supabaseFetch(`/rest/v1/profiles?id=eq.${created.id}&select=id,email,role,ref_code`);
  return rows?.[0] || null;
}

async function importProgram(program: any, coachId: string | null) {
  const rows = await supabaseFetch("/rest/v1/programs", {
    method: "POST",
    body: JSON.stringify([{
      coach_id: coachId,
      name: program.name || "Aktarılan Program",
      description: program.desc || program.description || "",
      duration: program.duration || "",
      banned_foods: program.bannedFoods || [],
      product_video: program.productVideo || null,
      is_template: !coachId,
    }]),
  });
  const saved = rows?.[0];
  if (!saved) return null;
  const tasks = (program.tasks || []).map((task: any, index: number) => ({
    program_id: saved.id,
    title: task.title || task.l || `Görev ${index + 1}`,
    section: task.section || "Genel",
    task_type: task.type || "meal",
    scheduled_time: task.scheduledTime || task.alarm || "09:00",
    note: task.note || task.l || "",
    photo_required: task.photoRequired ?? task.photo ?? true,
    snooze_enabled: task.snoozeEnabled ?? true,
    snooze_options: task.snoozeOptions || [15, 30, 60],
    sort_order: index,
  }));
  if (tasks.length) {
    await supabaseFetch("/rest/v1/program_tasks", {
      method: "POST",
      body: JSON.stringify(tasks),
    });
  }
  return saved;
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

    const workspace = await req.json();
    const users = Array.isArray(workspace.users) ? workspace.users : [];
    const programs = Array.isArray(workspace.programs) ? workspace.programs : [];
    const sessions = Array.isArray(workspace.sess) ? workspace.sess : [];
    const messages = Array.isArray(workspace.msgs) ? workspace.msgs : [];
    const taskLogs = Array.isArray(workspace.taskLogs) ? workspace.taskLogs : [];

    const coachRefByOldId = new Map<string, string>();
    users.filter((u: any) => u.role === "coach").forEach((u: any) => coachRefByOldId.set(u.id, u.refCode));

    const idMap = new Map<string, string>();
    for (const coach of users.filter((u: any) => u.role === "coach")) {
      const saved = await ensureAuthUser(coach, coachRefByOldId);
      if (saved?.id) idMap.set(coach.id, saved.id);
    }
    for (const client of users.filter((u: any) => u.role === "client")) {
      const saved = await ensureAuthUser(client, coachRefByOldId);
      if (saved?.id) idMap.set(client.id, saved.id);
    }

    for (const user of users) {
      const mappedId = idMap.get(user.id);
      if (!mappedId) continue;
      await supabaseFetch(`/rest/v1/profiles?id=eq.${mappedId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: user.status || "active",
          program_start_date: user.programStartDate || user.startedAt?.slice?.(0, 10) || user.createdAt || null,
          program_end_date: user.programEndDate || null,
          client_messages_open: user.clientMessagesOpen !== false,
          cover_bg: user.coverBg || null,
          schedule_prefs: user.schedulePrefs || {},
          schedule_prefs_locked: !!user.schedulePrefsLocked,
        }),
      });
      if (user.body && user.role === "client") {
        await supabaseFetch("/rest/v1/body_metrics", {
          method: "POST",
          body: JSON.stringify([{
            client_id: mappedId,
            coach_id: idMap.get(user.coachId) || null,
            height_cm: user.body.height || null,
            weight_kg: user.body.current || user.body.start || null,
            body_fat: user.body.fat || null,
            bmi: user.body.bmi || null,
            note: "Import edilen vücut analizi",
          }]),
        });
      }
    }

    const importedPrograms: Record<string, string> = {};
    for (const program of programs) {
      const saved = await importProgram(program, program.coachId ? idMap.get(program.coachId) || null : null);
      if (saved?.id && program.id) importedPrograms[program.id] = saved.id;
    }

    for (const client of users.filter((u: any) => u.role === "client")) {
      const clientId = idMap.get(client.id);
      const coachId = idMap.get(client.coachId);
      if (!clientId || !coachId) continue;
      let programId = client.programTemplateId ? importedPrograms[client.programTemplateId] : null;
      if (!programId && client.programDraft) {
        const saved = await importProgram(client.programDraft, coachId);
        programId = saved?.id;
      }
      if (programId) {
        await supabaseFetch("/rest/v1/client_programs", {
          method: "POST",
          body: JSON.stringify([{
            client_id: clientId,
            coach_id: coachId,
            program_id: programId,
            start_date: client.programStartDate || client.startedAt?.slice?.(0, 10) || new Date().toISOString().slice(0, 10),
            end_date: client.programEndDate || null,
            status: "active",
          }]),
        });
      }
    }

    const appointmentRows = sessions
      .map((s: any) => ({
        coach_id: idMap.get(s.coachId),
        client_id: idMap.get(s.clientId),
        type: s.type || "Görüşme",
        date: s.date,
        time: s.time || "10:00",
        duration: s.duration || "30 dk",
        status: s.status || "pending",
        requested_by: s.requestedBy || "coach",
      }))
      .filter((s: any) => s.coach_id && s.client_id && s.date);
    if (appointmentRows.length) {
      await supabaseFetch("/rest/v1/appointments", { method: "POST", body: JSON.stringify(appointmentRows) });
    }

    const messageRows = messages
      .map((m: any) => ({
        sender_id: idMap.get(m.from),
        receiver_id: idMap.get(m.to) || null,
        room: m.room || null,
        message_type: m.kind === "photo" || m.kind === "audio" ? m.kind : "text",
        text: m.text || "",
        media_url: m.url || null,
        media_storage_bucket: m.storageBucket || null,
        media_storage_path: m.storagePath || null,
        media_name: m.name || null,
        media_expires_at: m.expiresAt || null,
        read_by: [],
      }))
      .filter((m: any) => m.sender_id && (m.receiver_id || m.room));
    if (messageRows.length) {
      await supabaseFetch("/rest/v1/messages", { method: "POST", body: JSON.stringify(messageRows) });
    }

    const taskRows = taskLogs
      .map((log: any) => ({
        client_id: idMap.get(log.clientId),
        coach_id: idMap.get(log.coachId) || null,
        action: log.action || "imported",
        proof_url: log.url || null,
        proof_status: log.status || null,
        note: log.note || log.taskTitle || null,
      }))
      .filter((log: any) => log.client_id);
    if (taskRows.length) {
      await supabaseFetch("/rest/v1/task_logs", { method: "POST", body: JSON.stringify(taskRows) });
    }

    await supabaseFetch("/rest/v1/audit_logs", {
      method: "POST",
      body: JSON.stringify([{
        actor_id: caller.id,
        action: "admin_import_workspace",
        target_table: "workspace",
        metadata: {
          users: idMap.size,
          programs: Object.keys(importedPrograms).length,
          appointments: appointmentRows.length,
          messages: messageRows.length,
          taskLogs: taskRows.length,
        },
      }]),
    });

    return json({
      users: idMap.size,
      programs: Object.keys(importedPrograms).length,
      appointments: appointmentRows.length,
      messages: messageRows.length,
      taskLogs: taskRows.length,
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
});
