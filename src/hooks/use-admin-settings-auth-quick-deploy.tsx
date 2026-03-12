import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type AdminQuickDeployCatalogResponse,
	type AdminQuickDeployTemplateOptionsResponse,
	type QuickDeployTemplate,
	updateAdminQuickDeployCatalog,
} from "../lib/api-client";

type UseAdminSettingsAuthQuickDeployArgs = {
	quickDeployCatalog: AdminQuickDeployCatalogResponse | undefined;
	refetchQuickDeployCatalog: () => Promise<unknown>;
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

export function useAdminSettingsAuthQuickDeploy({
	quickDeployCatalog,
	refetchQuickDeployCatalog,
	quickDeployTemplateOptions,
	blueprintNetlabTemplates,
}: UseAdminSettingsAuthQuickDeployArgs) {
	const [quickDeployTemplates, setQuickDeployTemplates] = useState<
		QuickDeployTemplate[]
	>([]);
	const [selectedQuickDeployOption, setSelectedQuickDeployOption] =
		useState("");

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
				owner: "skyforge-platform",
				operatingModes: ["curated-demo", "training"],
				resourceClass: inferResourceClassFromTemplate(template),
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
		saveQuickDeployCatalog,
		hasQuickDeployTemplateRows,
		upsertQuickDeployTemplateField,
		removeQuickDeployTemplate,
		addQuickDeployTemplate,
		addQuickDeployTemplateFromOption,
	};
}
