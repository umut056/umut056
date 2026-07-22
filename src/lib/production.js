export const APP_CONFIG = {
  env: import.meta.env.VITE_APP_ENV || "development",
  demoAccounts: import.meta.env.VITE_ENABLE_DEMO_ACCOUNTS !== "false",
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  supabaseMediaBucket: import.meta.env.VITE_SUPABASE_MEDIA_BUCKET || "stepwise-media",
  cloudinaryCloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
  cloudinaryUploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "",
  fcmVapidKey: import.meta.env.VITE_FCM_VAPID_KEY || "",
};

export const isProductionMode = () => APP_CONFIG.env === "production";
export const isDemoAccountsEnabled = () => !isProductionMode() && APP_CONFIG.demoAccounts;
export const hasSupabaseConfig = () =>
  /^https:\/\/.+\.supabase\.co$/.test(APP_CONFIG.supabaseUrl) &&
  APP_CONFIG.supabaseAnonKey.length > 30;

export const productionReadiness = () => {
  const missing = [];
  const warnings = [];
  const checks = [];
  if (!isProductionMode()) missing.push("Production env modu");
  if (!hasSupabaseConfig()) missing.push("Supabase URL ve anon key");
  if (!APP_CONFIG.supabaseMediaBucket) missing.push("Supabase Storage bucket");
  if (APP_CONFIG.demoAccounts) warnings.push("Demo hesaplar env ayarinda acik gorunuyor");
  if (!APP_CONFIG.fcmVapidKey) warnings.push("Web VAPID key yok; Android push icin kritik degil");
  checks.push(
    { label: "Supabase Auth", ok: hasSupabaseConfig() },
    { label: "PostgreSQL REST", ok: hasSupabaseConfig() },
    { label: "Storage bucket", ok: !!APP_CONFIG.supabaseMediaBucket },
    { label: "Production modu", ok: isProductionMode() },
    { label: "Demo hesap kilidi", ok: !APP_CONFIG.demoAccounts },
    { label: "Android FCM", ok: true, note: "google-services.json ve native servis APK icinde kontrol edilir" },
    { label: "Kesin alarm", ok: true, note: "Android native alarm servisi aktif" },
  );
  return { ready: missing.length === 0, missing, warnings, checks };
};

const withTimeout = (request, ms = 12000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return request(controller.signal).finally(() => clearTimeout(timer));
};

export const supabaseRest = async (path, { method = "GET", token, body, query = "", prefer = "return=representation" } = {}) => {
  if (!hasSupabaseConfig()) throw new Error("Supabase ayarlari eksik");
  const res = await withTimeout((signal) => fetch(`${APP_CONFIG.supabaseUrl}/rest/v1/${path}${query}`, {
    method,
    headers: {
      apikey: APP_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token || APP_CONFIG.supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: prefer,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  }));
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
};

export const authRest = async (path, body) => {
  if (!hasSupabaseConfig()) throw new Error("Supabase ayarlari eksik");
  const res = await withTimeout((signal) => fetch(`${APP_CONFIG.supabaseUrl}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: APP_CONFIG.supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  }));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const edgeFunction = async (name, { token, body } = {}) => {
  if (!hasSupabaseConfig()) throw new Error("Supabase ayarlari eksik");
  const res = await withTimeout((signal) => fetch(`${APP_CONFIG.supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: APP_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token || APP_CONFIG.supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
    signal,
  }));
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const adminCreateUser = (payload, token) =>
  edgeFunction("admin-create-user", { token, body: payload });

export const adminImportWorkspace = (payload, token) =>
  edgeFunction("admin-import-workspace", { token, body: payload });

export const coachCreateClient = (payload, token) =>
  edgeFunction("coach-create-client", { token, body: payload });

export const notifyUser = (payload, token) =>
  edgeFunction("notify-user", { token, body: payload });

export const createAuditLog = async ({ action, targetTable, targetId, metadata = {} }, token) => {
  if (!action || !token) return null;
  const rows = await supabaseRest("audit_logs", {
    method: "POST",
    token,
    body: [{
      action,
      target_table: targetTable || null,
      target_id: targetId || null,
      metadata,
    }],
  });
  return rows?.[0] || null;
};

export const registerAccount = async ({ role, name, email, password, activationCode, coachRef, desiredRefCode }) => {
  if (!hasSupabaseConfig()) throw new Error("Supabase ayarlari eksik");
  const cleanRole = role === "coach" ? "coach" : "client";
  const data = {
    role: cleanRole,
    name,
    activation_code: cleanRole === "coach" ? activationCode : undefined,
    coach_ref: cleanRole === "client" ? coachRef : undefined,
    ref_code: cleanRole === "coach" ? desiredRefCode : undefined,
  };
  const session = await authRest("signup", { email, password, data });
  const token = session?.access_token;
  if (!token) {
    return { pendingEmailConfirmation: true, email };
  }
  const rows = await supabaseRest("profiles", { token, query: `?id=eq.${session.user.id}&select=*` });
  const profile = rows?.[0];
  if (!profile) return null;
  return {
    id: profile.id,
    role: profile.role,
    name: profile.name,
    email: profile.email,
    status: profile.status,
    coachId: profile.coach_id,
    refCode: profile.ref_code,
    avatarUrl: profile.avatar_url,
    avatarMedia: profile.avatar_media || null,
    avatarMediaId: profile.avatar_media?.mediaId,
    profilePhotoLocked: profile.profile_photo_locked,
    clientMessagesOpen: profile.client_messages_open,
    coverBg: profile.cover_bg,
    schedulePrefs: profile.schedule_prefs,
    schedulePrefsLocked: profile.schedule_prefs_locked,
    programStartDate: profile.program_start_date,
    programEndDate: profile.program_end_date,
    supabaseToken: token,
    refreshToken: session.refresh_token,
  };
};

const cleanPathPart = (value = "") =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

export const buildMediaPath = ({ ownerId, clientId, mediaType, fileName }) => {
  const parts = cleanPathPart(fileName || "").split(".");
  const ext = parts.length > 1 ? `.${parts.pop().toLowerCase()}` : "";
  return [
    cleanPathPart(ownerId || "unknown-owner"),
    clientId ? cleanPathPart(clientId) : "general",
    cleanPathPart(mediaType || "media"),
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`,
  ].join("/");
};

export const supabaseStorageUpload = async (file, { token, path, bucket = APP_CONFIG.supabaseMediaBucket, upsert = false } = {}) => {
  if (!hasSupabaseConfig() || !token || !file) return null;
  const res = await withTimeout((signal) => fetch(`${APP_CONFIG.supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: APP_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": upsert ? "true" : "false",
    },
    body: file,
    signal,
  }), 30000);
  if (!res.ok) throw new Error(await res.text());
  return {
    bucket,
    path,
  };
};

export const supabaseStorageSignedUrl = async ({ token, path, bucket = APP_CONFIG.supabaseMediaBucket, expiresIn = 60 * 60 * 24 * 7 } = {}) => {
  if (!hasSupabaseConfig() || !token || !path) return "";
  const res = await withTimeout((signal) => fetch(`${APP_CONFIG.supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`, {
    method: "POST",
    headers: {
      apikey: APP_CONFIG.supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
    signal,
  }));
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data?.signedURL ? `${APP_CONFIG.supabaseUrl}/storage/v1${data.signedURL}` : "";
};

export const uploadMediaFile = async (file, { token, ownerId, clientId, mediaType, fileName } = {}) => {
  if (!hasSupabaseConfig() || !token) return {};
  const path = buildMediaPath({ ownerId, clientId, mediaType, fileName: fileName || file?.name });
  const uploaded = await supabaseStorageUpload(file, { token, path });
  if (!uploaded) return {};
  const expiresIn = 60 * 60 * 24 * 7;
  const signedUrl = await supabaseStorageSignedUrl({ token, bucket: uploaded.bucket, path: uploaded.path, expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
  try {
    const rows = await supabaseRest("media_files", {
      method: "POST",
      token,
      body: [{
        owner_id: ownerId,
        client_id: clientId || null,
        media_type: mediaType,
        url: signedUrl,
        storage_bucket: uploaded.bucket,
        storage_path: uploaded.path,
        expires_at: expiresAt,
      }],
    });
    return { url: signedUrl, storageBucket: uploaded.bucket, storagePath: uploaded.path, expiresAt, uploadedAt: new Date().toISOString(), cloudId: rows?.[0]?.id, cloudStatus: "uploaded" };
  } catch {
    return { url: signedUrl, storageBucket: uploaded.bucket, storagePath: uploaded.path, expiresAt, uploadedAt: new Date().toISOString(), cloudStatus: "uploaded_unindexed" };
  }
};

export const registerCloudDeviceToken = async ({ userId, token, platform = "android" }, authToken) => {
  if (!userId || !token) return null;
  const rows = await supabaseRest("device_tokens", {
    method: "POST",
    token: authToken,
    query: "?on_conflict=token",
    prefer: "resolution=merge-duplicates,return=representation",
    body: [{
      user_id: userId,
      token,
      platform,
      enabled: true,
      last_seen_at: new Date().toISOString(),
    }],
  });
  return rows?.[0] || null;
};

const mapProfile = (profile) => ({
  id: profile.id,
  role: profile.role,
  name: profile.name,
  email: profile.email,
  status: profile.status,
  coachId: profile.coach_id,
  refCode: profile.ref_code,
  avatarUrl: profile.avatar_url,
  profilePhotoLocked: profile.profile_photo_locked,
  clientMessagesOpen: profile.client_messages_open,
  coverBg: profile.cover_bg,
  schedulePrefs: profile.schedule_prefs || {},
  schedulePrefsLocked: profile.schedule_prefs_locked,
  programStartDate: profile.program_start_date,
  programEndDate: profile.program_end_date,
  createdAt: profile.created_at?.slice?.(0, 10),
});

const mapMessage = (message) => ({
  id: message.id,
  from: message.sender_id,
  to: message.receiver_id,
  text: message.text,
  kind: message.message_type === "photo" || message.message_type === "audio" ? message.message_type : "text",
  url: message.media_url,
  storageBucket: message.media_storage_bucket,
  storagePath: message.media_storage_path,
  name: message.media_name,
  expiresAt: message.media_expires_at,
  readBy: message.read_by || [],
  date: message.created_at?.slice?.(0, 10),
  time: message.created_at ? new Date(message.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }) : "",
});

const mapAppointment = (appointment) => ({
  id: appointment.id,
  coachId: appointment.coach_id,
  clientId: appointment.client_id,
  type: appointment.type,
  date: appointment.date,
  time: appointment.time?.slice?.(0, 5) || appointment.time,
  duration: appointment.duration,
  status: appointment.status,
  requestedBy: appointment.requested_by,
});

const mapNotification = (notification) => ({
  id: notification.id,
  userId: notification.user_id,
  type: notification.type,
  text: notification.text,
  read: !!notification.read_at,
  date: notification.created_at?.slice?.(0, 10),
  time: notification.created_at ? new Date(notification.created_at).toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }) : "",
});

const mapProgram = (program, tasks = []) => ({
  id: program.id,
  coachId: program.coach_id,
  name: program.name,
  desc: program.description,
  duration: program.duration,
  bannedFoods: program.banned_foods || [],
  productVideo: program.product_video || null,
  isTemplate: program.is_template,
  tasks: tasks
    .filter((task) => task.program_id === program.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((task) => ({
      id: task.id,
      title: task.title,
      section: task.section,
      type: task.task_type,
      scheduledTime: task.scheduled_time?.slice?.(0, 5) || task.scheduled_time,
      note: task.note,
      photoRequired: task.photo_required,
      snoozeEnabled: task.snooze_enabled,
      snoozeOptions: task.snooze_options || [15, 30, 60],
      repeatType: "daily",
      repeatDays: [1, 2, 3, 4, 5, 6, 7],
    })),
});

const mapMediaFile = (media) => ({
  cloudId: media.id,
  mediaId: media.id,
  clientId: media.client_id,
  ownerId: media.owner_id,
  mediaType: media.media_type,
  url: media.url,
  storageBucket: media.storage_bucket,
  storagePath: media.storage_path,
  expiresAt: media.expires_at,
  assignedAt: media.created_at?.slice?.(0, 10),
  uploadedAt: media.created_at,
  cloudStatus: "uploaded",
});

export const loadProductionWorkspace = async (token) => {
  if (!hasSupabaseConfig() || !token) return null;
  const [profiles, messages, appointments, programs, tasks, clientPrograms, bodyMetrics, notifications, mediaFiles] = await Promise.all([
    supabaseRest("profiles", { token, query: "?select=*&order=created_at.asc" }),
    supabaseRest("messages", { token, query: "?select=*&order=created_at.asc" }),
    supabaseRest("appointments", { token, query: "?select=*&order=date.asc,time.asc" }),
    supabaseRest("programs", { token, query: "?select=*&order=created_at.asc" }),
    supabaseRest("program_tasks", { token, query: "?select=*&order=sort_order.asc" }),
    supabaseRest("client_programs", { token, query: "?select=*&status=eq.active&order=created_at.desc" }),
    supabaseRest("body_metrics", { token, query: "?select=*&order=created_at.desc&limit=500" }),
    supabaseRest("notifications", { token, query: "?select=*&order=created_at.desc&limit=50" }),
    supabaseRest("media_files", { token, query: "?select=*&order=created_at.desc&limit=300" }),
  ]);
  const mappedNotifications = (notifications || []).map(mapNotification);
  const mappedMedia = (mediaFiles || []).map(mapMediaFile);
  const mappedPrograms = (programs || []).map((program) => mapProgram(program, tasks || []));
  const programsById = new Map(mappedPrograms.map((program) => [program.id, program]));
  const latestMetricByClient = new Map();
  (bodyMetrics || []).forEach((metric) => {
    if (!metric?.client_id || latestMetricByClient.has(metric.client_id)) return;
    latestMetricByClient.set(metric.client_id, metric);
  });
  const activeProgramByClient = new Map();
  (clientPrograms || []).forEach((assignment) => {
    if (!assignment?.client_id || activeProgramByClient.has(assignment.client_id)) return;
    const program = programsById.get(assignment.program_id);
    if (!program) return;
    activeProgramByClient.set(assignment.client_id, { assignment, program });
  });
  return {
    users: (profiles || []).map((profile) => {
      const mapped = mapProfile(profile);
      const activeProgram = activeProgramByClient.get(profile.id);
      const assignedProgram = activeProgram?.program;
      const metric = latestMetricByClient.get(profile.id);
      const body = metric ? {
        height: metric.height_cm || 0,
        current: metric.weight_kg || 0,
        fat: metric.body_fat || 0,
        bmi: metric.bmi || 0,
      } : null;
      const productVideos = mappedMedia
        .filter((media) => media.mediaType === "product_video" && media.clientId === profile.id)
        .map((media) => ({ ...media, name: "\u00dcr\u00fcn kullan\u0131m videosu", coachId: profile.coach_id }))
        .slice(0, 5);
      const programVideo = assignedProgram?.productVideo
        ? { ...assignedProgram.productVideo, assignedAt: activeProgram.assignment.start_date || mapped.programStartDate || new Date().toISOString().slice(0, 10), sourceProgramId: assignedProgram.id, sourceProgramName: assignedProgram.name }
        : null;
      return {
        ...mapped,
        ...(body ? { body } : {}),
        ...(assignedProgram ? {
          program: assignedProgram.name,
          programTemplateId: assignedProgram.id,
          programDraft: assignedProgram,
          programStartDate: activeProgram.assignment.start_date || mapped.programStartDate,
          programEndDate: activeProgram.assignment.end_date || mapped.programEndDate,
          tasks: assignedProgram.tasks.map(() => false),
          pendingToday: assignedProgram.tasks.length,
          photoPendingToday: assignedProgram.tasks.filter((task) => task.photoRequired !== false).length,
          programHistory: [{
            name: assignedProgram.name,
            date: activeProgram.assignment.start_date || mapped.programStartDate || new Date().toISOString().slice(0, 10),
            duration: assignedProgram.duration,
            tasks: assignedProgram.tasks,
            bannedFoods: assignedProgram.bannedFoods,
            productVideo: programVideo,
          }],
        } : {}),
        ...(mapped.avatarMedia ? { avatarUrl: mapped.avatarMedia.url || mapped.avatarUrl, avatarStoragePath: mapped.avatarMedia.storagePath } : {}),
        ...(programVideo ? { productVideo: programVideo, productVideoDraft: programVideo, productVideos: [programVideo, ...productVideos].slice(0, 5) } : productVideos.length ? { productVideo: productVideos[0], productVideoDraft: productVideos[0], productVideos } : {}),
        notifications: mappedNotifications.filter((notice) => notice.userId === profile.id),
      };
    }),
    msgs: (messages || []).map(mapMessage),
    sess: (appointments || []).map(mapAppointment),
    programs: mappedPrograms,
  };
};

export const createCloudNotification = async ({ userId, type = "info", text, title = "StepWise Plus" }, token) => {
  if (!userId || !text) return null;
  try {
    const pushed = await notifyUser({ userId, type, text, title }, token);
    if (pushed?.notification) return mapNotification(pushed.notification);
  } catch {}
  const rows = await supabaseRest("notifications", {
    method: "POST",
    token,
    body: [{
      user_id: userId,
      type,
      text,
    }],
  });
  return rows?.[0] ? mapNotification(rows[0]) : null;
};

export const saveProfilePatch = async (userId, patch, token) => {
  const body = {
    name: patch.name,
    email: patch.email,
    status: patch.status,
    avatar_url: patch.avatarUrl,
    avatar_media: patch.avatarMedia,
    profile_photo_locked: patch.profilePhotoLocked,
    client_messages_open: patch.clientMessagesOpen,
    cover_bg: patch.coverBg,
    schedule_prefs: patch.schedulePrefs,
    schedule_prefs_locked: patch.schedulePrefsLocked,
    program_start_date: patch.programStartDate,
    program_end_date: patch.programEndDate,
  };
  Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
  const rows = await supabaseRest("profiles", {
    method: "PATCH",
    token,
    query: `?id=eq.${userId}`,
    body,
  });
  return rows?.[0] ? mapProfile(rows[0]) : null;
};

export const createCloudMessage = async ({ from, to, room, kind = "text", text = "", url = "", storageBucket, storagePath, name, expiresAt, senderName = "" }, token) => {
  const rows = await supabaseRest("messages", {
    method: "POST",
    token,
    body: [{
      sender_id: from,
      receiver_id: to || null,
      room: room || null,
      message_type: kind === "photo" || kind === "audio" ? kind : "text",
      text,
      media_url: url || null,
      media_storage_bucket: storageBucket || null,
      media_storage_path: storagePath || null,
      media_name: name || null,
      media_expires_at: expiresAt || null,
      read_by: [from],
    }],
  });
  const saved = rows?.[0] ? mapMessage(rows[0]) : null;
  if (saved?.to) {
    try {
      const prefix = senderName ? `${senderName}: ` : "";
      await createCloudNotification({
        userId: saved.to,
        type: "message",
        title: senderName || "StepWise Plus",
        text: kind === "photo" ? `${prefix}Fotoğraf gönderdi` : kind === "audio" ? `${prefix}Sesli mesaj gönderdi` : `${prefix}${text || "Yeni mesaj"}`,
      }, token);
    } catch {}
  }
  return saved;
};

export const createCloudAppointment = async (appointment, token) => {
  const rows = await supabaseRest("appointments", {
    method: "POST",
    token,
    body: [{
      coach_id: appointment.coachId,
      client_id: appointment.clientId,
      type: appointment.type || "G\u00f6r\u00fc\u015fme",
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration || "30 dk",
      status: appointment.status || "pending",
      requested_by: appointment.requestedBy || appointment.requested_by || "client",
    }],
  });
  const saved = rows?.[0] ? mapAppointment(rows[0]) : null;
  if (saved?.clientId) {
    try {
      await createCloudNotification({
        userId: saved.clientId,
        type: "appointment",
        text: saved.status === "confirmed" ? `Randevun onayland\u0131: ${saved.date} ${saved.time}` : `Yeni randevu talebi: ${saved.date} ${saved.time}`,
      }, token);
    } catch {}
  }
  if (saved?.coachId && saved.requestedBy === "client") {
    try {
      await createCloudNotification({
        userId: saved.coachId,
        type: "appointment",
        text: `Yeni randevu talebi: ${saved.date} ${saved.time}`,
      }, token);
    } catch {}
  }
  return saved;
};

export const updateCloudAppointment = async (id, patch, token) => {
  const body = {
    date: patch.date,
    time: patch.time,
    duration: patch.duration,
    status: patch.status,
    type: patch.type,
  };
  Object.keys(body).forEach((key) => body[key] === undefined && delete body[key]);
  const rows = await supabaseRest("appointments", {
    method: "PATCH",
    token,
    query: `?id=eq.${id}`,
    body,
  });
  const saved = rows?.[0] ? mapAppointment(rows[0]) : null;
  if (saved?.clientId && (patch.status === "confirmed" || patch.status === "proposed")) {
    try {
      await createCloudNotification({
        userId: saved.clientId,
        type: "appointment",
        text: patch.status === "confirmed" ? `Randevun onayland\u0131: ${saved.date} ${saved.time}` : `Ko\u00e7un yeni randevu saati \u00f6nerdi: ${saved.date} ${saved.time}`,
      }, token);
    } catch {}
  }
  return saved;
};

export const createCloudBodyMetric = async ({ clientId, coachId, body, note }, token) =>
  supabaseRest("body_metrics", {
    method: "POST",
    token,
    body: [{
      client_id: clientId,
      coach_id: coachId || null,
      height_cm: body?.height || null,
      weight_kg: body?.current || body?.weight || null,
      body_fat: body?.fat || null,
      bmi: body?.bmi || null,
      note: note || null,
    }],
  });

export const createCloudTaskLog = async ({ clientId, coachId, action, proofUrl, proofStatus, note }, token) =>
  supabaseRest("task_logs", {
    method: "POST",
    token,
    body: [{
      client_id: clientId,
      coach_id: coachId || null,
      action,
      proof_url: proofUrl || null,
      proof_status: proofStatus || null,
      note: note || null,
    }],
  });

export const upsertCloudDailyTaskStatus = async ({ clientId, coachId, taskIndex, taskTitle, taskDate, completed, proofUrl, proofStatus, snoozeUsed, nextAlarm, note }, token) =>
  supabaseRest("daily_task_status", {
    method: "POST",
    token,
    query: "?on_conflict=client_id,task_date,task_index",
    prefer: "resolution=merge-duplicates,return=representation",
    body: [{
      client_id: clientId,
      coach_id: coachId || null,
      task_index: taskIndex,
      task_title: taskTitle || null,
      task_date: taskDate || new Date().toISOString().slice(0, 10),
      completed: !!completed,
      proof_url: proofUrl || null,
      proof_status: proofStatus || null,
      snooze_used: snoozeUsed || 0,
      next_alarm: nextAlarm || null,
      note: note || null,
      updated_at: new Date().toISOString(),
    }],
  });

export const createCloudProgram = async (program, token) => {
  const rows = await supabaseRest("programs", {
    method: "POST",
    token,
    body: [{
      coach_id: program.coachId || null,
      name: program.name,
      description: program.desc || program.description || "",
      duration: program.duration || "",
      banned_foods: program.bannedFoods || [],
      product_video: program.productVideo || null,
      is_template: !!program.isTemplate,
    }],
  });
  const saved = rows?.[0];
  if (!saved) return null;
  const tasks = (program.tasks || []).map((task, index) => ({
    program_id: saved.id,
    title: task.title,
    section: task.section || "Genel",
    task_type: task.type || "meal",
    scheduled_time: task.scheduledTime || "09:00",
    note: task.note || "",
    photo_required: task.photoRequired !== false,
    snooze_enabled: task.snoozeEnabled !== false,
    snooze_options: task.snoozeOptions || [15, 30, 60],
    sort_order: index,
  }));
  if (tasks.length) {
    await supabaseRest("program_tasks", { method: "POST", token, body: tasks });
  }
  return mapProgram(saved, tasks.map((task) => ({
    id: "",
    program_id: task.program_id,
    title: task.title,
    section: task.section,
    task_type: task.task_type,
    scheduled_time: task.scheduled_time,
    note: task.note,
    photo_required: task.photo_required,
    snooze_enabled: task.snooze_enabled,
    snooze_options: task.snooze_options,
    sort_order: task.sort_order,
  })));
};

export const updateCloudProgram = async (program, token) => {
  if (!program?.id || !isUuid(program.id)) return null;
  const rows = await supabaseRest("programs", {
    method: "PATCH",
    token,
    query: `?id=eq.${program.id}`,
    body: {
      coach_id: program.coachId || null,
      name: program.name,
      description: program.desc || program.description || "",
      duration: program.duration || "",
      banned_foods: program.bannedFoods || [],
      product_video: program.productVideo || null,
      is_template: !!program.isTemplate,
      updated_at: new Date().toISOString(),
    },
  });
  const saved = rows?.[0] || {
    id: program.id,
    coach_id: program.coachId || null,
    name: program.name,
    description: program.desc || program.description || "",
    duration: program.duration || "",
    banned_foods: program.bannedFoods || [],
    product_video: program.productVideo || null,
    is_template: !!program.isTemplate,
  };
  await supabaseRest("program_tasks", {
    method: "DELETE",
    token,
    query: `?program_id=eq.${program.id}`,
    prefer: "return=minimal",
  });
  const tasks = (program.tasks || []).map((task, index) => ({
    program_id: program.id,
    title: task.title,
    section: task.section || "Genel",
    task_type: task.type || "meal",
    scheduled_time: task.scheduledTime || "09:00",
    note: task.note || "",
    photo_required: task.photoRequired !== false,
    snooze_enabled: task.snoozeEnabled !== false,
    snooze_options: task.snoozeOptions || [15, 30, 60],
    sort_order: index,
  }));
  if (tasks.length) {
    await supabaseRest("program_tasks", { method: "POST", token, body: tasks });
  }
  return mapProgram(saved, tasks.map((task) => ({
    id: "",
    program_id: task.program_id,
    title: task.title,
    section: task.section,
    task_type: task.task_type,
    scheduled_time: task.scheduled_time,
    note: task.note,
    photo_required: task.photo_required,
    snooze_enabled: task.snooze_enabled,
    snooze_options: task.snooze_options,
    sort_order: task.sort_order,
  })));
};

export const deleteCloudProgram = async (programId, token) => {
  if (!programId || !isUuid(programId)) return false;
  await supabaseRest("client_programs", {
    method: "DELETE",
    token,
    query: `?program_id=eq.${programId}`,
    prefer: "return=minimal",
  });
  await supabaseRest("program_tasks", {
    method: "DELETE",
    token,
    query: `?program_id=eq.${programId}`,
    prefer: "return=minimal",
  });
  await supabaseRest("programs", {
    method: "DELETE",
    token,
    query: `?id=eq.${programId}`,
    prefer: "return=minimal",
  });
  return true;
};

export const createCloudCoachCode = async (code, token) => {
  const rows = await supabaseRest("coach_codes", {
    method: "POST",
    token,
    body: [{
      code,
      status: "active",
    }],
  });
  return rows?.[0] || null;
};

const isUuid = (value = "") =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const assignCloudProgram = async ({ client, coach, template, startDate, endDate }, token) => {
  let program = template;
  if (!isUuid(template.id)) {
    program = await createCloudProgram({ ...template, coachId: coach.id }, token);
  }
  if (!program?.id) throw new Error("Program could not be created");
  const rows = await supabaseRest("client_programs", {
    method: "POST",
    token,
    body: [{
      client_id: client.id,
      coach_id: coach.id,
      program_id: program.id,
      start_date: startDate || new Date().toISOString().slice(0, 10),
      end_date: endDate || null,
      status: "active",
    }],
  });
  return { program, clientProgram: rows?.[0] || null };
};

export const markCloudMessagesRead = async ({ userId, fromId }, token) => {
  const query = fromId
    ? `?receiver_id=eq.${userId}&sender_id=eq.${fromId}`
    : `?receiver_id=eq.${userId}`;
  return supabaseRest("messages", {
    method: "PATCH",
    token,
    query,
    body: { read_by: [userId] },
  });
};
