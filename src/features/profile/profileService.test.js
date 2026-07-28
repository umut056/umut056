import { beforeEach, describe, expect, it, vi } from "vitest";

const production = vi.hoisted(() => ({
  isProductionMode: vi.fn(),
  saveProfilePatch: vi.fn(),
}));

vi.mock("../../lib/production.js", () => production);

const { resolveProfilePatch } = await import("./profileService.js");

describe("profileService", () => {
  beforeEach(() => {
    production.isProductionMode.mockReturnValue(false);
    production.saveProfilePatch.mockReset();
  });

  it("merges local profile patches without requiring cloud state", async () => {
    const updated = await resolveProfilePatch({
      user: { id: "client-1", name: "Elif", supabaseToken: "" },
      patch: { phone: "555", coverTheme: "green" },
    });

    expect(updated).toMatchObject({
      id: "client-1",
      name: "Elif",
      phone: "555",
      coverTheme: "green",
    });
    expect(production.saveProfilePatch).not.toHaveBeenCalled();
  });

  it("uses cloud patch in production when id and token are available", async () => {
    production.isProductionMode.mockReturnValue(true);
    production.saveProfilePatch.mockResolvedValue({ name: "Cloud Name", updatedAt: "2026-07-28" });

    const updated = await resolveProfilePatch({
      user: { id: "coach-1", name: "Local Name", supabaseToken: "token" },
      patch: { phone: "555" },
    });

    expect(production.saveProfilePatch).toHaveBeenCalledWith(
      "coach-1",
      expect.objectContaining({ id: "coach-1", phone: "555" }),
      "token",
    );
    expect(updated).toMatchObject({ name: "Cloud Name", phone: "555", updatedAt: "2026-07-28" });
  });

  it("falls back to local patch when cloud profile save fails", async () => {
    production.isProductionMode.mockReturnValue(true);
    production.saveProfilePatch.mockRejectedValue(new Error("network"));

    const updated = await resolveProfilePatch({
      user: { id: "client-1", name: "Elif", supabaseToken: "token" },
      patch: { phone: "555" },
      logLabel: "test-profile",
    });

    expect(updated).toMatchObject({ id: "client-1", name: "Elif", phone: "555" });
  });

  it("does not call cloud patch without a profile id", async () => {
    production.isProductionMode.mockReturnValue(true);

    const updated = await resolveProfilePatch({
      user: { name: "Missing id", supabaseToken: "token" },
      patch: { phone: "555" },
    });

    expect(updated).toMatchObject({ name: "Missing id", phone: "555" });
    expect(production.saveProfilePatch).not.toHaveBeenCalled();
  });
});
