import type { SavedConfigRef } from "@/components/lab-designer-types";
import {
	createKneDeploymentFromTemplate,
	getUserScopeNetlabTemplate,
	saveKneTopologyYAML,
	validateKneTopologyYAML,
} from "@/lib/api-client";
import { kneYamlToDesign } from "@/lib/kne-yaml";
import { queryKeys } from "@/lib/query-keys";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
	LabDesignerValidationState,
	UseLabDesignerDataOptions,
} from "./use-lab-designer-data-types";

const USER_REPO_SOURCE = "user" as const;

export function useLabDesignerDataMutations(args: {
	opts: UseLabDesignerDataOptions;
	setLastValidation: React.Dispatch<
		React.SetStateAction<LabDesignerValidationState | null>
	>;
}) {
	const { opts, setLastValidation } = args;
	const toAPISource = (value: string) => (value === "user" ? "user" : value);

	const validateBeforePersist = async () => {
		if (!opts.userId) throw new Error("Select a user");
		const resp = await validateKneTopologyYAML(opts.userId, {
			name: opts.labName,
			topologyYAML: opts.effectiveYaml,
		});
		setLastValidation({
			normalizedYAML: resp.normalizedYAML,
			warnings: resp.warnings,
			errors: resp.errors,
			valid: resp.valid,
		});
		if (resp.normalizedYAML !== opts.effectiveYaml) {
			opts.setYamlMode("custom");
			opts.setCustomYaml(resp.normalizedYAML);
			opts.setUseSavedConfig(false);
		}
		if (!resp.valid) {
			throw new Error(resp.errors[0] || "Topology validation failed");
		}
		return resp;
	};

	const validateTopology = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			return validateKneTopologyYAML(opts.userId, {
				name: opts.labName,
				topologyYAML: opts.effectiveYaml,
			});
		},
		onSuccess: (resp) => {
			setLastValidation({
				normalizedYAML: resp.normalizedYAML,
				warnings: resp.warnings,
				errors: resp.errors,
				valid: resp.valid,
			});
			if (resp.normalizedYAML !== opts.effectiveYaml) {
				opts.setYamlMode("custom");
				opts.setCustomYaml(resp.normalizedYAML);
				opts.setUseSavedConfig(false);
			}
			if (resp.errors.length > 0) {
				toast.error("Validation failed", {
					description: resp.errors[0],
				});
				return;
			}
			toast.success("Topology validated", {
				description:
					resp.warnings[0] ??
					"Designer and deployment path now share this normalized topology.",
			});
		},
		onError: (e) =>
			toast.error("Validation failed", {
				description: (e as Error).message,
			}),
	});

	const createDeployment = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			const validation = await validateBeforePersist();
			if (
				opts.effectiveTemplatesDir !== "kne" &&
				!opts.effectiveTemplatesDir.startsWith("kne/")
			) {
				throw new Error("Repo path must be under kne/");
			}

			const canUseSaved =
				opts.useSavedConfig && opts.lastSaved?.userId === opts.userId;
			const saved = canUseSaved
				? opts.lastSaved
				: await saveKneTopologyYAML(opts.userId, {
						name: opts.labName,
						topologyYAML: validation.normalizedYAML,
						templatesDir: opts.effectiveTemplatesDir,
						template: opts.effectiveTemplateFile,
				  }).then((resp) => {
						const next: SavedConfigRef = {
							userId: resp.userId,
							templatesDir: resp.templatesDir,
							template: resp.template,
							filePath: resp.filePath,
							branch: resp.branch,
						};
						opts.setLastSaved(next);
						return next;
				  });
			if (!saved) throw new Error("Failed to resolve saved topology reference");

			return createKneDeploymentFromTemplate(opts.userId, {
				name: opts.labName,
				templateSource: USER_REPO_SOURCE,
				templatesDir: saved.templatesDir,
				template: saved.template,
				autoDeploy: true,
			});
		},
		onSuccess: async (resp) => {
			toast.success("Deployment created", {
				description: resp.deployment?.name ?? opts.labName,
			});
			await opts.queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			const id = resp.deployment?.id;
			if (opts.openDeploymentOnCreate && id) {
				window.open(`/dashboard/deployments/${id}`, "_blank", "noopener,noreferrer");
			}
		},
		onError: (e) =>
			toast.error("Create deployment failed", {
				description: (e as Error).message,
			}),
	});

	const saveConfig = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			const validation = await validateBeforePersist();
			if (
				opts.effectiveTemplatesDir !== "kne" &&
				!opts.effectiveTemplatesDir.startsWith("kne/")
			) {
				throw new Error("Repo path must be under kne/");
			}
			return saveKneTopologyYAML(opts.userId, {
				name: opts.labName,
				topologyYAML: validation.normalizedYAML,
				templatesDir: opts.effectiveTemplatesDir,
				template: opts.effectiveTemplateFile,
			});
		},
		onSuccess: (resp) => {
			opts.setLastSaved({
				userId: resp.userId,
				templatesDir: resp.templatesDir,
				template: resp.template,
				filePath: resp.filePath,
				branch: resp.branch,
			});
			toast.success("Saved to repo", {
				description: `${resp.filePath} (${resp.branch})`,
			});
		},
		onError: (e) =>
			toast.error("Save failed", { description: (e as Error).message }),
	});

	const importTemplate = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			const file = opts.importFile.trim();
			if (!file) throw new Error("Select a template");
			return getUserScopeNetlabTemplate(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
				template: file,
			});
		},
		onSuccess: (resp) => {
			const parsed = kneYamlToDesign(resp.yaml);
			opts.setLabName(parsed.design.name);
			opts.setDefaultKind(parsed.design.defaultKind ?? "");
			opts.setNodes(
				parsed.design.nodes.map((node: (typeof parsed.design.nodes)[number]) => ({
					id: node.id,
					position: node.position ?? { x: 120, y: 120 },
					data: {
						label: node.label ?? node.id,
						kind: node.kind ?? "",
						image: node.image ?? "",
						mgmtIpv4: node.mgmtIpv4,
						startupConfig: node.startupConfig,
						env: node.env,
						interfaces: node.interfaces,
						notes: node.notes,
						status: node.status,
					},
					type: "designerNode",
				})),
			);
			opts.setEdges(
				parsed.design.links.map((link: (typeof parsed.design.links)[number]) => ({
					id: link.id,
					source: link.source,
					target: link.target,
					label:
						link.label ||
						`${link.sourceIf || link.source} ↔ ${link.targetIf || link.target}`,
					data: {
						label: link.label,
						sourceIf: link.sourceIf,
						targetIf: link.targetIf,
						mtu: link.mtu,
						notes: link.notes,
					},
				})),
			);
			opts.setSelectedNodeId(parsed.design.nodes[0]?.id ?? "");
			opts.setYamlMode("generated");
			opts.setCustomYaml("");
			opts.setImportOpen(false);
			toast.success("Template imported", { description: resp.path });
		},
		onError: (e) =>
			toast.error("Import failed", { description: (e as Error).message }),
	});

	return {
		validateTopology,
		createDeployment,
		saveConfig,
		importTemplate,
	};
}
