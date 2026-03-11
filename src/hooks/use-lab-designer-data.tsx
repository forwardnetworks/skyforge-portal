import type { SavedConfigRef } from "@/components/lab-designer-types";
import type { DesignEdge, DesignNode } from "@/components/lab-designer-types";
import {
	createClabernetesDeploymentFromTemplate,
	createContainerlabDeploymentFromTemplate,
	getUserScopeContainerlabTemplate,
	getUserScopeContainerlabTemplates,
	listRegistryRepositories,
	listUserContainerlabServers,
	listUserScopes,
	saveContainerlabTopologyYAML,
	validateContainerlabTopologyYAML,
} from "@/lib/api-client";
import { containerlabYamlToDesign } from "@/lib/containerlab-yaml";
import { queryKeys } from "@/lib/query-keys";
import { type QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function useLabDesignerData(opts: {
	queryClient: QueryClient;
	userId: string;
	runtime: "clabernetes" | "containerlab";
	importOpen: boolean;
	importSource: "user" | "blueprints";
	importDir: string;
	importFile: string;
	containerlabServer: string;
	labName: string;
	effectiveYaml: string;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	useSavedConfig: boolean;
	lastSaved: SavedConfigRef | null;
	openDeploymentOnCreate: boolean;
	setLastSaved: (value: SavedConfigRef | null) => void;
	setYamlMode: (value: "generated" | "custom") => void;
	setCustomYaml: (value: string) => void;
	setImportOpen: (value: boolean) => void;
	setLabName: (value: string) => void;
	setDefaultKind: (value: string) => void;
	setNodes: React.Dispatch<React.SetStateAction<DesignNode[]>>;
	setEdges: React.Dispatch<React.SetStateAction<DesignEdge[]>>;
	setSelectedNodeId: (value: string) => void;
	setUseSavedConfig: (value: boolean) => void;
}) {
	const [lastValidation, setLastValidation] = useState<{
		normalizedYAML: string;
		warnings: string[];
		errors: string[];
		valid: boolean;
	} | null>(null);

	const toAPISource = (value: string) => (value === "user" ? "user" : value);
	const USER_REPO_SOURCE = "user" as const;

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		retry: false,
		staleTime: 30_000,
	});

	const registryReposQ = useQuery({
		queryKey: queryKeys.registryRepos(""),
		queryFn: async () => listRegistryRepositories({ q: "", n: 2000 }),
		retry: false,
		staleTime: 60_000,
	});

	const containerlabServersQ = useQuery({
		queryKey: queryKeys.userContainerlabServers(),
		queryFn: listUserContainerlabServers,
		enabled: opts.runtime === "containerlab",
		retry: false,
		staleTime: 30_000,
	});

	const templatesQ = useQuery({
		queryKey: opts.userId
			? [
					"containerlabTemplates",
					opts.userId,
					opts.importSource,
					opts.importDir,
				]
			: ["containerlabTemplates", "none"],
		queryFn: async () =>
			getUserScopeContainerlabTemplates(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
			}),
		enabled: Boolean(opts.userId) && opts.importOpen,
		retry: false,
		staleTime: 30_000,
	});

	const templatePreviewQ = useQuery({
		queryKey: opts.userId
			? [
					"containerlabTemplate",
					opts.userId,
					opts.importSource,
					opts.importDir,
					opts.importFile,
				]
			: ["containerlabTemplate", "none"],
		queryFn: async () => {
			if (!opts.userId) throw new Error("missing user");
			if (!opts.importFile) return null;
			return getUserScopeContainerlabTemplate(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
				file: opts.importFile,
			});
		},
		enabled:
			Boolean(opts.userId) && opts.importOpen && Boolean(opts.importFile),
		retry: false,
		staleTime: 30_000,
	});

	const validateTopology = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			return validateContainerlabTopologyYAML(opts.userId, {
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
					resp.warnings[0] ?? "Designer and deployment path now share this normalized topology.",
			});
		},
		onError: (e) =>
			toast.error("Validation failed", {
				description: (e as Error).message,
			}),
	});

	const validateBeforePersist = async () => {
		if (!opts.userId) throw new Error("Select a user");
		const resp = await validateContainerlabTopologyYAML(opts.userId, {
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

	const createDeployment = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			const validation = await validateBeforePersist();
			if (
				opts.effectiveTemplatesDir !== "containerlab" &&
				!opts.effectiveTemplatesDir.startsWith("containerlab/")
			) {
				throw new Error("Repo path must be under containerlab/");
			}

			const canUseSaved =
				opts.useSavedConfig && opts.lastSaved?.userId === opts.userId;
			const saved = canUseSaved
				? opts.lastSaved
				: await saveContainerlabTopologyYAML(opts.userId, {
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

			if (opts.runtime === "containerlab") {
				if (!opts.containerlabServer) {
					throw new Error("Select a containerlab server");
				}
				return createContainerlabDeploymentFromTemplate(opts.userId, {
					name: opts.labName,
					netlabServer: opts.containerlabServer,
					templateSource: USER_REPO_SOURCE,
					templatesDir: saved.templatesDir,
					template: saved.template,
					autoDeploy: true,
				});
			}

			return createClabernetesDeploymentFromTemplate(opts.userId, {
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
				window.open(
					`/dashboard/deployments/${id}`,
					"_blank",
					"noopener,noreferrer",
				);
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
				opts.effectiveTemplatesDir !== "containerlab" &&
				!opts.effectiveTemplatesDir.startsWith("containerlab/")
			) {
				throw new Error("Repo path must be under containerlab/");
			}
			return saveContainerlabTopologyYAML(opts.userId, {
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
			return getUserScopeContainerlabTemplate(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
				file,
			});
		},
		onSuccess: (resp) => {
			const parsed = containerlabYamlToDesign(resp.yaml);
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
		userScopesQ,
		registryReposQ,
		containerlabServersQ,
		templatesQ,
		templatePreviewQ,
		validateTopology,
		lastValidation,
		createDeployment,
		saveConfig,
		importTemplate,
	};
}
