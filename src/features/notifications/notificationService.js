const timeTr = () => new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });

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
