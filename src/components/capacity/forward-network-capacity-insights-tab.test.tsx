import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForwardNetworkCapacityInsightsTab } from "./forward-network-capacity-insights-tab";

describe("ForwardNetworkCapacityInsightsTab", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders not-run empty state", () => {
		render(
			<ForwardNetworkCapacityInsightsTab
				kind="security"
				page={
					{
						securityInsights: {
							isLoading: false,
							isError: false,
							data: { status: "not-run", checks: [] },
						},
						runSecurityInsights: { isPending: false, mutate: vi.fn() },
					} as never
				}
			/>,
		);

		expect(
			screen.getByText("No security insights run yet for this network."),
		).toBeInTheDocument();
	});

	it("renders error state message", () => {
		render(
			<ForwardNetworkCapacityInsightsTab
				kind="cloud"
				page={
					{
						cloudInsights: {
							isLoading: false,
							isError: true,
							error: new Error("request failed 404"),
						},
						runCloudInsights: { isPending: false, mutate: vi.fn() },
					} as never
				}
			/>,
		);

		expect(screen.getByText(/Failed to load cloud insights/i)).toBeInTheDocument();
		expect(screen.getByText(/request failed 404/i)).toBeInTheDocument();
	});

	it("renders success summary with freshness age", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-25T18:00:00Z"));

		render(
			<ForwardNetworkCapacityInsightsTab
				kind="security"
				page={
					{
						securityInsights: {
							isLoading: false,
							isError: false,
							data: {
								status: "success",
								asOf: "2026-03-25T16:00:00Z",
								summary: {
									checks: 1,
									totalFindings: 2,
									high: 1,
									medium: 1,
									low: 0,
								},
								checks: [
									{
										checkId: "sec-1",
										title: "Open ingress",
										category: "perimeter",
										severity: "high",
										findings: 2,
									},
								],
							},
						},
						runSecurityInsights: { isPending: false, mutate: vi.fn() },
					} as never
				}
			/>,
		);

		expect(screen.getByText(/As of 2026-03-25T16:00:00Z \(2h ago\)/)).toBeInTheDocument();
		expect(screen.getByText("Checks: 1")).toBeInTheDocument();
	});
});
