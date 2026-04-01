import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const useUserSettingsPageMock = vi.fn(() => ({ kind: "user-page" }));
const useAdminSettingsPageMock = vi.fn(() => ({
	identity: { kind: "identity" },
	integrations: { kind: "integrations" },
	forward: { kind: "forward" },
	runtime: { kind: "runtime" },
	users: { kind: "users" },
	maintenance: {
		config: { kind: "config" },
		audit: { kind: "audit" },
		tasks: { kind: "tasks" },
	},
}));
const useCatalogRouteAccessMock = vi.fn(() => ({
	canAccessRoute: () => false,
}));

let currentSearch: { section?: string } = {};

vi.mock("@tanstack/react-router", () => ({
	createFileRoute: () =>
		(config: Record<string, unknown>) => ({
			...config,
			useSearch: () => currentSearch,
			useNavigate: () => navigateMock,
		}),
}));

vi.mock("../components/settings-page-content", () => ({
	SettingsSectionContent: (props: {
		section: string;
		adminProps?: unknown;
		sectionDefinition: { id: string; label: string };
	}) => (
		<div>
			<div data-testid="rendered-section">{props.section}</div>
			<div data-testid="rendered-label">{props.sectionDefinition.label}</div>
			<div data-testid="has-admin-props">
				{props.adminProps ? "yes" : "no"}
			</div>
		</div>
	),
}));

vi.mock("../hooks/use-user-settings-page", () => ({
	useUserSettingsPage: () => useUserSettingsPageMock(),
}));

vi.mock("../hooks/use-admin-settings-page", () => ({
	useAdminSettingsPage: () => useAdminSettingsPageMock(),
}));

vi.mock("../hooks/use-catalog-route-access", () => ({
	useCatalogRouteAccess: () => useCatalogRouteAccessMock(),
}));

import { Route } from "./settings";

function renderRoute() {
	const Component = Route.component as () => JSX.Element;
	return render(<Component />);
}

describe("/settings route", () => {
	beforeEach(() => {
		currentSearch = {};
		navigateMock.mockReset();
		useUserSettingsPageMock.mockClear();
		useAdminSettingsPageMock.mockClear();
		useCatalogRouteAccessMock.mockReset();
		useCatalogRouteAccessMock.mockReturnValue({
			canAccessRoute: () => false,
		});
	});

	it("falls back to profile for user-only sessions", () => {
		currentSearch = { section: "users" };

		renderRoute();

		expect(screen.getByTestId("rendered-section")).toHaveTextContent(
			"profile",
		);
		expect(screen.getByTestId("has-admin-props")).toHaveTextContent("no");
		expect(useAdminSettingsPageMock).not.toHaveBeenCalled();
	});

	it("preserves admin sections for admin-capable sessions", () => {
		currentSearch = { section: "users" };
		useCatalogRouteAccessMock.mockReturnValue({
			canAccessRoute: (route: string) => route === "/admin/",
		});

		renderRoute();

		expect(screen.getByTestId("rendered-section")).toHaveTextContent("users");
		expect(screen.getByTestId("has-admin-props")).toHaveTextContent("yes");
		expect(useAdminSettingsPageMock).toHaveBeenCalledTimes(1);
	});

	it("navigates with canonical section search params", () => {
		useCatalogRouteAccessMock.mockReturnValue({
			canAccessRoute: (route: string) => route === "/admin/",
		});

		renderRoute();
		fireEvent.click(screen.getByRole("button", { name: /runtime & capacity/i }));

		expect(navigateMock).toHaveBeenCalledWith({
			to: "/settings",
			search: { section: "runtime" },
			replace: true,
		});
	});
});
