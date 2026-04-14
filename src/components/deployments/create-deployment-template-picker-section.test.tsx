import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateDeploymentTemplatePickerSection } from "./create-deployment-template-picker-section";
import { Form } from "../ui/form";

afterEach(() => {
	cleanup();
});

vi.mock("../ui/select", () => ({
	Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectTrigger: ({ children }: { children: ReactNode }) => (
		<div>{children}</div>
	),
	SelectValue: ({ placeholder }: { placeholder?: string }) => (
		<span>{placeholder ?? ""}</span>
	),
	SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
	SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

function RenderTemplatePicker({
	status,
	watchKind = "terraform",
	effectiveSource = "blueprints",
	netlabValidationResult = null,
}: {
	status: "connected" | "reauth_required" | "missing_account_role";
	watchKind?: string;
	effectiveSource?: string;
	netlabValidationResult?: any;
}) {
	const form = useForm({
		defaultValues: {
			template: "aws/CloudAWS",
			name: "aws-demo",
		},
	});

	const page = {
		form,
		watchKind,
		watchTemplate: "aws/CloudAWS",
		templates: ["aws/CloudAWS"],
		templatesQ: { isLoading: false, isError: false },
		terraformProviders: ["aws"],
		terraformProviderFilter: "all",
		setTerraformProviderFilter: vi.fn(),
		setTemplatePreviewOpen: vi.fn(),
		selectedTemplateEstimate: null,
		templateEstimatePending: false,
		validateTemplate: { isPending: false, mutate: vi.fn() },
		uploadNetlabTemplate: { isPending: false, mutate: vi.fn() },
		effectiveSource,
		netlabValidationResult,
		awsTerraformReadinessQ: {
			data: {
				configured: true,
				status,
				ready: status === "connected",
				connected: status === "connected",
				reauthRequired: status === "reauth_required",
				missingAccountRole: status === "missing_account_role",
				statusMessage:
					status === "connected"
						? "AWS Terraform is ready"
						: status === "missing_account_role"
							? "AWS account ID and role name are required"
							: "Reauthentication required",
				user: "craigjohnson",
				accountId: status === "missing_account_role" ? "" : "123456789012",
				roleName:
					status === "missing_account_role" ? "" : "AdministratorAccess",
			},
		},
		awsSsoStatusQ: {
			data: {
				status,
				statusMessage:
					status === "connected" ? "Connected" : "Reauthentication required",
			},
		},
	} as any;

	return (
		<Form {...form}>
			<CreateDeploymentTemplatePickerSection page={page} />
		</Form>
	);
}

describe("CreateDeploymentTemplatePickerSection", () => {
	it("blocks AWS Terraform validate when AWS SSO is not connected", () => {
		render(<RenderTemplatePicker status="reauth_required" />);

		expect(screen.getByText(/AWS SSO:/i)).toBeInTheDocument();
		expect(
			screen.getByText(/Terraform plan and is blocked until AWS SSO is connected/i),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /validate/i })).toBeDisabled();
	});

	it("allows AWS Terraform validate when AWS SSO is connected", () => {
		render(<RenderTemplatePicker status="connected" />);

		expect(
			screen.queryByText(/Terraform plan and is blocked until AWS SSO is connected/i),
		).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /validate/i })).not.toBeDisabled();
	});

	it("blocks AWS Terraform validate when AWS account or role is missing", () => {
		render(<RenderTemplatePicker status="missing_account_role" />);

		expect(
			screen.getByText(/blocked until AWS account ID and role name are saved/i),
		).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /validate/i })).toBeDisabled();
	});

	it("shows ZIP upload for user netlab templates", () => {
		render(
			<RenderTemplatePicker
				status="connected"
				watchKind="netlab"
				effectiveSource="blueprints"
			/>,
		);

		expect(
			screen.getByRole("button", { name: /upload yaml\/zip/i }),
		).toBeInTheDocument();
		expect(
			screen.getByText(/switches the source to `User repo`/i),
		).toBeInTheDocument();
	});

	it("renders netlab validation suggestions", () => {
		render(
			<RenderTemplatePicker
				status="connected"
				watchKind="netlab"
				effectiveSource="user"
				netlabValidationResult={{
					valid: false,
					summary: "Validation failed",
					diagnostics: [
						{
							code: "missing-sidecar-file",
							message: "startup-config configs/r1.cfg: no such file",
							suggestion: "Check relative startup-config paths.",
						},
					],
				}}
			/>,
		);

		expect(
			screen.getByText(/startup-config configs\/r1\.cfg: no such file/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/Check relative startup-config paths\./i),
		).toBeInTheDocument();
	});
});
