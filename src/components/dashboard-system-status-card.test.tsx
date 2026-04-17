import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardSystemStatusCard } from "./dashboard-system-status-card";

function renderCard(page: Record<string, unknown>) {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<DashboardSystemStatusCard page={page as never} />
		</QueryClientProvider>,
	);
}

describe("DashboardSystemStatusCard", () => {
	it("shows advisories and forward target health as the primary status summary", () => {
		renderCard({
			statusSummary: {
				status: "degraded",
				up: 4,
				down: 1,
				checks: [],
			},
			managedIntegrations: { integrations: [] },
			observabilitySummary: {
				scope: "admin",
				skyforge: {
					queueQueued: 2,
					queueRunning: 3,
					queueOldestSec: 75,
					workerHeartbeatSec: 9,
					advisories: [
						{
							level: "warn",
							metric: "queue_oldest_sec",
							value: 75,
							threshold: 60,
							message: "Task queue backlog age is elevated.",
						},
						{
							level: "crit",
							metric: "worker_heartbeat_sec",
							value: 240,
							threshold: 180,
							message: "Worker heartbeat is stale.",
						},
					],
				},
				forward: {
					sourceStatus: "degraded",
					prometheusTargetCount: 6,
					prometheusUpSum: 5,
					targetJobs: [
						{
							job: "forward-app",
							totalTargets: 4,
							upTargets: 3,
							downTargets: 1,
						},
						{
							job: "skyforge-server",
							totalTargets: 2,
							upTargets: 2,
							downTargets: 0,
						},
					],
				},
			},
		});

		expect(screen.getByText("Active advisories")).toBeInTheDocument();
		expect(screen.getByText("Forward targets")).toBeInTheDocument();
		expect(screen.getByText("5/6")).toBeInTheDocument();
		expect(
			screen.getByText("Task queue backlog age is elevated."),
		).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});
});
