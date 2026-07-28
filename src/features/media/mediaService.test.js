import { beforeEach, describe, expect, it, vi } from "vitest";

const production = vi.hoisted(() => ({
  supabaseStorageSignedUrl: vi.fn(),
  uploadMediaFile: vi.fn(),
}));

const session = vi.hoisted(() => ({
  storedSession: vi.fn(),
}));

vi.mock("../../lib/production.js", () => production);
vi.mock("../../lib/session.js", () => session);

const { MediaStore, mediaCloudUrl, persistMedia } = await import("./mediaService.js");

describe("mediaService", () => {
  beforeEach(() => {
    production.supabaseStorageSignedUrl.mockReset();
    production.uploadMediaFile.mockReset();
    session.storedSession.mockReset();
    vi.spyOn(MediaStore, "put").mockResolvedValue(undefined);
  });

  it("persists media locally before returning uploaded cloud metadata", async () => {
    production.uploadMediaFile.mockResolvedValue({
      url: "https://cdn.example/photo.jpg",
      storageBucket: "stepwise-media",
      storagePath: "owner/photo.jpg",
    });
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

    const result = await persistMedia({
      id: "media-1",
      file,
      mediaType: "task_photo",
      owner: { id: "client-1", supabaseToken: "token" },
      clientId: "client-1",
    });

    expect(MediaStore.put).toHaveBeenCalledWith("media-1", file);
    expect(production.uploadMediaFile).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        token: "token",
        ownerId: "client-1",
        clientId: "client-1",
        mediaType: "task_photo",
        fileName: "photo.jpg",
      }),
    );
    expect(result).toMatchObject({
      mediaId: "media-1",
      mediaType: "task_photo",
      name: "photo.jpg",
      type: "image/jpeg",
      url: "https://cdn.example/photo.jpg",
      cloudStatus: "uploaded",
    });
  });

  it("keeps local metadata when cloud upload fails", async () => {
    production.uploadMediaFile.mockRejectedValue(new Error("offline"));
    const file = new File(["x"], "voice.webm", { type: "audio/webm" });

    const result = await persistMedia({
      id: "media-2",
      file,
      mediaType: "message_audio",
      owner: { id: "client-1", supabaseToken: "token" },
    });

    expect(result).toMatchObject({
      mediaId: "media-2",
      mediaType: "message_audio",
      name: "voice.webm",
      cloudStatus: "local_saved",
    });
  });

  it("returns empty media cloud url without a storage path", async () => {
    expect(await mediaCloudUrl({ url: "https://old.example/file.jpg" })).toBe("");
  });

  it("falls back to cached media url when no session token exists", async () => {
    session.storedSession.mockReturnValue("{}");

    expect(await mediaCloudUrl({ storagePath: "owner/file.jpg", url: "https://old.example/file.jpg" })).toBe(
      "https://old.example/file.jpg",
    );
    expect(production.supabaseStorageSignedUrl).not.toHaveBeenCalled();
  });

  it("refreshes cloud media url with the stored session token", async () => {
    session.storedSession.mockReturnValue(JSON.stringify({ supabaseToken: "token" }));
    production.supabaseStorageSignedUrl.mockResolvedValue("https://signed.example/file.jpg");

    await expect(
      mediaCloudUrl({
        storageBucket: "stepwise-media",
        storagePath: "owner/file.jpg",
        url: "https://old.example/file.jpg",
      }),
    ).resolves.toBe("https://signed.example/file.jpg");
  });

  it("falls back to cached media url when signed url refresh fails", async () => {
    session.storedSession.mockReturnValue(JSON.stringify({ supabaseToken: "token" }));
    production.supabaseStorageSignedUrl.mockRejectedValue(new Error("expired"));

    await expect(
      mediaCloudUrl({
        storageBucket: "stepwise-media",
        storagePath: "owner/file.jpg",
        url: "https://old.example/file.jpg",
      }),
    ).resolves.toBe("https://old.example/file.jpg");
  });
});
