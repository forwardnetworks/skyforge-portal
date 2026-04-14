import { DesignerNode } from "@/components/lab-designer-node";
import type {
	CanvasMenuState,
	DesignEdge,
	DesignNode,
	DesignerAnnotation,
	DesignerGroup,
	EdgeMenuState,
	LabDesignerInspectorTab,
	NodeMenuState,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactFlowInstance } from "@xyflow/react";
import { useEdgesState, useNodesState } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { defaultLabDesignerImportDir } from "./lab-designer-import-defaults";

export const USER_REPO_SOURCE = "user" as const;
export const LAB_DESIGNER_STORAGE_KEY = "skyforge.labDesigner.v1";
const LAB_DESIGNER_LAYOUT_STORAGE_KEY = "skyforge.labDesigner.layout.v1";

type LabDesignerLayoutPrefs = {
	showCommandBar?: boolean;
	showPalette?: boolean;
	showInspector?: boolean;
};

function readLabDesignerLayoutPrefs(): LabDesignerLayoutPrefs {
	if (typeof window === "undefined") return {};
	try {
		const raw = window.localStorage.getItem(LAB_DESIGNER_LAYOUT_STORAGE_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw) as LabDesignerLayoutPrefs;
		return {
			showCommandBar: parsed?.showCommandBar,
			showPalette: parsed?.showPalette,
			showInspector: parsed?.showInspector,
		};
	} catch {
		return {};
	}
}

export function useLabDesignerPageState() {
	const layoutPrefs = readLabDesignerLayoutPrefs();
	const storageKey = LAB_DESIGNER_STORAGE_KEY;
	const rfRef = useRef<HTMLDivElement | null>(null);
	const queryClient = useQueryClient();

	const [labName, setLabName] = useState("lab");
	const [defaultKind, setDefaultKind] = useState("");
	const [userId, setUserScopeId] = useState("");
	const [runtime, setRuntime] = useState<"kne">("kne");
	const [kneServer, setKNEServer] = useState("");
	const [useSavedConfig, setUseSavedConfig] = useState(true);
	const [lastSaved, setLastSaved] = useState<SavedConfigRef | null>(null);
	const [templatesDir, setTemplatesDir] = useState("kne/designer");
	const [templateFile, setTemplateFile] = useState("");
	const [showCommandBar, setShowCommandBar] = useState(
		layoutPrefs.showCommandBar ?? true,
	);
	const [showPalette, setShowPalette] = useState(
		layoutPrefs.showPalette ?? true,
	);
	const [showInspector, setShowInspector] = useState(
		layoutPrefs.showInspector ?? true,
	);
	const [inspectorTab, setInspectorTab] =
		useState<LabDesignerInspectorTab>("lab");
	const [snapToGrid, setSnapToGrid] = useState(true);
	const [paletteSearch, setPaletteSearch] = useState("");
	const [paletteVendor, setPaletteVendor] = useState<string>("all");
	const [paletteRole, setPaletteRole] = useState<string>("all");
	const [rfInstance, setRfInstance] = useState<ReactFlowInstance<
		DesignNode,
		DesignEdge
	> | null>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string>("");
	const [selectedEdgeId, setSelectedEdgeId] = useState<string>("");
	const [linkMode, setLinkMode] = useState(false);
	const [pendingLinkSource, setPendingLinkSource] = useState<string>("");
	const [yamlMode, setYamlMode] = useState<"generated" | "custom">("generated");
	const [customYaml, setCustomYaml] = useState<string>("");
	const [importOpen, setImportOpen] = useState(false);
	const [importSource, setImportSource] = useState<"user" | "blueprints">(
		"blueprints",
	);
	const [importDir, setImportDir] = useState(
		defaultLabDesignerImportDir("blueprints"),
	);
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
	const [annotations, setAnnotations] = useState<DesignerAnnotation[]>([]);
	const [groups, setGroups] = useState<DesignerGroup[]>([]);
	const [nodeMenu, setNodeMenu] = useState<NodeMenuState | null>(null);
	const [edgeMenu, setEdgeMenu] = useState<EdgeMenuState | null>(null);
	const [canvasMenu, setCanvasMenu] = useState<CanvasMenuState | null>(null);
	const [showWarnings, setShowWarnings] = useState(false);

	const [nodes, setNodes, onNodesChange] = useNodesState<DesignNode>([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState<DesignEdge>([]);

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

	const nodeTypes = useMemo(() => ({ designerNode: DesignerNode }), []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const payload: LabDesignerLayoutPrefs = {
			showCommandBar,
			showPalette,
			showInspector,
		};
		window.localStorage.setItem(
			LAB_DESIGNER_LAYOUT_STORAGE_KEY,
			JSON.stringify(payload),
		);
	}, [showCommandBar, showPalette, showInspector]);

	return {
		USER_REPO_SOURCE,
		storageKey,
		rfRef,
		queryClient,
		labName,
		setLabName,
		defaultKind,
		setDefaultKind,
		userId,
		setUserScopeId,
		runtime,
		setRuntime,
		kneServer,
		setKNEServer,
		useSavedConfig,
		setUseSavedConfig,
		lastSaved,
		setLastSaved,
		templatesDir,
		setTemplatesDir,
		templateFile,
		setTemplateFile,
		showCommandBar,
		setShowCommandBar,
		showPalette,
		setShowPalette,
		showInspector,
		setShowInspector,
		inspectorTab,
		setInspectorTab,
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
		selectedEdgeId,
		setSelectedEdgeId,
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
		annotations,
		setAnnotations,
		groups,
		setGroups,
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
	};
}
