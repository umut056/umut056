import { describe, expect, it } from "vitest";
import { conversationBetween, messagePreviewText, roomMessages } from "./messageService.js";

describe("messageService", () => {
  it("returns only messages between two users", () => {
    const messages = [
      { id: "1", from: "coach", to: "client" },
      { id: "2", from: "client", to: "coach" },
      { id: "3", from: "other", to: "coach" },
    ];

    expect(conversationBetween(messages, "coach", "client").map((message) => message.id)).toEqual(["1", "2"]);
  });

  it("sorts room messages by creation time", () => {
    const messages = [
      { id: "late", room: "coaches", createdAt: 20 },
      { id: "early", room: "coaches", createdAt: 10 },
      { id: "other", room: "clients", createdAt: 1 },
    ];

    expect(roomMessages(messages, "coaches").map((message) => message.id)).toEqual(["early", "late"]);
  });

  it("uses stable previews for media messages", () => {
    expect(messagePreviewText({ kind: "photo" })).toBe("Fotoğraf");
    expect(messagePreviewText({ kind: "audio" })).toBe("Sesli mesaj");
    expect(messagePreviewText({ text: "Merhaba" })).toBe("Merhaba");
  });
});
