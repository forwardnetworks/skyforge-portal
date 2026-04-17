import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCreateDeploymentCreateMutation } from "./use-create-deployment-create-mutation";

const createUserScopeDeploymentMock = vi.fn();
const runDeploymentActionWithRetryMock = vi.fn();
const invalidateDashboardSnapshotQueryMock = vi.fn();
const invalidateUserScopeActivityQueriesMock = vi.fn();
const hardRefreshToDeploymentTopologyMock = vi.fn();
const waitForForwardSyncAndNetworkMock = vi.fn();
const toastLoadingMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastMessageMock = vi.fn();
const toastErrorMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("../lib/api-client", () => ({
	createUserScopeDeployment: (...args: unknown[]) =>
		createUserScopeDeploymentMock(...args),
}));

vi.mock("../lib/deployment-actions", () => ({
	deploymentActionQueueDescription: () => "queue position 1",
	noOpMessageForDeploymentAction: () => "No action required",
	runDeploymentActionWithRetry: (...args: unknown[]) =>
		runDeploymentActionWithRetryMock(...args),
}));

vi.mock("../lib/dashboard-query-sync", () => ({
	invalidateDashboardSnapshotQuery: (...args: unknown[]) =>
		invalidateDashboardSnapshotQueryMock(...args),
	invalidateUserScopeActivityQueries: (...args: unknown[]) =>
		invalidateUserScopeActivityQueriesMock(...args),
}));

vi.mock("./create-deployment-shared", async () => {
	const actual =
		await vi.importActual<typeof import("./create-deployment-shared")>(
			"./create-deployment-shared",
		);
	return {
		...actual,
		hardRefreshToDeploymentTopology: (...args: unknown[]) =>
			hardRefreshToDeploymentTopologyMock(...args),
		waitForForwardSyncAndNetwork: (...args: unknown[]) =>
			waitForForwardSyncAndNetworkMock(...args),
	};
});

vi.mock("sonner", () => ({
	toast: {
		loading: (...args: unknown[]) => toastLoadingMock(...args),
		success: (...args: unknown[]) => toastSuccessMock(...args),
		message: (...args: unknown[]) => toastMessageMock(...args),
		error: (...args: unknown[]) => toastErrorMock(...args),
	},
}));

function HookHarness() {
	const mutation = useCreateDeploymentCreateMutation({
		navigate: navigateMock,
		queryClient: new QueryClient({
			defaultOptions: {
				queries: { retry: false },
				mutations: { retry: false },
			},
		}),
		form: {} as never,
		watchUserScopeId: "user-1",
		watchKind: "kne_netlab",
		watchSource: "blueprints",
		watchTemplate: "EVPN/ebgp",
		watchTemplateRepoId: "",
		effectiveSource: "blueprints",
		templatesDir: "netlab",
		allowNoExpiry: false,
		managedFamilies: new Set<string>(),
		lifetimeAllowedHours: [4, 8, 24],
		variableGroups: [],
	});

	return (
		<button
			onClick={() =>
				mutation.mutate({
					userId: "user-1",
					name: "EVPN E2E",
					kind: "kne_netlab",
					source: "blueprints",
					template: "EVPN/ebgp",
					templateRepoId: "",
					deploymentMode: "in_cluster",
					labLifetime: "4",
					env: [],
				})
			}
			type="button"
		>
			create
		</button>
	);
}

function renderHarness() {
	return render(
		<QueryClientProvider
			client={
				new QueryClient({
					defaultOptions: {
						queries: { retry: false },
						mutations: { retry: false },
					},
				})
			}
		>
			<HookHarness />
		</QueryClientProvider>,
	);
}

describe("useCreateDeploymentCreateMutation", () => {
	it("opens deployments before create completes and then navigates to the detail page", async () => {
		createUserScopeDeploymentMock.mockReset();
		runDeploymentActionWithRetryMock.mockReset();
		invalidateDashboardSnapshotQueryMock.mockReset();
		invalidateUserScopeActivityQueriesMock.mockReset();
		toastLoadingMock.mockReset();
		toastSuccessMock.mockReset();
		toastMessageMock.mockReset();
		toastErrorMock.mockReset();
		navigateMock.mockReset();

		navigateMock.mockResolvedValue(undefined);
		createUserScopeDeploymentMock.mockResolvedValue({
			id: "dep-123",
			userId: "user-1",
		});
		runDeploymentActionWithRetryMock.mockResolvedValue({
			queued: true,
			queue: { position: 1, queueDepth: 1, nextRetryAt: "", expiresAt: "" },
			meta: { noOp: false, reason: "" },
		});
		invalidateDashboardSnapshotQueryMock.mockResolvedValue(undefined);
		invalidateUserScopeActivityQueriesMock.mockResolvedValue(undefined);

		renderHarness();
		fireEvent.click(screen.getByRole("button", { name: "create" }));

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({ to: "/dashboard/deployments" });
		});
		await waitFor(() => {
			expect(createUserScopeDeploymentMock).toHaveBeenCalledWith("user-1", {
				name: "EVPN E2E",
				family: "kne",
				engine: "netlab",
				config: {
					template: "EVPN/ebgp",
					templateSource: "blueprints",
					templatesDir: "netlab",
					engine: "netlab",
				},
			});
		});
		expect(navigateMock.mock.invocationCallOrder[0]).toBeLessThan(
			createUserScopeDeploymentMock.mock.invocationCallOrder[0],
		);

		await waitFor(() => {
			expect(navigateMock).toHaveBeenCalledWith({
				to: "/dashboard/deployments/$deploymentId",
				params: { deploymentId: "dep-123" },
				search: { tab: "topology" },
			});
		});
		expect(runDeploymentActionWithRetryMock).toHaveBeenCalledWith(
			"user-1",
			"dep-123",
			"create",
		);
	});
});
