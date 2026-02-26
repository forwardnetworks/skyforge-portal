import { describe, expect, it } from "vitest";
import {
	noOpMessageForDeploymentAction,
	readDeploymentActionMeta,
} from "./deployment-actions";

describe("readDeploymentActionMeta", () => {
	it("normalizes noOp and reason", () => {
		expect(readDeploymentActionMeta({ noOp: 1, reason: " queued " })).toEqual({
			noOp: true,
			reason: "queued",
		});
	});

	it("handles empty input", () => {
		expect(readDeploymentActionMeta({})).toEqual({
			noOp: false,
			reason: "",
		});
	});
});

describe("noOpMessageForDeploymentAction", () => {
	it("returns duplicate/cooldown messages", () => {
		expect(noOpMessageForDeploymentAction("start", "in_flight_duplicate")).toBe(
			"Action already in progress",
		);
		expect(noOpMessageForDeploymentAction("start", "cooldown_suppressed")).toBe(
			"Action suppressed briefly to prevent duplicate jobs",
		);
	});

	it("returns action-specific presence/absence messages", () => {
		expect(noOpMessageForDeploymentAction("create", "already_present")).toBe(
			"Deployment is already active",
		);
		expect(noOpMessageForDeploymentAction("start", "already_present")).toBe(
			"Deployment is already active",
		);
		expect(noOpMessageForDeploymentAction("stop", "already_absent")).toBe(
			"Deployment is already stopped",
		);
		expect(noOpMessageForDeploymentAction("destroy", "already_absent")).toBe(
			"Deployment is already stopped",
		);
	});

	it("falls back to generic message for unknown reasons", () => {
		expect(noOpMessageForDeploymentAction("create", "unknown_reason")).toBe(
			"No action required",
		);
	});
});
