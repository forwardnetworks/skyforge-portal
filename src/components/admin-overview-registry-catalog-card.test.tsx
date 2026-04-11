import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminOverviewRegistryCatalogCard } from "./admin-overview-registry-catalog-card";

function makeProps(overrides: Record<string, unknown> = {}) {
	return {
		adminRegistryCatalog: {
			source: "admin-config",
			hasPassword: false,
		},
		adminRegistryCatalogLoading: false,
		registryBaseURLDraft: "https://ghcr.io",
		registrySkipTLSVerifyDraft: false,
		registryRepoPrefixesDraft: "forwardnetworks/kne",
		registryUsernameDraft: "",
		registryPasswordDraft: "",
		registryPrepullWorkerNodesDraft: false,
		registryDiscoveredReposLoading: false,
		registryDiscoveredReposError: false,
		registryDiscoveredRepoCount: 4,
		registryCatalogRepoCount: 2,
		registryMissingCatalogRepos: [
			"ghcr.io/forwardnetworks/kubevirt/juniper_vjunos-router",
			"ghcr.io/forwardnetworks/kubevirt/vr-n9kv",
		],
		registryDisabledDiscoveredRepos: [],
		registryCatalogImagesDraft: [
			{
				repository: "ghcr.io/forwardnetworks/kne/cisco_iol",
				kind: "cisco_iol",
				role: "router",
				defaultTag: "latest",
				enabled: true,
			},
		],
		saveRegistryCatalogPending: false,
		triggerRegistryCatalogPrepullPending: false,
		onRegistryBaseURLChange: vi.fn(),
		onRegistrySkipTLSVerifyChange: vi.fn(),
		onRegistryRepoPrefixesChange: vi.fn(),
		onRegistryUsernameChange: vi.fn(),
		onRegistryPasswordChange: vi.fn(),
		onRegistryPrepullWorkerNodesChange: vi.fn(),
		onRegistryCatalogImageFieldChange: vi.fn(),
		onAddRegistryCatalogImage: vi.fn(),
		onRemoveRegistryCatalogImage: vi.fn(),
		onAddMissingRegistryReposToCatalog: vi.fn(),
		onSaveRegistryCatalog: vi.fn(),
		onTriggerRegistryCatalogPrepull: vi.fn(),
		...overrides,
	};
}

describe("AdminOverviewRegistryCatalogCard", () => {
	it("shows coverage counters and allows seeding missing repos", () => {
		const props = makeProps();
		render(<AdminOverviewRegistryCatalogCard {...(props as any)} />);

		expect(screen.getByText("missing in catalog: 2")).toBeInTheDocument();
		expect(
			screen.getByText("disabled in catalog: 0"),
		).toBeInTheDocument();
		expect(
			screen.getByText("ghcr.io/forwardnetworks/kubevirt/vr-n9kv"),
		).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("button", {
				name: "Add missing discovered repos to catalog draft",
			}),
		);
		expect(props.onAddMissingRegistryReposToCatalog).toHaveBeenCalledTimes(1);
	});

	it("renders aligned state when all discovered repos are covered", () => {
		const props = makeProps({
			registryMissingCatalogRepos: [],
			registryCatalogRepoCount: 4,
		});
		render(<AdminOverviewRegistryCatalogCard {...(props as any)} />);

		expect(
			screen.getByText("All discovered repositories are represented in catalog rows."),
		).toBeInTheDocument();
	});
});
