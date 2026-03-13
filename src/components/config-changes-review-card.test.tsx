import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfigChangesReviewCard } from "./config-changes-review-card";

function makePage(review: Record<string, unknown> | null) {
	return {
		reviewQ: {
			isLoading: false,
			data: review ? { review } : undefined,
		},
	};
}

describe("ConfigChangesReviewCard", () => {
	it("shows eligible auto-rollback plan for netlab-kne review", () => {
		const page = makePage({
			executionPath: "planned-change-control",
			executionBackend: "netlab-kne",
			verificationBackend: "forward",
			plannedExecutionTaskType: "netlab-kne-run",
			deviceCount: 2,
			changeCount: 1,
			artifactRefs: [
				{
					kind: "forward-auto-rollback",
					name: "forward/auto-rollback",
					key: "requested;eligibility=eligible",
				},
			],
		});

		render(<ConfigChangesReviewCard page={page as never} />);

		expect(screen.getByText("Execution backend")).toBeInTheDocument();
		expect(screen.getByText("netlab-kne")).toBeInTheDocument();
		expect(screen.getByText("Verification backend")).toBeInTheDocument();
		expect(screen.getByText("forward")).toBeInTheDocument();
		expect(screen.getByText("Auto-rollback plan")).toBeInTheDocument();
		expect(screen.getByText("eligible and enforced")).toBeInTheDocument();
	});

	it("shows unsupported auto-rollback plan for ansible-push review", () => {
		const page = makePage({
			executionPath: "planned-change-control-ansible-push",
			plannedExecutionTaskType: "netlab-kne-run",
			deviceCount: 2,
			changeCount: 1,
			artifactRefs: [
				{
					kind: "forward-auto-rollback",
					name: "forward/auto-rollback",
					key: "requested;eligibility=unsupported;backend=ansible-push",
				},
			],
		});

		render(<ConfigChangesReviewCard page={page as never} />);

		expect(screen.getByText("requested but unsupported")).toBeInTheDocument();
		expect(screen.getByText("Backend: ansible-push")).toBeInTheDocument();
	});
});
