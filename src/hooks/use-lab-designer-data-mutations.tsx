import type {
	ImportedNodeMetadata,
	SavedConfigRef,
	StartupConfigData,
} from "@/components/lab-designer-types";
import { resolveTopologyImageTags } from "@/hooks/lab-designer-utils";
import {
	createKneDeploymentFromTemplate,
	getKneDesignerSidecar,
	getRegistryCatalog,
	getUserScopeKNETemplate,
	importTopology,
	saveKneTopologyYAML,
	validateKneTopologyYAML,
} from "@/lib/api-client";
import { invalidateDashboardQueries } from "@/lib/dashboard-query-sync";
import { kneYamlToDesign } from "@/lib/kne-yaml";
import { normalizeStartupConfig } from "@/lib/lab-designer-startup-config";
import { queryKeys } from "@/lib/query-keys";
import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";
import type {
	LabDesignerImportState,
	LabDesignerValidationState,
	UseLabDesignerDataOptions,
} from "./use-lab-designer-data-types";

const USER_REPO_SOURCE = "user" as const;

type DesignerSidecarState = {
	version: number;
	labName: string;
	defaultKind?: string;
	viewport?: { x: number; y: number; zoom: number };
	annotations?: Array<{
		id: string;
		title?: string;
		text?: string;
		x?: number;
		y?: number;
	}>;
	groups?: Array<{
		id: string;
		label?: string;
		nodeIds?: string[];
	}>;
	nodes: Array<{
		id: string;
		label?: string;
		kind?: string;
		image?: string;
		x: number;
		y: number;
		mgmtIpv4?: string;
		runtime?: string;
		startupConfig?: StartupConfigData;
		env?: Record<string, string>;
		interfaces?: unknown;
		notes?: string;
		status?: string;
		importMeta?: ImportedNodeMetadata;
	}>;
	edges: Array<{
		id: string;
		source: string;
		target: string;
		label?: string;
		sourceIf?: string;
		targetIf?: string;
		mtu?: number;
		notes?: string;
	}>;
};

const SIDE_CAR_RESERVED_KEYS = new Set([
	"version",
	"labName",
	"defaultKind",
	"viewport",
	"annotations",
	"groups",
	"nodes",
	"edges",
]);

export function extractPreservedDesignerSidecarFields(
	sidecar: Record<string, unknown> | undefined,
): Record<string, unknown> {
	if (!sidecar || typeof sidecar !== "object") return {};
	const preserved: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(sidecar)) {
		if (SIDE_CAR_RESERVED_KEYS.has(key)) continue;
		preserved[key] = value;
	}
	return preserved;
}

export function buildDesignerSidecarStateForSave(args: {
	labName: string;
	defaultKind: string;
	viewport?: { x: number; y: number; zoom: number };
	annotations?: DesignerSidecarState["annotations"];
	groups?: DesignerSidecarState["groups"];
	nodes: DesignerSidecarState["nodes"];
	edges: DesignerSidecarState["edges"];
	preserved: Record<string, unknown>;
}): Record<string, unknown> {
	return {
		...args.preserved,
		version: 2,
		labName: args.labName,
		defaultKind: String(args.defaultKind ?? "").trim() || undefined,
		viewport: args.viewport,
		annotations: args.annotations,
		groups: args.groups,
		nodes: args.nodes,
		edges: args.edges,
	};
}

export function useLabDesignerDataMutations(args: {
	opts: UseLabDesignerDataOptions;
	setLastValidation: React.Dispatch<
		React.SetStateAction<LabDesignerValidationState | null>
	>;
	setLastImportResult: React.Dispatch<
		React.SetStateAction<LabDesignerImportState | null>
	>;
}) {
	const { opts, setLastValidation, setLastImportResult } = args;
	const toAPISource = (value: string) => (value === "user" ? "user" : value);
	const preservedSidecarRef = useRef<Record<string, unknown>>({});

	const resolveTopologyImageRefs = async (
		topologyYAML: string,
	): Promise<{ normalizedYAML: string; updatedImageCount: number }> => {
		const catalog = await opts.queryClient
			.fetchQuery({
				queryKey: queryKeys.registryCatalog(),
				queryFn: async () => getRegistryCatalog(),
				retry: false,
				staleTime: 30_000,
			})
			.catch(() => null);

		const fallbackTagByRepo: Record<string, string> = {};
		for (const row of catalog?.images ?? []) {
			const repo = String(row?.repository ?? "")
				.trim()
				.replace(/^\/+|\/+$/g, "");
			if (!repo) continue;
			const fallbackTag = String(row?.defaultTag ?? "").trim() || "latest";
			fallbackTagByRepo[repo] = fallbackTag;
		}

		const resolved = await resolveTopologyImageTags({
			topologyYAML,
			queryClient: opts.queryClient,
			fallbackTagByRepo,
		});
		return {
			normalizedYAML: resolved.topologyYAML,
			updatedImageCount: resolved.updatedImages.length,
		};
	};

	const buildDesignerSidecarState = (): Record<string, unknown> =>
		buildDesignerSidecarStateForSave({
			labName: opts.labName,
			defaultKind: opts.defaultKind,
			viewport: opts.rfInstance?.getViewport(),
			annotations: opts.annotations.map((item) => ({
				id: String(item.id),
				title: String(item.title ?? "").trim() || undefined,
				text: String(item.text ?? ""),
				x: Number(item.x ?? 0),
				y: Number(item.y ?? 0),
			})),
			groups: opts.groups.map((group) => ({
				id: String(group.id),
				label: String(group.label ?? "").trim() || undefined,
				nodeIds: Array.isArray(group.nodeIds)
					? group.nodeIds.map((id) => String(id)).filter(Boolean)
					: [],
			})),
			nodes: opts.nodes.map((node) => ({
				id: String(node.id),
				label: String(node.data?.label ?? ""),
				kind: String(node.data?.kind ?? ""),
				image: String(node.data?.image ?? ""),
				x: Number(node.position?.x ?? 0),
				y: Number(node.position?.y ?? 0),
				runtime: String(node.data?.runtime ?? "").trim() || undefined,
				mgmtIpv4: String(node.data?.mgmtIpv4 ?? "").trim() || undefined,
				startupConfig: normalizeStartupConfig(node.data?.startupConfig),
				env: node.data?.env,
				interfaces: node.data?.interfaces,
				notes: String(node.data?.notes ?? "").trim() || undefined,
				status: String(node.data?.status ?? "").trim() || undefined,
				importMeta: node.data?.importMeta,
			})),
			edges: opts.edges.map((edge) => ({
				id: String(edge.id),
				source: String(edge.source),
				target: String(edge.target),
				label: String(edge.data?.label ?? edge.label ?? "").trim() || undefined,
				sourceIf: String(edge.data?.sourceIf ?? "").trim() || undefined,
				targetIf: String(edge.data?.targetIf ?? "").trim() || undefined,
				mtu: Number.isFinite(Number(edge.data?.mtu))
					? Number(edge.data?.mtu)
					: undefined,
				notes: String(edge.data?.notes ?? "").trim() || undefined,
			})),
			preserved: preservedSidecarRef.current,
		});

	const mergeDesignerSidecar = (
		sidecar: Record<string, unknown> | undefined,
	): void => {
		if (!sidecar || typeof sidecar !== "object") return;
		preservedSidecarRef.current =
			extractPreservedDesignerSidecarFields(sidecar);
		const root = sidecar as {
			defaultKind?: unknown;
			viewport?: unknown;
			annotations?: unknown;
			groups?: unknown;
			nodes?: unknown;
			edges?: unknown;
		};
		if (typeof root.defaultKind === "string" && root.defaultKind.trim()) {
			opts.setDefaultKind(root.defaultKind.trim());
		}
		if (Array.isArray(root.nodes)) {
			const byID = new Map<string, any>();
			for (const entry of root.nodes) {
				if (!entry || typeof entry !== "object") continue;
				const id = String((entry as any).id ?? "").trim();
				if (!id) continue;
				byID.set(id, entry as any);
			}
			opts.setNodes((prev) =>
				prev.map((node) => {
					const saved = byID.get(String(node.id));
					if (!saved) return node;
					const x = Number(saved.x);
					const y = Number(saved.y);
					return {
						...node,
						position: {
							x: Number.isFinite(x) ? x : node.position.x,
							y: Number.isFinite(y) ? y : node.position.y,
						},
						data: {
							...node.data,
							label:
								typeof saved.label === "string" && saved.label.trim()
									? saved.label.trim()
									: node.data?.label,
							notes:
								typeof saved.notes === "string"
									? saved.notes
									: node.data?.notes,
							status:
								typeof saved.status === "string"
									? saved.status
									: node.data?.status,
							mgmtIpv4:
								typeof saved.mgmtIpv4 === "string"
									? saved.mgmtIpv4
									: node.data?.mgmtIpv4,
							runtime:
								typeof saved.runtime === "string"
									? saved.runtime
									: node.data?.runtime,
							startupConfig:
								normalizeStartupConfig(saved.startupConfig) ??
								node.data?.startupConfig,
							importMeta:
								saved.importMeta &&
								typeof saved.importMeta === "object"
									? (saved.importMeta as ImportedNodeMetadata)
									: node.data?.importMeta,
						},
					};
				}),
			);
		}
		if (Array.isArray(root.annotations)) {
			const annotationRows: unknown[] = root.annotations;
			opts.setAnnotations(() =>
				annotationRows
					.filter((entry) => entry && typeof entry === "object")
					.map((entry: unknown) => {
						const row = entry as {
							id?: unknown;
							title?: unknown;
							text?: unknown;
							x?: unknown;
							y?: unknown;
						};
						const id = String(row.id ?? "").trim();
						if (!id) return null;
						const x = Number(row.x);
						const y = Number(row.y);
						return {
							id,
							title: String(row.title ?? ""),
							text: String(row.text ?? ""),
							x: Number.isFinite(x) ? x : 0,
							y: Number.isFinite(y) ? y : 0,
						};
					})
					.filter(
						(
							value,
						): value is {
							id: string;
							title: string;
							text: string;
							x: number;
							y: number;
						} => Boolean(value),
					),
			);
		}
		if (Array.isArray(root.groups)) {
			const groupRows: unknown[] = root.groups;
			opts.setGroups(() =>
				groupRows
					.filter((entry) => entry && typeof entry === "object")
					.map((entry: unknown) => {
						const row = entry as {
							id?: unknown;
							label?: unknown;
							nodeIds?: unknown;
						};
						const id = String(row.id ?? "").trim();
						if (!id) return null;
						return {
							id,
							label: String(row.label ?? ""),
							nodeIds: Array.isArray(row.nodeIds)
								? row.nodeIds
										.map((nodeID: unknown) => String(nodeID))
										.filter(Boolean)
								: [],
						};
					})
					.filter(
						(
							value,
						): value is {
							id: string;
							label: string;
							nodeIds: string[];
						} => Boolean(value),
					),
			);
		}
		if (Array.isArray(root.edges)) {
			const byID = new Map<string, any>();
			for (const entry of root.edges) {
				if (!entry || typeof entry !== "object") continue;
				const id = String((entry as any).id ?? "").trim();
				if (!id) continue;
				byID.set(id, entry as any);
			}
			opts.setEdges((prev) =>
				prev.map((edge) => {
					const saved = byID.get(String(edge.id));
					if (!saved) return edge;
					const mtu = Number(saved.mtu);
					return {
						...edge,
						label:
							typeof saved.label === "string" && saved.label.trim()
								? saved.label.trim()
								: edge.label,
						data: {
							...edge.data,
							label:
								typeof saved.label === "string"
									? saved.label
									: edge.data?.label,
							sourceIf:
								typeof saved.sourceIf === "string"
									? saved.sourceIf
									: edge.data?.sourceIf,
							targetIf:
								typeof saved.targetIf === "string"
									? saved.targetIf
									: edge.data?.targetIf,
							mtu: Number.isFinite(mtu) ? mtu : edge.data?.mtu,
							notes:
								typeof saved.notes === "string"
									? saved.notes
									: edge.data?.notes,
						},
					};
				}),
			);
		}
		if (root.viewport && typeof root.viewport === "object") {
			const view = root.viewport as {
				x?: unknown;
				y?: unknown;
				zoom?: unknown;
			};
			const x = Number(view.x);
			const y = Number(view.y);
			const zoom = Number(view.zoom);
			if (
				opts.rfInstance &&
				Number.isFinite(x) &&
				Number.isFinite(y) &&
				Number.isFinite(zoom)
			) {
				requestAnimationFrame(() => {
					opts.rfInstance?.setViewport({ x, y, zoom });
				});
			}
		}
	};

	const applyImportedDesign = (yaml: string) => {
		const parsed = kneYamlToDesign(yaml);
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
					runtime: node.runtime,
					mgmtIpv4: node.mgmtIpv4,
					startupConfig: node.startupConfig,
					env: node.env,
					interfaces: node.interfaces,
					notes: node.notes,
					status: node.status,
					importMeta: node.importMeta,
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
		opts.setAnnotations([]);
		opts.setGroups([]);
		opts.setYamlMode("generated");
		opts.setCustomYaml("");
		opts.setImportOpen(false);
	};

	const applyImportedTopology = (yaml: string) => {
		preservedSidecarRef.current = {};
		applyImportedDesign(yaml);
	};

	const validateBeforePersist = async () => {
		if (!opts.userId) throw new Error("Select a user");
		const resolved = await resolveTopologyImageRefs(opts.effectiveYaml);
		if (resolved.updatedImageCount > 0) {
			opts.setYamlMode("custom");
			opts.setCustomYaml(resolved.normalizedYAML);
			opts.setUseSavedConfig(false);
		}
		const resp = await validateKneTopologyYAML(opts.userId, {
			name: opts.labName,
			topologyYAML: resolved.normalizedYAML,
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
			const resolved = await resolveTopologyImageRefs(opts.effectiveYaml);
			if (resolved.updatedImageCount > 0) {
				opts.setYamlMode("custom");
				opts.setCustomYaml(resolved.normalizedYAML);
				opts.setUseSavedConfig(false);
			}
			return validateKneTopologyYAML(opts.userId, {
				name: opts.labName,
				topologyYAML: resolved.normalizedYAML,
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
						designerState: buildDesignerSidecarState(),
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
			await invalidateDashboardQueries(opts.queryClient);
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
				designerState: buildDesignerSidecarState(),
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
			const templateResp = await getUserScopeKNETemplate(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
				file,
			});
			let sidecar:
				| { found: boolean; designerState?: Record<string, unknown> }
				| undefined;
			if (opts.importSource === USER_REPO_SOURCE) {
				try {
					sidecar = await getKneDesignerSidecar(opts.userId, {
						dir: templateResp.dir,
						file: templateResp.file,
					});
				} catch {
					sidecar = undefined;
				}
			}
			return { templateResp, sidecar };
		},
		onSuccess: ({ templateResp, sidecar }) => {
			setLastImportResult(null);
			preservedSidecarRef.current = {};
			applyImportedDesign(templateResp.yaml);
			let restoredSidecar = false;
			if (sidecar?.found && sidecar.designerState) {
				mergeDesignerSidecar(sidecar.designerState);
				restoredSidecar = true;
			}
			toast.success("Template imported", {
				description: restoredSidecar
					? `${templateResp.path} (designer metadata restored)`
					: templateResp.path,
			});
		},
		onError: (e) =>
			toast.error("Import failed", { description: (e as Error).message }),
	});

	const importTopologyMutation = useMutation({
		mutationFn: async (args: {
			source?: "containerlab" | "eve-ng" | "gns3";
			topologyYAML: string;
			filename?: string;
			sidecarFiles?: Record<string, string>;
		}) => {
			if (!opts.userId) throw new Error("Select a user");
			const payload = String(args.topologyYAML ?? "").trim();
			if (!payload) throw new Error("Select a topology file");
			return importTopology(opts.userId, {
				source: args.source,
				topologyYAML: payload,
				filename: args.filename,
				sidecarFiles: args.sidecarFiles,
			});
		},
		onSuccess: (resp) => {
			setLastImportResult(resp);
			if (resp.canImport === false || resp.blocking) {
				const firstError = resp.issues.find(
					(issue) => issue.severity === "error",
				);
				toast.error("Import failed", {
					description:
						firstError?.message ?? "Fix conversion errors and retry.",
				});
				return;
			}
			toast.success("Topology converted", {
				description: "Review the converted topology, then confirm replace.",
			});
		},
		onError: (e) =>
			toast.error("Import failed", {
				description: (e as Error).message,
			}),
	});

	return {
		validateTopology,
		createDeployment,
		saveConfig,
		importTemplate,
		applyImportedTopology,
		importTopology: importTopologyMutation,
	};
}
