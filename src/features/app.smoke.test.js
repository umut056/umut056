import { describe, expect, it } from "vitest";
import { getClientDashboardSummary, getCoachDashboardSummary } from "./dashboard/dashboardSelectors.js";
import { buildAssignedProgramClient } from "./programs/programService.js";
import { dailyStateFor, mergeDailyUser } from "./tasks/dailyTaskService.js";
import { conversationBetween } from "./messages/messageService.js";

describe("critical app smoke flows", () => {
  it("keeps program assignment, daily tasks, dashboard and messaging in sync", () => {
    const coach = { id: "coach-1", role: "coach", name: "Test Koc" };
    const client = { id: "client-1", role: "client", coachId: coach.id, name: "Test Danisan" };
    const program = {
      id: "program-1",
      name: "4 Temel Program",
      desc: "Program",
      duration: 30,
      tasks: [{ title: "Sabah tartisi", photoRequired: true }, { title: "Kahvalti" }],
      bannedFoods: [],
    };

    const assignedClient = buildAssignedProgramClient({
      client,
      template: program,
      activeTasks: program.tasks,
      date: "2026-07-22",
    });
    const state = dailyStateFor(assignedClient, program.tasks, "2026-07-22");
    const completedClient = mergeDailyUser(assignedClient, program.tasks, {
      ...state,
      tasks: [true, false],
    });

    const coachSummary = getCoachDashboardSummary({
      coach,
      users: [coach, completedClient],
      hasAssignedProgram: () => true,
      currentPendingCount: (user) => user.pendingToday,
      coachProofActions: () => [],
      isRiskClient: () => false,
    });
    const clientSummary = getClientDashboardSummary({
      client: completedClient,
      taskPlan: program.tasks,
      dailyState: completedClient.dailyTasks["2026-07-22"],
      clientStartAt: () => "2026-07-22",
    });
    const messages = conversationBetween(
      [
        { from: coach.id, to: client.id, text: "Merhaba" },
        { from: client.id, to: coach.id, text: "Tamam" },
      ],
      coach.id,
      client.id,
    );

    expect(completedClient.program).toBe("4 Temel Program");
    expect(completedClient.pendingToday).toBe(1);
    expect(coachSummary.clients).toHaveLength(1);
    expect(coachSummary.activeTasks).toBe(1);
    expect(clientSummary.pct).toBe(50);
    expect(messages).toHaveLength(2);
  });
});

