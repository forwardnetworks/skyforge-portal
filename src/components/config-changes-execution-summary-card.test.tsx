import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfigChangesExecutionSummaryCard } from "./config-changes-execution-summary-card";

function makeRun(overrides: Record<string, unknown> = {}) {
	return {
		id: "run-1",
		status: "failed",
		executionSummary: {
			taskId: 101,
			executionPath: "change-plan",
			plannedExecutionTaskType: "netlab-kne-run",
			verified: false,
			verificationWarnings: [],
			artifactRefs: [],
		},
		...overrides,
	};
}

describe("ConfigChangesExecutionSummaryCard", () => {
	it("renders execution and verification backend fields", () => {
		const run = makeRun({
			executionSummary: {
				taskId: 101,
				executionPath: "change-plan",
				executionBackend: "netlab-kne",
				verificationBackend: "forward",
				verified: false,
				verificationWarnings: [],
				artifactRefs: [],
			},
		});

		render(<ConfigChangesExecutionSummaryCard run={run as never} />);
		expect(screen.getByText("Execution backend")).toBeInTheDocument();
		expect(screen.getByText("netlab-kne")).toBeInTheDocument();
		expect(screen.getByText("Verification backend")).toBeInTheDocument();
		expect(screen.getByText("forward")).toBeInTheDocument();
	});

	it("renders auto-rollback applied outcome", () => {
		const run = makeRun({
			executionSummary: {
				taskId: 101,
				executionPath: "change-plan",
				verified: false,
				verificationWarnings: [],
				artifactRefs: [
					{
						kind: "forward-auto-rollback-status",
						name: "forward/auto-rollback/status",
						key: "outcome=applied;reason=",
					},
				],
			},
		});

		render(<ConfigChangesExecutionSummaryCard run={run as never} />);
		expect(screen.getByText("Auto-rollback outcomes")).toBeInTheDocument();
		expect(screen.getByText("auto-rollback: applied")).toBeInTheDocument();
	});

	it("renders auto-rollback unsupported reason", () => {
		const run = makeRun({
			executionSummary: {
				taskId: 101,
				executionPath: "change-plan",
				verified: false,
				verificationWarnings: [],
				artifactRefs: [
					{
						kind: "forward-auto-rollback-status",
						name: "forward/auto-rollback/status",
						key: "outcome=unsupported;reason=ansible-push",
					},
				],
			},
		});

		render(<ConfigChangesExecutionSummaryCard run={run as never} />);
		expect(screen.getByText("auto-rollback: unsupported")).toBeInTheDocument();
		expect(screen.getByText("Reason: ansible-push")).toBeInTheDocument();
	});

	it("renders auto-rollback failed outcome", () => {
		const run = makeRun({
			executionSummary: {
				taskId: 101,
				executionPath: "change-plan",
				verified: false,
				verificationWarnings: [],
				artifactRefs: [
					{
						kind: "forward-auto-rollback-status",
						name: "forward/auto-rollback/status",
						key: "outcome=failed;reason=verify-failed",
					},
				],
			},
		});

		render(<ConfigChangesExecutionSummaryCard run={run as never} />);
		expect(screen.getByText("auto-rollback: failed")).toBeInTheDocument();
		expect(screen.getByText("Reason: verify-failed")).toBeInTheDocument();
	});
});
