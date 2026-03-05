import { describe, expect, it } from "vitest";
import { getSessionExpiryWarning } from "./session-expiry";

describe("getSessionExpiryWarning", () => {
	it("returns null when expiry is missing or invalid", () => {
		expect(getSessionExpiryWarning({})).toBeNull();
		expect(getSessionExpiryWarning({ expiresAt: "not-a-date" })).toBeNull();
	});

	it("returns warning details inside warning window", () => {
		const nowMs = Date.parse("2026-01-01T00:00:00Z");
		const expiresAt = "2026-01-01T00:12:00Z";
		expect(
			getSessionExpiryWarning(
				{ expiresAt },
				{ nowMs, warningWindowMs: 15 * 60_000 },
			),
		).toEqual({
			expiresAt,
			minutesRemaining: 12,
		});
	});

	it("returns null when expiry is outside warning window or already expired", () => {
		const nowMs = Date.parse("2026-01-01T00:00:00Z");
		expect(
			getSessionExpiryWarning(
				{ expiresAt: "2026-01-01T00:20:00Z" },
				{ nowMs, warningWindowMs: 15 * 60_000 },
			),
		).toBeNull();
		expect(
			getSessionExpiryWarning(
				{ expiresAt: "2025-12-31T23:59:59Z" },
				{ nowMs, warningWindowMs: 15 * 60_000 },
			),
		).toBeNull();
	});
});
