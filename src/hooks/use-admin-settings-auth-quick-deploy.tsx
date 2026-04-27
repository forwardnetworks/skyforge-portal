import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type AdminQuickDeployCatalogResponse,
	type AdminQuickDeployTemplateOptionsResponse,
	type QuickDeployTemplate,
	updateAdminQuickDeployCatalog,
	updateAdminQuickDeployRepo,
} from "../lib/api-client";

type UseAdminSettingsAuthQuickDeployArgs = {
	quickDeployCatalog: AdminQuickDeployCatalogResponse | undefined;
	refetchQuickDeployCatalog: () => Promise<unknown>;
	refetchQuickDeployTemplateOptions: () => Promise<unknown>;
	quickDeployTemplateOptions:
		| AdminQuickDeployTemplateOptionsResponse
		| undefined;
	blueprintNetlabTemplates:
		| {
				templates?: string[] | null;
		  }
		| undefined;
};

function quickDeployTemplateIdFromPath(path: string): string {
	return path
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function quickDeployTemplateNameFromPath(path: string): string {
	const normalized = path
		.trim()
		.replace(/\/topology\.ya?ml$/i, "")
		.split("/")
		.filter((part) => part.length > 0);
	if (normalized.length === 0) {
		return "Template";
	}
	const last = normalized.slice(-2).join(" / ");
	return last.replace(/[-_]/g, " ");
}

const curatedQuickDeployTemplates = new Set([
	"bgp/unnumbered/topology.yml",
	"evpn/ebgp/topology.yml",
	"evpn/symmetric-irb/topology.yml",
	"mpls/sr-vpnv4/topology.yml",
	"mpls/vpn-simple/topology.yml",
	"vrf/vrf-hub-spoke/topology.yml",
]);

function normalizeQuickDeployTemplatePath(path: string): string {
	return path
		.trim()
		.toLowerCase()
		.replace(/^\/+/, "")
		.replace(/^netlab\//, "")
		.replace(/^labs\//, "");
}

export function useAdminSettingsAuthQuickDeploy({
	quickDeployCatalog,
	refetchQuickDeployCatalog,
	refetchQuickDeployTemplateOptions,
	quickDeployTemplateOptions,
	blueprintNetlabTemplates,
}: UseAdminSettingsAuthQuickDeployArgs) {
	const [quickDeployTemplates, setQuickDeployTemplates] = useState<
		QuickDeployTemplate[]
	>([]);
	const [selectedQuickDeployOption, setSelectedQuickDeployOption] =
		useState("");
	const [quickDeployRepoDraft, setQuickDeployRepoDraft] = useState("");

	useEffect(() => {
		if (!quickDeployCatalog?.templates) {
			return;
		}
		setQuickDeployTemplates(
			quickDeployCatalog.templates.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description,
				template: item.template,
				templateSource: item.templateSource,
				templateRepo: item.templateRepo,
				templatesDir: item.templatesDir,
				tags: item.tags ?? [],
				owner: item.owner ?? "skyforge-platform",
				operatingModes: item.operatingModes ?? ["curated-demo", "training"],
				resourceClass: item.resourceClass,
				allowedProfiles: item.allowedProfiles ?? [],
				resetBaselineMode: item.resetBaselineMode ?? "curated-reset",
				integrationDependencies: item.integrationDependencies ?? [
					"forward",
					"managed-collector",
				],
				placementHints: item.placementHints ?? ["lab"],
			})),
		);
	}, [quickDeployCatalog?.templates]);

	useEffect(() => {
		const nextRepo = (
			quickDeployTemplateOptions?.repo ??
			quickDeployCatalog?.repo ??
			""
		).trim();
		if (!nextRepo) {
			return;
		}
		setQuickDeployRepoDraft(nextRepo);
	}, [quickDeployCatalog?.repo, quickDeployTemplateOptions?.repo]);

	const saveQuickDeployCatalog = useMutation({
		mutationFn: async () =>
			updateAdminQuickDeployCatalog({
				templates: quickDeployTemplates,
			}),
		onSuccess: async () => {
			toast.success("Quick deploy catalog saved");
			await refetchQuickDeployCatalog();
		},
		onError: (e) => {
			toast.error("Failed to save quick deploy catalog", {
				description: (e as Error).message,
			});
		},
	});

	const saveQuickDeployRepo = useMutation({
		mutationFn: async () =>
			updateAdminQuickDeployRepo({
				repo: quickDeployRepoDraft.trim(),
			}),
		onSuccess: async () => {
			toast.success("Quick deploy template repo updated");
			await Promise.all([
				refetchQuickDeployCatalog(),
				refetchQuickDeployTemplateOptions(),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update quick deploy template repo", {
				description: (e as Error).message,
			});
		},
	});

	const parseCommaList = (value: string) =>
		value
			.split(",")
			.map((entry) => entry.trim())
			.filter((entry) => entry.length > 0);

	const upsertQuickDeployTemplateField = (
		index: number,
		field: keyof QuickDeployTemplate,
		value: string,
	) => {
		const nextValue =
			field === "allowedProfiles" ||
			field === "operatingModes" ||
			field === "tags" ||
			field === "integrationDependencies" ||
			field === "placementHints"
				? parseCommaList(value)
				: value;
		setQuickDeployTemplates((prev) =>
			prev.map((item, itemIndex) =>
				itemIndex === index ? { ...item, [field]: nextValue } : item,
			),
		);
	};

	const removeQuickDeployTemplate = (index: number) => {
		setQuickDeployTemplates((prev) =>
			prev.filter((_, itemIndex) => itemIndex !== index),
		);
	};

	const addQuickDeployTemplate = () => {
		setQuickDeployTemplates((prev) => [
			...prev,
			{
				id: "",
				name: "",
				description: "",
				template: "",
				owner: "skyforge-platform",
				operatingModes: ["curated-demo", "training"],
				resourceClass: "standard",
				tags: [],
				allowedProfiles: [],
				resetBaselineMode: "curated-reset",
				integrationDependencies: ["forward", "managed-collector"],
				placementHints: ["lab"],
			},
		]);
	};

	const inferResourceClassFromTemplate = (template: string): string => {
		const normalized = template.trim().toLowerCase();
		if (
			normalized.includes("evpn") ||
			normalized.includes("mpls") ||
			normalized.includes("vxlan")
		) {
			return "heavy";
		}
		if (normalized.includes("vrf") || normalized.includes("bgp")) {
			return "standard";
		}
		return "small";
	};

	const inferTagsFromTemplate = (template: string): string[] => {
		const normalizedRepo = quickDeployRepoDraft.trim().toLowerCase();
		const normalizedTemplate = normalizeQuickDeployTemplatePath(template);
		if (
			normalizedRepo.includes("blueprints") &&
			curatedQuickDeployTemplates.has(normalizedTemplate)
		) {
			return ["curated"];
		}
		return `${normalizedRepo} ${normalizedTemplate}`.includes("training")
			? ["training"]
			: [];
	};

	const addQuickDeployTemplateFromOption = () => {
		const template = selectedQuickDeployOption.trim();
		if (!template) return;
		const exists = quickDeployTemplates.some(
			(item) => item.template.trim().toLowerCase() === template.toLowerCase(),
		);
		if (exists) {
			toast.message("Template already in catalog", { description: template });
			return;
		}
		const name = quickDeployTemplateNameFromPath(template);
		const id = quickDeployTemplateIdFromPath(template);
		setQuickDeployTemplates((prev) => [
			...prev,
			{
				id,
				name,
				description: `Blueprint topology: ${template}`,
				template,
				templateSource: "blueprints",
				owner: "skyforge-platform",
				operatingModes: ["curated-demo", "training"],
				resourceClass: inferResourceClassFromTemplate(template),
				tags: inferTagsFromTemplate(template),
				allowedProfiles: [],
				resetBaselineMode: "curated-reset",
				integrationDependencies: ["forward", "managed-collector"],
				placementHints: ["lab"],
			},
		]);
		setSelectedQuickDeployOption("");
	};

	const availableQuickDeployTemplates = useMemo(() => {
		const fromAdminOptions = quickDeployTemplateOptions?.templates ?? [];
		const fromScopeCatalog = blueprintNetlabTemplates?.templates ?? [];
		const merged = new Set<string>();
		for (const item of [...fromAdminOptions, ...fromScopeCatalog]) {
			const path = String(item ?? "").trim();
			if (!path) continue;
			merged.add(path);
		}
		return Array.from(merged).sort((a, b) => a.localeCompare(b));
	}, [
		quickDeployTemplateOptions?.templates,
		blueprintNetlabTemplates?.templates,
	]);

	const hasQuickDeployTemplateRows =
		quickDeployTemplates.filter((item) => item.template.trim().length > 0)
			.length > 0;

	return {
		selectedQuickDeployOption,
		setSelectedQuickDeployOption,
		availableQuickDeployTemplates,
		quickDeployTemplates,
		quickDeployRepoDraft,
		setQuickDeployRepoDraft,
		saveQuickDeployRepo,
		saveQuickDeployCatalog,
		hasQuickDeployTemplateRows,
		upsertQuickDeployTemplateField,
		removeQuickDeployTemplate,
		addQuickDeployTemplate,
		addQuickDeployTemplateFromOption,
	};
}
