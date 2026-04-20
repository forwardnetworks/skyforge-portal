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

	it("renders core services separately from managed integrations", () => {
		renderCard({
			statusSummary: {
				status: "ok",
				up: 2,
				down: 0,
				checks: [
					{ name: "postgres", status: "up", detail: "connected" },
					{ name: "redis", status: "up", detail: "connected" },
				],
			},
			managedIntegrations: {
				integrations: [
					{ id: "coder", label: "Coder", status: "ready", detail: "1/1 replicas available" },
					{ id: "jira", label: "Jira", status: "ready", detail: "1/1 replicas available" },
				],
			},
			observabilitySummary: {
				scope: "admin",
				skyforge: {
					queueQueued: 0,
					queueRunning: 0,
					queueOldestSec: 0,
					workerHeartbeatSec: 5,
					advisories: [],
				},
				forward: {
					sourceStatus: "ok",
					prometheusTargetCount: 0,
					prometheusUpSum: 0,
					targetJobs: [],
				},
			},
		});

		expect(screen.getAllByText("Core service")).toHaveLength(2);
		expect(screen.getAllByText("Managed integration")).toHaveLength(2);
		expect(screen.getByText("Coder")).toBeInTheDocument();
		expect(screen.getByText("Jira")).toBeInTheDocument();
	});
});
