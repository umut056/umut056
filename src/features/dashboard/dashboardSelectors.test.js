import { describe, expect, it } from "vitest";
import { getCoachDashboardSummary, getClientDashboardSummary } from "./dashboardSelectors.js";

describe("dashboardSelectors", () => {
  it("summarizes coach clients and active work", () => {
    const users = [
      { id: "coach-1", role: "coach" },
      { id: "client-1", role: "client", coachId: "coach-1", compliance: 80 },
      { id: "client-2", role: "client", coachId: "coach-1", compliance: 60 },
      { id: "client-3", role: "client", coachId: "coach-2", compliance: 100 },
    ];

    const summary = getCoachDashboardSummary({
      coach: { id: "coach-1" },
      users,
      hasAssignedProgram: (client) => client.id !== "client-2",
      currentPendingCount: () => 3,
      coachProofActions: () => [{ id: "proof-1" }],
      isRiskClient: (client) => client.id === "client-2",
    });

    expect(summary.clients).toHaveLength(2);
    expect(summary.assignedClients).toHaveLength(1);
    expect(summary.avg).toBe(80);
    expect(summary.activeTasks).toBe(3);
    expect(summary.photoPending).toBe(1);
    expect(summary.riskClients.map((client) => client.id)).toEqual(["client-2"]);
  });

  it("summarizes client progress without undefined weight values", () => {
    const summary = getClientDashboardSummary({
      client: { body: { start: 72, current: 67.5, target: 63 } },
      taskPlan: [{ title: "A" }, { title: "B" }],
      dailyState: { tasks: [true, false] },
      clientStartAt: () => "2026-07-20",
    });

    expect(summary.done).toBe(1);
    expect(summary.pct).toBe(50);
    expect(summary.body.start).toBe(72);
    expect(summary.body.current).toBe(67.5);
    expect(summary.delta).toBe(4.5);
    expect(summary.deltaLabel).toBe("4.5");
  });
});

