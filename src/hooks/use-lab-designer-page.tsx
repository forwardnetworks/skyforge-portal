import { DesignerNode } from "@/components/lab-designer-node";
import type {
	CanvasMenuState,
	DesignNode,
	EdgeMenuState,
	LabDesignerSearch,
	NodeMenuState,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import { createLabDesignerActions } from "@/hooks/use-lab-designer-actions";
import { useLabDesignerData } from "@/hooks/use-lab-designer-data";
import { useLabDesignerDerived } from "@/hooks/use-lab-designer-derived";
import {
	useLabDesignerEscapeKeyEffect,
	useLabDesignerImportPrefsEffect,
	useLabDesignerImportedDeploymentSyncEffect,
} from "@/hooks/use-lab-designer-effects";
import {
	type LabDesign,
	designToContainerlabYaml,
} from "@/lib/containerlab-yaml";
import { useQueryClient } from "@tanstack/react-query";
import type { Edge, ReactFlowInstance } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useCallback, useMemo, useRef, useState } from "react";

export function useLabDesignerPage(search: LabDesignerSearch) {
	const USER_REPO_SOURCE = "user" as const;
	const storageKey = "skyforge.labDesigner.v1";
	const importDeploymentId = String(search.importDeploymentId ?? "").trim();
	const rfRef = useRef<HTMLDivElement | null>(null);
	const queryClient = useQueryClient();

	const [labName, setLabName] = useState("lab");
	const [userId, setUserScopeId] = useState("");
	const [runtime, setRuntime] = useState<"clabernetes" | "containerlab">(
		"clabernetes",
	);
	const [containerlabServer, setContainerlabServer] = useState("");
	const [useSavedConfig, setUseSavedConfig] = useState(true);
	const [lastSaved, setLastSaved] = useState<SavedConfigRef | null>(null);
	const [templatesDir, setTemplatesDir] = useState("containerlab/designer");
	const [templateFile, setTemplateFile] = useState("");
	const [snapToGrid, setSnapToGrid] = useState(true);
	const [paletteSearch, setPaletteSearch] = useState("");
	const [paletteVendor, setPaletteVendor] = useState<string>("all");
	const [paletteRole, setPaletteRole] = useState<string>("all");
	const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
		DesignNode,
		Edge
	> | null>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string>("");
	const [linkMode, setLinkMode] = useState(false);
	const [pendingLinkSource, setPendingLinkSource] = useState<string>("");
	const [yamlMode, setYamlMode] = useState<"generated" | "custom">("generated");
	const [customYaml, setCustomYaml] = useState<string>("");
	const [importOpen, setImportOpen] = useState(false);
	const [importSource, setImportSource] = useState<"user" | "blueprints">(
		"blueprints",
	);
	const [importDir, setImportDir] = useState("containerlab");
	const [importFile, setImportFile] = useState("");
	const [quickstartOpen, setQuickstartOpen] = useState(false);
	const [qsName, setQsName] = useState("clos");
	const [qsSpines, setQsSpines] = useState(2);
	const [qsLeaves, setQsLeaves] = useState(4);
	const [qsHostsPerLeaf, setQsHostsPerLeaf] = useState(1);
	const [qsSwitchKind, setQsSwitchKind] = useState("ceos");
	const [qsSwitchImage, setQsSwitchImage] = useState("");
	const [qsHostKind, setQsHostKind] = useState("linux");
	const [qsHostImage, setQsHostImage] = useState("");
	const [openDeploymentOnCreate, setOpenDeploymentOnCreate] = useState(true);
	const [nodeMenu, setNodeMenu] = useState<NodeMenuState | null>(null);
	const [edgeMenu, setEdgeMenu] = useState<EdgeMenuState | null>(null);
	const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState | null>(null);
	const [showWarnings, setShowWarnings] = useState(false);

	const [nodes, setNodes, onNodesChange] = useNodesState<DesignNode>([
		{
			id: "r1",
			position: { x: 80, y: 80 },
			data: { label: "r1", kind: "linux", image: "" },
			type: "designerNode",
		},
	]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

	const design: LabDesign = useMemo(
		() => ({
			name: labName,
			nodes: nodes.map((n) => ({
				id: String(n.id),
				label: String(n.data?.label ?? n.id),
				kind: String((n.data as any)?.kind ?? ""),
				image: String((n.data as any)?.image ?? ""),
				position: { x: n.position.x, y: n.position.y },
			})),
			links: edges.map((e) => ({
				id: String(e.id),
				source: String(e.source),
				target: String(e.target),
			})),
		}),
		[edges, labName, nodes],
	);
	const { yaml } = useMemo(() => designToContainerlabYaml(design), [design]);
	const effectiveYaml = useMemo(() => {
		if (yamlMode === "custom") return String(customYaml ?? "");
		return yaml;
	}, [customYaml, yaml, yamlMode]);
	const effectiveTemplatesDir = useMemo(() => {
		const d = String(templatesDir ?? "")
			.trim()
			.replace(/^\/+|\/+$/g, "");
		return d || "containerlab/designer";
	}, [templatesDir]);
	const effectiveTemplateFile = useMemo(() => {
		const raw = String(templateFile ?? "").trim();
		const base = raw || `${labName || "lab"}.clab.yml`;
		if (base.endsWith(".yml") || base.endsWith(".yaml")) return base;
		return `${base}.yml`;
	}, [labName, templateFile]);

	const markWarningsVisible = useCallback(() => {
		setShowWarnings(true);
	}, []);

	const onNodesChangeWithWarnings = useCallback(
		(changes: any[]) => {
			if (changes.some((c) => c.type !== "select")) markWarningsVisible();
			onNodesChange(changes);
		},
		[markWarningsVisible, onNodesChange],
	);

	const onEdgesChangeWithWarnings = useCallback(
		(changes: any[]) => {
			if (changes.some((c) => c.type !== "select")) markWarningsVisible();
			onEdgesChange(changes);
		},
		[markWarningsVisible, onEdgesChange],
	);

	const data = useLabDesignerData({
		queryClient,
		userId,
		runtime,
		importOpen,
		importSource,
		importDir,
		importFile,
		containerlabServer,
		labName,
		effectiveYaml,
		effectiveTemplatesDir,
		effectiveTemplateFile,
		useSavedConfig,
		lastSaved,
		openDeploymentOnCreate,
		setLastSaved,
		setYamlMode,
		setCustomYaml,
		setImportOpen,
	});

	const derived = useLabDesignerDerived({
		nodes,
		edges,
		labName,
		selectedNodeId,
		yamlMode,
		customYaml,
		templatesDir,
		templateFile,
		paletteSearch,
		paletteVendor,
		paletteRole,
		registryRepos: Array.isArray(data.registryReposQ.data?.repositories)
			? data.registryReposQ.data.repositories
			: [],
		registryError: data.registryReposQ.isError
			? (data.registryReposQ.error as Error)
			: null,
		userScopes: data.userScopesQ.data ?? [],
		containerlabServers: data.containerlabServersQ.data?.servers ?? [],
	});

	const actions = createLabDesignerActions({
		queryClient,
		rfRef,
		rfInstance,
		nodes,
		edges,
		labName,
		qsName,
		qsSpines,
		qsLeaves,
		qsHostsPerLeaf,
		qsSwitchKind,
		qsSwitchImage,
		qsHostKind,
		qsHostImage,
		selectedNodeId,
		importDeploymentId,
		userId,
		effectiveYaml: derived.effectiveYaml,
		effectiveTemplatesDir: derived.effectiveTemplatesDir,
		effectiveTemplateFile: derived.effectiveTemplateFile,
		lastSaved,
		setLabName,
		setNodes,
		setEdges,
		setSelectedNodeId,
		setYamlMode,
		setCustomYaml,
		setQuickstartOpen,
		setNodeMenu,
		setEdgeMenu,
		setCanvasMenu,
		setUseSavedConfig,
		setLastSaved,
		setUserScopeId,
		setContainerlabServer,
		setRuntime,
		markWarningsVisible,
	});

	useLabDesignerImportPrefsEffect({
		importOpen,
		userId,
		importSource,
		importDir,
		setImportSource,
		setImportDir,
		userRepoSource: USER_REPO_SOURCE,
	});

	useLabDesignerEscapeKeyEffect(actions.closeMenus);

	useLabDesignerImportedDeploymentSyncEffect({
		search,
		syncImportedDeployment: actions.syncImportedDeployment,
	});

	const nodeTypes = useMemo(() => ({ designerNode: DesignerNode }), []);

	return {
		USER_REPO_SOURCE,
		storageKey,
		importDeploymentId,
		rfRef,
		labName,
		setLabName,
		userId,
		setUserScopeId,
		runtime,
		setRuntime,
		containerlabServer,
		setContainerlabServer,
		useSavedConfig,
		setUseSavedConfig,
		lastSaved,
		templatesDir,
		setTemplatesDir,
		templateFile,
		setTemplateFile,
		snapToGrid,
		setSnapToGrid,
		paletteSearch,
		setPaletteSearch,
		paletteVendor,
		setPaletteVendor,
		paletteRole,
		setPaletteRole,
		rfInstance,
		setRfInstance,
		selectedNodeId,
		setSelectedNodeId,
		linkMode,
		setLinkMode,
		pendingLinkSource,
		setPendingLinkSource,
		yamlMode,
		setYamlMode,
		customYaml,
		setCustomYaml,
		importOpen,
		setImportOpen,
		importSource,
		setImportSource,
		importDir,
		setImportDir,
		importFile,
		setImportFile,
		quickstartOpen,
		setQuickstartOpen,
		qsName,
		setQsName,
		qsSpines,
		setQsSpines,
		qsLeaves,
		setQsLeaves,
		qsHostsPerLeaf,
		setQsHostsPerLeaf,
		qsSwitchKind,
		setQsSwitchKind,
		qsSwitchImage,
		setQsSwitchImage,
		qsHostKind,
		setQsHostKind,
		qsHostImage,
		setQsHostImage,
		openDeploymentOnCreate,
		setOpenDeploymentOnCreate,
		nodeMenu,
		setNodeMenu,
		edgeMenu,
		setEdgeMenu,
		canvasMenu,
		setCanvasMenu,
		showWarnings,
		nodes,
		setNodes,
		edges,
		setEdges,
		onNodesChangeWithWarnings,
		onEdgesChangeWithWarnings,
		nodeTypes,
		markWarningsVisible,
		...derived,
		...data,
		...actions,
	};
}
