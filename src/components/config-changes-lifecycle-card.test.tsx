import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfigChangesLifecycleCard } from "./config-changes-lifecycle-card";

function makePage(overrides: Record<string, unknown> = {}) {
	return {
		lifecycleQ: {
			isLoading: false,
			data: {
				events: [
					{
						id: "e1",
						eventType: "change-run.status",
						status: "failed",
						message: "verification failed",
						details: { taskId: "10", autoRollback: "failed" },
						createdAt: "2026-03-13T10:00:00Z",
					},
				],
			},
		},
		selectedRun: {
			executionSummary: {
				artifactRefs: [
					{
						kind: "forward-auto-rollback-status",
						name: "forward/auto-rollback/status",
						key: "outcome=failed;reason=rollback-error",
					},
				],
			},
		},
		...overrides,
	};
}

describe("ConfigChangesLifecycleCard", () => {
	it("renders auto-rollback summary with correlated lifecycle event", () => {
		render(<ConfigChangesLifecycleCard page={makePage() as never} />);
		expect(screen.getByText("Auto-rollback summary")).toBeInTheDocument();
		expect(screen.getByText("auto-rollback: failed")).toBeInTheDocument();
		expect(screen.getByText("Reason: rollback-error")).toBeInTheDocument();
		expect(screen.getByText(/Lifecycle event: change-run.status at/i)).toBeInTheDocument();
	});

	it("renders fallback text when no correlated event exists", () => {
		render(
			<ConfigChangesLifecycleCard
				page={
					makePage({
						lifecycleQ: {
							isLoading: false,
							data: {
								events: [
									{
										id: "e2",
										eventType: "change-run.status",
										status: "failed",
										details: { taskId: "20" },
										createdAt: "2026-03-13T11:00:00Z",
									},
								],
							},
						},
					}) as never
				}
			/>,
		);
		expect(screen.getByText("No lifecycle event correlation yet.")).toBeInTheDocument();
	});
});
