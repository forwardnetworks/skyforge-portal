import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CompositePlansPageContent } from "./composite-plans-page-content";

function buildPage(overrides: Record<string, unknown> = {}) {
	return {
		createMutation: { isPending: false },
		updateMutation: { isPending: false },
		runMutation: { isPending: false },
		deleteMutation: { isPending: false },
		previewMutation: { isPending: false },
		plans: [],
		selectedPlanId: "",
		setSelectedPlanId: vi.fn(),
		userScopes: [{ id: "u-1", name: "scope-1", slug: "scope-1" }],
		selectedUserScopeId: "u-1",
		navigate: vi.fn(),
		draft: {
			id: "plan-1",
			name: "composite-test",
			inputsJson: "{}",
			stages: [],
			bindings: [],
			outputs: [],
		},
		setDraft: vi.fn(),
		runInputsJson: "{}",
		setRunInputsJson: vi.fn(),
		addStage: vi.fn(),
		removeStage: vi.fn(),
		addBinding: vi.fn(),
		removeBinding: vi.fn(),
		addOutput: vi.fn(),
		removeOutput: vi.fn(),
		previewWarnings: [],
		previewErrors: [],
		newPlan: vi.fn(),
		preview: vi.fn(),
		saveAsNew: vi.fn(),
		save: vi.fn(),
		run: vi.fn(),
		deletePlan: vi.fn(),
		runsQ: { isLoading: false },
		compositeRuns: [],
		selectedRunId: "",
		setSelectedRunId: vi.fn(),
		runLifecycleQ: { isLoading: false },
		stageEvidence: [],
		...overrides,
	} as never;
}

describe("CompositePlansPageContent", () => {
	it("renders composite run history and stage evidence panels", () => {
		const page = buildPage({
			compositeRuns: [
				{
					id: "101",
					status: "running",
					type: "composite-run",
					message: "test run",
				},
			],
			selectedRunId: "101",
			stageEvidence: [
				{
					stageId: "reserve",
					provider: "baremetal",
					action: "reserve",
					status: "success",
					outputsCount: 2,
					error: "",
					time: "2026-03-13T18:00:00Z",
				},
			],
		});
		render(<CompositePlansPageContent page={page} />);

		expect(screen.getByText("Composite Run History")).toBeInTheDocument();
		expect(screen.getByTestId("composite-run-history")).toBeInTheDocument();
		expect(screen.getByTestId("composite-run-101")).toBeInTheDocument();
		expect(screen.getByTestId("composite-stage-evidence")).toBeInTheDocument();
		expect(screen.getByText(/reserve • baremetal\/reserve/i)).toBeInTheDocument();
	});

	it("selects run from history", () => {
		const setSelectedRunId = vi.fn();
		const page = buildPage({
			compositeRuns: [
				{ id: "201", status: "queued", type: "composite-run", message: "" },
				{ id: "202", status: "running", type: "composite-run", message: "" },
			],
			setSelectedRunId,
		});
		render(<CompositePlansPageContent page={page} />);

		fireEvent.click(screen.getByTestId("composite-run-202"));
		expect(setSelectedRunId).toHaveBeenCalledWith("202");
	});
});
