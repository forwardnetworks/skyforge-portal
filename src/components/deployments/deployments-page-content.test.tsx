import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DeploymentsPageContent } from "./deployments-page-content";

vi.mock("./deployments-page-header", () => ({
	DeploymentsPageHeader: () => <div data-testid="deployments-header" />,
}));
vi.mock("./deployments-page-loading-state", () => ({
	DeploymentsPageLoadingState: () => <div data-testid="deployments-loading" />,
}));
vi.mock("./deployments-page-toolbar", () => ({
	DeploymentsPageToolbar: () => <div data-testid="deployments-toolbar" />,
}));
vi.mock("./deployments-page-table", () => ({
	DeploymentsPageTable: () => <div data-testid="deployments-table" />,
}));
vi.mock("./deployments-activity-feed", () => ({
	DeploymentsActivityFeed: () => <div data-testid="deployments-activity" />,
}));
vi.mock("./deployments-lifetime-dialog", () => ({
	DeploymentsLifetimeDialog: () => <div data-testid="deployments-lifetime-dialog" />,
}));
vi.mock("./deployments-delete-dialog", () => ({
	DeploymentsDeleteDialog: () => <div data-testid="deployments-delete-dialog" />,
}));

describe("DeploymentsPageContent", () => {
	it("shows loading state until snapshot data arrives and always renders split shells", () => {
		const { rerender } = render(
			<DeploymentsPageContent state={{ snap: { data: null } } as never} />,
		);

		expect(screen.getByTestId("deployments-loading")).toBeInTheDocument();
		expect(screen.getByTestId("deployments-header")).toBeInTheDocument();
		expect(screen.getByTestId("deployments-toolbar")).toBeInTheDocument();
		expect(screen.getByTestId("deployments-table")).toBeInTheDocument();
		expect(screen.getByTestId("deployments-activity")).toBeInTheDocument();
		expect(screen.getByTestId("deployments-lifetime-dialog")).toBeInTheDocument();
		expect(screen.getByTestId("deployments-delete-dialog")).toBeInTheDocument();

		rerender(
			<DeploymentsPageContent state={{ snap: { data: { runs: [] } } } as never} />,
		);
		expect(screen.queryByTestId("deployments-loading")).not.toBeInTheDocument();
	});
});
