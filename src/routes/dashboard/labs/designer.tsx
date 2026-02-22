import { createFileRoute } from "@tanstack/react-router";
import {
	Background,
	Controls,
	type Edge,
	Handle,
	MiniMap,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
	addEdge,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import {
	type DragEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import "@xyflow/react/dist/style.css";
import { RegistryImagePicker } from "@/components/registry-image-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	type LabDesign,
	designToContainerlabYaml,
} from "@/lib/containerlab-yaml";
import { queryKeys } from "@/lib/query-keys";
import {
	createClabernetesDeploymentFromTemplate,
	createContainerlabDeploymentFromTemplate,
	getDeploymentTopology,
	getWorkspaceContainerlabTemplate,
	getWorkspaceContainerlabTemplates,
	getWorkspaces,
	listRegistryRepositories,
	listRegistryTags,
	listUserContainerlabServers,
	saveContainerlabTopologyYAML,
} from "@/lib/skyforge-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactFlowInstance } from "@xyflow/react";
import {
	Copy,
	Cpu,
	Download,
	ExternalLink,
	FolderOpen,
	LayoutGrid,
	Link2,
	Plus,
	Rocket,
	Save,
	Server,
	Shield,
	Waypoints,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const designerSearchSchema = z.object({
	workspaceId: z.string().optional().catch(""),
	importDeploymentId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/labs/designer")({
	validateSearch: (search) => designerSearchSchema.parse(search),
	component: LabDesignerPage,
});

type DesignNodeData = {
	label: string;
	kind: string;
	image: string;
};

type DesignNode = Node<DesignNodeData>;

type PaletteCategory = "Hosts" | "Routers" | "Switches" | "Firewalls" | "Other";

type PaletteItem = {
	id: string;
	label: string;
	category: PaletteCategory;
	kind: string;
	repo?: string;
	vendor?: string;
	model?: string;
	role?: "host" | "router" | "switch" | "firewall" | "other";
};

const paletteMimeType = "application/x-skyforge-palette-item";

function hostLabelFromURL(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "";
	try {
		const u = new URL(s);
		return u.hostname || s;
	} catch {
		return s.replace(/^https?:\/\//, "").split("/")[0] ?? s;
	}
}

function inferPaletteItemFromRepo(repo: string): PaletteItem {
	const clean = String(repo ?? "")
		.trim()
		.replace(/^\/+|\/+$/g, "");
	const lower = clean.toLowerCase();
	const base = clean.split("/").pop() ?? clean;

	const mk = (opts: Omit<PaletteItem, "id">): PaletteItem => ({
		id: `${opts.kind}:${opts.repo ?? ""}`,
		...opts,
	});

	// Hosts
	if (
		lower.includes("endhost") ||
		lower.includes("linux") ||
		lower.includes("ubuntu") ||
		lower.includes("alpine")
	) {
		return mk({
			label: `Host · ${base}`,
			category: "Hosts",
			kind: "linux",
			repo: clean,
			vendor: "Linux",
			model: base,
			role: "host",
		});
	}

	// Arista EOS
	if (base === "ceos" || lower.endsWith("/ceos") || lower.includes("/ceos:")) {
		return mk({
			label: "Switch · Arista cEOS",
			category: "Switches",
			kind: "ceos",
			repo: clean,
			vendor: "Arista",
			model: "cEOS",
			role: "switch",
		});
	}

	// Cisco (vrnetlab)
	if (lower.includes("vrnetlab/cisco_iol")) {
		return mk({
			label: "Router · Cisco IOL (IOS)",
			category: "Routers",
			kind: "cisco_iol",
			repo: clean,
			vendor: "Cisco",
			model: "IOL",
			role: "router",
		});
	}
	if (lower.includes("vrnetlab/vr-n9kv") || lower.includes("vrnetlab/nxos")) {
		return mk({
			label: "Switch · Cisco NX-OSv (N9Kv)",
			category: "Switches",
			kind: "vr-n9kv",
			repo: clean,
			vendor: "Cisco",
			model: "NX-OSv9k",
			role: "switch",
		});
	}
	if (lower.includes("vrnetlab/vr-vmx") || lower.includes("/vr-vmx")) {
		return mk({
			label: "Router · Juniper vMX",
			category: "Routers",
			kind: "vr-vmx",
			repo: clean,
			vendor: "Juniper",
			model: "vMX",
			role: "router",
		});
	}
	if (lower.includes("vrnetlab/juniper_vjunos-router")) {
		return mk({
			label: "Router · Juniper vJunos Router",
			category: "Routers",
			kind: "juniper_vjunos-router",
			repo: clean,
			vendor: "Juniper",
			model: "vJunos-router",
			role: "router",
		});
	}
	if (lower.includes("vrnetlab/juniper_vjunos-switch")) {
		return mk({
			label: "Switch · Juniper vJunos Switch",
			category: "Switches",
			kind: "juniper_vjunos-switch",
			repo: clean,
			vendor: "Juniper",
			model: "vJunos-switch",
			role: "switch",
		});
	}
	if (
		lower.includes("vrnetlab/juniper_vsrx") ||
		lower.includes("vr-vsrx") ||
		lower.includes("vsrx") ||
		lower.includes("/srx")
	) {
		return mk({
			label: "Firewall · Juniper SRX",
			category: "Firewalls",
			kind: "vr-vsrx",
			repo: clean,
			vendor: "Juniper",
			model: "SRX",
			role: "firewall",
		});
	}
	if (lower.includes("vrnetlab/vr-fortios") || lower.includes("fortios")) {
		return mk({
			label: "Firewall · Fortinet FortiOS",
			category: "Firewalls",
			kind: "vr-fortios",
			repo: clean,
			vendor: "Fortinet",
			model: "FortiOS",
			role: "firewall",
		});
	}
	if (lower.includes("vrnetlab/vr-ftosv") || lower.includes("os10")) {
		return mk({
			label: "Switch · Dell OS10",
			category: "Switches",
			kind: "vr-ftosv",
			repo: clean,
			vendor: "Dell",
			model: "OS10",
			role: "switch",
		});
	}
	if (
		lower.includes("vrnetlab/") &&
		(lower.includes("asa") ||
			lower.includes("pan") ||
			lower.includes("palo") ||
			lower.includes("checkpoint"))
	) {
		return mk({
			label: `Firewall · ${base}`,
			category: "Firewalls",
			kind: base,
			repo: clean,
			role: "firewall",
		});
	}

	// Fallback: show any registry repo as "Other" so the palette is extensible.
	return mk({
		label: `Node · ${base}`,
		category: "Other",
		kind: base,
		repo: clean,
		role: "other",
	});
}

function PaletteDraggableItem(props: { item: PaletteItem }) {
	const p = props.item;
	const Icon =
		p.role === "firewall" ? Shield : p.role === "host" ? Server : Waypoints;
	const heading = p.vendor
		? `${p.vendor}${p.model ? ` · ${p.model}` : ""}`
		: p.label;
	const role =
		p.role === "router"
			? "Router"
			: p.role === "switch"
				? "Switch"
				: p.role === "firewall"
					? "Firewall"
					: p.role === "host"
						? "Host"
						: "Node";
	return (
		<div
			className="cursor-grab select-none rounded-lg border bg-background px-3 py-2 text-sm hover:bg-accent"
			draggable
			onDragStart={(e) => {
				e.dataTransfer.setData(paletteMimeType, JSON.stringify(p));
				e.dataTransfer.effectAllowed = "copy";
			}}
			title={p.repo ? `${p.label}\n${p.repo}` : p.label}
		>
			<div className="flex items-start gap-2">
				<Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
				<div className="min-w-0">
					<div className="truncate flex items-center gap-2">
						<span className="truncate">{heading}</span>
						<span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
							{role}
						</span>
					</div>
					<div className="truncate text-[11px] text-muted-foreground font-mono">
						{p.repo ?? p.kind}
					</div>
				</div>
			</div>
		</div>
	);
}

async function resolveRepoTag(opts: {
	repo: string;
	queryClient: ReturnType<typeof useQueryClient>;
}): Promise<string> {
	const repo = String(opts.repo ?? "")
		.trim()
		.replace(/^\/+|\/+$/g, "");
	if (!repo) return "latest";
	try {
		const resp = await opts.queryClient.fetchQuery({
			queryKey: queryKeys.registryTags(repo, ""),
			queryFn: async () => listRegistryTags(repo, { q: "" }),
			retry: false,
			staleTime: 30_000,
		});
		const tags = Array.isArray(resp?.tags) ? resp.tags : [];
		if (tags.includes("latest")) return "latest";
		if (tags.length > 0) return String(tags[tags.length - 1]);
		return "latest";
	} catch {
		return "latest";
	}
}

type SavedConfigRef = {
	workspaceId: string;
	templatesDir: string;
	template: string;
	filePath: string;
	branch: string;
};

function DesignerNode(props: NodeProps<DesignNode>) {
	const kind = String(props.data?.kind ?? "");
	const label = String(props.data?.label ?? props.id);
	const kindLower = kind.toLowerCase();
	const isFirewall =
		kindLower.includes("forti") ||
		kindLower.includes("vsrx") ||
		kindLower.includes("srx") ||
		kindLower.includes("asa") ||
		kindLower.includes("pan");
	const isHost = kindLower.includes("linux") || kindLower.includes("host");
	const Icon = isFirewall ? Shield : isHost ? Server : Cpu;
	const accent = isFirewall
		? "border-amber-500/60"
		: isHost
			? "border-emerald-500/60"
			: "border-sky-500/60";

	return (
		<div
			className={[
				"rounded-xl border bg-background/95 px-3 py-2 shadow-sm min-w-[140px]",
				props.selected ? "ring-2 ring-primary/60" : "",
				accent,
			].join(" ")}
		>
			<Handle type="target" position={Position.Top} />
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<Handle type="source" position={Position.Bottom} />
			<div className="flex items-start gap-2">
				<div className="mt-0.5 rounded-md border bg-muted p-1.5">
					<Icon className="h-4 w-4" />
				</div>
				<div className="min-w-0">
					<div className="font-medium leading-tight truncate">{label}</div>
					<div className="text-[11px] text-muted-foreground truncate">
						{kind || "node"}
					</div>
				</div>
			</div>
		</div>
	);
}

function LabDesignerPage() {
	const search = Route.useSearch();
	const importDeploymentId = String(search.importDeploymentId ?? "").trim();
	const storageKey = "skyforge.labDesigner.v1";
	const rfRef = useRef<HTMLDivElement | null>(null);
	const queryClient = useQueryClient();

	const [labName, setLabName] = useState("lab");
	const [workspaceId, setWorkspaceId] = useState("");
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
	const [importSource, setImportSource] = useState<"workspace" | "blueprints">(
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
	const [nodeMenu, setNodeMenu] = useState<{
		x: number;
		y: number;
		nodeId: string;
	} | null>(null);
	const [edgeMenu, setEdgeMenu] = useState<{
		x: number;
		y: number;
		edgeId: string;
	} | null>(null);
	const [canvasMenu, setCanvasMenu] = useState<{ x: number; y: number } | null>(
		null,
	);
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

	const selectedNode = useMemo(
		() => nodes.find((n) => n.id === selectedNodeId) ?? null,
		[nodes, selectedNodeId],
	);

	const design: LabDesign = useMemo(() => {
		return {
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
		};
	}, [edges, labName, nodes]);

	const { yaml, warnings } = useMemo(
		() => designToContainerlabYaml(design),
		[design],
	);
	const missingImageWarnings = useMemo(
		() => warnings.filter((w) => w.toLowerCase().includes("missing image")),
		[warnings],
	);
	const otherWarnings = useMemo(
		() => warnings.filter((w) => !w.toLowerCase().includes("missing image")),
		[warnings],
	);
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

	useEffect(() => {
		if (!importOpen || !workspaceId) return;
		const key = `skyforge.labDesigner.importPrefs.${workspaceId}`;
		try {
			const raw = window.localStorage.getItem(key);
			if (!raw) return;
			const parsed = JSON.parse(raw) as any;
			if (parsed?.source === "workspace" || parsed?.source === "blueprints")
				setImportSource(parsed.source);
			if (typeof parsed?.dir === "string") setImportDir(parsed.dir);
		} catch {
			// ignore
		}
	}, [importOpen, workspaceId]);

	useEffect(() => {
		if (!workspaceId) return;
		const key = `skyforge.labDesigner.importPrefs.${workspaceId}`;
		try {
			window.localStorage.setItem(
				key,
				JSON.stringify({ source: importSource, dir: importDir }),
			);
		} catch {
			// ignore
		}
	}, [importDir, importSource, workspaceId]);

	const addNode = () => {
		const base = "n";
		let i = nodes.length + 1;
		let id = `${base}${i}`;
		const used = new Set(nodes.map((n) => n.id));
		while (used.has(id)) {
			i++;
			id = `${base}${i}`;
		}
		const pos = { x: 120 + nodes.length * 40, y: 120 + nodes.length * 30 };
		const next: Node<DesignNodeData> = {
			id,
			position: pos,
			data: { label: id, kind: "linux", image: "" },
			type: "designerNode",
		};
		setNodes((prev) => [...prev, next]);
		setSelectedNodeId(id);
	};

	const applyQuickstartClos = () => {
		const spines = Math.max(
			1,
			Math.min(16, Number.isFinite(qsSpines) ? qsSpines : 2),
		);
		const leaves = Math.max(
			1,
			Math.min(64, Number.isFinite(qsLeaves) ? qsLeaves : 4),
		);
		const hostsPerLeaf = Math.max(
			0,
			Math.min(16, Number.isFinite(qsHostsPerLeaf) ? qsHostsPerLeaf : 1),
		);

		const name = (qsName || "clos").trim() || "clos";
		setLabName(name);

		const mkNode = (
			id: string,
			x: number,
			y: number,
			kind: string,
			image: string,
		): DesignNode => ({
			id,
			position: { x, y },
			data: { label: id, kind, image },
			type: "designerNode",
		});

		const nextNodes: DesignNode[] = [];
		const nextEdges: Edge[] = [];

		const x0 = 120;
		const dx = 260;
		const ySpine = 120;
		const yLeaf = 320;
		const yHost = 520;

		const spineIds = Array.from({ length: spines }, (_, i) => `s${i + 1}`);
		const leafIds = Array.from({ length: leaves }, (_, i) => `l${i + 1}`);

		for (let i = 0; i < spineIds.length; i++) {
			nextNodes.push(
				mkNode(spineIds[i], x0 + i * dx, ySpine, qsSwitchKind, qsSwitchImage),
			);
		}

		for (let i = 0; i < leafIds.length; i++) {
			nextNodes.push(
				mkNode(leafIds[i], x0 + i * dx, yLeaf, qsSwitchKind, qsSwitchImage),
			);
		}

		// Full-mesh leaf<->spine
		for (const l of leafIds) {
			for (const s of spineIds) {
				nextEdges.push({
					id: `e-${l}-${s}`,
					source: l,
					target: s,
				});
			}
		}

		// Hosts per leaf (host -> leaf)
		let hostCounter = 1;
		for (let li = 0; li < leafIds.length; li++) {
			const leafId = leafIds[li];
			for (let hi = 0; hi < hostsPerLeaf; hi++) {
				const hostId = `h${hostCounter++}`;
				const hostX = x0 + li * dx + hi * 70;
				nextNodes.push(mkNode(hostId, hostX, yHost, qsHostKind, qsHostImage));
				nextEdges.push({
					id: `e-${hostId}-${leafId}`,
					source: hostId,
					target: leafId,
				});
			}
		}

		setNodes(nextNodes);
		setEdges(nextEdges);
		setYamlMode("generated");
		setCustomYaml("");
		setSelectedNodeId("");
		setQuickstartOpen(false);
		requestAnimationFrame(() =>
			rfInstance?.fitView({ padding: 0.15, duration: 250 }),
		);

		const missingImages = nextNodes.filter(
			(n) => !String((n.data as any)?.image ?? "").trim(),
		);
		if (missingImages.length) {
			toast.message("Quickstart created (missing images)", {
				description: "Pick images per-node (or use defaults) before deploying.",
			});
		} else {
			toast.success("Starter topology created");
		}
	};

	const autoLayout = () => {
		const count = nodes.length;
		if (!count) return;
		const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
		const cellW = 260;
		const cellH = 180;
		const startX = 120;
		const startY = 120;
		setNodes((prev) =>
			prev.map((n, idx) => ({
				...n,
				position: {
					x: startX + (idx % cols) * cellW,
					y: startY + Math.floor(idx / cols) * cellH,
				},
			})),
		);
		requestAnimationFrame(() =>
			rfInstance?.fitView({ padding: 0.15, duration: 300 }),
		);
	};

	const closeMenus = () => {
		setNodeMenu(null);
		setEdgeMenu(null);
		setCanvasMenu(null);
	};

	const openImportedTool = (opts: {
		action: "terminal" | "logs" | "describe";
		node: string;
	}) => {
		if (!importDeploymentId) return;
		const qs = new URLSearchParams();
		qs.set("action", opts.action);
		qs.set("node", opts.node);
		const url = `/dashboard/deployments/${encodeURIComponent(importDeploymentId)}?${qs.toString()}`;
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const renameNode = (nodeId: string) => {
		const n = nodes.find((x) => String(x.id) === nodeId);
		if (!n) return;
		const current = String(n.data?.label ?? n.id);
		const nextRaw = window.prompt("Node name", current);
		if (nextRaw == null) return;
		const nextTrim = nextRaw.trim();
		if (!nextTrim) return;

		const used = new Set(nodes.map((x) => String(x.id)));
		used.delete(nodeId);
		let nextId = nextTrim;
		let i = 2;
		while (used.has(nextId)) {
			nextId = `${nextTrim}-${i++}`;
		}

		setNodes((prev) =>
			prev.map((x) =>
				String(x.id) === nodeId
					? { ...x, id: nextId, data: { ...(x.data as any), label: nextTrim } }
					: x,
			),
		);
		setEdges((prev) =>
			prev.map((e) => ({
				...e,
				source: String(e.source) === nodeId ? nextId : e.source,
				target: String(e.target) === nodeId ? nextId : e.target,
				label:
					String(e.source) === nodeId || String(e.target) === nodeId
						? `${String(e.source) === nodeId ? nextId : e.source} ↔ ${
								String(e.target) === nodeId ? nextId : e.target
							}`
						: e.label,
			})),
		);
		if (selectedNodeId === nodeId) setSelectedNodeId(nextId);
		setNodeMenu((m) =>
			m && m.nodeId === nodeId ? { ...m, nodeId: nextId } : m,
		);
	};

	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeMenus();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const exportYaml = () => {
		const blob = new Blob([effectiveYaml], { type: "text/yaml" });
		const a = document.createElement("a");
		a.href = URL.createObjectURL(blob);
		a.download = `${labName || "lab"}.clab.yml`;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(a.href), 5_000);
	};

	// Optional: import an existing running deployment topology into the canvas.
	useEffect(() => {
		const ws = String(search.workspaceId ?? "").trim();
		const depId = String(search.importDeploymentId ?? "").trim();
		if (!ws || !depId) return;
		setWorkspaceId(ws);
		setUseSavedConfig(false);
		setLastSaved(null);

		let cancelled = false;
		(async () => {
			try {
				const topo = await getDeploymentTopology(ws, depId);
				if (cancelled) return;
				const nextNodes: Array<Node<DesignNodeData>> = (topo.nodes ?? []).map(
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
						},
						type: "designerNode",
					}),
				);
				const nextEdges: Array<Edge> = (topo.edges ?? []).map((e) => ({
					id: String(e.id),
					source: String(e.source),
					target: String(e.target),
					label: e.label || `${e.source} ↔ ${e.target}`,
				}));

				if (!nextNodes.length)
					throw new Error("No nodes found in deployment topology");
				setNodes(nextNodes);
				setEdges(nextEdges);
				setSelectedNodeId(String(nextNodes[0].id));
				toast.success("Imported running topology", {
					description: `Deployment ${depId}`,
				});
				requestAnimationFrame(() =>
					rfInstance?.fitView({ padding: 0.15, duration: 250 }),
				);
			} catch (e) {
				if (cancelled) return;
				toast.error("Failed to import deployment topology", {
					description: (e as Error).message,
				});
			}
		})();

		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search.importDeploymentId, search.workspaceId]);

	const saveDraft = () => {
		try {
			const payload = {
				labName,
				workspaceId,
				runtime,
				containerlabServer,
				useSavedConfig,
				lastSaved,
				nodes,
				edges,
			};
			window.localStorage.setItem(storageKey, JSON.stringify(payload));
			toast.success("Draft saved");
		} catch (e) {
			toast.error("Failed to save draft", {
				description: (e as Error).message,
			});
		}
	};

	const loadDraft = () => {
		try {
			const raw = window.localStorage.getItem(storageKey);
			if (!raw) {
				toast.message("No saved draft");
				return;
			}
			const parsed = JSON.parse(raw) as any;
			if (typeof parsed?.labName === "string") setLabName(parsed.labName);
			if (typeof parsed?.workspaceId === "string")
				setWorkspaceId(parsed.workspaceId);
			if (
				parsed?.runtime === "clabernetes" ||
				parsed?.runtime === "containerlab"
			)
				setRuntime(parsed.runtime);
			if (typeof parsed?.containerlabServer === "string")
				setContainerlabServer(parsed.containerlabServer);
			else if (typeof parsed?.netlabServer === "string")
				setContainerlabServer(parsed.netlabServer);
			if (typeof parsed?.useSavedConfig === "boolean")
				setUseSavedConfig(parsed.useSavedConfig);
			if (parsed?.lastSaved && typeof parsed.lastSaved === "object")
				setLastSaved(parsed.lastSaved);
			if (Array.isArray(parsed?.nodes)) setNodes(parsed.nodes);
			if (Array.isArray(parsed?.edges)) setEdges(parsed.edges);
			toast.success("Draft loaded");
		} catch (e) {
			toast.error("Failed to load draft", {
				description: (e as Error).message,
			});
		}
	};

	const workspacesQ = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
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
		enabled: runtime === "containerlab",
		retry: false,
		staleTime: 30_000,
	});

	const templatesQ = useQuery({
		queryKey: workspaceId
			? ["containerlabTemplates", workspaceId, importSource, importDir]
			: ["containerlabTemplates", "none"],
		queryFn: async () =>
			getWorkspaceContainerlabTemplates(workspaceId, {
				source: importSource,
				dir: importDir,
			}),
		enabled: Boolean(workspaceId) && importOpen,
		retry: false,
		staleTime: 30_000,
	});

	const templatePreviewQ = useQuery({
		queryKey: workspaceId
			? [
					"containerlabTemplate",
					workspaceId,
					importSource,
					importDir,
					importFile,
				]
			: ["containerlabTemplate", "none"],
		queryFn: async () => {
			if (!workspaceId) throw new Error("missing workspace");
			if (!importFile) return null;
			return getWorkspaceContainerlabTemplate(workspaceId, {
				source: importSource,
				dir: importDir,
				file: importFile,
			});
		},
		enabled: Boolean(workspaceId) && importOpen && Boolean(importFile),
		retry: false,
		staleTime: 30_000,
	});

	const createDeployment = useMutation({
		mutationFn: async () => {
			if (!workspaceId) throw new Error("Select a workspace");
			if (!effectiveYaml.trim()) throw new Error("YAML is empty");
			if (!/^\s*topology\s*:/m.test(effectiveYaml)) {
				throw new Error("YAML must contain a top-level 'topology:' section");
			}
			if (
				effectiveTemplatesDir !== "containerlab" &&
				!effectiveTemplatesDir.startsWith("containerlab/")
			) {
				throw new Error("Repo path must be under containerlab/");
			}

			const canUseSaved =
				useSavedConfig && lastSaved?.workspaceId === workspaceId;
			const saved = canUseSaved
				? lastSaved
				: await saveContainerlabTopologyYAML(workspaceId, {
						name: labName,
						topologyYAML: effectiveYaml,
						templatesDir: effectiveTemplatesDir,
						template: effectiveTemplateFile,
					}).then((resp) => {
						const next: SavedConfigRef = {
							workspaceId: resp.workspaceId,
							templatesDir: resp.templatesDir,
							template: resp.template,
							filePath: resp.filePath,
							branch: resp.branch,
						};
						setLastSaved(next);
						return next;
					});

			if (runtime === "containerlab") {
				if (!containerlabServer)
					throw new Error("Select a containerlab server");
				return createContainerlabDeploymentFromTemplate(workspaceId, {
					name: labName,
					netlabServer: containerlabServer,
					templateSource: "workspace",
					templatesDir: saved.templatesDir,
					template: saved.template,
					autoDeploy: true,
				});
			}

			return createClabernetesDeploymentFromTemplate(workspaceId, {
				name: labName,
				templateSource: "workspace",
				templatesDir: saved.templatesDir,
				template: saved.template,
				autoDeploy: true,
			});
		},
		onSuccess: async (resp) => {
			toast.success("Deployment created", {
				description: resp.deployment?.name ?? labName,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			const id = resp.deployment?.id;
			if (openDeploymentOnCreate && id) {
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
			if (!workspaceId) throw new Error("Select a workspace");
			if (!effectiveYaml.trim()) throw new Error("YAML is empty");
			if (!/^\s*topology\s*:/m.test(effectiveYaml)) {
				throw new Error("YAML must contain a top-level 'topology:' section");
			}
			if (
				effectiveTemplatesDir !== "containerlab" &&
				!effectiveTemplatesDir.startsWith("containerlab/")
			) {
				throw new Error("Repo path must be under containerlab/");
			}
			return saveContainerlabTopologyYAML(workspaceId, {
				name: labName,
				topologyYAML: effectiveYaml,
				templatesDir: effectiveTemplatesDir,
				template: effectiveTemplateFile,
			});
		},
		onSuccess: (resp) => {
			setLastSaved({
				workspaceId: resp.workspaceId,
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
			if (!workspaceId) throw new Error("Select a workspace");
			const file = importFile.trim();
			if (!file) throw new Error("Select a template");
			return getWorkspaceContainerlabTemplate(workspaceId, {
				source: importSource,
				dir: importDir,
				file,
			});
		},
		onSuccess: (resp) => {
			setYamlMode("custom");
			setCustomYaml(resp.yaml);
			setImportOpen(false);
			toast.success("Template imported", { description: resp.path });
		},
		onError: (e) =>
			toast.error("Import failed", { description: (e as Error).message }),
	});

	const onDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	};

	const onDrop = async (event: DragEvent) => {
		event.preventDefault();
		if (!rfRef.current || !rfInstance) return;
		const payload = event.dataTransfer.getData(paletteMimeType);
		const legacyKind = event.dataTransfer.getData(
			"application/x-skyforge-kind",
		);
		const parsed: PaletteItem | null = payload
			? (() => {
					try {
						return JSON.parse(payload) as PaletteItem;
					} catch {
						return null;
					}
				})()
			: null;
		const kind = parsed?.kind || legacyKind;
		if (!kind) return;

		const rect = rfRef.current.getBoundingClientRect();
		const position = rfInstance.screenToFlowPosition({
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		});

		const role = parsed?.role;
		const idBase =
			role === "host"
				? "h"
				: role === "router"
					? "r"
					: role === "switch"
						? "s"
						: role === "firewall"
							? "f"
							: kind === "linux"
								? "h"
								: "n";
		let i = nodes.length + 1;
		let id = `${idBase}${i}`;
		const used = new Set(nodes.map((n) => n.id));
		while (used.has(id)) {
			i++;
			id = `${idBase}${i}`;
		}

		const repo = String(parsed?.repo ?? "").trim();
		const tag = repo ? await resolveRepoTag({ repo, queryClient }) : "";
		const image = repo ? `${repo}:${tag}` : "";

		const next: Node<DesignNodeData> = {
			id,
			position,
			data: { label: id, kind, image },
			type: "designerNode",
		};
		markWarningsVisible();
		setNodes((prev) => [...prev, next]);
		setSelectedNodeId(id);
	};

	const openMapInNewTab = async () => {
		if (!workspaceId) {
			toast.error("Select a workspace first");
			return;
		}
		try {
			const canUseSaved = lastSaved?.workspaceId === workspaceId;
			const saved = canUseSaved
				? lastSaved
				: await saveContainerlabTopologyYAML(workspaceId, {
						name: labName,
						topologyYAML: effectiveYaml,
						templatesDir: effectiveTemplatesDir,
						template: effectiveTemplateFile,
					}).then((resp) => {
						const next: SavedConfigRef = {
							workspaceId: resp.workspaceId,
							templatesDir: resp.templatesDir,
							template: resp.template,
							filePath: resp.filePath,
							branch: resp.branch,
						};
						setLastSaved(next);
						return next;
					});

			const qs = new URLSearchParams();
			qs.set("workspaceId", workspaceId);
			qs.set("source", "workspace");
			qs.set("dir", saved.templatesDir);
			qs.set("file", saved.template);
			const url = `/dashboard/labs/map?${qs.toString()}`;
			window.open(url, "_blank", "noopener,noreferrer");
		} catch (e) {
			toast.error("Failed to open map", { description: (e as Error).message });
		}
	};

	const onCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName?.toUpperCase?.() ?? "";
		if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable)
			return;
		if (event.key === "Escape") {
			closeMenus();
			return;
		}
		if (event.key !== "Delete" && event.key !== "Backspace") return;
		const selectedNodeIds = new Set(
			nodes.filter((n) => (n as any).selected).map((n) => String(n.id)),
		);
		const selectedEdgeIds = new Set(
			edges.filter((e) => (e as any).selected).map((e) => String(e.id)),
		);
		if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
		event.preventDefault();
		setNodes((prev) => prev.filter((n) => !selectedNodeIds.has(String(n.id))));
		setEdges((prev) =>
			prev.filter((e) => {
				if (selectedEdgeIds.has(String(e.id))) return false;
				if (
					selectedNodeIds.has(String(e.source)) ||
					selectedNodeIds.has(String(e.target))
				)
					return false;
				return true;
			}),
		);
	};

	const nodeTypes = useMemo(() => ({ designerNode: DesignerNode }), []);

	const paletteBaseItems = useMemo(() => {
		const repos = registryReposQ.isError
			? []
			: (registryReposQ.data?.repositories ?? []);
		return repos.map(inferPaletteItemFromRepo);
	}, [registryReposQ.data?.repositories, registryReposQ.isError]);

	const paletteVendors = useMemo(() => {
		const set = new Set<string>();
		for (const p of paletteBaseItems) {
			const v = String(p.vendor ?? "").trim();
			if (v) set.add(v);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [paletteBaseItems]);

	const paletteItems = useMemo(() => {
		const base = paletteBaseItems;
		const q = paletteSearch.trim().toLowerCase();
		const filtered = base
			.filter((p) => {
				if (paletteVendor === "all") return true;
				return String(p.vendor ?? "") === paletteVendor;
			})
			.filter((p) => {
				if (paletteRole === "all") return true;
				return String(p.role ?? "other") === paletteRole;
			})
			.filter((p) => {
				if (!q) return true;
				return `${p.label} ${p.kind} ${p.category} ${p.repo ?? ""}`
					.toLowerCase()
					.includes(q);
			});

		const order: Record<PaletteCategory, number> = {
			Hosts: 0,
			Routers: 1,
			Switches: 2,
			Firewalls: 3,
			Other: 4,
		};
		return filtered.sort((a, b) => {
			const oa = order[a.category] ?? 99;
			const ob = order[b.category] ?? 99;
			if (oa !== ob) return oa - ob;
			return a.label.localeCompare(b.label);
		});
	}, [paletteBaseItems, paletteRole, paletteSearch, paletteVendor]);
	const paletteHasBaseItems = paletteBaseItems.length > 0;
	const paletteIsFilteredEmpty =
		paletteHasBaseItems && paletteItems.length === 0;
	const registryError = registryReposQ.isError
		? (registryReposQ.error as Error)?.message || "Registry unavailable."
		: "";

	return (
		<div className="h-full w-full p-4 flex flex-col gap-4 min-h-0">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<div className="text-2xl font-bold tracking-tight">
						Lab Designer (Containerlab)
					</div>
					<div className="text-sm text-muted-foreground">
						Drag nodes, wire links, generate Containerlab YAML, and deploy.
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setQuickstartOpen(true)}
					>
						<Waypoints className="mr-2 h-4 w-4" />
						Get started
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setImportOpen(true)}
						disabled={!workspaceId}
					>
						<FolderOpen className="mr-2 h-4 w-4" />
						Import template
					</Button>
					<Button variant="outline" size="sm" onClick={loadDraft}>
						Load draft
					</Button>
					<Button variant="outline" size="sm" onClick={saveDraft}>
						Save draft
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => saveConfig.mutate()}
						disabled={saveConfig.isPending}
					>
						<Save className="mr-2 h-4 w-4" />
						Save config
					</Button>
					<Button variant="outline" size="sm" onClick={exportYaml}>
						<Download className="mr-2 h-4 w-4" />
						Download YAML
					</Button>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[1fr_420px] flex-1 min-h-0">
				<Card className="flex flex-col min-h-0">
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between gap-3">
							<CardTitle>Topology</CardTitle>
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => setSnapToGrid((v) => !v)}
								>
									{snapToGrid ? "Snap: on" : "Snap: off"}
								</Button>
								<Button
									size="sm"
									variant={linkMode ? "default" : "outline"}
									onClick={() => {
										setLinkMode((v) => {
											const next = !v;
											if (!next) setPendingLinkSource("");
											return next;
										});
									}}
									title="Create links by clicking a source node, then a target node"
								>
									<Link2 className="mr-2 h-4 w-4" />
									{linkMode ? "Link: on" : "Link: off"}
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={autoLayout}
									disabled={nodes.length < 2}
								>
									<LayoutGrid className="mr-2 h-4 w-4" />
									Auto-layout
								</Button>
								<Button size="sm" variant="outline" onClick={addNode}>
									<Plus className="mr-2 h-4 w-4" />
									Add node
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex-1 min-h-0">
						<div className="flex h-full w-full border rounded-xl overflow-hidden bg-background/50">
							<div className="w-[180px] border-r bg-background p-3">
								<div className="text-xs font-semibold text-muted-foreground">
									Palette
								</div>
								<div className="mt-2">
									<Input
										value={paletteSearch}
										onChange={(e) => setPaletteSearch(e.target.value)}
										placeholder="Search…"
										className="h-8"
									/>
								</div>
								<div className="mt-2 grid gap-2">
									<Select
										value={paletteVendor}
										onValueChange={setPaletteVendor}
									>
										<SelectTrigger className="h-8">
											<SelectValue placeholder="Vendor" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All vendors</SelectItem>
											{paletteVendors.map((v) => (
												<SelectItem key={v} value={v}>
													{v}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select value={paletteRole} onValueChange={setPaletteRole}>
										<SelectTrigger className="h-8">
											<SelectValue placeholder="Role" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">All roles</SelectItem>
											<SelectItem value="router">Routers</SelectItem>
											<SelectItem value="switch">Switches</SelectItem>
											<SelectItem value="firewall">Firewalls</SelectItem>
											<SelectItem value="host">Hosts</SelectItem>
											<SelectItem value="other">Other</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="mt-3 space-y-2">
									{registryReposQ.isLoading ? (
										<div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
											Loading images…
										</div>
									) : paletteItems.length === 0 ? (
										<div className="rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
											{registryReposQ.isError ? (
												<div className="space-y-1">
													<div className="font-medium text-foreground">
														Registry not available
													</div>
													<div>{registryError}</div>
													<div>
														Set SKYFORGE_REGISTRY_URL (e.g. https://ghcr.io) and
														optional credentials.
													</div>
												</div>
											) : paletteIsFilteredEmpty ? (
												<div className="space-y-1">
													<div className="font-medium text-foreground">
														No matches
													</div>
													<div>Try clearing filters or search terms.</div>
												</div>
											) : (
												<div className="space-y-1">
													<div className="font-medium text-foreground">
														No images yet
													</div>
													<div>
														Add container images to your registry (e.g. GHCR) or
														adjust registry repo prefixes.
													</div>
												</div>
											)}
										</div>
									) : (
										<div className="space-y-3">
											{(
												[
													"Hosts",
													"Routers",
													"Switches",
													"Firewalls",
													"Other",
												] as const
											)
												.map((cat) => ({
													category: cat,
													items: paletteItems.filter((p) => p.category === cat),
												}))
												.filter((g) => g.items.length > 0)
												.map((g) => (
													<div key={g.category} className="space-y-1">
														<div className="text-[11px] font-semibold text-muted-foreground">
															{g.category}
														</div>
														<div className="space-y-2">
															{g.items.slice(0, 60).map((p) => (
																<PaletteDraggableItem key={p.id} item={p} />
															))}
														</div>
													</div>
												))}
										</div>
									)}
								</div>
							</div>

							<div
								className="flex-1 outline-none relative"
								ref={rfRef}
								onDrop={onDrop}
								onDragOver={onDragOver}
								tabIndex={0}
								onKeyDown={onCanvasKeyDown}
								onMouseDown={(e) => {
									(e.currentTarget as HTMLDivElement).focus();
									closeMenus();
								}}
								onContextMenu={(e) => e.preventDefault()}
							>
								{linkMode ? (
									<div className="absolute z-10 m-3 rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
										{pendingLinkSource ? (
											<>
												Link mode: select target for{" "}
												<span className="font-mono text-foreground">
													{pendingLinkSource}
												</span>
											</>
										) : (
											<>
												Link mode: click a source node, then click a target node
											</>
										)}
									</div>
								) : null}
								<ReactFlow<Node<DesignNodeData>, Edge>
									nodes={nodes}
									edges={edges}
									onNodesChange={onNodesChangeWithWarnings}
									onEdgesChange={onEdgesChangeWithWarnings}
									onConnect={(c) => {
										const label =
											c.source && c.target
												? `${c.source} ↔ ${c.target}`
												: undefined;
										setEdges((eds) => addEdge({ ...c, label }, eds));
									}}
									fitView
									onNodeClick={(_, n) => {
										const id = String(n.id);
										if (linkMode) {
											if (!pendingLinkSource) {
												setPendingLinkSource(id);
												return;
											}
											if (pendingLinkSource === id) {
												setPendingLinkSource("");
												return;
											}
											const edgeId = `e-${pendingLinkSource}-${id}-${Date.now()}`;
											setEdges((prev) =>
												addEdge(
													{
														id: edgeId,
														source: pendingLinkSource,
														target: id,
														label: `${pendingLinkSource} ↔ ${id}`,
													},
													prev,
												),
											);
											setPendingLinkSource("");
											return;
										}
										setSelectedNodeId(id);
									}}
									onNodeContextMenu={(event, node) => {
										event.preventDefault();
										const rect = rfRef.current?.getBoundingClientRect();
										const x = rect ? event.clientX - rect.left : event.clientX;
										const y = rect ? event.clientY - rect.top : event.clientY;
										setNodeMenu({ x, y, nodeId: String(node.id) });
										setEdgeMenu(null);
										setCanvasMenu(null);
									}}
									onEdgeContextMenu={(event, edge) => {
										event.preventDefault();
										const rect = rfRef.current?.getBoundingClientRect();
										const x = rect ? event.clientX - rect.left : event.clientX;
										const y = rect ? event.clientY - rect.top : event.clientY;
										setEdgeMenu({ x, y, edgeId: String(edge.id) });
										setNodeMenu(null);
										setCanvasMenu(null);
									}}
									onPaneContextMenu={(event) => {
										event.preventDefault();
										const rect = rfRef.current?.getBoundingClientRect();
										const x = rect ? event.clientX - rect.left : event.clientX;
										const y = rect ? event.clientY - rect.top : event.clientY;
										setCanvasMenu({ x, y });
										setNodeMenu(null);
										setEdgeMenu(null);
									}}
									onInit={setRfInstance}
									snapToGrid={snapToGrid}
									snapGrid={[12, 12]}
									nodeTypes={nodeTypes}
								>
									<Controls />
									<MiniMap
										zoomable
										pannable
										className="bg-background border rounded-lg"
									/>
									<Background gap={12} size={1} />
								</ReactFlow>

								{nodeMenu ? (
									<div
										className="absolute z-50"
										style={{ left: nodeMenu.x, top: nodeMenu.y }}
										onContextMenu={(e) => e.preventDefault()}
									>
										<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
											<CardHeader className="p-3 pb-2">
												<CardTitle className="text-sm">Node</CardTitle>
												<div className="text-xs text-muted-foreground font-mono truncate">
													{String(
														nodes.find((n) => String(n.id) === nodeMenu.nodeId)
															?.data?.label ?? nodeMenu.nodeId,
													)}
												</div>
											</CardHeader>
											<CardContent className="p-3 pt-0 space-y-2">
												<Button
													size="sm"
													className="w-full"
													onClick={() => {
														setSelectedNodeId(nodeMenu.nodeId);
														closeMenus();
													}}
												>
													Edit…
												</Button>
												{importDeploymentId ? (
													<div className="grid grid-cols-3 gap-2">
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																openImportedTool({
																	action: "terminal",
																	node: nodeMenu.nodeId,
																});
																closeMenus();
															}}
														>
															Terminal
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																openImportedTool({
																	action: "logs",
																	node: nodeMenu.nodeId,
																});
																closeMenus();
															}}
														>
															Logs
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => {
																openImportedTool({
																	action: "describe",
																	node: nodeMenu.nodeId,
																});
																closeMenus();
															}}
														>
															Describe
														</Button>
													</div>
												) : null}
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													onClick={() => {
														renameNode(nodeMenu.nodeId);
														closeMenus();
													}}
												>
													Rename…
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													onClick={() => {
														const n = nodes.find(
															(x) => String(x.id) === nodeMenu.nodeId,
														);
														if (!n) return;
														const used = new Set(
															nodes.map((x) => String(x.id)),
														);
														let i = nodes.length + 1;
														let nextId = `${String(n.id)}-${i}`;
														while (used.has(nextId)) {
															i++;
															nextId = `${String(n.id)}-${i}`;
														}
														const clone: Node<DesignNodeData> = {
															...n,
															id: nextId,
															position: {
																x: n.position.x + 32,
																y: n.position.y + 32,
															},
															data: { ...n.data, label: nextId },
														};
														setNodes((prev) => [...prev, clone]);
														setSelectedNodeId(nextId);
														closeMenus();
													}}
												>
													Duplicate
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													onClick={() => {
														setLinkMode(true);
														setPendingLinkSource(nodeMenu.nodeId);
														closeMenus();
													}}
												>
													Start link
												</Button>
												<Button
													size="sm"
													variant="secondary"
													className="w-full"
													onClick={() => {
														const label =
															nodes.find(
																(n) => String(n.id) === nodeMenu.nodeId,
															)?.data?.label ?? nodeMenu.nodeId;
														void navigator.clipboard?.writeText(String(label));
														toast.success("Copied");
														closeMenus();
													}}
												>
													Copy name
												</Button>
												<Button
													size="sm"
													variant="destructive"
													className="w-full"
													onClick={() => {
														const id = nodeMenu.nodeId;
														setNodes((prev) =>
															prev.filter((n) => String(n.id) !== id),
														);
														setEdges((prev) =>
															prev.filter(
																(e) =>
																	String(e.source) !== id &&
																	String(e.target) !== id,
															),
														);
														if (selectedNodeId === id) setSelectedNodeId("");
														closeMenus();
													}}
												>
													Delete
												</Button>
											</CardContent>
										</Card>
									</div>
								) : null}

								{edgeMenu ? (
									<div
										className="absolute z-50"
										style={{ left: edgeMenu.x, top: edgeMenu.y }}
										onContextMenu={(e) => e.preventDefault()}
									>
										<Card className="w-60 shadow-lg border bg-background/95 backdrop-blur">
											<CardHeader className="p-3 pb-2">
												<CardTitle className="text-sm">Link</CardTitle>
												<div className="text-xs text-muted-foreground font-mono truncate">
													{edges.find((e) => String(e.id) === edgeMenu.edgeId)
														?.label ?? edgeMenu.edgeId}
												</div>
											</CardHeader>
											<CardContent className="p-3 pt-0 space-y-2">
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													onClick={() => {
														const e = edges.find(
															(x) => String(x.id) === edgeMenu.edgeId,
														);
														if (!e) return;
														const next = window.prompt(
															"Link label",
															String(e.label ?? ""),
														);
														if (next == null) return;
														setEdges((prev) =>
															prev.map((x) =>
																String(x.id) === edgeMenu.edgeId
																	? { ...x, label: next }
																	: x,
															),
														);
														closeMenus();
													}}
												>
													Rename…
												</Button>
												<Button
													size="sm"
													variant="destructive"
													className="w-full"
													onClick={() => {
														setEdges((prev) =>
															prev.filter(
																(e) => String(e.id) !== edgeMenu.edgeId,
															),
														);
														closeMenus();
													}}
												>
													Delete
												</Button>
											</CardContent>
										</Card>
									</div>
								) : null}

								{canvasMenu ? (
									<div
										className="absolute z-50"
										style={{ left: canvasMenu.x, top: canvasMenu.y }}
										onContextMenu={(e) => e.preventDefault()}
									>
										<Card className="w-60 shadow-lg border bg-background/95 backdrop-blur">
											<CardHeader className="p-3 pb-2">
												<CardTitle className="text-sm">Canvas</CardTitle>
											</CardHeader>
											<CardContent className="p-3 pt-0 space-y-2">
												<Button
													size="sm"
													className="w-full"
													onClick={() => {
														addNode();
														closeMenus();
													}}
												>
													Add node
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													onClick={() => {
														autoLayout();
														closeMenus();
													}}
													disabled={nodes.length < 2}
												>
													Auto-layout
												</Button>
												<Button
													size="sm"
													variant="outline"
													className="w-full"
													onClick={() => {
														rfInstance?.fitView({
															padding: 0.15,
															duration: 250,
														});
														closeMenus();
													}}
													disabled={!rfInstance}
												>
													Fit view
												</Button>
											</CardContent>
										</Card>
									</div>
								) : null}
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Lab</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="space-y-1">
								<Label>Lab name</Label>
								<Input
									value={labName}
									onChange={(e) => setLabName(e.target.value)}
								/>
							</div>
							<div className="space-y-1">
								<Label>Workspace</Label>
								<Select
									value={workspaceId}
									onValueChange={(v) => setWorkspaceId(v)}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												workspacesQ.isLoading ? "Loading…" : "Select workspace…"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{(workspacesQ.data?.workspaces ?? []).map((w: any) => (
											<SelectItem key={String(w.id)} value={String(w.id)}>
												{String(w.name ?? w.slug ?? w.id)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Runtime</Label>
								<Select
									value={runtime}
									onValueChange={(v) => setRuntime(v as any)}
									disabled={!workspaceId}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												!workspaceId
													? "Select workspace first…"
													: "Select runtime…"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="clabernetes">
											Clabernetes (in-cluster)
										</SelectItem>
										<SelectItem value="containerlab">
											Containerlab (BYOS)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Repo path</Label>
								<div className="grid grid-cols-2 gap-2">
									<Input
										value={templatesDir}
										onChange={(e) => setTemplatesDir(e.target.value)}
										placeholder="containerlab/designer"
									/>
									<Input
										value={templateFile}
										onChange={(e) => setTemplateFile(e.target.value)}
										placeholder={`${labName || "lab"}.clab.yml`}
									/>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											void navigator.clipboard?.writeText(
												`${effectiveTemplatesDir}/${effectiveTemplateFile}`,
											);
											toast.success("Copied path");
										}}
										disabled={!workspaceId}
									>
										Copy path
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={openMapInNewTab}
										disabled={!workspaceId}
									>
										<ExternalLink className="mr-2 h-4 w-4" />
										Open map
									</Button>
								</div>
								<div className="text-xs text-muted-foreground font-mono truncate">
									{effectiveTemplatesDir}/{effectiveTemplateFile}
								</div>
							</div>
							<div className="flex items-center justify-between gap-3 rounded-lg border p-3">
								<div className="min-w-0">
									<div className="text-sm font-medium">Use saved config</div>
									<div className="text-xs text-muted-foreground truncate">
										{lastSaved?.workspaceId === workspaceId
											? `${lastSaved.filePath} (${lastSaved.branch})`
											: "Auto-saves before deploy"}
									</div>
								</div>
								<Switch
									checked={useSavedConfig}
									onCheckedChange={(v) => setUseSavedConfig(Boolean(v))}
								/>
							</div>
							<div className="space-y-1">
								<Label>Containerlab server</Label>
								<Select
									value={containerlabServer}
									onValueChange={(v) => setContainerlabServer(v)}
									disabled={!workspaceId || runtime !== "containerlab"}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												runtime !== "containerlab"
													? "Not required for clabernetes…"
													: !workspaceId
														? "Select workspace first…"
														: containerlabServersQ.isLoading
															? "Loading…"
															: "Select server…"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{(containerlabServersQ.data?.servers ?? []).map(
											(s: any) => (
												<SelectItem
													key={String(s.id)}
													value={`user:${String(s.id)}`}
												>
													{hostLabelFromURL(s.apiUrl) || s.name}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
								<div className="text-xs text-muted-foreground">
									Only required for Containerlab (BYOS). Configure in My
									Settings , then go to BYOL Servers.
								</div>
							</div>
							<div>
								<Button
									className="w-full"
									disabled={createDeployment.isPending}
									onClick={() => createDeployment.mutate()}
								>
									<Rocket className="mr-2 h-4 w-4" />
									{createDeployment.isPending
										? "Creating…"
										: "Create deployment + deploy"}
								</Button>
							</div>
							<div className="flex items-center justify-between rounded-lg border px-3 py-2">
								<div className="min-w-0">
									<div className="text-sm font-medium">
										Open deployment on create
									</div>
									<div className="text-xs text-muted-foreground">
										Keeps the Designer open in this tab.
									</div>
								</div>
								<Switch
									checked={openDeploymentOnCreate}
									onCheckedChange={(v) => setOpenDeploymentOnCreate(Boolean(v))}
								/>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Node</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{!selectedNode ? (
								<div className="text-sm text-muted-foreground">
									Click a node to edit.
								</div>
							) : (
								<>
									<div className="space-y-1">
										<Label>Name</Label>
										<Input
											value={String(
												selectedNode.data?.label ?? selectedNode.id,
											)}
											onChange={(e) => {
												const v = e.target.value;
												markWarningsVisible();
												setNodes((prev) =>
													prev.map((n) =>
														n.id === selectedNode.id
															? { ...n, data: { ...n.data, label: v } }
															: n,
													),
												);
											}}
										/>
									</div>
									<div className="space-y-1">
										<Label>Kind</Label>
										<Input
											value={String((selectedNode.data as any)?.kind ?? "")}
											onChange={(e) => {
												const v = e.target.value;
												setNodes((prev) =>
													prev.map((n) =>
														n.id === selectedNode.id
															? { ...n, data: { ...n.data, kind: v } }
															: n,
													),
												);
											}}
											placeholder="linux, ceos, ..."
										/>
									</div>
									<RegistryImagePicker
										value={String((selectedNode.data as any)?.image ?? "")}
										onChange={(image) => {
											markWarningsVisible();
											setNodes((prev) =>
												prev.map((n) =>
													n.id === selectedNode.id
														? { ...n, data: { ...n.data, image } }
														: n,
												),
											);
										}}
									/>
								</>
							)}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-3">
							<div className="flex items-center justify-between gap-3">
								<CardTitle>YAML</CardTitle>
								<div className="flex items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										onClick={() => {
											void navigator.clipboard?.writeText(effectiveYaml);
											toast.success("Copied YAML");
										}}
									>
										<Copy className="mr-2 h-4 w-4" />
										Copy
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center gap-2">
								<Button
									size="sm"
									variant={yamlMode === "generated" ? "default" : "outline"}
									onClick={() => setYamlMode("generated")}
								>
									Generated
								</Button>
								<Button
									size="sm"
									variant={yamlMode === "custom" ? "default" : "outline"}
									onClick={() => {
										setYamlMode("custom");
										if (!customYaml.trim()) setCustomYaml(effectiveYaml);
									}}
								>
									Custom
								</Button>
							</div>
							{otherWarnings.length ||
							(showWarnings && missingImageWarnings.length) ? (
								<div className="rounded-md border bg-amber-500/10 text-amber-900 dark:text-amber-200 px-3 py-2 text-xs">
									{otherWarnings.slice(0, 6).map((w) => (
										<div key={w}>{w}</div>
									))}
									{showWarnings
										? missingImageWarnings
												.slice(0, 6)
												.map((w) => <div key={w}>{w}</div>)
										: null}
								</div>
							) : null}
							<Textarea
								value={yamlMode === "custom" ? customYaml : yaml}
								onChange={(e) => setCustomYaml(e.target.value)}
								readOnly={yamlMode !== "custom"}
								className="font-mono text-xs h-[320px]"
							/>
						</CardContent>
					</Card>
				</div>
			</div>

			<Dialog open={importOpen} onOpenChange={(v) => setImportOpen(v)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Import template</DialogTitle>
						<DialogDescription>
							Load an existing containerlab YAML from templates/blueprints into
							the editor.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label>Source</Label>
								<Select
									value={importSource}
									onValueChange={(v) => {
										const next = v as "workspace" | "blueprints";
										setImportSource(next);
										setImportDir(
											next === "workspace"
												? "containerlab/designer"
												: "containerlab",
										);
										setImportFile("");
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="blueprints">Blueprints</SelectItem>
										<SelectItem value="workspace">Workspace repo</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Directory</Label>
								<Input
									value={importDir}
									onChange={(e) => setImportDir(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-1">
							<Label>Template</Label>
							<Select
								value={importFile}
								onValueChange={(v) => setImportFile(v)}
								disabled={!workspaceId}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											templatesQ.isLoading ? "Loading…" : "Select template…"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{(templatesQ.data?.templates ?? []).map((t) => (
										<SelectItem key={t} value={t}>
											{t}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{templatesQ.isError ? (
								<div className="text-xs text-destructive">
									Failed to list templates
								</div>
							) : null}
						</div>

						<div className="space-y-1">
							<Label>Preview</Label>
							<Textarea
								value={templatePreviewQ.data?.yaml ?? ""}
								readOnly
								placeholder={
									importFile
										? templatePreviewQ.isLoading
											? "Loading preview…"
											: "No preview"
										: "Select a template to preview…"
								}
								className="font-mono text-xs h-[220px]"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setImportOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => importTemplate.mutate()}
							disabled={importTemplate.isPending || !importFile}
						>
							Import
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={quickstartOpen} onOpenChange={(v) => setQuickstartOpen(v)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Quickstart: Generate CLOS</DialogTitle>
						<DialogDescription>
							Generate a simple leaf/spine fabric (inspired by `clab generate`).
							This populates the designer canvas; you can edit nodes and YAML
							afterwards.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-1">
							<Label>Lab name</Label>
							<Input
								value={qsName}
								onChange={(e) => setQsName(e.target.value)}
							/>
						</div>
						<div className="grid grid-cols-3 gap-3">
							<div className="space-y-1">
								<Label>Spines</Label>
								<Input
									type="number"
									min={1}
									max={16}
									value={qsSpines}
									onChange={(e) => setQsSpines(Number(e.target.value || 0))}
								/>
							</div>
							<div className="space-y-1">
								<Label>Leaves</Label>
								<Input
									type="number"
									min={1}
									max={64}
									value={qsLeaves}
									onChange={(e) => setQsLeaves(Number(e.target.value || 0))}
								/>
							</div>
							<div className="space-y-1">
								<Label>Hosts/leaf</Label>
								<Input
									type="number"
									min={0}
									max={16}
									value={qsHostsPerLeaf}
									onChange={(e) =>
										setQsHostsPerLeaf(Number(e.target.value || 0))
									}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-3">
								<div className="space-y-1">
									<Label>Switch kind</Label>
									<Input
										value={qsSwitchKind}
										onChange={(e) => setQsSwitchKind(e.target.value)}
										placeholder="ceos"
									/>
								</div>
								<RegistryImagePicker
									value={qsSwitchImage}
									onChange={setQsSwitchImage}
								/>
							</div>
							<div className="space-y-3">
								<div className="space-y-1">
									<Label>Host kind</Label>
									<Input
										value={qsHostKind}
										onChange={(e) => setQsHostKind(e.target.value)}
										placeholder="linux"
									/>
								</div>
								<RegistryImagePicker
									value={qsHostImage}
									onChange={setQsHostImage}
								/>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setQuickstartOpen(false)}>
							Cancel
						</Button>
						<Button onClick={applyQuickstartClos}>Generate</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
