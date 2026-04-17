import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardPageContent } from "./dashboard-page-content";
import type { PlatformWarning } from "../lib/api-client-platform";

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
	PlatformWarningsCard: ({
		title,
		description,
		warnings,
	}: {
		title?: string;
		description?: string;
		warnings?: PlatformWarning[];
	}) => (
		<div data-testid="platform-warnings">
			<div>{title}</div>
			<div>{description}</div>
			<div>{(warnings ?? []).map((warning) => warning.code ?? warning.summary ?? "").join("|")}</div>
		</div>
	),
}));
vi.mock("./dashboard-shared", () => ({
	MetricCard: ({
		title,
		value,
		description,
	}: {
		title: string;
		value: string;
		description?: string;
	}) => (
		<div data-testid={`metric-${title}`}>
			<div>{title}</div>
			<div>{value}</div>
			<div>{description}</div>
		</div>
	),
	formatCount: (value: number | null | undefined) =>
		value == null ? "0" : String(value),
	formatMode: (value: string | null | undefined) => value ?? "",
	dashboardModeGuidanceEntryID: (value: string | null | undefined) =>
		value
			? `dashboard-advanced-posture-mode-${value}`
			: "dashboard-advanced-posture-mode-unresolved",
}));

function makePage(overrides: Record<string, unknown> = {}) {
	const availabilityWarning: PlatformWarning = {
		code: "availability-warning",
		severity: "warning",
		summary: "availability warning",
	};
	const adminWarning: PlatformWarning = {
		code: "admin-warning",
		severity: "warning",
		summary: "admin warning",
	};
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
		dashboardContent: [
			{
				id: "dashboard-hero-simple",
				surface: "hero",
				mode: "simple",
				badge: "Simple mode",
				eyebrow: "Start here",
				title: "Launch faster",
				description: "Simple hero copy",
				detailTemplate: "Mode {mode}",
				fallbackValue: "unknown",
				order: 10,
			},
			{
				id: "dashboard-simple-callout-tools",
				surface: "callout",
				mode: "simple",
				title: "Need more tools?",
				description: "Switch to advanced mode.",
				icon: "zap",
				order: 20,
			},
			{
				id: "dashboard-simple-summary-active-deployments",
				surface: "summary",
				mode: "simple",
				title: "Active deployments",
				description: "Running labs in your current quota window",
				order: 25,
			},
			{
				id: "dashboard-simple-summary-open-reservations",
				surface: "summary",
				mode: "simple",
				title: "Open reservations",
				description: "Requested and approved reservation activity",
				order: 26,
			},
			{
				id: "dashboard-simple-posture-header",
				surface: "posture-header",
				mode: "simple",
				title: "Current posture",
				description:
					"The smallest useful amount of platform state for new users.",
				order: 27,
			},
			{
				id: "dashboard-simple-posture-headroom",
				surface: "posture",
				mode: "simple",
				title: "Concurrent headroom",
				description: "Available slots before you need to reserve.",
				order: 28,
			},
			{
				id: "dashboard-simple-posture-degraded",
				surface: "posture",
				mode: "simple",
				title: "Degraded checks",
				description: "Health checks currently reporting degraded state.",
				order: 29,
			},
			{
				id: "dashboard-simple-warnings-header",
				surface: "warnings-header",
				mode: "simple",
				title: "Platform conditions",
				description:
					"Only the warnings that affect launch and reservation decisions.",
				order: 30,
			},
			{
				id: "dashboard-hero-advanced",
				surface: "hero",
				mode: "advanced",
				badge: "Status-first dashboard",
				eyebrow: "Operational home",
				title: "Control plane",
				description: "Advanced hero copy",
				detailTemplate: "Mode {mode}",
				fallbackValue: "unknown",
				order: 30,
			},
			{
				id: "dashboard-advanced-posture-header",
				surface: "posture-header",
				mode: "advanced",
				title: "Current operating posture",
				description: "Resolved account mode and immediate operator guidance.",
				icon: "shield",
				order: 40,
			},
			{
				id: "dashboard-advanced-posture-primary-mode",
				surface: "posture-primary",
				mode: "advanced",
				title: "Primary mode",
				description: "Resolved account mode from the live platform policy.",
				fallbackValue: "Unreported",
				order: 45,
			},
			{
				id: "dashboard-advanced-posture-mode-curated-demo",
				surface: "posture-mode-guidance",
				mode: "advanced",
				title: "Mode guidance",
				description:
					"Use curated quick deploy templates for repeatable demos and baseline GTM workflows.",
				order: 46,
			},
			{
				id: "dashboard-advanced-posture-mode-unresolved",
				surface: "posture-mode-guidance",
				mode: "advanced",
				title: "Mode guidance",
				description: "Platform mode has not been resolved yet.",
				order: 51,
			},
			{
				id: "dashboard-advanced-posture-status",
				surface: "posture",
				mode: "advanced",
				title: "Status signal",
				description:
					"Review live platform status and warnings before launching.",
				icon: "zap",
				order: 50,
			},
			{
				id: "dashboard-advanced-posture-reset",
				surface: "posture",
				mode: "advanced",
				title: "Reset + reservation",
				description: "Reset and reservation controls remain available.",
				icon: "timer-reset",
				order: 60,
			},
			{
				id: "dashboard-advanced-kpi-concurrent-headroom",
				surface: "kpi",
				mode: "advanced",
				title: "Concurrent headroom",
				description: "Quota data loading",
				detailTemplate: "{active} active of {quota}",
				order: 65,
			},
			{
				id: "dashboard-advanced-kpi-persistent-headroom",
				surface: "kpi",
				mode: "advanced",
				title: "Persistent headroom",
				description: "Persistence policy loading",
				detailTemplate: "{active} active of {quota}",
				order: 66,
			},
			{
				id: "dashboard-advanced-kpi-requested-reservations",
				surface: "kpi",
				mode: "advanced",
				title: "Requested reservations",
				description: "Awaiting approval or scheduling",
				order: 67,
			},
			{
				id: "dashboard-advanced-kpi-approved-reservations",
				surface: "kpi",
				mode: "advanced",
				title: "Approved reservations",
				description: "Reserved platform time",
				order: 68,
			},
			{
				id: "dashboard-advanced-metric-degraded-checks",
				surface: "metric",
				mode: "advanced",
				title: "Degraded checks",
				description: "Public-safe service checks reporting degraded state",
				order: 69,
			},
			{
				id: "dashboard-advanced-metric-tracked-reservations",
				surface: "metric",
				mode: "advanced",
				title: "Tracked reservations",
				description: "Most recent reservation records visible to this account",
				order: 70,
			},
			{
				id: "dashboard-advanced-warnings-header",
				surface: "warnings-header",
				mode: "advanced",
				title: "Platform conditions",
				description:
					"Live hybrid-placement, capacity, and degraded-mode warnings affecting launch decisions.",
				order: 71,
			},
			{
				id: "dashboard-advanced-principle-launch-rule",
				surface: "principle",
				mode: "advanced",
				eyebrow: "Launch rule",
				title: "Dashboard before workflow",
				description: "Operators land here first.",
				order: 70,
			},
		],
		dashboardNextSteps: [
			{ id: "one", text: "step one", order: 10 },
			{ id: "two", text: "step two", order: 20 },
		],
		adminOverview: { warnings: [adminWarning] },
		platformAvailability: {
			warnings: [availabilityWarning],
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
			"Platform conditionsLive hybrid-placement, capacity, and degraded-mode warnings affecting launch decisions.availability-warning",
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
			"Platform conditionsLive hybrid-placement, capacity, and degraded-mode warnings affecting launch decisions.availability-warning|admin-warning",
		);
		expect(screen.getByText("Concurrent headroom")).toBeInTheDocument();
		expect(screen.getByText("Primary mode")).toBeInTheDocument();
		expect(screen.getByText("Tracked reservations")).toBeInTheDocument();
		expect(
			screen.getByText("Public-safe service checks reporting degraded state"),
		).toBeInTheDocument();
	});

	it("shows a lighter simple-mode dashboard", () => {
		render(
			<DashboardPageContent
				page={makePage({ uiExperienceMode: "simple" }) as never}
			/>,
		);

		expect(screen.getByText("Launch faster")).toBeInTheDocument();
		expect(screen.getByText("Active deployments")).toBeInTheDocument();
		expect(screen.getByText("Current posture")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Launch lab" }),
		).toBeInTheDocument();
		expect(screen.queryByTestId("system-status-card")).not.toBeInTheDocument();
		expect(screen.queryByTestId("availability-card")).not.toBeInTheDocument();
		expect(screen.queryByTestId("policy-summary-card")).not.toBeInTheDocument();
	});

	it("dedupes duplicated warning payloads across availability and admin overview", () => {
		const duplicateWarning: PlatformWarning = {
			code: "inventory-snapshot-missing",
			severity: "warning",
			summary: "Cluster inventory snapshot is not available yet.",
			recommendedAction: "Verify the platform inventory refresh worker cron is healthy.",
		};
		render(
			<DashboardPageContent
				page={
					makePage({
						canAccessPlatformView: true,
						adminOverview: { warnings: [duplicateWarning] },
						platformAvailability: {
							warnings: [duplicateWarning],
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
					}) as never
				}
			/>,
		);

		expect(screen.getByTestId("platform-warnings").textContent).toBe(
			"Platform conditionsLive hybrid-placement, capacity, and degraded-mode warnings affecting launch decisions.inventory-snapshot-missing",
		);
	});
});
