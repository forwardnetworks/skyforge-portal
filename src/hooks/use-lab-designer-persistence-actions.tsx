import type {
	DesignEdge,
	DesignNode,
	DesignNodeData,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import {
	getDeploymentTopology,
	saveKneTopologyYAML,
} from "@/lib/api-client";
import type { Edge, Node } from "@xyflow/react";
import { toast } from "sonner";
import type { LabDesignerActionsOptions } from "./lab-designer-action-types";

export function createLabDesignerPersistenceActions(
	opts: LabDesignerActionsOptions,
) {
	const openImportedTool = (args: {
		action: "terminal" | "logs" | "describe";
		node: string;
	}) => {
		if (!opts.importDeploymentId) return;
		const qs = new URLSearchParams();
		qs.set("action", args.action);
		qs.set("node", args.node);
		const url = `/dashboard/deployments/${encodeURIComponent(opts.importDeploymentId)}?${qs.toString()}`;
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const exportYaml = () => {
		const blob = new Blob([opts.effectiveYaml], { type: "text/yaml" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${opts.labName || "lab"}.kne.yml`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 5_000);
	};

	const syncImportedDeployment = async (search: {
		userId?: string;
		importDeploymentId?: string;
	}) => {
		const ws = String(search.userId ?? "").trim();
		const depId = String(search.importDeploymentId ?? "").trim();
		if (!ws || !depId) return;
		opts.setUserScopeId(ws);
		opts.setUseSavedConfig(false);
		opts.setLastSaved(null);

		const topo = await getDeploymentTopology(ws, depId);
		const nextNodes: Array<DesignNode> = (topo.nodes ?? []).map(
			(n, idx) => ({
				id: String(n.id),
				position: {
					x: 120 + (idx % 4) * 260,
					y: 120 + Math.floor(idx / 4) * 180,
				},
				data: {
					label: String(n.label || n.id),
					kind: String(n.kind || ""),
					image: "",
					status: String(n.status || ""),
				},
				type: "designerNode",
			}),
		);
		const nextEdges: Array<DesignEdge> = (topo.edges ?? []).map((e) => ({
			id: String(e.id),
			source: String(e.source),
			target: String(e.target),
			label: e.label || `${e.source} ↔ ${e.target}`,
			data: {
				label: e.label || "",
			},
		}));

		if (!nextNodes.length) {
			throw new Error("No nodes found in deployment topology");
		}
		opts.setNodes(nextNodes);
		opts.setEdges(nextEdges);
		opts.setSelectedNodeId(String(nextNodes[0].id));
		toast.success("Imported running topology", {
			description: `Deployment ${depId}`,
		});
		requestAnimationFrame(() =>
			opts.rfInstance?.fitView({ padding: 0.15, duration: 250 }),
		);
	};

	const saveDraft = (
		storageKey: string,
		runtime: "kne",
		containerlabServer: string,
		useSavedConfig: boolean,
	) => {
		try {
			const payload = {
				labName: opts.labName,
				defaultKind: opts.defaultKind,
				userId: opts.userId,
				runtime,
				containerlabServer,
				useSavedConfig,
				lastSaved: opts.lastSaved,
				nodes: opts.nodes,
				edges: opts.edges,
			};
			window.localStorage.setItem(storageKey, JSON.stringify(payload));
			toast.success("Draft saved");
		} catch (e) {
			toast.error("Failed to save draft", {
				description: (e as Error).message,
			});
		}
	};

	const loadDraft = (storageKey: string) => {
		try {
			const raw = window.localStorage.getItem(storageKey);
			if (!raw) {
				toast.message("No saved draft");
				return;
			}
			const parsed = JSON.parse(raw) as any;
			if (typeof parsed?.labName === "string") opts.setLabName(parsed.labName);
			if (typeof parsed?.defaultKind === "string") {
				opts.setDefaultKind(parsed.defaultKind);
			}
			if (typeof parsed?.userId === "string") {
				opts.setUserScopeId(parsed.userId);
			}
			if (parsed?.runtime === "kne") {
				opts.setRuntime(parsed.runtime);
			}
			if (typeof parsed?.containerlabServer === "string") {
				opts.setContainerlabServer(parsed.containerlabServer);
			} else if (typeof parsed?.netlabServer === "string") {
				opts.setContainerlabServer(parsed.netlabServer);
			}
			if (parsed?.lastSaved && typeof parsed.lastSaved === "object") {
				opts.setLastSaved(parsed.lastSaved as SavedConfigRef);
			}
			if (Array.isArray(parsed?.nodes)) opts.setNodes(parsed.nodes);
			if (Array.isArray(parsed?.edges)) opts.setEdges(parsed.edges);
			toast.success("Draft loaded");
		} catch (e) {
			toast.error("Failed to load draft", {
				description: (e as Error).message,
			});
		}
	};

	const openMapInNewTab = async () => {
		if (!opts.userId) {
			toast.error("Select a user first");
			return;
		}
		try {
			const canUseSaved = opts.lastSaved?.userId === opts.userId;
			const saved = canUseSaved
				? opts.lastSaved
				: await saveKneTopologyYAML(opts.userId, {
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

			const qs = new URLSearchParams();
			qs.set("userId", opts.userId);
			qs.set("source", "user");
			qs.set("dir", saved.templatesDir);
			qs.set("file", saved.template);
			window.open(
				`/dashboard/labs/map?${qs.toString()}`,
				"_blank",
				"noopener,noreferrer",
			);
		} catch (e) {
			toast.error("Failed to open map", { description: (e as Error).message });
		}
	};

	return {
		openImportedTool,
		exportYaml,
		syncImportedDeployment,
		saveDraft,
		loadDraft,
		openMapInNewTab,
	};
}
