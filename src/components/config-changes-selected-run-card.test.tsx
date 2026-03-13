import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfigChangesSelectedRunCard } from "./config-changes-selected-run-card";

function makeMutation() {
  return { mutate: vi.fn(), isPending: false };
}

function makePage(overrides: Record<string, unknown> = {}) {
  return {
    isAdmin: true,
    selectedRun: {
      id: "run-1",
      targetType: "deployment",
      targetRef: "dep-1",
      status: "approved",
      approvalState: "approved",
      sourceKind: "change-plan",
      executionMode: "apply",
      requestedBy: "alice",
      executionTaskId: null,
      rollbackSummary: {
        previousDeploymentConfigJson: '{"template":"demo/topology.yml"}',
      },
    },
    renderMutation: makeMutation(),
    approveMutation: makeMutation(),
    rejectMutation: makeMutation(),
    executeMutation: makeMutation(),
    rollbackMutation: makeMutation(),
    canRenderRun: false,
    canApproveRun: false,
    canRejectRun: true,
    canExecuteRun: true,
    canRollbackRun: true,
    rollbackBlockedReason: "",
    ...overrides,
  };
}

describe("ConfigChangesSelectedRunCard", () => {
  it("shows operator actions for supported executable runs", () => {
    const page = makePage();
    render(<ConfigChangesSelectedRunCard page={page as never} />);

    expect(screen.getByRole("button", { name: /execute/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /rollback/i })).toBeEnabled();
    expect(screen.getByText(/Only deployment-targeted change-plan runs are executable/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /execute/i }));
    expect(page.executeMutation.mutate).toHaveBeenCalledWith("run-1");

    fireEvent.click(screen.getByRole("button", { name: /rollback/i }));
    expect(page.rollbackMutation.mutate).toHaveBeenCalledWith("run-1");
  });

  it("disables execute and rollback for non-executable runs", () => {
    const page = makePage({
      selectedRun: {
        id: "run-2",
        targetType: "snapshot",
        targetRef: "dep-2",
        status: "approved",
        approvalState: "approved",
        sourceKind: "change-plan",
        executionMode: "apply",
        requestedBy: "alice",
        executionTaskId: null,
        rollbackSummary: null,
      },
      canExecuteRun: false,
      canRollbackRun: false,
      rollbackBlockedReason: "Rollback is only available for deployment targets.",
    });

    render(<ConfigChangesSelectedRunCard page={page as never} />);

    expect(screen.getByRole("button", { name: /execute/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /rollback/i })).toBeDisabled();
    expect(
      screen.getByText("Rollback is only available for deployment targets."),
    ).toBeInTheDocument();
  });

  it("shows non-admin guidance without operator controls", () => {
    const page = makePage({
      isAdmin: false,
      canRenderRun: true,
    });

    render(<ConfigChangesSelectedRunCard page={page as never} />);

    expect(screen.getByRole("button", { name: /render review/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Only requested or validating runs can be rendered/i)).toBeInTheDocument();
  });

  it("shows latest auto-rollback outcome from execution evidence", () => {
    const page = makePage({
      selectedRun: {
        id: "run-3",
        targetType: "deployment",
        targetRef: "dep-3",
        status: "failed",
        approvalState: "approved",
        sourceKind: "change-plan",
        executionMode: "apply",
        requestedBy: "alice",
        executionTaskId: 42,
        rollbackSummary: {
          previousDeploymentConfigJson: '{"template":"demo/topology.yml"}',
        },
        executionSummary: {
          artifactRefs: [
            {
              kind: "forward-auto-rollback-status",
              name: "forward/auto-rollback/status",
              key: "outcome=unsupported;reason=ansible-push",
            },
            {
              kind: "forward-auto-rollback-status",
              name: "forward/auto-rollback/status",
              key: "outcome=failed;reason=rollback-error",
            },
          ],
        },
      },
    });

    render(<ConfigChangesSelectedRunCard page={page as never} />);

    expect(screen.getByText("Auto-rollback")).toBeInTheDocument();
    expect(screen.getAllByText("failed").length).toBeGreaterThan(0);
    expect(screen.getByText("Reason: rollback-error")).toBeInTheDocument();
  });
});
