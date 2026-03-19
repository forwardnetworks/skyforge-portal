import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPageContent } from "./dashboard-page-content";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("./dashboard-launchpad-card", () => ({
	DashboardLaunchpadCard: () => <div data-testid="launchpad-card" />,
}));
vi.mock("./dashboard-system-status-card", () => ({
	DashboardSystemStatusCard: () => <div data-testid="system-status-card" />,
}));
vi.mock("./dashboard-guidance-card", () => ({
	DashboardGuidanceCard: () => <div data-testid="guidance-card" />,
}));
vi.mock("./dashboard-availability-card", () => ({
	DashboardAvailabilityCard: () => <div data-testid="availability-card" />,
}));
vi.mock("./dashboard-policy-summary-card", () => ({
	DashboardPolicySummaryCard: () => <div data-testid="policy-summary-card" />,
}));
vi.mock("./dashboard-reservations-card", () => ({
	DashboardReservationsCard: () => <div data-testid="reservations-card" />,
}));
vi.mock("./dashboard-admin-summary-card", () => ({
	DashboardAdminSummaryCard: () => <div data-testid="admin-summary-card" />,
}));
vi.mock("./dashboard-next-steps-card", () => ({
	DashboardNextStepsCard: () => <div data-testid="next-steps-card" />,
}));
vi.mock("./platform-warnings-card", () => ({
	PlatformWarningsCard: ({ warnings }: { warnings?: string[] }) => (
		<div data-testid="platform-warnings">{(warnings ?? []).join("|")}</div>
	),
}));
vi.mock("./dashboard-shared", () => ({
	MetricCard: ({ title, value }: { title: string; value: string }) => (
		<div data-testid={`metric-${title}`}>{value}</div>
	),
	formatCount: (value: number | null | undefined) =>
		value == null ? "0" : String(value),
	formatMode: (value: string | null | undefined) => value ?? "",
	describeOperatingMode: (value: string | null | undefined) => value ?? "",
}));

function makePage(overrides: Record<string, unknown> = {}) {
	return {
		canAccessPlatformView: false,
		statusSummary: undefined,
		observabilitySummary: undefined,
		forwardClusterLaunchHref: "/api/forward/session",
		dashboardHeroActions: [
			{
				id: "dashboard-hero-launch-lab",
				label: "Launch lab",
				href: "/dashboard/deployments/quick",
				variant: "primary",
				order: 10,
			},
			{
				id: "dashboard-hero-view-deployments",
				label: "View deployments",
				href: "/dashboard/deployments",
				variant: "outline",
				order: 20,
			},
			{
				id: "dashboard-hero-reservations",
				label: "Reservations",
				href: "/dashboard/reservations",
				variant: "ghost",
				order: 30,
			},
			{
				id: "dashboard-hero-forward",
				label: "Open Forward",
				href: "/api/forward/session",
				variant: "ghost",
				order: 40,
			},
		],
		dashboardNextSteps: [
			{ id: "one", text: "step one", order: 10 },
			{ id: "two", text: "step two", order: 20 },
		],
		adminOverview: { warnings: ["admin warning"] },
		platformAvailability: {
			warnings: ["availability warning"],
			policy: {
				primaryOperatingMode: "curated-demo",
				quota: { maxConcurrentLabs: 4, maxPersistentLabs: 2 },
			},
			usage: {
				remainingConcurrentLabs: 2,
				remainingPersistentLabs: 1,
				activeDeployments: 2,
				persistentLabs: 1,
				requestedReservations: 3,
				approvedReservations: 1,
			},
		},
		reservations: [],
		...overrides,
	};
}

describe("DashboardPageContent", () => {
	it("shows non-admin next steps and only availability warnings", () => {
		render(<DashboardPageContent page={makePage() as never} />);

		expect(screen.getByTestId("launchpad-card")).toBeInTheDocument();
		expect(screen.getByTestId("system-status-card")).toBeInTheDocument();
		expect(screen.getByTestId("next-steps-card")).toBeInTheDocument();
		expect(screen.queryByTestId("admin-summary-card")).not.toBeInTheDocument();
		expect(screen.getByTestId("platform-warnings").textContent).toBe(
			"availability warning",
		);
	});

	it("shows admin summary and merges admin warnings", () => {
		render(
			<DashboardPageContent
				page={makePage({ canAccessPlatformView: true }) as never}
			/>,
		);

		expect(screen.getByTestId("admin-summary-card")).toBeInTheDocument();
		expect(screen.queryByTestId("next-steps-card")).not.toBeInTheDocument();
		expect(screen.getByTestId("platform-warnings").textContent).toBe(
			"availability warning|admin warning",
		);
	});

	it("shows a lighter simple-mode dashboard", () => {
		render(
			<DashboardPageContent
				page={makePage({ uiExperienceMode: "simple" }) as never}
			/>,
		);

		expect(screen.getByText("Launch faster")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Launch lab" }),
		).toBeInTheDocument();
		expect(screen.queryByTestId("system-status-card")).not.toBeInTheDocument();
		expect(screen.queryByTestId("availability-card")).not.toBeInTheDocument();
		expect(screen.queryByTestId("policy-summary-card")).not.toBeInTheDocument();
	});
});
