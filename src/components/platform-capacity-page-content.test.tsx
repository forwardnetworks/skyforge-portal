import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformCapacityPageContent } from "./platform-capacity-page-content";

vi.mock("./platform-capacity-summary-cards", () => ({
	PlatformCapacitySummaryCards: () => <div data-testid="capacity-summary" />,
}));
vi.mock("./platform-capacity-infra-comparison-card", () => ({
	PlatformCapacityInfraComparisonCard: ({ infraComparison }: { infraComparison?: { mode?: string } }) => (
		<div data-testid="infra-comparison">{infraComparison?.mode ?? "none"}</div>
	),
}));
vi.mock("./platform-capacity-tables", () => ({
	PlatformCapacityTables: () => <div data-testid="capacity-tables" />,
}));
vi.mock("./platform-warnings-card", () => ({
	PlatformWarningsCard: ({ warnings }: { warnings?: string[] }) => (
		<div data-testid="capacity-warnings">{(warnings ?? []).join("|")}</div>
	),
}));

describe("PlatformCapacityPageContent", () => {
	it("passes overview warnings and infra comparison through split coordinator", () => {
		render(
			<PlatformCapacityPageContent
				page={{
					overviewQ: {
						data: {
							warnings: ["onprem degraded", "burst limited"],
							infraComparison: { mode: "blended" },
						},
					},
				} as never}
			/>,
		);

		expect(screen.getByText("Platform Capacity")).toBeInTheDocument();
		expect(screen.getByTestId("capacity-warnings").textContent).toBe(
			"onprem degraded|burst limited",
		);
		expect(screen.getByTestId("infra-comparison").textContent).toBe(
			"blended",
		);
		expect(screen.getByTestId("capacity-summary")).toBeInTheDocument();
		expect(screen.getByTestId("capacity-tables")).toBeInTheDocument();
	});
});
