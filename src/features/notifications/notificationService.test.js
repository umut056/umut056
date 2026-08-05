import { describe, expect, it } from "vitest";
import {
  coachActionInbox,
  markMessagesRead,
  unreadConversationDetail,
  unreadConversationHeadline,
  unreadConversationSummaries,
  unreadCount,
  unreadCountFrom,
  unreadMessageBadge,
  unreadMessagesFor,
} from "./notificationService.js";

describe("notificationService unread messages", () => {
  const messages = [
    { id: "read", from: "client-1", to: "coach-1", text: "Okundu", readBy: ["coach-1"], createdAt: 1, time: "09:00" },
    { id: "a", from: "client-1", to: "coach-1", text: "Merhaba", readBy: [], createdAt: 10, time: "10:00" },
    { id: "b", from: "client-2", to: "coach-1", kind: "audio", text: "", senderName: "Elif Yilmaz", readBy: [], createdAt: 20, time: "10:05" },
    { id: "c", from: "client-1", to: "coach-1", text: "Kontrol eder misin?", readBy: [], createdAt: 30, time: "10:10" },
    { id: "other", from: "coach-1", to: "client-1", text: "Yanlis yon", readBy: [], createdAt: 40, time: "10:15" },
  ];

  it("counts unread messages globally and per sender", () => {
    expect(unreadMessagesFor(messages, "coach-1").map((message) => message.id)).toEqual(["a", "b", "c"]);
    expect(unreadCount(messages, { id: "coach-1" })).toBe(3);
    expect(unreadCountFrom(messages, "coach-1", "client-1")).toBe(2);
  });

  it("groups unread messages by sender with last preview metadata", () => {
    const summaries = unreadConversationSummaries(
      messages,
      "coach-1",
      [{ id: "client-1", name: "Mert Demir" }],
      (message) => (message.kind === "audio" ? "Sesli mesaj" : message.text || "Mesaj"),
    );

    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({
      senderId: "client-1",
      senderName: "Mert Demir",
      count: 2,
      lastText: "Kontrol eder misin?",
      lastTime: "10:10",
    });
    expect(summaries[1]).toMatchObject({
      senderId: "client-2",
      senderName: "Elif Yilmaz",
      count: 1,
      lastText: "Sesli mesaj",
    });
  });

  it("builds a readable unread badge summary for coach navigation", () => {
    expect(
      unreadMessageBadge(messages, "coach-1", [
        { id: "client-1", name: "Mert Demir" },
        { id: "client-2", name: "Elif Yilmaz" },
      ]),
    ).toEqual({
      total: 3,
      senderCount: 2,
      topSenderId: "client-1",
      topSenderName: "Mert Demir",
      label: "2 kişi · 3 mesaj",
    });

    expect(
      unreadMessageBadge(
        messages.filter((message) => message.from !== "client-2"),
        "coach-1",
        [{ id: "client-1", name: "Mert Demir" }],
      ),
    ).toMatchObject({
      total: 2,
      senderCount: 1,
      topSenderName: "Mert Demir",
      label: "Mert Demir: 2",
    });
  });

  it("formats unread conversation headline and detail with sender counts", () => {
    const summaries = unreadConversationSummaries(
      messages,
      "coach-1",
      [
        { id: "client-1", name: "Mert Demir" },
        { id: "client-2", name: "Elif Yilmaz" },
      ],
      (message) => (message.kind === "audio" ? "Sesli mesaj" : message.text || "Mesaj"),
    );

    expect(unreadConversationHeadline(summaries)).toBe("2 danışandan 3 yeni mesaj");
    expect(unreadConversationDetail(summaries)).toBe("Mert Demir (2) · Elif Yilmaz (1)");

    expect(unreadConversationHeadline([summaries[0]])).toBe("Mert Demir · 2 yeni mesaj");
    expect(unreadConversationDetail([summaries[0]])).toBe("Kontrol eder misin?");
  });

  it("marks unread messages read without touching other conversations", () => {
    const result = markMessagesRead(messages, "coach-1", "client-1");

    expect(result.changed).toBe(true);
    expect(result.messages.find((message) => message.id === "a").readBy).toContain("coach-1");
    expect(result.messages.find((message) => message.id === "b").readBy).not.toContain("coach-1");
  });

  it("builds a coach action inbox from proofs, unread messages and appointments", () => {
    const inbox = coachActionInbox({
      coachId: "coach-1",
      users: [
        { id: "coach-1", role: "coach", name: "Test Koc" },
        { id: "client-1", role: "client", name: "Elif" },
        { id: "client-2", role: "client", name: "Mert" },
      ],
      messages: [
        {
          id: "m1",
          from: "client-1",
          to: "coach-1",
          text: "Merhaba",
          time: "09:00",
          createdAt: 1,
          readBy: [],
        },
        {
          id: "m2",
          from: "client-1",
          to: "coach-1",
          text: "Foto attim",
          time: "09:02",
          createdAt: 2,
          readBy: [],
        },
      ],
      proofActions: [
        {
          id: "p1",
          client: { id: "client-2", name: "Mert" },
          task: "Sabah tartisi",
          note: "Tarti net",
          time: "08:00",
        },
      ],
      appointments: [
        {
          id: "s1",
          coachId: "coach-1",
          clientId: "client-1",
          status: "pending",
          date: "2026-07-28",
          time: "14:00",
        },
      ],
    });

    expect(inbox.map((item) => item.type)).toEqual(["proof", "message", "appointment"]);
    expect(inbox[0]).toMatchObject({
      clientName: "Mert",
      title: "Mert fotoğraf gönderdi",
      text: "Sabah tartisi · Tarti net",
    });
    expect(inbox[1]).toMatchObject({
      clientName: "Elif",
      count: 2,
      text: "2 okunmamış mesaj · Foto attim",
    });
    expect(inbox[2].text).toContain("Elif");
  });

  it("can keep coach action inbox free of message items", () => {
    const inbox = coachActionInbox({
      coachId: "coach-1",
      includeMessages: false,
      users: [
        { id: "coach-1", role: "coach", name: "Test Koc" },
        { id: "client-1", role: "client", name: "Elif" },
      ],
      messages: [{ id: "m1", from: "client-1", to: "coach-1", text: "Merhaba", readBy: [] }],
      proofActions: [{ id: "p1", client: { id: "client-1", name: "Elif" }, task: "Sabah tartisi" }],
    });

    expect(inbox.map((item) => item.type)).toEqual(["proof"]);
  });
});
