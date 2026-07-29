import { describe, expect, it } from "vitest";
import {
  averageCompliance,
  clientsByCompliance,
  clientsByMonthlyScore,
  clientProgressBody,
  coachReportClients,
  recentTaskLogsForClients,
  riskClients,
  totalLostWeight,
} from "./reportSelectors.js";

describe("reportSelectors", () => {
  it("handles missing report data without throwing", () => {
    expect(coachReportClients(null, "coach-1")).toEqual([]);
    expect(averageCompliance(null)).toBe(0);
    expect(totalLostWeight(null)).toBe(0);
    expect(riskClients(null, null)).toEqual([]);
    expect(recentTaskLogsForClients(null, null)).toEqual([]);
    expect(clientsByCompliance(null)).toEqual([]);
    expect(clientsByMonthlyScore(null)).toEqual([]);
  });

  it("normalizes client progress body values for empty progress screens", () => {
    const body = clientProgressBody({
      start: "72",
      current: undefined,
      target: "bad",
      waist: "84.5",
      gender: "",
      ideal: "",
    });

    expect(body.start).toBe(72);
    expect(body.current).toBe(0);
    expect(body.target).toBe(0);
    expect(body.waist).toBe(84.5);
    expect(body.gender).toBe("female");
    expect(body.ideal).toBe("-");
  });

  it("summarizes coach report clients from mixed workspace users", () => {
    const users = [
      { id: "coach-1", role: "coach" },
      { id: "client-1", role: "client", coachId: "coach-1", compliance: 80, weeklyAverage: 70, body: { start: 72, current: 68 } },
      { id: "client-2", role: "client", coachId: "coach-1", compliance: 40, weeklyAverage: 50, body: { start: 80, current: 82 } },
      { id: "client-3", role: "client", coachId: "coach-2", compliance: 100 },
    ];

    const clients = coachReportClients(users, "coach-1");

    expect(clients.map((client) => client.id)).toEqual(["client-1", "client-2"]);
    expect(averageCompliance(clients)).toBe(60);
    expect(totalLostWeight(clients)).toBe(4);
    expect(clientsByCompliance(clients).map((client) => client.id)).toEqual(["client-1", "client-2"]);
    expect(clientsByMonthlyScore(clients).map((client) => client.id)).toEqual(["client-1", "client-2"]);
  });

  it("keeps risk and task log selectors scoped to the coach clients", () => {
    const clients = [{ id: "client-1", missedToday: 0 }, { id: "client-2", missedToday: 2 }];
    const logs = [
      { id: "log-1", clientId: "client-1" },
      { id: "log-2", clientId: "client-3" },
      { id: "log-3", clientId: "client-2" },
    ];

    expect(riskClients(clients, (client) => client.missedToday > 0).map((client) => client.id)).toEqual(["client-2"]);
    expect(recentTaskLogsForClients(logs, clients).map((log) => log.id)).toEqual(["log-1", "log-3"]);
  });
});
