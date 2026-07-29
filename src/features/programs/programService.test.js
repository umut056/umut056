import { describe, expect, it } from "vitest";
import {
  buildAssignedProgramClient,
  buildProgramRemovalState,
  buildProgramSaveState,
  displayProgram,
  editableProgramForCoach,
  normalizeProgramTasksForCycle,
  parseProgramTaskRows,
  programTasksToRows,
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

  it("creates an editable coach-owned copy of a system template", () => {
    const editable = editableProgramForCoach(
      { id: "system-4", name: "4 Temel Program", tasks: [{ title: "Sabah" }] },
      "coach-1",
    );

    expect(editable).toMatchObject({
      id: "cp-coach-1-system-4",
      coachId: "coach-1",
      sourceTemplateId: "system-4",
      variantNote: "Ozel",
    });
  });

  it("serializes and parses editable program task rows", () => {
    const rows = programTasksToRows([
      { title: "Atomlu kahvalti", scheduledTime: "07:15", section: "Kahvalti", note: "500 ml su" },
      { title: "Ogle yemegi", scheduledTime: "12:30", section: "Ana Ogun" },
    ]);
    const parsed = parseProgramTaskRows(rows);

    expect(rows).toContain("Atomlu kahvalti | 07:15 | Kahvalti | 500 ml su");
    expect(parsed[0]).toMatchObject({
      title: "Atomlu kahvalti",
      scheduledTime: "07:15",
      section: "Kahvalti",
      photoRequired: true,
      repeatType: "cycle",
      cycleLength: 5,
      cycleDays: [0, 1, 2],
    });
    expect(parsed[1]).toMatchObject({ title: "Ogle yemegi", scheduledTime: "12:30", repeatType: "daily" });
  });

  it("removes coach programs and unassigns affected clients", () => {
    const state = buildProgramRemovalState({
      program: { id: "custom-1", coachId: "coach-1", name: "Ozel Program" },
      programs: [{ id: "custom-1", coachId: "coach-1" }, { id: "other", coachId: "coach-1" }],
      users: [
        { id: "coach-1", role: "coach" },
        { id: "client-1", role: "client", coachId: "coach-1", programTemplateId: "custom-1", program: "Ozel Program", tasks: [true], compliance: 75 },
      ],
      coachId: "coach-1",
    });

    expect(state.programs.map((program) => program.id)).toEqual(["other"]);
    expect(state.users.find((user) => user.id === "client-1")).toMatchObject({
      program: UNASSIGNED_PROGRAM,
      programTemplateId: "",
      tasks: [],
      pendingToday: 0,
      compliance: 0,
    });
  });

  it("hides system templates for a coach instead of deleting them", () => {
    const state = buildProgramRemovalState({
      program: { id: "system-1", name: "6 Temel Program" },
      programs: [{ id: "system-1" }],
      users: [{ id: "coach-1", role: "coach", hiddenProgramIds: ["old"] }],
      coachId: "coach-1",
    });

    expect(state.programs).toEqual([{ id: "system-1" }]);
    expect(state.users[0].hiddenProgramIds).toEqual(["old", "system-1"]);
  });

  it("saves edited coach programs and refreshes assigned client drafts with video", () => {
    const state = buildProgramSaveState({
      previousProgramId: "custom-1",
      coachId: "coach-1",
      date: "2026-07-22",
      programs: [{ id: "custom-1", coachId: "coach-1", name: "Old Program" }],
      users: [
        { id: "coach-1", role: "coach" },
        {
          id: "client-1",
          role: "client",
          coachId: "coach-1",
          programTemplateId: "custom-1",
          tasks: [true, false],
          compliance: 50,
          programHistory: [],
        },
        {
          id: "client-2",
          role: "client",
          coachId: "coach-2",
          programTemplateId: "custom-1",
          tasks: [true],
        },
      ],
      program: {
        id: "custom-1",
        coachId: "coach-1",
        name: "Updated Program",
        desc: "Updated",
        duration: "30 gun",
        tasks: [
          { title: "Atomlu kahvalti", scheduledTime: "07:15" },
          { title: "Ogle yemegi", scheduledTime: "12:30" },
        ],
        productVideo: { mediaId: "video-1", name: "Kullanim videosu" },
      },
    });

    expect(state.programs).toHaveLength(1);
    expect(state.programs[0].name).toBe("Updated Program");

    const client = state.users.find((user) => user.id === "client-1");
    expect(client.program).toBe("Updated Program");
    expect(client.programDraft.name).toBe("Updated Program");
    expect(client.productVideo).toMatchObject({
      mediaId: "video-1",
      sourceProgramId: "custom-1",
      assignedAt: "2026-07-22",
    });
    expect(client.compliance).toBe(50);

    expect(state.users.find((user) => user.id === "client-2").program).toBeUndefined();
  });
});
