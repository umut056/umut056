import { createCloudMessage, isProductionMode, markCloudMessagesRead } from "../../lib/production.js";
import { persistMedia } from "../media/mediaService.js";

const todayIsoDate = () => new Date().toISOString().split("T")[0];

const localMessageTime = () =>
  new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" });

export function conversationBetween(messages = [], firstUserId, secondUserId) {
  if (!firstUserId || !secondUserId) return [];

  return messages.filter(
    (message) =>
      (message.from === firstUserId && message.to === secondUserId) ||
      (message.from === secondUserId && message.to === firstUserId),
  );
}

export function roomMessages(messages = [], room) {
  if (!room) return [];

  return messages
    .filter((message) => message.room === room)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

export function messagePreviewText(message) {
  if (!message) return "";
  if (message.kind === "photo") return "Fotoğraf";
  if (message.kind === "audio") return "Sesli mesaj";
  return message.text || "Mesaj";
}

export async function createMediaMessageDraft({
  kind,
  file,
  user,
  clientId,
  idPrefix = "msg",
  name,
}) {
  const mediaId = `${idPrefix}-${kind}-${user.id}-${Date.now()}`;
  const stored = await persistMedia({
    id: mediaId,
    file,
    mediaType: kind === "photo" ? "message_photo" : "message_audio",
    owner: user,
    clientId,
  });

  return {
    text: messagePreviewText({ kind }),
    kind,
    ...stored,
    name: name || file.name,
  };
}

export async function syncConversationRead({
  markLocalRead,
  user,
  fromId,
  logLabel = "cloud-read",
}) {
  if (!user?.id || !fromId) return false;

  const changed = markLocalRead(user.id, fromId);

  if (changed && isProductionMode() && user.supabaseToken) {
    markCloudMessagesRead({ userId: user.id, fromId }, user.supabaseToken).catch((err) =>
      console.warn(logLabel, err),
    );
  }

  return changed;
}

export async function createMessageRecord({
  user,
  to,
  room,
  extra,
  logLabel = "cloud-message",
}) {
  let saved = null;

  if (isProductionMode() && user?.supabaseToken) {
    try {
      const payload = {
        from: user.id,
        kind: extra.kind,
        text: extra.text,
        url: extra.url,
        storageBucket: extra.storageBucket,
        storagePath: extra.storagePath,
        name: extra.name,
        expiresAt: extra.expiresAt,
        senderName: user.name,
      };

      if (room) payload.room = room;
      else payload.to = to;

      saved = await createCloudMessage(payload, user.supabaseToken);
    } catch (err) {
      console.warn(logLabel, err);
    }
  }

  const localId = `m${Date.now()}`;

  if (saved) {
    return {
      ...saved,
      ...extra,
      id: saved.id,
      time: saved.time,
      date: saved.date,
      ...(room ? { room, to: room, createdAt: Date.now() } : {}),
    };
  }

  return {
    id: localId,
    from: user.id,
    to: room || to,
    ...(room ? { room, createdAt: Date.now() } : {}),
    time: localMessageTime(),
    date: todayIsoDate(),
    ...extra,
  };
}
