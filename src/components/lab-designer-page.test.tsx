import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LabDesignerPage } from "./lab-designer-page";

let mockPage: any;

vi.mock("@/hooks/use-lab-designer-page", () => ({
	useLabDesignerPage: () => mockPage,
}));

vi.mock("@/components/lab-designer-workspace", () => ({
	LabDesignerWorkspace: () => <div data-testid="designer-workspace" />,
}));

vi.mock("@/components/lab-designer-import-dialog", () => ({
	LabDesignerImportDialog: () => null,
}));

vi.mock("@/components/lab-designer-quickstart-dialog", () => ({
	LabDesignerQuickstartDialog: () => null,
}));

vi.mock("@/components/registry-image-picker", () => ({
	RegistryImagePicker: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (value: string) => void;
	}) => (
		<input
			aria-label="Registry image"
			value={value}
			onChange={(event) => onChange(event.target.value)}
		/>
	),
}));

function makePage(overrides: Record<string, unknown> = {}) {
	const setNodes = vi.fn();
	const setEdges = vi.fn();
	return {
		USER_REPO_SOURCE: "user",
		storageKey: "designer",
		importDeploymentId: "",
		rfRef: { current: null },
		labName: "fabric-lab",
		setLabName: vi.fn(),
		defaultKind: "",
		setDefaultKind: vi.fn(),
		userId: "user-1",
		setUserScopeId: vi.fn(),
		runtime: "kne",
		setRuntime: vi.fn(),
		kneServer: "",
		setKNEServer: vi.fn(),
		useSavedConfig: false,
		setUseSavedConfig: vi.fn(),
		lastSaved: null,
		templatesDir: "kne/designer",
		setTemplatesDir: vi.fn(),
		templateFile: "fabric.kne.yml",
		setTemplateFile: vi.fn(),
		showCommandBar: true,
		setShowCommandBar: vi.fn(),
		showPalette: true,
		setShowPalette: vi.fn(),
		showInspector: true,
		setShowInspector: vi.fn(),
		inspectorTab: "lab",
		setInspectorTab: vi.fn(),
		snapToGrid: true,
		setSnapToGrid: vi.fn(),
		paletteSearch: "",
		setPaletteSearch: vi.fn(),
		paletteVendor: "all",
		setPaletteVendor: vi.fn(),
		paletteRole: "all",
		setPaletteRole: vi.fn(),
		rfInstance: null,
		setRfInstance: vi.fn(),
		selectedNodeId: "",
		setSelectedNodeId: vi.fn(),
		linkMode: false,
		setLinkMode: vi.fn(),
		pendingLinkSource: "",
		setPendingLinkSource: vi.fn(),
		yamlMode: "generated",
		setYamlMode: vi.fn(),
		customYaml: "",
		setCustomYaml: vi.fn(),
		importOpen: false,
		setImportOpen: vi.fn(),
		importSource: "blueprints",
		setImportSource: vi.fn(),
		importDir: "kne",
		setImportDir: vi.fn(),
		importFile: "",
		setImportFile: vi.fn(),
		quickstartOpen: false,
		setQuickstartOpen: vi.fn(),
		qsName: "clos",
		setQsName: vi.fn(),
		qsSpines: 2,
		setQsSpines: vi.fn(),
		qsLeaves: 4,
		setQsLeaves: vi.fn(),
		qsHostsPerLeaf: 1,
		setQsHostsPerLeaf: vi.fn(),
		qsSwitchKind: "ceos",
		setQsSwitchKind: vi.fn(),
		qsSwitchImage: "",
		setQsSwitchImage: vi.fn(),
		qsHostKind: "linux",
		setQsHostKind: vi.fn(),
		qsHostImage: "",
		setQsHostImage: vi.fn(),
		openDeploymentOnCreate: true,
		setOpenDeploymentOnCreate: vi.fn(),
		annotations: [],
		setAnnotations: vi.fn(),
		groups: [],
		setGroups: vi.fn(),
		nodeMenu: null,
		setNodeMenu: vi.fn(),
		edgeMenu: null,
		setEdgeMenu: vi.fn(),
		canvasMenu: null,
		setCanvasMenu: vi.fn(),
		showWarnings: false,
		nodes: [],
		setNodes,
		edges: [],
		setEdges,
		onNodesChangeWithWarnings: vi.fn(),
		onEdgesChangeWithWarnings: vi.fn(),
		nodeTypes: {},
		markWarningsVisible: vi.fn(),
		selectedNode: null,
		selectedEdge: null,
		yaml: "name: generated\ntopology: {}\n",
		missingImageWarnings: [],
		otherWarnings: [],
		effectiveYaml: "name: generated\ntopology: {}\n",
		effectiveTemplatesDir: "kne/designer",
		effectiveTemplateFile: "fabric.kne.yml",
		paletteVendors: [],
		paletteItems: [],
		paletteIsFilteredEmpty: false,
		registryError: "",
		userScopeOptions: [{ value: "user-1", label: "User One" }],
		kneServerOptions: [],
		registryReposQ: { isLoading: false, isError: false },
		userScopesQ: { isLoading: false },
		kneServersQ: { isLoading: false },
		templatesQ: { data: { templates: [] }, isLoading: false, isError: false },
		templatePreviewQ: { data: { yaml: "" }, isLoading: false },
		validateTopology: { mutate: vi.fn(), isPending: false },
		lastValidation: null,
		createDeployment: { mutate: vi.fn(), isPending: false },
		saveConfig: { mutate: vi.fn(), isPending: false },
		importTemplate: { mutate: vi.fn(), isPending: false },
		importTopology: { mutate: vi.fn(), isPending: false },
		lastImportResult: null,
		loadDraft: vi.fn(),
		saveDraft: vi.fn(),
		exportYaml: vi.fn(),
		autoLayout: vi.fn(),
		addNode: vi.fn(),
		onDrop: vi.fn(),
		onDragOver: vi.fn(),
		onCanvasKeyDown: vi.fn(),
		closeMenus: vi.fn(),
		openImportedTool: vi.fn(),
		renameNode: vi.fn(),
		applyQuickstartClos: vi.fn(),
		openMapInNewTab: vi.fn(),
		...overrides,
	};
}

describe("LabDesignerPage", () => {
	beforeEach(() => {
		mockPage = makePage();
	});

	it("renders validation warnings, errors, and normalized yaml", async () => {
		mockPage = makePage({
			inspectorTab: "yaml",
			lastValidation: {
				normalizedYAML: "name: normalized\ntopology: {}\n",
				warnings: ["node names were normalized"],
				errors: ["missing topology.nodes"],
				valid: false,
			},
		});

		render(<LabDesignerPage search={{}} />);

		expect(screen.getByText("Needs fixes")).toBeInTheDocument();
		expect(screen.getByText("node names were normalized")).toBeInTheDocument();
		expect(screen.getByText("missing topology.nodes")).toBeInTheDocument();
		expect(
			screen
				.getAllByRole("textbox")
				.some(
					(element) =>
						(element as HTMLTextAreaElement | HTMLInputElement).value ===
						"name: normalized\ntopology: {}\n",
				),
		).toBe(true);
	});

	it("updates lab default kind from the inspector", () => {
		render(<LabDesignerPage search={{}} />);

		fireEvent.change(screen.getByPlaceholderText("ceos, linux, n9kv..."), {
			target: { value: "ceos" },
		});

		expect(mockPage.setDefaultKind).toHaveBeenCalledWith("ceos");
	});

	it("applies node inspector edits through setNodes", async () => {
		const selectedNode = {
			id: "r1",
			position: { x: 0, y: 0 },
			type: "designerNode",
			data: { label: "r1", kind: "linux", image: "", interfaces: [] },
		};
		mockPage = makePage({
			inspectorTab: "node",
			nodes: [selectedNode],
			selectedNode,
		});

		render(<LabDesignerPage search={{}} />);
		const nodePanel = screen.getByRole("tabpanel", { name: /Node/ });
		const nodeInputs = within(nodePanel).getAllByRole("textbox");

		fireEvent.change(nodeInputs[0], {
			target: { value: "leaf1" },
		});

		expect(mockPage.setNodes).toHaveBeenCalled();
	});

	it("applies link inspector edits through setEdges", async () => {
		const selectedEdge = {
			id: "e-r1-r2",
			source: "r1",
			target: "r2",
			data: { sourceIf: "eth1", targetIf: "eth2", label: "uplink" },
		};
		mockPage = makePage({
			inspectorTab: "link",
			edges: [{ ...selectedEdge, selected: true }],
			selectedEdge,
		});

		render(<LabDesignerPage search={{}} />);
		const linkPanel = screen.getByRole("tabpanel", { name: /Link/ });
		const linkInputs = within(linkPanel).getAllByRole("textbox");

		fireEvent.change(linkInputs[0], {
			target: { value: "eth9" },
		});

		expect(mockPage.setEdges).toHaveBeenCalled();
	});
});
