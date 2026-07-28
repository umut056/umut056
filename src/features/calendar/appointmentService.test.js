import { describe, expect, it, vi } from "vitest";
import {
  applySessionPatch,
  buildClientSessionRequest,
  buildCoachSession,
  clientSessionConfirmedNotice,
  clientSessionRequestNotice,
  coachCreatedSessionNotice,
  coachSessionNotice,
  sessionsForClient,
  sessionsForCoach,
  sessionsForDate,
  todayIsoDate,
  weekDateItems,
} from "./appointmentService.js";

describe("appointmentService", () => {
  const sessions = [
    { id: "s1", coachId: "coach-1", clientId: "client-1", date: "2026-07-28", time: "10:00" },
    { id: "s2", coachId: "coach-1", clientId: "client-2", date: "2026-07-29", time: "11:00" },
    { id: "s3", coachId: "coach-2", clientId: "client-1", date: "2026-07-28", time: "12:00" },
  ];

  it("filters sessions by coach, client and date without throwing on missing arrays", () => {
    expect(sessionsForCoach(sessions, "coach-1").map((session) => session.id)).toEqual(["s1", "s2"]);
    expect(sessionsForClient(sessions, "client-1").map((session) => session.id)).toEqual(["s1", "s3"]);
    expect(sessionsForDate(sessions, "2026-07-28").map((session) => session.id)).toEqual(["s1", "s3"]);

    expect(sessionsForCoach(null, "coach-1")).toEqual([]);
    expect(sessionsForClient(null, "client-1")).toEqual([]);
    expect(sessionsForDate(null, "2026-07-28")).toEqual([]);
  });

  it("patches an existing session safely", () => {
    const result = applySessionPatch(sessions, "s1", { status: "confirmed" });

    expect(result.current).toMatchObject({ id: "s1" });
    expect(result.updated).toMatchObject({ id: "s1", status: "confirmed" });
    expect(result.sessions.find((session) => session.id === "s1")).toMatchObject({ status: "confirmed" });
  });

  it("returns an empty patch result for missing session arrays", () => {
    expect(applySessionPatch(null, "s1", { status: "confirmed" })).toEqual({
      current: undefined,
      updated: { status: "confirmed" },
      sessions: [],
    });
  });

  it("builds coach-created and client-requested sessions with defaults", () => {
    vi.spyOn(Date, "now").mockReturnValue(123);

    expect(buildCoachSession({ coachId: "coach-1", form: { clientId: "client-1", date: "2026-07-28" } })).toMatchObject({
      id: "s123",
      coachId: "coach-1",
      clientId: "client-1",
      type: "Görüşme",
      time: "10:00",
      duration: "30 dk",
      status: "confirmed",
      decidedBy: "coach",
    });

    expect(
      buildClientSessionRequest({
        coachId: "coach-1",
        clientId: "client-1",
        request: { date: "2026-07-28" },
      }),
    ).toMatchObject({
      id: "s123",
      type: "Görüşme talebi",
      status: "pending",
      requestedBy: "client",
    });

    vi.restoreAllMocks();
  });

  it("formats Turkish appointment notices", () => {
    const session = { clientId: "client-1", date: "2026-07-28", time: "14:00" };

    expect(coachSessionNotice(session, { status: "confirmed" })).toBe("Randevun onaylandı: 2026-07-28 14:00");
    expect(coachSessionNotice(session, { status: "proposed" })).toBe("Koçun yeni randevu saati önerdi: 2026-07-28 14:00");
    expect(clientSessionConfirmedNotice("Elif", session)).toBe("Elif randevu saatini onayladı: 2026-07-28 14:00");
    expect(clientSessionRequestNotice("Elif", session)).toBe("Elif randevu talep etti: 2026-07-28 14:00");
    expect(coachCreatedSessionNotice(session)).toBe("Koçun randevu saatini belirledi: 2026-07-28 14:00");
  });

  it("creates calendar helper dates", () => {
    const base = new Date("2026-07-29T12:00:00");

    expect(todayIsoDate(base)).toBe("2026-07-29");
    expect(weekDateItems(base)).toHaveLength(7);
    expect(weekDateItems(base)[0].iso).toBe("2026-07-27");
  });
});
