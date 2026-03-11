import type { SavedConfigRef } from "@/components/lab-designer-types";
import {
	createClabernetesDeploymentFromTemplate,
	createContainerlabDeploymentFromTemplate,
	getUserScopeContainerlabTemplate,
	getUserScopeContainerlabTemplates,
	listRegistryRepositories,
	listUserContainerlabServers,
	listUserScopes,
	saveContainerlabTopologyYAML,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { type QueryClient, useMutation, useQuery } from "@tanstack/react-query";
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
}) {
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

	const createDeployment = useMutation({
		mutationFn: async () => {
			if (!opts.userId) throw new Error("Select a user");
			if (!opts.effectiveYaml.trim()) throw new Error("YAML is empty");
			if (!/^\s*topology\s*:/m.test(opts.effectiveYaml)) {
				throw new Error("YAML must contain a top-level 'topology:' section");
			}
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
						topologyYAML: opts.effectiveYaml,
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
			if (!opts.effectiveYaml.trim()) throw new Error("YAML is empty");
			if (!/^\s*topology\s*:/m.test(opts.effectiveYaml)) {
				throw new Error("YAML must contain a top-level 'topology:' section");
			}
			if (
				opts.effectiveTemplatesDir !== "containerlab" &&
				!opts.effectiveTemplatesDir.startsWith("containerlab/")
			) {
				throw new Error("Repo path must be under containerlab/");
			}
			return saveContainerlabTopologyYAML(opts.userId, {
				name: opts.labName,
				topologyYAML: opts.effectiveYaml,
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
			opts.setYamlMode("custom");
			opts.setCustomYaml(resp.yaml);
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
		createDeployment,
		saveConfig,
		importTemplate,
	};
}
