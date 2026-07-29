import { describe, expect, it } from "vitest";
import {
  getCoachDashboardSummary,
  getCoachV2Snapshot,
  getClientDashboardSummary,
  getClientWellnessSnapshot,
} from "./dashboardSelectors.js";

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

  it("can calculate coach average from the current daily state instead of stale client compliance", () => {
    const summary = getCoachDashboardSummary({
      coach: { id: "coach-1" },
      users: [
        { id: "coach-1", role: "coach" },
        { id: "client-1", role: "client", coachId: "coach-1", compliance: 80 },
      ],
      hasAssignedProgram: () => true,
      currentPendingCount: () => 2,
      currentCompliance: () => 0,
      coachProofActions: () => [],
      isRiskClient: () => false,
    });

    expect(summary.avg).toBe(0);
    expect(summary.activeTasks).toBe(2);
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

  it("derives a V2 wellness snapshot from existing client data", () => {
    const snapshot = getClientWellnessSnapshot({
      client: {
        compliance: 80,
        streakDays: 5,
        body: { start: 72, current: 67.5, target: 63, water: 52 },
      },
      taskPlan: [{ title: "A" }, { title: "B" }],
      dailyState: { tasks: [true, false] },
    });

    expect(snapshot.healthScore).toBeGreaterThan(0);
    expect(snapshot.modules.map((module) => module.id)).toEqual([
      "nutrition",
      "water",
      "activity",
      "progress",
    ]);
    expect(snapshot.actionCards.map((card) => card.id)).toEqual([
      "ai-coach",
      "nutrition",
      "body",
      "hydration",
      "activity",
      "products",
    ]);
    expect(snapshot.aiInsight).toContain("Bugün");
  });

  it("derives a V2 coach command snapshot from existing coach summary data", () => {
    const snapshot = getCoachV2Snapshot({
      clients: [{ id: "client-1", name: "Elif Yılmaz" }],
      avg: 73,
      activeTasks: 10,
      proofActions: [{ id: "proof-1" }],
      riskClients: [],
    });

    expect(snapshot.healthScore).toBeGreaterThan(0);
    expect(snapshot.focusItems).toHaveLength(3);
    expect(snapshot.proofLoad).toBe(1);
  });
});
