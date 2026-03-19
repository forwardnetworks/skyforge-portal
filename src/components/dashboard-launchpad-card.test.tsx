import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardLaunchpadCard } from "./dashboard-launchpad-card";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: () => ({
		data: {
			launchpadContent: [
				{
					id: "launchpad-header-simple",
					surface: "header",
					mode: "simple",
					eyebrow: "Guided launchpad",
					title: "Choose a path",
					description: "Simple launchpad copy",
					order: 10,
				},
				{
					id: "launchpad-header-advanced",
					surface: "header",
					mode: "advanced",
					eyebrow: "Operator launchpad",
					title: "Dashboard",
					description: "Advanced launchpad copy",
					order: 20,
				},
			],
			launchpadActions: [
				{
					id: "launchpad-action-launch-lab",
					mode: "both",
					label: "Launch lab",
					href: "/dashboard/deployments/quick",
					variant: "primary",
					order: 10,
				},
				{
					id: "launchpad-action-settings-simple",
					mode: "simple",
					label: "Profile & settings",
					href: "/settings",
					variant: "ghost",
					order: 30,
				},
				{
					id: "launchpad-action-settings-advanced",
					mode: "advanced",
					label: "Settings",
					href: "/settings",
					variant: "ghost",
					order: 40,
				},
			],
			launchpad: [
				{
					id: "launchpad-launch-lab",
					title: "Launch Lab",
					description: "Launch curated labs",
					href: "/dashboard/deployments/quick",
					icon: "play-circle",
					order: 10,
				},
			],
		},
	}),
}));

vi.mock("./ui/button", () => ({
	Button: ({ asChild, children, ...props }: any) =>
		asChild ? children : <button {...props}>{children}</button>,
}));

function makePage(overrides: Record<string, unknown> = {}) {
	return {
		session: { authenticated: true },
		uiExperienceMode: "simple",
		platformAvailability: { policy: { primaryOperatingMode: "curated-demo" } },
		...overrides,
	};
}

describe("DashboardLaunchpadCard", () => {
	it("renders simple-mode launchpad header and actions from catalog", () => {
		render(<DashboardLaunchpadCard page={makePage() as never} />);

		expect(screen.getByText("Guided launchpad")).toBeInTheDocument();
		expect(screen.getByText("Choose a path")).toBeInTheDocument();
		expect(screen.getByText("Simple launchpad copy")).toBeInTheDocument();
		expect(screen.getByText("Profile & settings")).toBeInTheDocument();
		expect(screen.queryByText("Settings")).not.toBeInTheDocument();
	});

	it("renders advanced-mode launchpad header and advanced settings action", () => {
		render(
			<DashboardLaunchpadCard
				page={makePage({ uiExperienceMode: "advanced" }) as never}
			/>,
		);

		expect(screen.getByText("Operator launchpad")).toBeInTheDocument();
		expect(screen.getByText("Advanced launchpad copy")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(screen.queryByText("Profile & settings")).not.toBeInTheDocument();
	});
});
