import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigChangesQueueCard } from "./config-changes-queue-card";

function makePage(overrides: Record<string, unknown> = {}) {
	return {
		isAdmin: true,
		listQ: { isLoading: false },
		runs: [
			{
				id: "run-a",
				summary: "Run A",
				targetType: "deployment",
				targetRef: "dep-a",
				sourceKind: "change-plan",
				status: "failed",
				executionMode: "apply",
				executionSummary: {
					artifactRefs: [
						{
							kind: "forward-auto-rollback-status",
							key: "outcome=failed;reason=rollback-error",
						},
					],
				},
			},
			{
				id: "run-b",
				summary: "Run B",
				targetType: "deployment",
				targetRef: "dep-b",
				sourceKind: "change-plan",
				status: "rolled-back",
				executionMode: "apply",
				executionSummary: {
					artifactRefs: [
						{
							kind: "forward-auto-rollback-status",
							key: "outcome=applied;reason=",
						},
					],
				},
			},
			{
				id: "run-c",
				summary: "Run C",
				targetType: "deployment",
				targetRef: "dep-c",
				sourceKind: "change-plan",
				status: "approved",
				executionMode: "apply",
				reviewJson:
					'{"artifactRefs":[{"kind":"forward-auto-rollback","key":"requested;eligibility=eligible"}]}',
			},
			{
				id: "run-d",
				summary: "Run D",
				targetType: "deployment",
				targetRef: "dep-d",
				sourceKind: "change-plan",
				status: "approved",
				executionMode: "apply",
				reviewJson:
					'{"artifactRefs":[{"kind":"forward-auto-rollback","key":"requested;eligibility=unsupported;backend=ansible-push"}]}',
			},
		],
		selectedRunId: "run-a",
		setSelectedRunId: vi.fn(),
		...overrides,
	};
}

describe("ConfigChangesQueueCard", () => {
	it("shows auto-rollback filter counts", () => {
		render(<ConfigChangesQueueCard page={makePage() as never} />);
		expect(screen.getByText("auto-rollback: all (4)")).toBeInTheDocument();
		expect(screen.getByText("auto-rollback: requested (2)")).toBeInTheDocument();
		expect(screen.getByText("auto-rollback: failed (1)")).toBeInTheDocument();
		expect(screen.getByText("auto-rollback: none (0)")).toBeInTheDocument();
		expect(screen.getByText("Showing 4 of 4 runs")).toBeInTheDocument();
	});

	it("shows auto-rollback badges in queue rows", () => {
		render(<ConfigChangesQueueCard page={makePage() as never} />);
		expect(screen.getAllByText("auto-rollback: failed").length).toBeGreaterThan(0);
		expect(screen.getAllByText("auto-rollback: applied").length).toBeGreaterThan(0);
		expect(
			screen.getAllByText("auto-rollback: requested (eligible)").length,
		).toBeGreaterThan(0);
	});

	it("filters runs by auto-rollback outcome", () => {
		render(<ConfigChangesQueueCard page={makePage() as never} />);
		fireEvent.click(
			screen.getByRole("button", { name: "filter auto-rollback: failed" }),
		);
		expect(screen.getByText("Run A")).toBeInTheDocument();
		expect(screen.queryByText("Run B")).not.toBeInTheDocument();
		expect(screen.getByText("Showing 1 of 4 runs")).toBeInTheDocument();
	});

	it("filters runs by auto-rollback requested state", () => {
		render(<ConfigChangesQueueCard page={makePage() as never} />);
		fireEvent.click(
			screen.getByRole("button", { name: "filter auto-rollback: requested" }),
		);
		expect(screen.getByText("Run C")).toBeInTheDocument();
		expect(screen.getByText("Run D")).toBeInTheDocument();
		expect(screen.queryByText("Run A")).not.toBeInTheDocument();
		expect(screen.queryByText("Run B")).not.toBeInTheDocument();
	});

  it("filters runs by requested-unsupported state", () => {
		render(<ConfigChangesQueueCard page={makePage() as never} />);
		fireEvent.click(
			screen.getByRole("button", {
				name: "filter auto-rollback: requested-unsupported",
			}),
		);
    expect(screen.getByText("Run D")).toBeInTheDocument();
    expect(screen.getByText("backend: ansible-push")).toBeInTheDocument();
    expect(screen.queryByText("Run C")).not.toBeInTheDocument();
		expect(screen.queryByText("Run A")).not.toBeInTheDocument();
		expect(screen.queryByText("Run B")).not.toBeInTheDocument();
	});
});
