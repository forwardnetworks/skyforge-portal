import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { useForwardAnalyticsPage } from "./use-forward-analytics-page";

const navigateMock = vi.fn();

const listUserScopesMock = vi.fn();
const listUserScopeForwardNetworksMock = vi.fn();
const listUserForwardCollectorConfigsMock = vi.fn();
const listUserScopeForwardAvailableNetworksMock = vi.fn();
const getUserScopeForwardNetworkCapacityPortfolioMock = vi.fn();
const createUserScopeForwardNetworkMock = vi.fn();
const deleteUserScopeForwardNetworkMock = vi.fn();

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<object>("@tanstack/react-router");
	return {
		...actual,
		useNavigate: () => navigateMock,
	};
});

vi.mock("../lib/api-client", () => ({
	listUserScopes: (...args: unknown[]) => listUserScopesMock(...args),
	listUserScopeForwardNetworks: (...args: unknown[]) =>
		listUserScopeForwardNetworksMock(...args),
	listUserForwardCollectorConfigs: (...args: unknown[]) =>
		listUserForwardCollectorConfigsMock(...args),
	listUserScopeForwardAvailableNetworks: (...args: unknown[]) =>
		listUserScopeForwardAvailableNetworksMock(...args),
	getUserScopeForwardNetworkCapacityPortfolio: (...args: unknown[]) =>
		getUserScopeForwardNetworkCapacityPortfolioMock(...args),
	createUserScopeForwardNetwork: (...args: unknown[]) =>
		createUserScopeForwardNetworkMock(...args),
	deleteUserScopeForwardNetwork: (...args: unknown[]) =>
		deleteUserScopeForwardNetworkMock(...args),
}));

function HookHarness({ userId }: { userId: string }) {
	const page = useForwardAnalyticsPage({ userId });

	useEffect(() => {
		page.setDescription("saved from test");
	}, [page]);

	return (
		<div>
			<div data-testid="name">{page.name}</div>
			<div data-testid="available-count">{page.availableNetworks.length}</div>
			<button
				onClick={() => page.handleCollectorConfigChange("collector-2")}
				type="button"
			>
				select-collector-2
			</button>
			<button
				onClick={() => page.handleForwardNetworkChange("net-2")}
				type="button"
			>
				select-network-2
			</button>
			<button onClick={() => page.createM.mutate()} type="button">
				save-network
			</button>
		</div>
	);
}

function renderHarness(userId = "scope-1") {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return render(
		<QueryClientProvider client={queryClient}>
			<HookHarness userId={userId} />
		</QueryClientProvider>,
	);
}

describe("useForwardAnalyticsPage", () => {
	it("flows collector -> available networks -> save request payload", async () => {
		navigateMock.mockReset();
		listUserScopesMock.mockResolvedValue([{ id: "scope-1", username: "alice" }]);
		listUserScopeForwardNetworksMock.mockResolvedValue({ networks: [] });
		getUserScopeForwardNetworkCapacityPortfolioMock.mockResolvedValue({
			items: [],
		});
		listUserForwardCollectorConfigsMock.mockResolvedValue({
			collectors: [
				{ id: "collector-1", name: "Default Collector" },
				{ id: "collector-2", name: "Lab Collector" },
			],
		});
		listUserScopeForwardAvailableNetworksMock.mockImplementation(
			async (_userId: string, collectorConfigId?: string) => ({
				collectorConfigId,
				networks:
					collectorConfigId === "collector-2"
						? [
								{ id: "net-2", name: "Network Two" },
								{ id: "net-3", name: "Network Three" },
							]
						: [{ id: "net-default", name: "Default Network" }],
			}),
		);
		createUserScopeForwardNetworkMock.mockResolvedValue({
			id: "saved-1",
			userScopeId: "scope-1",
			forwardNetwork: "net-2",
			name: "Network Two",
			createdBy: "alice",
			createdAt: "2026-03-25T00:00:00Z",
			updatedAt: "2026-03-25T00:00:00Z",
		});
		deleteUserScopeForwardNetworkMock.mockResolvedValue({ ok: true });

		renderHarness();

		await waitFor(() => {
			expect(listUserScopeForwardAvailableNetworksMock).toHaveBeenCalledWith(
				"scope-1",
				undefined,
			);
		});

		fireEvent.click(screen.getByRole("button", { name: "select-collector-2" }));

		await waitFor(() => {
			expect(listUserScopeForwardAvailableNetworksMock).toHaveBeenCalledWith(
				"scope-1",
				"collector-2",
			);
		});
		await waitFor(() => {
			expect(screen.getByTestId("available-count")).toHaveTextContent("2");
		});

		fireEvent.click(screen.getByRole("button", { name: "select-network-2" }));
		expect(screen.getByTestId("name")).toHaveTextContent("Network Two");

		fireEvent.click(screen.getByRole("button", { name: "save-network" }));

		await waitFor(() => {
			expect(createUserScopeForwardNetworkMock).toHaveBeenCalledWith("scope-1", {
				name: "Network Two",
				forwardNetwork: "net-2",
				description: "saved from test",
				collectorConfigId: "collector-2",
			});
		});
	});
});
