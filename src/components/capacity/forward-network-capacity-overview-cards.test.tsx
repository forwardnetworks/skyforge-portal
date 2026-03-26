import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ForwardNetworkCapacityOverviewCards } from "./forward-network-capacity-overview-cards";

describe("ForwardNetworkCapacityOverviewCards", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("shows stale banner with age when summary is stale", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-25T18:00:00Z"));

		render(
			<ForwardNetworkCapacityOverviewCards
				page={
					{
						summary: {
							data: {
								stale: true,
								asOf: "2026-03-25T16:00:00Z",
							},
						},
						inventory: { data: { asOf: "2026-03-25T16:00:00Z" } },
						coverage: { data: null },
						forwardNetworkId: "net-123",
						overview: { above: 0, soonest: null },
					} as never
				}
			/>,
		);

		expect(screen.getByText(/Data is stale/i)).toBeInTheDocument();
		expect(screen.getAllByText(/2h ago/i).length).toBeGreaterThanOrEqual(1);
		expect(screen.getByText(/Age:/i)).toBeInTheDocument();
	});
});
