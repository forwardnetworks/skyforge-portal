import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOverviewQuickDeployCard } from "./admin-overview-quick-deploy-card";

function makeProps(overrides: Record<string, unknown> = {}) {
	return {
		onAllowedProfilesChange: vi.fn(),
		quickDeploySource: "blueprints",
		quickDeployRepo: "skyforge/blueprints",
		quickDeployBranch: "main",
		quickDeployDir: "netlab",
		selectedQuickDeployOption: "EVPN/fabric/topology.yml",
		availableQuickDeployTemplates: ["EVPN/fabric/topology.yml"],
		quickDeployTemplates: [
			{
				id: "evpn-fabric",
				name: "EVPN Fabric",
				template: "EVPN/fabric/topology.yml",
				description: "Demo fabric",
				owner: "ts",
				operatingModes: ["curated-demo"],
				resourceClass: "standard",
				resetBaselineMode: "curated-reset",
				integrationDependencies: ["forward"],
				placementHints: ["lab"],
				allowedProfiles: ["demo-user"],
			},
		],
		quickDeployLookupFailed: false,
		quickDeployCatalogLoading: false,
		saveQuickDeployCatalogPending: false,
		hasQuickDeployTemplateRows: true,
		onSelectedQuickDeployOptionChange: vi.fn(),
		onAddQuickDeployTemplateFromOption: vi.fn(),
		onQuickDeployTemplateFieldChange: vi.fn(),
		onRemoveQuickDeployTemplate: vi.fn(),
		onAddQuickDeployTemplate: vi.fn(),
		onSaveQuickDeployCatalog: vi.fn(),
		...overrides,
	};
}

describe("AdminOverviewQuickDeployCard", () => {
	it("shows catalog source details and enables adding indexed templates", () => {
		const props = makeProps();
		render(<AdminOverviewQuickDeployCard {...(props as any)} />);

		expect(screen.getByText(/Source: blueprints/)).toBeInTheDocument();
		expect(screen.getByText(/Blueprint repo: skyforge\/blueprints @ main/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /add from index/i }));
		expect(props.onAddQuickDeployTemplateFromOption).toHaveBeenCalledTimes(1);
	});

	it("routes allowed profile edits through the dedicated callback", () => {
		const props = makeProps();
		render(<AdminOverviewQuickDeployCard {...(props as any)} />);

		fireEvent.change(screen.getByDisplayValue("demo-user"), {
			target: { value: "demo-user, trainer" },
		});
		expect(props.onAllowedProfilesChange).toHaveBeenCalledWith(0, "demo-user, trainer");
	});
});
