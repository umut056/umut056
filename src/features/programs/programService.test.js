import { describe, expect, it } from "vitest";
import {
  buildAssignedProgramClient,
  displayProgram,
  normalizeProgramTasksForCycle,
  programVideoForAssignment,
  uniquePrograms,
  UNASSIGNED_PROGRAM,
} from "./programService.js";

describe("programService", () => {
  it("deduplicates programs by coach and normalized name", () => {
    const programs = [
      { id: "p1", coachId: "coach-1", name: "4 Temel Program" },
      { id: "p2", coachId: "coach-1", name: " 4 temel program " },
      { id: "p3", coachId: "coach-2", name: "4 Temel Program" },
    ];

    expect(uniquePrograms(programs).map((program) => program.id)).toEqual(["p1", "p3"]);
  });

  it("shows an unassigned label when a client has no program", () => {
    expect(displayProgram({ client: {}, templates: [] })).toBe(UNASSIGNED_PROGRAM);
  });

  it("builds an assigned client without carrying stale daily task completion", () => {
    const client = {
      id: "client-1",
      tasks: [true, true],
      programHistory: [{ name: "Old", date: "2026-07-01" }],
    };
    const template = {
      id: "program-1",
      name: "6 Temel Program",
      desc: "Program aciklamasi",
      duration: 30,
      tasks: [{ title: "Sabah" }, { title: "Aksam" }],
      bannedFoods: ["Seker"],
    };

    const assigned = buildAssignedProgramClient({
      client,
      template,
      activeTasks: template.tasks,
      date: "2026-07-22",
    });

    expect(assigned.program).toBe("6 Temel Program");
    expect(assigned.programTemplateId).toBe("program-1");
    expect(assigned.tasks).toEqual([false, false]);
    expect(assigned.pendingToday).toBe(2);
    expect(assigned.compliance).toBe(0);
    expect(assigned.programHistory[0].name).toBe("6 Temel Program");
  });

  it("normalizes atomlu and atomsuz tasks into a five day cycle", () => {
    const normalized = normalizeProgramTasksForCycle([
      { title: "Atomlu kahvalti karisimi" },
      { title: "Atomsuz kahvalti karisimi" },
      { title: "Ogle yemegi" },
    ]);

    expect(normalized[0]).toMatchObject({ repeatType: "cycle", cycleLength: 5, cycleDays: [0, 1, 2] });
    expect(normalized[1]).toMatchObject({ repeatType: "cycle", cycleLength: 5, cycleDays: [3, 4] });
    expect(normalized[2].repeatType).toBeUndefined();
  });

  it("attaches program videos to assigned program history", () => {
    const video = programVideoForAssignment(
      { id: "program-1", name: "Video Program", productVideo: { mediaId: "media-1" } },
      "2026-07-22",
    );

    expect(video).toMatchObject({
      mediaId: "media-1",
      assignedAt: "2026-07-22",
      sourceProgramId: "program-1",
      sourceProgramName: "Video Program",
    });
  });
});

