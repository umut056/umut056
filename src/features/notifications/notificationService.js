const timeTr = () => new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });
const asArray = (value) => (Array.isArray(value) ? value : []);

export function unreadMessagesFor(messages = [], userId, fromId = null) {
  if (!userId) return [];
  return messages.filter(
    (message) =>
      message.to === userId &&
      (!fromId || message.from === fromId) &&
      !(message.readBy || []).includes(userId),
  );
}

export function unreadCount(messages = [], user) {
  return user ? unreadMessagesFor(messages, user.id).length : 0;
}

export function unreadCountFrom(messages = [], userId, fromId) {
  return unreadMessagesFor(messages, userId, fromId).length;
}

export function unreadConversationSummaries(messages = [], userId, participants = [], getPreviewText = null) {
  if (!userId) return [];

  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const grouped = new Map();
  const preview = typeof getPreviewText === "function" ? getPreviewText : (message) => message?.text || "Mesaj";

  unreadMessagesFor(messages, userId)
    .slice()
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    .forEach((message) => {
      const current = grouped.get(message.from) || {
        senderId: message.from,
        senderName: message.senderName || participantById.get(message.from)?.name || "Yeni mesaj",
        count: 0,
        lastMessage: null,
        lastText: "",
        lastTime: "",
      };

      current.count += 1;
      current.lastMessage = message;
      current.lastText = preview(message);
      current.lastTime = message.time || "";
      if (!current.senderName || current.senderName === "Yeni mesaj") {
        current.senderName = message.senderName || participantById.get(message.from)?.name || current.senderName;
      }
      grouped.set(message.from, current);
    });

  return [...grouped.values()].sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
}

export function unreadMessageBadge(messages = [], userId, participants = []) {
  const summaries = unreadConversationSummaries(messages, userId, participants);
  const total = summaries.reduce((count, summary) => count + summary.count, 0);
  const senderCount = summaries.length;
  const topSender = summaries[0] || null;

  return {
    total,
    senderCount,
    topSenderId: topSender?.senderId || null,
    topSenderName: topSender?.senderName || "",
    label:
      total <= 0
        ? ""
        : senderCount === 1
          ? `${topSender.senderName}: ${total}`
          : `${senderCount} kişi · ${total} mesaj`,
  };
}

export function coachActionInbox({
  coachId,
  users = [],
  messages = [],
  appointments = [],
  proofActions = [],
  getPreviewText = null,
}) {
  if (!coachId) return [];

  const userById = new Map(asArray(users).map((user) => [user.id, user]));
  const messageItems = unreadConversationSummaries(messages, coachId, asArray(users), getPreviewText).map((summary) => ({
    id: `message-${summary.senderId}`,
    type: "message",
    priority: 80,
    clientId: summary.senderId,
    clientName: summary.senderName,
    title: `${summary.senderName} mesaj gönderdi`,
    text: `${summary.count} okunmamış mesaj · ${summary.lastText}`,
    count: summary.count,
    time: summary.lastTime,
    source: summary.lastMessage,
  }));

  const proofItems = asArray(proofActions).map((proof, index) => ({
    id: `proof-${proof.id || proof.client?.id || index}`,
    type: "proof",
    priority: 90,
    clientId: proof.client?.id || proof.clientId,
    clientName: proof.client?.name || userById.get(proof.clientId)?.name || "Danışan",
    title: `${proof.client?.name || userById.get(proof.clientId)?.name || "Danışan"} fotoğraf gönderdi`,
    text: proof.note ? `${proof.task || "Görev"} · ${proof.note}` : proof.task || "Fotoğraf onayı bekliyor",
    count: 1,
    time: proof.time || "",
    source: proof,
  }));

  const appointmentItems = asArray(appointments)
    .filter((appointment) => appointment?.coachId === coachId && ["pending", "proposed"].includes(appointment.status))
    .map((appointment) => {
      const client = userById.get(appointment.clientId);
      return {
        id: `appointment-${appointment.id}`,
        type: "appointment",
        priority: appointment.status === "pending" ? 70 : 60,
        clientId: appointment.clientId,
        clientName: client?.name || "Danışan",
        title: appointment.status === "pending" ? "Randevu talebi" : "Randevu saat önerisi",
        text: `${client?.name || "Danışan"} · ${appointment.date || "-"} ${appointment.time || ""}`.trim(),
        count: 1,
        time: appointment.time || "",
        source: appointment,
      };
    });

  return [...proofItems, ...messageItems, ...appointmentItems].sort(
    (a, b) => b.priority - a.priority || String(b.time || "").localeCompare(String(a.time || "")),
  );
}

export function markMessagesRead(messages = [], userId, fromId = null) {
  if (!userId) return { messages, changed: false };
  let changed = false;
  const next = messages.map((message) => {
    if (
      message.to !== userId ||
      (fromId && message.from !== fromId) ||
      (message.readBy || []).includes(userId)
    ) {
      return message;
    }
    changed = true;
    return {
      ...message,
      readBy: [...(message.readBy || []), userId],
      readAt: { ...(message.readAt || {}), [userId]: Date.now() },
    };
  });
  return { messages: next, changed };
}

export function createLocalNotice({ text, type = "info", date, idPrefix = "n" }) {
  if (!text) return null;
  return {
    id: `${idPrefix}${Date.now()}`,
    text,
    type,
    date,
    time: timeTr(),
    read: false,
  };
}

export function addNoticeToUsers(users = [], userId, notice, limit = 20) {
  if (!userId || !notice) return users;
  return users.map((user) =>
    user.id === userId
      ? { ...user, notifications: [notice, ...(user.notifications || [])].slice(0, limit) }
      : user,
  );
}

export function activeCoachNotes(client) {
  const notes = (client?.coachNotes || []).map((note) => ({ ...note, source: "coachNotes" }));
  const notices = (client?.notifications || [])
    .filter((notice) => notice.type === "coach_note")
    .map((notice) => ({ ...notice, source: "notifications", coachId: client.coachId }));
  const dismissed = new Set(client?.dismissedCoachNoteKeys || []);
  const seen = new Set();
  return [...notes, ...notices]
    .filter((note) => note?.text && !note.dismissedAt && !note.read)
    .filter((note) => {
      const key = `${note.coachId || ""}-${note.date || ""}-${note.text}`;
      if (dismissed.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort(
      (a, b) =>
        String(b.createdAt || "").localeCompare(String(a.createdAt || "")) ||
        String(b.time || "").localeCompare(String(a.time || "")),
    );
}

export function applyDismissCoachNote(users = [], clientId, noteId) {
  if (!clientId || !noteId) return users;
  return users.map((user) => {
    if (user.id !== clientId) return user;
    const match = [...(user.coachNotes || []), ...(user.notifications || []).filter((n) => n.type === "coach_note")]
      .find((note) => note.id === noteId);
    const key = match ? `${match.coachId || user.coachId || ""}-${match.date || ""}-${match.text}` : null;
    return {
      ...user,
      dismissedCoachNoteKeys: key ? [...new Set([...(user.dismissedCoachNoteKeys || []), key])] : user.dismissedCoachNoteKeys,
      coachNotes: (user.coachNotes || []).map((note) =>
        note.id === noteId ? { ...note, dismissedAt: Date.now(), read: true } : note,
      ),
      notifications: (user.notifications || []).map((notice) =>
        notice.id === noteId ? { ...notice, read: true, dismissedAt: Date.now() } : notice,
      ),
    };
  });
}

export async function showBrowserNotification(title, body) {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(title, { body, tag: `stepwise-notice-${Date.now()}`, requireInteraction: false });
    }
  } catch {}
}
