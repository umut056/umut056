import { describe, expect, it } from "vitest";
import { applyCoachProofStatus, createProofReviewLog, getCoachProofActions } from "./proofService.js";

describe("proofService", () => {
  const users = [
    { id: "coach-1", role: "coach", name: "Test Koc" },
    {
      id: "client-1",
      role: "client",
      coachId: "coach-1",
      name: "Elif",
      dailyTasks: {
        "2026-07-28": {
          date: "2026-07-28",
          tasks: [true],
          photoProofs: {
            0: {
              id: "proof-1",
              status: "pending",
              note: "Tarti notu",
              localSavedAt: "2026-07-28T09:00:00.000Z",
            },
          },
          snoozedTasks: {},
        },
      },
    },
    {
      id: "client-2",
      role: "client",
      coachId: "coach-2",
      dailyTasks: {
        "2026-07-28": {
          photoProofs: { 0: { id: "proof-other", status: "pending" } },
        },
      },
    },
  ];

  it("returns only pending proof actions for the selected coach", () => {
    const actions = getCoachProofActions({
      coachId: "coach-1",
      users,
      todayKey: "2026-07-28",
      getTaskPlan: () => [{ title: "Sabah tartisi" }],
    });

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "proof-1",
      idx: 0,
      task: "Sabah tartisi",
      note: "Tarti notu",
      client: expect.objectContaining({ id: "client-1" }),
    });
  });

  it("handles missing users without throwing", () => {
    expect(getCoachProofActions({ coachId: "coach-1", users: null, todayKey: "2026-07-28" })).toEqual([]);
    expect(
      applyCoachProofStatus({
        users: null,
        coachId: "coach-1",
        clientId: "client-1",
        idx: 0,
        status: "approved",
        todayKey: "2026-07-28",
      }).users,
    ).toEqual([]);
  });

  it("applies proof status to root and daily proof copies", () => {
    const result = applyCoachProofStatus({
      users,
      coachId: "coach-1",
      clientId: "client-1",
      idx: 0,
      status: "approved",
      todayKey: "2026-07-28",
      getTaskPlan: () => [{ title: "Sabah tartisi" }],
    });
    const client = result.users.find((user) => user.id === "client-1");

    expect(result.taskTitle).toBe("Sabah tartisi");
    expect(client.photoProofs[0]).toMatchObject({ status: "approved", reviewedBy: "coach-1" });
    expect(client.dailyTasks["2026-07-28"].photoProofs[0]).toMatchObject({
      status: "approved",
      reviewedBy: "coach-1",
    });
  });

  it("dismisses proof actions from the coach queue without deleting proof data", () => {
    const result = applyCoachProofStatus({
      users,
      coachId: "coach-1",
      clientId: "client-1",
      idx: 0,
      status: "dismissed",
      todayKey: "2026-07-28",
    });
    const client = result.users.find((user) => user.id === "client-1");

    expect(client.dailyTasks["2026-07-28"].photoProofs[0]).toMatchObject({
      id: "proof-1",
      status: "pending",
      coachHiddenBy: "coach-1",
    });
    expect(getCoachProofActions({ coachId: "coach-1", users: result.users, todayKey: "2026-07-28" })).toEqual([]);
  });

  it("creates review logs with coach, client, action and task title", () => {
    expect(
      createProofReviewLog({
        coachId: "coach-1",
        clientId: "client-1",
        taskTitle: "Sabah tartisi",
        status: "rejected",
        todayKey: "2026-07-28",
      }),
    ).toMatchObject({
      clientId: "client-1",
      coachId: "coach-1",
      taskTitle: "Sabah tartisi",
      action: "proof_rejected",
      date: "2026-07-28",
    });
  });
});
