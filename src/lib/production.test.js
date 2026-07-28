import { describe, expect, it } from "vitest";
import { mapCloudMessage, mapCloudProgramTask, serializeProgramTaskForCloud } from "./production.js";

describe("production program task mapping", () => {
  it("maps cloud cycle metadata back into app tasks", () => {
    expect(
      mapCloudProgramTask({
        id: "task-1",
        title: "Atomlu kahvalti karisimi",
        task_type: "meal",
        scheduled_time: "07:15:00",
        photo_required: true,
        snooze_enabled: true,
        snooze_options: [15, 30],
        repeat_type: "cycle",
        repeat_days: [],
        cycle_length: 5,
        cycle_days: [0, 1, 2],
      }),
    ).toMatchObject({
      id: "task-1",
      title: "Atomlu kahvalti karisimi",
      type: "meal",
      scheduledTime: "07:15",
      repeatType: "cycle",
      cycleLength: 5,
      cycleDays: [0, 1, 2],
    });
  });

  it("serializes app cycle tasks for Supabase without losing repeat metadata", () => {
    expect(
      serializeProgramTaskForCloud(
        "program-1",
        {
          title: "Atomsuz kahvalti karisimi",
          section: "Kahvalti",
          type: "meal",
          scheduledTime: "07:15",
          repeatType: "cycle",
          cycleLength: 5,
          cycleDays: [3, 4],
        },
        2,
      ),
    ).toMatchObject({
      program_id: "program-1",
      title: "Atomsuz kahvalti karisimi",
      section: "Kahvalti",
      scheduled_time: "07:15",
      repeat_type: "cycle",
      cycle_length: 5,
      cycle_days: [3, 4],
      sort_order: 2,
    });
  });
});

describe("production message mapping", () => {
  it("keeps sender names from cloud messages for unread previews", () => {
    expect(
      mapCloudMessage({
        id: "message-1",
        sender_id: "client-1",
        receiver_id: "coach-1",
        sender_name: "Elif Yılmaz",
        message_type: "text",
        text: "Merhaba",
        read_by: ["client-1"],
        created_at: "2026-07-28T10:15:00.000Z",
      }),
    ).toMatchObject({
      id: "message-1",
      from: "client-1",
      to: "coach-1",
      senderName: "Elif Yılmaz",
      text: "Merhaba",
    });
  });
});
