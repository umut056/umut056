import { describe, expect, it } from "vitest";
import { mergeCloudUsersWithLocal, mergeMessages, normalizeUsers } from "./workspaceService.js";

const hasAssignedProgram = (client) =>
  !!(
    client?.programDraft ||
    client?.programTemplateId ||
    (client?.program && client.program !== "Program atanmadı" && client.program !== "Program atanmadÄ±")
  );

describe("workspaceService", () => {
  it("keeps local program and body values when a cloud profile has no active assignment data", () => {
    const localUsers = [
      {
        id: "client-1",
        role: "client",
        name: "Elif",
        program: "6 Temel Program",
        programTemplateId: "six-foundation",
        programDraft: { id: "six-foundation", name: "6 Temel Program", tasks: [{ title: "Sabah" }] },
        tasks: [true],
        pendingToday: 0,
        photoPendingToday: 0,
        compliance: 100,
        body: { height: 168, age: 31, gender: "female", start: 72, current: 67.5, target: 63 },
      },
    ];
    const cloudUsers = normalizeUsers([
      {
        id: "client-1",
        role: "client",
        name: "Elif Yilmaz",
        email: "elif@example.com",
      },
    ]);

    const [merged] = mergeCloudUsersWithLocal(cloudUsers, localUsers, { hasAssignedProgram });

    expect(merged.programTemplateId).toBe("six-foundation");
    expect(merged.program).toBe("6 Temel Program");
    expect(merged.body.current).toBe(67.5);
    expect(merged.body.target).toBe(63);
    expect(merged.email).toBe("elif@example.com");
  });

  it("does not reset local daily progress when cloud returns the same assignment without daily state", () => {
    const localUsers = [
      {
        id: "client-1",
        role: "client",
        program: "4 Temel Program",
        programTemplateId: "four-foundation",
        programDraft: { id: "four-foundation", name: "4 Temel Program", tasks: [{ title: "Sabah" }, { title: "Aksam" }] },
        tasks: [true, false],
        pendingToday: 1,
        photoPendingToday: 1,
        missedToday: 0,
        compliance: 50,
        weeklyAverage: 70,
      },
    ];
    const cloudUsers = normalizeUsers([
      {
        id: "client-1",
        role: "client",
        program: "4 Temel Program",
        programTemplateId: "four-foundation",
        programDraft: { id: "four-foundation", name: "4 Temel Program", tasks: [{ title: "Sabah" }, { title: "Aksam" }] },
        tasks: [false, false],
        pendingToday: 2,
        photoPendingToday: 2,
        compliance: 0,
      },
    ]);

    const [merged] = mergeCloudUsersWithLocal(cloudUsers, localUsers, { hasAssignedProgram });

    expect(merged.tasks).toEqual([true, false]);
    expect(merged.pendingToday).toBe(1);
    expect(merged.compliance).toBe(50);
  });

  it("accepts a real cloud program reassignment instead of keeping stale local progress", () => {
    const localUsers = [
      {
        id: "client-1",
        role: "client",
        program: "4 Temel Program",
        programTemplateId: "four-foundation",
        tasks: [true, false],
        pendingToday: 1,
        compliance: 50,
      },
    ];
    const cloudUsers = normalizeUsers([
      {
        id: "client-1",
        role: "client",
        program: "Kilo Alma Programı",
        programTemplateId: "weight-gain",
        programDraft: { id: "weight-gain", name: "Kilo Alma Programı", tasks: [{ title: "Gece Shake" }] },
        tasks: [false],
        pendingToday: 1,
        compliance: 0,
      },
    ]);

    const [merged] = mergeCloudUsersWithLocal(cloudUsers, localUsers, { hasAssignedProgram });

    expect(merged.programTemplateId).toBe("weight-gain");
    expect(merged.tasks).toEqual([false]);
    expect(merged.compliance).toBe(0);
  });

  it("keeps local product videos when cloud has no media rows yet", () => {
    const localVideo = { mediaId: "video-1", name: "Kullanim", url: "blob:local" };
    const localUsers = [
      {
        id: "client-1",
        role: "client",
        productVideo: localVideo,
        productVideoDraft: localVideo,
        productVideos: [localVideo],
      },
    ];
    const cloudUsers = normalizeUsers([{ id: "client-1", role: "client", productVideos: [] }]);

    const [merged] = mergeCloudUsersWithLocal(cloudUsers, localUsers, { hasAssignedProgram });

    expect(merged.productVideo).toEqual(localVideo);
    expect(merged.productVideos).toEqual([localVideo]);
  });

  it("merges cloud and local message metadata without losing read state", () => {
    const merged = mergeMessages(
      [
        {
          id: "m1",
          from: "coach",
          to: "client",
          text: "Merhaba",
          readBy: ["coach"],
          createdAt: 10,
        },
      ],
      [
        {
          id: "m1",
          from: "coach",
          to: "client",
          readBy: ["client"],
          readAt: { client: 100 },
          url: "blob:local-photo",
          createdAt: 10,
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].readBy.sort()).toEqual(["client", "coach"]);
    expect(merged[0].readAt).toEqual({ client: 100 });
    expect(merged[0].text).toBe("Merhaba");
    expect(merged[0].url).toBe("blob:local-photo");
  });
});
