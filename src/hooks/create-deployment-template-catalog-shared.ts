import type {
	DeploymentKind,
	TemplateSource,
} from "./create-deployment-shared";
import { USER_REPO_SOURCE } from "./create-deployment-shared";

export const fallbackNetlabDeviceOptions = [
	"asav",
	"eos",
	"fortios",
	"iol",
	"iol_l2",
	"iosxr",
	"linux",
	"sros",
	"vmx",
	"vsrx",
];

export function getEffectiveTemplateSource(
	watchKind: DeploymentKind,
	watchSource: string,
): TemplateSource {
	if (
		watchKind === "netlab" ||
		watchKind === "kne_netlab"
	) {
		if (watchSource === USER_REPO_SOURCE) return USER_REPO_SOURCE;
		if (watchSource === "custom") return "custom";
		return "blueprints";
	}
	if (watchKind === "kne_raw") {
		return watchSource as TemplateSource;
	}
	if (watchKind === "containerlab") {
		return watchSource as TemplateSource;
	}
	if (watchKind === "terraform") return watchSource as TemplateSource;
	return USER_REPO_SOURCE;
}

export function shouldIncludeTemplateRepo(
	source: TemplateSource,
	templateRepoId: string,
): boolean {
	return (
		(source === "external" || source === "custom") && Boolean(templateRepoId)
	);
}

export function filterTerraformTemplates(
	templates: string[],
	terraformProviderFilter: string,
): string[] {
	const filter = String(terraformProviderFilter ?? "all")
		.trim()
		.toLowerCase();
	if (!filter || filter === "all") return templates;
	return templates.filter(
		(template) =>
			String(template).toLowerCase().startsWith(`${filter}/`) ||
			String(template).toLowerCase() === filter,
	);
}

export function getTerraformProviders(templates: string[]): string[] {
	const providers = new Set<string>();
	for (const template of templates) {
		const provider = String(template ?? "")
			.split("/")[0]
			?.trim();
		if (provider) providers.add(provider);
	}
	return Array.from(providers).sort((a, b) => a.localeCompare(b));
}

export function getDeploymentModeOptions(watchKind: DeploymentKind) {
	switch (watchKind) {
		case "netlab":
		case "kne_netlab":
		case "containerlab":
		case "kne_raw":
			return [
				{ value: "in_cluster", label: "In cluster" },
				{ value: "byos", label: "BYOS" },
			];
		default:
			return [{ value: "in_cluster", label: "In cluster" }];
	}
}
