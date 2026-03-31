import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { CreateDeploymentFormCard } from "./create-deployment-form-card";

vi.mock("./create-deployment-basics-section", () => ({
	CreateDeploymentBasicsSection: () => <div data-testid="basics-section" />,
}));

vi.mock("./create-deployment-environment-section", () => ({
	CreateDeploymentEnvironmentSection: () => (
		<div data-testid="environment-section" />
	),
}));

function RenderCard(props?: {
	status?:
		| "connected"
		| "reauth_required"
		| "not_connected"
		| "not_configured"
		| "missing_account_role";
	accountId?: string;
	roleName?: string;
}) {
	const form = useForm({
		defaultValues: {
			userId: "user-1",
			name: "aws-demo",
			kind: "terraform",
			source: "blueprints",
			templateRepoId: "",
			template: "aws/CloudAWS",
			deploymentMode: "in_cluster",
			labLifetime: "never",
			env: [],
		},
	});

	const page = {
		navigate: vi.fn(),
		form,
		onSubmit: vi.fn(),
		watchUserScopeId: "user-1",
		watchKind: "terraform",
		watchTemplate: "aws/CloudAWS",
		terraformProviderFilter: "all",
		awsSsoStatusQ: {
			data: {
				status: props?.status ?? "reauth_required",
				statusMessage:
					props?.status === "connected"
						? "Connected"
						: "Reauthentication required",
				user: "craigjohnson",
				lastAuthenticatedAt: "2026-03-31T20:00:00Z",
				expiresAt: "2026-03-31T21:00:00Z",
			},
		},
		awsTerraformReadinessQ: {
			data: {
				configured: true,
				status: props?.status ?? "reauth_required",
				ready: props?.status === "connected",
				connected: props?.status === "connected",
				missingAccountRole: props?.status === "missing_account_role",
				reauthRequired: props?.status === "reauth_required",
				statusMessage:
					props?.status === "connected"
						? "AWS Terraform is ready"
						: props?.status === "missing_account_role"
							? "AWS account ID and role name are required"
							: "Reauthentication required",
				user: "craigjohnson",
				accountId: props?.accountId ?? "123456789012",
				roleName: props?.roleName ?? "AdministratorAccess",
				lastAuthenticatedAt: "2026-03-31T20:00:00Z",
				expiresAt: "2026-03-31T21:00:00Z",
			},
		},
		userAwsSsoQ: {
			data: {
				configured: true,
				accountId: props?.accountId ?? "123456789012",
				roleName: props?.roleName ?? "AdministratorAccess",
			},
		},
		awsSsoSession: null,
		awsSsoPollStatus: "",
		startAwsSsoM: { mutate: vi.fn(), isPending: false },
		mutation: { isPending: false, isError: false, error: null },
	} as any;

	return <CreateDeploymentFormCard page={page} />;
}

describe("CreateDeploymentFormCard", () => {
	it("shows effective AWS account and role and blocks create when reauth is required", () => {
		render(<RenderCard />);

		expect(screen.getByText(/AWS Terraform create is blocked/i)).toBeInTheDocument();
		expect(screen.getByText("123456789012")).toBeInTheDocument();
		expect(screen.getByText("AdministratorAccess")).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /create deployment/i }),
		).toBeDisabled();
		expect(
			screen.getByRole("button", { name: /reauthenticate aws/i }),
		).toBeInTheDocument();
	});

	it("allows create when AWS SSO is connected", () => {
		render(<RenderCard status="connected" />);

		expect(
			screen.queryByText(/AWS Terraform create is blocked/i),
		).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /create deployment/i }),
		).not.toBeDisabled();
	});

	it("blocks create when AWS account or role is missing", () => {
		render(<RenderCard status="missing_account_role" accountId="" roleName="" />);

		expect(
			screen.getByText(/AWS account ID and role name are saved in Cloud Credentials/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /create deployment/i }),
		).toBeDisabled();
	});
});
