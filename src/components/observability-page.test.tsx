import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ObservabilityPage } from "./observability-page";

const getUserObservabilitySummaryMock = vi.fn();
const getUserObservabilitySeriesMock = vi.fn();
const getObservabilitySlowRequestsMock = vi.fn();

vi.mock("@/lib/api-client-forward-observability", () => ({
	getUserObservabilitySummary: (...args: unknown[]) =>
		getUserObservabilitySummaryMock(...args),
	getUserObservabilitySeries: (...args: unknown[]) =>
		getUserObservabilitySeriesMock(...args),
	getObservabilitySlowRequests: (...args: unknown[]) =>
		getObservabilitySlowRequestsMock(...args),
}));

function renderPage() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<ObservabilityPage />
		</QueryClientProvider>,
	);
}

describe("ObservabilityPage", () => {
	it("renders structured admin observability views", async () => {
		getUserObservabilitySummaryMock.mockResolvedValue({
			generatedAt: "2026-04-16T22:40:00Z",
			scope: "admin",
			skyforge: {
				generatedAt: "2026-04-16T22:40:00Z",
				endpoints: [
					{
						endpointKey: "/api/quick-deploy/deploy",
						count: 8,
						errorCount: 1,
						p50Ms: 420,
						p95Ms: 1900,
						p99Ms: 2600,
						topCause: "db_slow",
					},
				],
				queueQueued: 3,
				queueRunning: 2,
				queueOldestSec: 41,
				workerHeartbeatSec: 5,
				nodeCpuActiveP95: 28,
				nodeMemUsedP95: 37,
				advisories: [
					{
						level: "warn",
						metric: "queue_oldest_sec",
						value: 41,
						threshold: 30,
						message: "Task queue backlog age is elevated.",
					},
				],
			},
			forward: {
				namespace: "forward",
				sourceStatus: "degraded",
				prometheusService: true,
				grafanaService: true,
				prometheusReachable: true,
				prometheusUpSum: 5,
				prometheusTargetCount: 6,
				targetJobs: [
					{
						job: "skyforge-server",
						totalTargets: 2,
						upTargets: 2,
						downTargets: 0,
					},
					{
						job: "forward-app",
						totalTargets: 4,
						upTargets: 3,
						downTargets: 1,
					},
				],
				checkedAt: "2026-04-16T22:40:00Z",
			},
		});
		getUserObservabilitySeriesMock.mockImplementation(
			async ({ metric }: { metric: string }) => ({
				scope: "admin",
				metric,
				window: "24h",
				points: [
					{ timestamp: "2026-04-16T21:00:00Z", value: 10 },
					{ timestamp: "2026-04-16T22:00:00Z", value: 20 },
				],
			}),
		);
		getObservabilitySlowRequestsMock.mockResolvedValue({
			window: "24h",
			requests: [
				{
					collectedAt: "2026-04-16T22:35:00Z",
					endpointKey: "/api/quick-deploy/deploy",
					statusCode: 200,
					totalMs: 2100,
					phaseDbMs: 900,
					phaseEnrichMs: 200,
					queueOldestSec: 0,
					workerHeartbeatSec: 4,
					causeCode: "db_slow",
				},
			],
		});

		renderPage();

		await waitFor(() => {
			expect(
				screen.getByText("Task queue backlog age is elevated."),
			).toBeInTheDocument();
		});
		expect(screen.getByText("Active advisories")).toBeInTheDocument();
		expect(screen.getByText("Forward target health")).toBeInTheDocument();
		expect(screen.getByText("skyforge-server")).toBeInTheDocument();
		expect(screen.getByText("/api/quick-deploy/deploy")).toBeInTheDocument();
		expect(screen.getByText("Slow requests")).toBeInTheDocument();
		expect(
			screen.getByText("Open Grafana operations dashboard"),
		).toBeInTheDocument();
	});

	it("keeps admin-only slow requests hidden for non-admin users", async () => {
		getUserObservabilitySummaryMock.mockResolvedValue({
			generatedAt: "2026-04-16T22:40:00Z",
			scope: "user",
			skyforge: {
				generatedAt: "2026-04-16T22:40:00Z",
				endpoints: [],
				queueQueued: 0,
				queueRunning: 1,
				queueOldestSec: 0,
				workerHeartbeatSec: 2,
				nodeCpuActiveP95: 12,
				nodeMemUsedP95: 18,
				advisories: [],
			},
			forward: {
				namespace: "forward",
				sourceStatus: "ok",
				prometheusService: true,
				grafanaService: true,
				prometheusReachable: true,
				prometheusUpSum: 2,
				prometheusTargetCount: 2,
				targetJobs: [],
				checkedAt: "2026-04-16T22:40:00Z",
			},
		});
		getUserObservabilitySeriesMock.mockImplementation(
			async ({ metric }: { metric: string }) => ({
				scope: "user",
				metric,
				window: "24h",
				points: [],
			}),
		);
		getObservabilitySlowRequestsMock.mockReset();

		renderPage();

		await waitFor(() => {
			expect(screen.getByText("Observability")).toBeInTheDocument();
		});
		expect(screen.queryByText("Slow requests")).not.toBeInTheDocument();
		expect(getObservabilitySlowRequestsMock).not.toHaveBeenCalled();
	});
});
