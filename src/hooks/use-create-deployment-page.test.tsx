import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCreateDeploymentPage } from "./use-create-deployment-page";

const navigateMock = vi.fn();
const validateResetMock = vi.fn();
const uploadResetMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => navigateMock,
}));

vi.mock("./use-create-deployment-data", () => ({
	useCreateDeploymentData: () => ({
		effectiveSource: "blueprints",
		templatesQ: { data: { dir: "templates" } },
		allowNoExpiry: false,
		managedFamilies: new Set<string>(),
		lifetimeAllowedHours: [24],
		variableGroups: [],
		userSettingsQ: { data: null },
		watchSpec: { family: "kne" },
		driverSummary: "In-cluster (kne)",
		lifetimeManaged: false,
		lifetimeCanEdit: false,
		lifetimeOptions: [],
		expiryAction: "stop",
		lifetimeDefaultHours: 24,
		deploymentModeOptions: [],
		byosNetlabEnabled: false,
		byosKNEEnabled: false,
		forwardCollectorsQ: { data: [] },
		selectableCollectors: [],
		externalAllowed: false,
		externalRepos: [],
		byosServerRefs: [],
		userNetlabServersQ: { data: [] },
		userKNEServersQ: { data: [] },
		templates: [],
		terraformProviders: [],
		awsSsoStatusQ: { data: null },
		awsTerraformReadinessQ: { data: null },
		userAwsSsoQ: { data: null },
		awsSsoSession: null,
		awsSsoPollStatus: "",
		startAwsSsoM: { mutate: vi.fn(), isPending: false },
		templatePreviewQ: { data: null },
		selectedTemplateEstimate: null,
		templateEstimatePending: false,
		templateEstimateQ: { data: null },
		netlabDeviceOptions: [],
		netlabDeviceOptionsQ: { data: [] },
	}),
}));

vi.mock("./use-create-deployment-mutations", () => ({
	useCreateDeploymentMutations: () => ({
		mutation: { mutate: vi.fn(), isPending: false },
		validateTemplate: {
			reset: validateResetMock,
			mutate: vi.fn(),
			isPending: false,
			data: null,
		},
		uploadNetlabTemplate: {
			reset: uploadResetMock,
			mutate: vi.fn(),
			isPending: false,
			data: null,
		},
	}),
}));

function RenderHookState({ tick }: { tick: number }) {
	useCreateDeploymentPage();
	return <div data-testid="tick">{tick}</div>;
}

function RerenderHarness() {
	const [tick, setTick] = useState(0);
	useEffect(() => {
		setTick(1);
	}, []);
	return <RenderHookState tick={tick} />;
}

describe("useCreateDeploymentPage", () => {
	it("does not re-run template reset effects on an unrelated rerender", () => {
		validateResetMock.mockClear();
		uploadResetMock.mockClear();
		const queryClient = new QueryClient();

		render(
			<QueryClientProvider client={queryClient}>
				<RerenderHarness />
			</QueryClientProvider>,
		);

		expect(validateResetMock).toHaveBeenCalledTimes(1);
		expect(uploadResetMock).toHaveBeenCalledTimes(1);
	});
});
