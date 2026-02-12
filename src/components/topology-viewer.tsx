import {
	Background,
	type Connection,
	Controls,
	type Edge,
	Handle,
	MiniMap,
	type Node,
	type NodeProps,
	Panel,
	Position,
	ReactFlow,
	addEdge,
	useEdgesState,
	useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";
import { NodeDescribeModal } from "@/components/node-describe-modal";
import { NodeLogsModal } from "@/components/node-logs-modal";
import { TerminalModal } from "@/components/terminal-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WebUIModal } from "@/components/webui-modal";
import { useDownloadImage } from "@/hooks/use-download-image";
import {
	type DeploymentUIEventsState,
	useDeploymentUIEvents,
} from "@/lib/deployment-ui-events";
import { queryKeys } from "@/lib/query-keys";
import {
	type DeploymentNodeInterfacesResponse,
	type DeploymentNodeRunningConfigResponse,
	type DeploymentTopology,
	type LinkCaptureResponse,
	type LinkStatsSnapshot,
	captureDeploymentLinkPcap,
	downloadWorkspaceArtifact,
	getDeploymentInventory,
	getDeploymentLinkStats,
	getDeploymentNodeInterfaces,
	getDeploymentNodeRunningConfig,
	setDeploymentLinkAdmin,
	setDeploymentLinkImpairment,
} from "@/lib/skyforge-api";
import { saveDeploymentNodeConfig } from "@/lib/skyforge-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
	Activity,
	Cloud,
	Download,
	Laptop,
	LayoutGrid,
	Network,
	Search,
	Server,
} from "lucide-react";
import { toast } from "sonner";

// Custom Node Component
const CustomNode = ({ data }: NodeProps) => {
	const Icon =
		data.icon === "switch"
			? Network
			: data.icon === "cloud"
				? Cloud
				: data.icon === "client"
					? Laptop
					: Server;
	const statusColor =
		data.status === "running"
			? "default"
			: data.status === "stopped"
				? "secondary"
				: "destructive";
	const highlight = Boolean((data as any)?.highlight);
	const vendor = String((data as any)?.vendor ?? "");

	const VendorMark = ({ vendor }: { vendor: string }) => {
		const v = String(vendor).toLowerCase();
		if (v === "cisco") {
			return (
				<div
					className="h-6 w-6 rounded-md flex items-center justify-center"
					title="Cisco"
					style={{
						background: "rgba(0, 142, 204, 0.15)",
						color: "rgb(0, 142, 204)",
					}}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						{[
							{ x: 4, h: 8 },
							{ x: 7, h: 10 },
							{ x: 10, h: 12 },
							{ x: 13, h: 10 },
							{ x: 16, h: 8 },
						].map((b) => (
							<rect
								key={b.x}
								x={b.x}
								y={14 - b.h}
								width="2"
								height={b.h}
								rx="1"
								fill="currentColor"
							/>
						))}
					</svg>
				</div>
			);
		}
		if (v === "arista") {
			return (
				<div
					className="h-6 w-6 rounded-md flex items-center justify-center"
					title="Arista"
					style={{
						background: "rgba(232, 43, 44, 0.14)",
						color: "rgb(232, 43, 44)",
					}}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path
							d="M12 3 4.5 21h3.6l1.6-4h4.6l1.6 4h3.6L12 3zm-1 11 1-2.6 1 2.6h-2z"
							fill="currentColor"
						/>
					</svg>
				</div>
			);
		}
		if (v === "linux") {
			return (
				<div
					className="h-6 w-6 rounded-md flex items-center justify-center"
					title="Linux"
					style={{
						background: "rgba(34, 197, 94, 0.12)",
						color: "rgb(34, 197, 94)",
					}}
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<circle cx="12" cy="9" r="4" fill="#111827" />
						<ellipse cx="12" cy="16" rx="5" ry="6" fill="#111827" />
						<ellipse cx="12" cy="17" rx="3.3" ry="4.2" fill="#ffffff" />
						<path d="M12 10l2 1-2 1-2-1 2-1z" fill="#f59e0b" />
					</svg>
				</div>
			);
		}
		return (
			<div
				className="h-6 w-6 rounded-md flex items-center justify-center bg-muted text-[11px] font-bold"
				title="Unknown"
			>
				?
			</div>
		);
	};

	return (
		<Card
			className={`min-w-[180px] border-2 shadow-md ${highlight ? "border-primary ring-2 ring-primary/30" : ""}`}
		>
			<CardHeader className="p-3 pb-2">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<VendorMark vendor={vendor} />
						<div
							className="p-1.5 bg-muted rounded-md"
							title={String((data as any)?.kind ?? "")}
						>
							<Icon className="w-4 h-4" />
						</div>
					</div>
					<Badge variant={statusColor} className="text-[10px] h-5">
						{String(data.status)}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="p-3 pt-0">
				<CardTitle className="text-sm font-bold truncate">
					{String(data.label)}
				</CardTitle>
				<div className="text-xs text-muted-foreground mt-1 truncate font-mono">
					{String(data.ip || "10.0.0.x")}
				</div>
				<Handle
					type="target"
					position={Position.Top}
					className="!bg-muted-foreground"
				/>
				<Handle
					type="source"
					position={Position.Bottom}
					className="!bg-muted-foreground"
				/>
			</CardContent>
		</Card>
	);
};

const nodeTypes = {
	custom: CustomNode,
};

export function TopologyViewer({
	topology,
	workspaceId,
	deploymentId,
	enableTerminal,
	fullHeight,
	className,
}: {
	topology?: DeploymentTopology | null;
	workspaceId?: string;
	deploymentId?: string;
	enableTerminal?: boolean;
	fullHeight?: boolean;
	className?: string;
}) {
	const vendorFromKind = useCallback(
		(kindRaw: string): "cisco" | "arista" | "linux" | "unknown" => {
			const k = String(kindRaw ?? "").toLowerCase();
			if (!k) return "unknown";
			if (
				k.includes("arista") ||
				k.includes("eos") ||
				k.includes("ceos") ||
				k.includes("veos")
			)
				return "arista";
			if (
				k.includes("cisco") ||
				k.includes("ios") ||
				k.includes("nxos") ||
				k.includes("csr") ||
				k.includes("c8k") ||
				k.includes("iosxr")
			)
				return "cisco";
			if (
				k.includes("linux") ||
				k.includes("ubuntu") ||
				k.includes("debian") ||
				k.includes("alpine") ||
				k.includes("rocky") ||
				k.includes("centos")
			)
				return "linux";
			return "unknown";
		},
		[],
	);

	const derived = useMemo(() => {
		if (
			!topology ||
			!Array.isArray(topology.nodes) ||
			topology.nodes.length === 0
		) {
			return { nodes: [] as Node[], edges: [] as Edge[] };
		}
		const gapX = 240;
		const gapY = 160;
		const cols = Math.max(1, Math.ceil(Math.sqrt(topology.nodes.length)));
		const nodes: Node[] = topology.nodes.map((n, idx) => {
			const col = idx % cols;
			const row = Math.floor(idx / cols);
			const kind = String(n.kind ?? "");
			const vendor = vendorFromKind(kind);
			const icon =
				vendor === "linux"
					? "client"
					: vendor === "arista" || vendor === "cisco"
						? "switch"
						: "server";
			const status = String(n.status ?? "unknown");
			const pingIp = String((n as any).pingIp ?? n.mgmtIp ?? "");
			const mgmtHost = String((n as any).mgmtHost ?? "");
			return {
				id: String(n.id),
				position: { x: col * gapX, y: row * gapY },
				data: {
					label: String(n.label ?? n.id),
					icon,
					status,
					ip: pingIp,
					mgmtHost,
					kind,
					vendor,
				},
				type: "custom",
			};
		});
		const edges: Edge[] = (topology.edges ?? []).map((e) => ({
			id: String(e.id),
			source: String(e.source),
			target: String(e.target),
			label: e.label ? String(e.label) : undefined,
			animated: false,
		}));
		return { nodes, edges };
	}, [topology, vendorFromKind]);

	const [nodes, setNodes, onNodesChange] = useNodesState(derived.nodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState(derived.edges);
	const ref = useRef<HTMLDivElement>(null);
	const { downloadImage } = useDownloadImage();
	const [terminalNode, setTerminalNode] = useState<{
		id: string;
		kind?: string;
	} | null>(null);
	const [webuiNode, setWebuiNode] = useState<{
		id: string;
		kind?: string;
	} | null>(null);
	const [logsNode, setLogsNode] = useState<{
		id: string;
		kind?: string;
		ip?: string;
	} | null>(null);
	const [describeNode, setDescribeNode] = useState<{
		id: string;
		kind?: string;
		ip?: string;
	} | null>(null);
	const [edgeMenu, setEdgeMenu] = useState<{
		x: number;
		y: number;
		edge: Edge;
	} | null>(null);
	const [nodeMenu, setNodeMenu] = useState<{
		x: number;
		y: number;
		node: Node;
	} | null>(null);
	const [selectedEdge, setSelectedEdge] = useState<{
		id: string;
		label?: string;
	} | null>(null);
	const [impairOpen, setImpairOpen] = useState(false);
	const [impairSaving, setImpairSaving] = useState(false);
	const [statsEnabled, setStatsEnabled] = useState(false);
	const [statsError, setStatsError] = useState<string | null>(null);
	const [edgeRates, setEdgeRates] = useState<
		Record<string, { bps: number; pps: number; drops: number }>
	>({});
	const lastStatsRef = useRef<{
		atMs: number;
		byEdge: Record<string, LinkStatsSnapshot["edges"][number]>;
	} | null>(null);
	const baseEdgeLabelsRef = useRef<Record<string, string | undefined>>({});
	const deepLinkHandledRef = useRef(false);
	const [search, setSearch] = useState("");
	const [layoutMode, setLayoutMode] = useState<"grid" | "circle">("grid");
	const positionsKey = useMemo(() => {
		if (!workspaceId || !deploymentId) return "";
		return `skyforge.topology.positions.${workspaceId}.${deploymentId}`;
	}, [deploymentId, workspaceId]);
	const [pinnedPositions, setPinnedPositions] = useState<
		Record<string, { x: number; y: number }>
	>(() => {
		return {};
	});
	const [interfacesNode, setInterfacesNode] = useState<{
		id: string;
		kind?: string;
		ip?: string;
	} | null>(null);
	const [interfacesOpen, setInterfacesOpen] = useState(false);
	const [runningConfigNode, setRunningConfigNode] = useState<{
		id: string;
	} | null>(null);
	const [runningConfigOpen, setRunningConfigOpen] = useState(false);
	const [captureOpen, setCaptureOpen] = useState(false);
	const [captureEdge, setCaptureEdge] = useState<{
		id: string;
		label?: string;
	} | null>(null);
	const [capture, setCapture] = useState<{
		side: "source" | "target";
		duration: string;
		packets: string;
		snaplen: string;
	}>({
		side: "source",
		duration: "10",
		packets: "2500",
		snaplen: "192",
	});
	const [interfacesAutoRefresh, setInterfacesAutoRefresh] = useState(false);
	const [hoverEdge, setHoverEdge] = useState<{
		id: string;
		x: number;
		y: number;
	} | null>(null);
	const [impair, setImpair] = useState<{
		delayMs: string;
		jitterMs: string;
		lossPct: string;
		dupPct: string;
		corruptPct: string;
		reorderPct: string;
		rateKbps: string;
	}>({
		delayMs: "",
		jitterMs: "",
		lossPct: "",
		dupPct: "",
		corruptPct: "",
		reorderPct: "",
		rateKbps: "",
	});

	useEffect(() => {
		if (!positionsKey) return;
		try {
			const raw = window.localStorage.getItem(positionsKey);
			if (!raw) return;
			const parsed = JSON.parse(raw) as Record<
				string,
				{ x: number; y: number }
			>;
			if (parsed && typeof parsed === "object") setPinnedPositions(parsed);
		} catch {
			// ignore
		}
	}, [positionsKey]);

	const uiEventsEnabled = Boolean(workspaceId && deploymentId);
	useDeploymentUIEvents(workspaceId ?? "", deploymentId ?? "", uiEventsEnabled);
	const uiEvents = useQuery({
		queryKey:
			workspaceId && deploymentId
				? queryKeys.deploymentUIEvents(workspaceId, deploymentId)
				: ["deploymentUIEvents", "none"],
		queryFn: async () => ({ cursor: 0, events: [] }) as DeploymentUIEventsState,
		initialData: { cursor: 0, events: [] } as DeploymentUIEventsState,
		staleTime: Number.POSITIVE_INFINITY,
		enabled: uiEventsEnabled,
	});
	const edgeFlags = useMemo(
		() => buildEdgeFlags(uiEvents.data?.events ?? []),
		[uiEvents.data?.events],
	);

	useEffect(() => {
		setNodes(
			applyLayoutAndHighlights(
				derived.nodes,
				layoutMode,
				pinnedPositions,
				search,
			),
		);
		baseEdgeLabelsRef.current = Object.fromEntries(
			derived.edges.map((e) => [
				String(e.id),
				typeof e.label === "string" ? e.label : undefined,
			]),
		);
		setEdges(
			decorateEdges(
				derived.edges,
				edgeRates,
				statsEnabled,
				baseEdgeLabelsRef.current,
				edgeFlags,
			),
		);
	}, [
		derived.edges,
		derived.nodes,
		edgeFlags,
		edgeRates,
		layoutMode,
		pinnedPositions,
		search,
		setEdges,
		setNodes,
		statsEnabled,
	]);

	useEffect(() => {
		// Update edge rendering when stats update.
		setEdges((prev) =>
			decorateEdges(
				prev,
				edgeRates,
				statsEnabled,
				baseEdgeLabelsRef.current,
				edgeFlags,
			),
		);
	}, [edgeFlags, edgeRates, setEdges, statsEnabled]);

	useEffect(() => {
		if (!workspaceId || !deploymentId) return;
		if (deepLinkHandledRef.current) return;
		const params = new URLSearchParams(window.location.search);
		const node = params.get("node")?.trim();
		const action = params.get("action")?.trim();
		if (!node || !action) {
			deepLinkHandledRef.current = true;
			return;
		}
		if (action === "terminal") setTerminalNode({ id: node });
		if (action === "webui") setWebuiNode({ id: node });
		if (action === "logs") setLogsNode({ id: node });
		if (action === "describe") setDescribeNode({ id: node });
		if (action === "interfaces") {
			setInterfacesNode({ id: node });
			setInterfacesOpen(true);
		}
		if (action === "running-config") {
			setRunningConfigNode({ id: node });
			setRunningConfigOpen(true);
		}
		deepLinkHandledRef.current = true;
		params.delete("node");
		params.delete("action");
		const suffix = params.toString();
		const nextUrl = `${window.location.pathname}${suffix ? `?${suffix}` : ""}${window.location.hash || ""}`;
		window.history.replaceState(null, "", nextUrl);
	}, [deploymentId, workspaceId]);

	useEffect(() => {
		if (!edgeMenu) return;
		const onClick = () => setEdgeMenu(null);
		const onKeyDown = (ev: KeyboardEvent) => {
			if (ev.key === "Escape") setEdgeMenu(null);
		};
		window.addEventListener("click", onClick);
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("click", onClick);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [edgeMenu]);

	const saveConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!workspaceId || !deploymentId)
				throw new Error("missing workspace/deployment");
			return saveDeploymentNodeConfig(workspaceId, deploymentId, nodeId);
		},
		onSuccess: (resp, nodeId) => {
			if (resp?.skipped) {
				toast.message("Save config skipped", {
					description: resp.message || `Node ${nodeId}`,
				});
				return;
			}
			toast.success("Save config queued/applied", {
				description: resp.stdout || `Node ${nodeId}`,
			});
		},
		onError: (e: any) => {
			toast.error("Save config failed", {
				description: e?.message ?? String(e),
			});
		},
	});

	const linkAdmin = useMutation({
		mutationFn: async (args: { edgeId: string; action: "up" | "down" }) => {
			if (!workspaceId || !deploymentId)
				throw new Error("missing workspace/deployment");
			return setDeploymentLinkAdmin(workspaceId, deploymentId, args);
		},
		onSuccess: (resp) => {
			const failed = resp.results.filter((r) => r.error);
			if (failed.length) {
				toast.error("Link admin applied with errors", {
					description: failed.map((r) => `${r.node}: ${r.error}`).join("; "),
				});
				return;
			}
			toast.success(`Link ${resp.action} applied`);
		},
		onError: (e: any) =>
			toast.error("Link admin failed", {
				description: e?.message ?? String(e),
			}),
	});

	const captureLink = useMutation({
		mutationFn: async (args: {
			edgeId: string;
			side: "source" | "target";
			durationSeconds: number;
			maxPackets: number;
			snaplen: number;
		}) => {
			if (!workspaceId || !deploymentId)
				throw new Error("missing workspace/deployment");
			return captureDeploymentLinkPcap(workspaceId, deploymentId, args);
		},
		onSuccess: (resp) => {
			toast.success("Pcap captured", {
				description: `${resp.sizeBytes} bytes • ${resp.artifactKey}`,
			});
		},
		onError: (e: any) =>
			toast.error("Pcap capture failed", {
				description: e?.message ?? String(e),
			}),
	});

	const fetchInterfaces = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!workspaceId || !deploymentId)
				throw new Error("missing workspace/deployment");
			return getDeploymentNodeInterfaces(workspaceId, deploymentId, nodeId);
		},
		onError: (e: any) =>
			toast.error("Failed to load interfaces", {
				description: e?.message ?? String(e),
			}),
	});

	const fetchRunningConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!workspaceId || !deploymentId)
				throw new Error("missing workspace/deployment");
			return getDeploymentNodeRunningConfig(workspaceId, deploymentId, nodeId);
		},
		onError: (e: any) =>
			toast.error("Failed to load running config", {
				description: e?.message ?? String(e),
			}),
	});

	const downloadPcap = useCallback(
		async (key: string) => {
			if (!workspaceId) return;
			const resp = await downloadWorkspaceArtifact(workspaceId, key);
			const b64 = String((resp as any)?.fileData ?? "");
			if (!b64) throw new Error("missing fileData");
			const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
			const blob = new Blob([bytes], { type: "application/vnd.tcpdump.pcap" });
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = key.split("/").pop() || "capture.pcap";
			a.click();
			URL.revokeObjectURL(url);
		},
		[workspaceId],
	);

	const downloadInventory = useCallback(async () => {
		if (!workspaceId || !deploymentId) return;
		const resp = await getDeploymentInventory(workspaceId, deploymentId, "csv");
		const csv = String(resp.csv ?? "");
		if (!csv.trim()) throw new Error("empty inventory csv");
		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `${deploymentId}-inventory.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}, [deploymentId, workspaceId]);

	useEffect(() => {
		if (!nodeMenu) return;
		const onClick = () => setNodeMenu(null);
		const onKeyDown = (ev: KeyboardEvent) => {
			if (ev.key === "Escape") setNodeMenu(null);
		};
		window.addEventListener("click", onClick);
		window.addEventListener("keydown", onKeyDown);
		return () => {
			window.removeEventListener("click", onClick);
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [nodeMenu]);

	useEffect(() => {
		if (!interfacesOpen) return;
		if (!interfacesNode?.id) return;
		fetchInterfaces.mutate(interfacesNode.id);
	}, [fetchInterfaces, interfacesNode?.id, interfacesOpen]);

	useEffect(() => {
		if (!interfacesOpen || !interfacesAutoRefresh) return;
		if (!interfacesNode?.id) return;
		const t = window.setInterval(() => {
			fetchInterfaces.mutate(interfacesNode.id);
		}, 2000);
		return () => window.clearInterval(t);
	}, [
		fetchInterfaces,
		interfacesAutoRefresh,
		interfacesNode?.id,
		interfacesOpen,
	]);

	useEffect(() => {
		if (!runningConfigOpen) return;
		if (!runningConfigNode?.id) return;
		fetchRunningConfig.mutate(runningConfigNode.id);
	}, [fetchRunningConfig, runningConfigNode?.id, runningConfigOpen]);

	const onConnect = useCallback(
		(params: Connection) => setEdges((eds) => addEdge(params, eds)),
		[setEdges],
	);

	const onNodeContextMenu = useCallback(
		(event: React.MouseEvent, node: Node) => {
			event.preventDefault();
			if (!workspaceId || !deploymentId) return;
			const rect = ref.current?.getBoundingClientRect();
			const x = rect ? event.clientX - rect.left : event.clientX;
			const y = rect ? event.clientY - rect.top : event.clientY;
			setNodeMenu({ x, y, node });
		},
		[deploymentId, workspaceId],
	);

	const onEdgeContextMenu = useCallback(
		(event: React.MouseEvent, edge: Edge) => {
			if (!workspaceId || !deploymentId) return;
			event.preventDefault();
			const rect = ref.current?.getBoundingClientRect();
			const x = rect ? event.clientX - rect.left : event.clientX;
			const y = rect ? event.clientY - rect.top : event.clientY;
			setEdgeMenu({ x, y, edge });
		},
		[deploymentId, workspaceId],
	);

	const applyImpairment = useCallback(
		async (action: "set" | "clear", edgeId: string) => {
			if (!workspaceId || !deploymentId) return;
			try {
				setImpairSaving(true);
				const body: any = { edgeId, action };
				if (action === "set") {
					const delayMs = impair.delayMs.trim()
						? Number(impair.delayMs.trim())
						: undefined;
					const jitterMs = impair.jitterMs.trim()
						? Number(impair.jitterMs.trim())
						: undefined;
					const lossPct = impair.lossPct.trim()
						? Number(impair.lossPct.trim())
						: undefined;
					const dupPct = impair.dupPct.trim()
						? Number(impair.dupPct.trim())
						: undefined;
					const corruptPct = impair.corruptPct.trim()
						? Number(impair.corruptPct.trim())
						: undefined;
					const reorderPct = impair.reorderPct.trim()
						? Number(impair.reorderPct.trim())
						: undefined;
					const rateKbps = impair.rateKbps.trim()
						? Number(impair.rateKbps.trim())
						: undefined;
					if (Number.isFinite(delayMs)) body.delayMs = delayMs;
					if (Number.isFinite(jitterMs)) body.jitterMs = jitterMs;
					if (Number.isFinite(lossPct)) body.lossPct = lossPct;
					if (Number.isFinite(dupPct)) body.dupPct = dupPct;
					if (Number.isFinite(corruptPct)) body.corruptPct = corruptPct;
					if (Number.isFinite(reorderPct)) body.reorderPct = reorderPct;
					if (Number.isFinite(rateKbps)) body.rateKbps = rateKbps;
				}
				const resp = await setDeploymentLinkImpairment(
					workspaceId,
					deploymentId,
					body,
				);
				const failed = resp.results.filter((r) => r.error);
				if (failed.length) {
					toast.error("Link impairment applied with errors", {
						description: failed.map((r) => `${r.node}: ${r.error}`).join("; "),
					});
				} else {
					toast.success(
						action === "clear"
							? "Link impairment cleared"
							: "Link impairment applied",
					);
				}
			} catch (e: any) {
				toast.error("Failed to apply link impairment", {
					description: e?.message ?? String(e),
				});
			} finally {
				setImpairSaving(false);
			}
		},
		[
			deploymentId,
			impair.corruptPct,
			impair.delayMs,
			impair.dupPct,
			impair.jitterMs,
			impair.lossPct,
			impair.rateKbps,
			impair.reorderPct,
			workspaceId,
		],
	);

	useEffect(() => {
		if (!statsEnabled || !workspaceId || !deploymentId) return;
		setStatsError(null);
		lastStatsRef.current = null;

		const url = `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/links/stats/events`;
		const es = new EventSource(url, { withCredentials: true });

		const onStats = (ev: MessageEvent) => {
			try {
				const payload = JSON.parse(String(ev.data ?? "{}")) as {
					type?: string;
					snapshot?: LinkStatsSnapshot;
					error?: string;
				};
				if (payload.type === "error") {
					setStatsError(payload.error || "failed to stream link stats");
					return;
				}
				if (payload.type !== "snapshot" || !payload.snapshot) return;

				const snap = payload.snapshot;
				const atMs = Date.parse(snap.generatedAt || "");
				if (!Number.isFinite(atMs)) return;
				const byEdge: Record<string, LinkStatsSnapshot["edges"][number]> = {};
				for (const e of snap.edges ?? []) {
					byEdge[String(e.edgeId)] = e;
				}

				const prev = lastStatsRef.current;
				lastStatsRef.current = { atMs, byEdge };
				if (!prev) return;

				const dt = (atMs - prev.atMs) / 1000;
				if (!(dt > 0)) return;

				const rates: Record<
					string,
					{ bps: number; pps: number; drops: number }
				> = {};
				for (const [edgeId, cur] of Object.entries(byEdge)) {
					const p = prev.byEdge[edgeId];
					if (!p) continue;
					const d = (a: number, b: number) => Math.max(0, a - b);

					const srcTx = d(cur.sourceTxBytes, p.sourceTxBytes);
					const srcRx = d(cur.sourceRxBytes, p.sourceRxBytes);
					const dstTx = d(cur.targetTxBytes, p.targetTxBytes);
					const dstRx = d(cur.targetRxBytes, p.targetRxBytes);

					const dirAToB = Math.max(srcTx, dstRx);
					const dirBToA = Math.max(dstTx, srcRx);
					const bytes = dirAToB + dirBToA;

					const srcTxPk = d(cur.sourceTxPackets, p.sourceTxPackets);
					const srcRxPk = d(cur.sourceRxPackets, p.sourceRxPackets);
					const dstTxPk = d(cur.targetTxPackets, p.targetTxPackets);
					const dstRxPk = d(cur.targetRxPackets, p.targetRxPackets);
					const pps =
						(Math.max(srcTxPk, dstRxPk) + Math.max(dstTxPk, srcRxPk)) / dt;

					const drops =
						(d(cur.sourceRxDropped, p.sourceRxDropped) +
							d(cur.sourceTxDropped, p.sourceTxDropped) +
							d(cur.targetRxDropped, p.targetRxDropped) +
							d(cur.targetTxDropped, p.targetTxDropped)) /
						dt;

					rates[edgeId] = { bps: (bytes * 8) / dt, pps, drops };
				}
				setEdgeRates(rates);
			} catch (e: any) {
				setStatsError(e?.message ?? String(e));
			}
		};

		const onError = () => setStatsError("link stats stream disconnected");

		es.addEventListener("stats", onStats as any);
		es.onerror = onError;

		// Kick a one-shot fetch too (makes the first delta appear faster after a pause).
		void getDeploymentLinkStats(workspaceId, deploymentId).catch(() => {});

		return () => {
			es.removeEventListener("stats", onStats as any);
			es.close();
		};
	}, [deploymentId, statsEnabled, workspaceId]);

	return (
		<div
			className={`w-full bg-background/50 overflow-hidden relative ${fullHeight ? "h-full" : "h-[600px]"} border rounded-xl ${
				className ?? ""
			}`}
			ref={ref}
		>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onNodeContextMenu={onNodeContextMenu}
				onEdgeContextMenu={onEdgeContextMenu}
				onEdgeMouseEnter={(event, edge) => {
					const rect = ref.current?.getBoundingClientRect();
					const x = rect ? event.clientX - rect.left : event.clientX;
					const y = rect ? event.clientY - rect.top : event.clientY;
					setHoverEdge({ id: String(edge.id), x, y });
				}}
				onEdgeMouseMove={(event) => {
					if (!hoverEdge) return;
					const rect = ref.current?.getBoundingClientRect();
					const x = rect ? event.clientX - rect.left : event.clientX;
					const y = rect ? event.clientY - rect.top : event.clientY;
					setHoverEdge((p) => (p ? { ...p, x, y } : null));
				}}
				onEdgeMouseLeave={() => setHoverEdge(null)}
				onNodeDragStop={(_, n) => {
					if (!positionsKey) return;
					setPinnedPositions((prev) => {
						const next = {
							...prev,
							[String(n.id)]: { x: n.position.x, y: n.position.y },
						};
						try {
							window.localStorage.setItem(positionsKey, JSON.stringify(next));
						} catch {
							// ignore
						}
						return next;
					});
				}}
				nodeTypes={nodeTypes}
				fitView
				className="bg-muted/10"
			>
				<Panel position="top-right">
					<Card className="shadow-sm border bg-background/85 backdrop-blur">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm">Tools</CardTitle>
						</CardHeader>
						<CardContent className="p-3 pt-0 space-y-2">
							<div className="flex items-center gap-2 rounded-md border bg-background/70 px-2 py-1">
								<Search className="h-4 w-4 text-muted-foreground" />
								<Input
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search nodes…"
									className="h-7 w-56 border-0 bg-transparent p-0 text-sm focus-visible:ring-0"
								/>
								{search.trim() ? (
									<Button
										variant="ghost"
										size="sm"
										className="h-7 px-2"
										onClick={() => setSearch("")}
									>
										Clear
									</Button>
								) : null}
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant={statsEnabled ? "default" : "outline"}
									size="sm"
									onClick={() => {
										setStatsEnabled((v) => {
											const next = !v;
											if (!next) {
												setStatsError(null);
												setEdgeRates({});
												lastStatsRef.current = null;
											}
											return next;
										});
									}}
									disabled={!workspaceId || !deploymentId}
									title="Show live link utilization (SSE)"
								>
									<Activity className="mr-2 h-4 w-4" />
									Live stats
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setLayoutMode((m) => (m === "grid" ? "circle" : "grid"))
									}
									title="Toggle layout"
								>
									<LayoutGrid className="mr-2 h-4 w-4" />
									{layoutMode === "grid" ? "Grid" : "Circle"}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										setPinnedPositions({});
										if (positionsKey) {
											try {
												window.localStorage.removeItem(positionsKey);
											} catch {
												/* ignore */
											}
										}
									}}
									title="Reset pinned node positions"
								>
									Reset
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										downloadInventory().catch((e) =>
											toast.error("Failed to download inventory", {
												description: (e as Error).message,
											}),
										)
									}
									disabled={!workspaceId || !deploymentId}
									title="Download inventory CSV"
								>
									Inventory
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										ref.current && downloadImage(ref.current, "topology.png")
									}
								>
									<Download className="mr-2 h-4 w-4" />
									PNG
								</Button>
							</div>
							<div className="text-[11px] text-muted-foreground">
								Tip: Right-click a node or link for actions.
							</div>
						</CardContent>
					</Card>
				</Panel>
				<Controls />
				<MiniMap
					zoomable
					pannable
					className="bg-background border rounded-lg"
				/>
				<Background gap={12} size={1} />
			</ReactFlow>

			{statsEnabled && statsError ? (
				<div className="absolute bottom-2 left-2 z-40 rounded-md border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
					Live stats: {statsError}
				</div>
			) : null}

			{hoverEdge && statsEnabled && edgeRates[hoverEdge.id] ? (
				<div
					className="absolute z-40 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm"
					style={{ left: hoverEdge.x + 12, top: hoverEdge.y + 12 }}
				>
					<div className="font-mono">{hoverEdge.id}</div>
					<div className="text-muted-foreground">
						{formatBps(edgeRates[hoverEdge.id].bps)} •{" "}
						{Math.round(edgeRates[hoverEdge.id].pps)} pps •{" "}
						{edgeRates[hoverEdge.id].drops.toFixed(1)} drops/s
					</div>
				</div>
			) : null}

			{uiEventsEnabled && (uiEvents.data?.events?.length ?? 0) > 0 ? (
				<div className="absolute bottom-2 right-2 z-40 w-[420px] max-w-[92vw]">
					<Card className="shadow-sm border bg-background/90 backdrop-blur">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm">Recent activity</CardTitle>
						</CardHeader>
						<CardContent className="p-3 pt-0 space-y-2">
							{(uiEvents.data?.events ?? [])
								.slice(-8)
								.reverse()
								.map((ev) => (
									<div
										key={String(ev.id)}
										className="flex items-start justify-between gap-2 text-xs"
									>
										<div className="min-w-0">
											<div className="font-mono truncate">{ev.eventType}</div>
											<div className="text-muted-foreground truncate">
												{ev.createdAt}
											</div>
										</div>
										<div className="text-muted-foreground font-mono truncate">
											{ev.createdBy ? ev.createdBy : ""}
										</div>
									</div>
								))}
						</CardContent>
					</Card>
				</div>
			) : null}

			{enableTerminal && workspaceId && deploymentId ? (
				<TerminalModal
					open={!!terminalNode}
					onOpenChange={(open) => {
						if (!open) setTerminalNode(null);
					}}
					workspaceId={workspaceId}
					deploymentId={deploymentId}
					nodeId={terminalNode?.id ?? ""}
					nodeKind={terminalNode?.kind ?? ""}
				/>
			) : null}

			{workspaceId && deploymentId ? (
				<WebUIModal
					open={!!webuiNode}
					onOpenChange={(open) => {
						if (!open) setWebuiNode(null);
					}}
					workspaceId={workspaceId}
					deploymentId={deploymentId}
					nodeId={webuiNode?.id ?? ""}
				/>
			) : null}

			{workspaceId && deploymentId ? (
				<NodeLogsModal
					open={!!logsNode}
					onOpenChange={(open) => {
						if (!open) setLogsNode(null);
					}}
					workspaceId={workspaceId}
					deploymentId={deploymentId}
					nodeId={logsNode?.id ?? ""}
					nodeKind={logsNode?.kind ?? ""}
					nodeIp={logsNode?.ip ?? ""}
				/>
			) : null}

			{workspaceId && deploymentId ? (
				<NodeDescribeModal
					open={!!describeNode}
					onOpenChange={(open) => {
						if (!open) setDescribeNode(null);
					}}
					workspaceId={workspaceId}
					deploymentId={deploymentId}
					nodeId={describeNode?.id ?? ""}
					nodeKind={describeNode?.kind ?? ""}
					nodeIp={describeNode?.ip ?? ""}
				/>
			) : null}

			<Dialog
				open={interfacesOpen}
				onOpenChange={(open) => {
					setInterfacesOpen(open);
					if (!open) setInterfacesNode(null);
				}}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Interfaces</DialogTitle>
					</DialogHeader>
					<InterfacesBody
						node={interfacesNode?.id ?? ""}
						data={fetchInterfaces.data}
						loading={fetchInterfaces.isPending}
						error={
							fetchInterfaces.isError
								? ((fetchInterfaces.error as any)?.message ?? "failed")
								: ""
						}
						autoRefresh={interfacesAutoRefresh}
						onToggleAutoRefresh={() => setInterfacesAutoRefresh((v) => !v)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				open={runningConfigOpen}
				onOpenChange={(open) => {
					setRunningConfigOpen(open);
					if (!open) setRunningConfigNode(null);
				}}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Running config</DialogTitle>
					</DialogHeader>
					<RunningConfigBody
						node={runningConfigNode?.id ?? ""}
						data={fetchRunningConfig.data}
						loading={fetchRunningConfig.isPending}
						error={
							fetchRunningConfig.isError
								? ((fetchRunningConfig.error as any)?.message ?? "failed")
								: ""
						}
					/>
				</DialogContent>
			</Dialog>

			{nodeMenu && workspaceId && deploymentId ? (
				<div
					className="absolute z-50"
					style={{ left: nodeMenu.x, top: nodeMenu.y }}
					onContextMenu={(e) => e.preventDefault()}
				>
					<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm">Node Actions</CardTitle>
							<div className="text-xs text-muted-foreground font-mono truncate">
								{String(
									(nodeMenu.node as any)?.data?.label ?? nodeMenu.node.id,
								)}
							</div>
						</CardHeader>
						<CardContent className="p-3 pt-0 space-y-2">
							<Button
								size="sm"
								className="w-full"
								disabled={!enableTerminal}
								onClick={() => {
									const kind = String((nodeMenu.node as any)?.data?.kind ?? "");
									setNodeMenu(null);
									setTerminalNode({ id: String(nodeMenu.node.id), kind });
								}}
							>
								Open terminal…
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								onClick={() => {
									setNodeMenu(null);
									setWebuiNode({ id: String(nodeMenu.node.id) });
								}}
							>
								Open Web UI…
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								disabled={!enableTerminal}
								onClick={() => {
									const id = String(nodeMenu.node.id);
									const url = `${window.location.pathname}?node=${encodeURIComponent(id)}&action=terminal`;
									window.open(url, "_blank", "noopener,noreferrer");
									setNodeMenu(null);
								}}
							>
								Open terminal (new tab)
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									const id = String(nodeMenu.node.id);
									const url = `${window.location.pathname}?node=${encodeURIComponent(id)}&action=webui`;
									window.open(url, "_blank", "noopener,noreferrer");
									setNodeMenu(null);
								}}
							>
								Open Web UI (new tab)
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								onClick={() => {
									const kind = String((nodeMenu.node as any)?.data?.kind ?? "");
									const ip = String((nodeMenu.node as any)?.data?.ip ?? "");
									setNodeMenu(null);
									setLogsNode({ id: String(nodeMenu.node.id), kind, ip });
								}}
							>
								View logs…
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									const id = String(nodeMenu.node.id);
									const url = `${window.location.pathname}?node=${encodeURIComponent(id)}&action=logs`;
									window.open(url, "_blank", "noopener,noreferrer");
									setNodeMenu(null);
								}}
							>
								View logs (new tab)
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								onClick={() => {
									const kind = String((nodeMenu.node as any)?.data?.kind ?? "");
									const ip = String((nodeMenu.node as any)?.data?.ip ?? "");
									setNodeMenu(null);
									setDescribeNode({ id: String(nodeMenu.node.id), kind, ip });
								}}
							>
								Describe…
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									const id = String(nodeMenu.node.id);
									const url = `${window.location.pathname}?node=${encodeURIComponent(id)}&action=describe`;
									window.open(url, "_blank", "noopener,noreferrer");
									setNodeMenu(null);
								}}
							>
								Describe (new tab)
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								onClick={() => {
									const kind = String((nodeMenu.node as any)?.data?.kind ?? "");
									const ip = String((nodeMenu.node as any)?.data?.ip ?? "");
									const id = String(nodeMenu.node.id);
									setNodeMenu(null);
									setInterfacesNode({ id, kind, ip });
									setInterfacesOpen(true);
								}}
							>
								Interfaces…
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									const id = String(nodeMenu.node.id);
									const url = `${window.location.pathname}?node=${encodeURIComponent(id)}&action=interfaces`;
									window.open(url, "_blank", "noopener,noreferrer");
									setNodeMenu(null);
								}}
							>
								Interfaces (new tab)
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								disabled={saveConfig.isPending}
								onClick={() => {
									const id = String(nodeMenu.node.id);
									setNodeMenu(null);
									saveConfig.mutate(id);
								}}
							>
								{saveConfig.isPending ? "Saving…" : "Save config"}
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								onClick={() => {
									const id = String(nodeMenu.node.id);
									setNodeMenu(null);
									setRunningConfigNode({ id });
									setRunningConfigOpen(true);
								}}
							>
								Running config…
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => {
									const id = String(nodeMenu.node.id);
									const url = `${window.location.pathname}?node=${encodeURIComponent(id)}&action=running-config`;
									window.open(url, "_blank", "noopener,noreferrer");
									setNodeMenu(null);
								}}
							>
								Running config (new tab)
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="w-full"
								onClick={() => {
									const ip = String(
										(nodeMenu.node as any)?.data?.ip ?? "",
									).trim();
									if (!ip) {
										toast.error("No management IP available");
										return;
									}
									void navigator.clipboard?.writeText(ip);
									toast.success("Copied management IP");
									setNodeMenu(null);
								}}
							>
								Copy management IP
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="w-full"
								onClick={() => {
									const name = String(nodeMenu.node.id);
									void navigator.clipboard?.writeText(name);
									toast.success("Copied node name");
									setNodeMenu(null);
								}}
							>
								Copy node name
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="w-full"
								onClick={() => {
									const ip = String(
										(nodeMenu.node as any)?.data?.ip ?? "",
									).trim();
									if (!ip) {
										toast.error("No management IP available");
										return;
									}
									const cmd = `ssh admin@${ip}`;
									void navigator.clipboard?.writeText(cmd);
									toast.success("Copied SSH command");
									setNodeMenu(null);
								}}
							>
								Copy SSH command
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="w-full"
								onClick={() => setNodeMenu(null)}
							>
								Close
							</Button>
						</CardContent>
					</Card>
				</div>
			) : null}

			{edgeMenu && workspaceId && deploymentId ? (
				<div
					className="absolute z-50"
					style={{ left: edgeMenu.x, top: edgeMenu.y }}
					onContextMenu={(e) => e.preventDefault()}
				>
					<Card className="w-64 shadow-lg border bg-background/95 backdrop-blur">
						<CardHeader className="p-3 pb-2">
							<CardTitle className="text-sm">Link Actions</CardTitle>
							<div className="text-xs text-muted-foreground font-mono truncate">
								{String(edgeMenu.edge.label ?? edgeMenu.edge.id)}
							</div>
						</CardHeader>
						<CardContent className="p-3 pt-0 space-y-2">
							<Button
								size="sm"
								variant={
									edgeFlags.edgeDown.has(String(edgeMenu.edge.id))
										? "secondary"
										: "destructive"
								}
								className="w-full"
								disabled={linkAdmin.isPending}
								onClick={() => {
									const edgeId = String(edgeMenu.edge.id);
									const isDown = edgeFlags.edgeDown.has(edgeId);
									setEdgeMenu(null);
									linkAdmin.mutate({ edgeId, action: isDown ? "up" : "down" });
								}}
							>
								{edgeFlags.edgeDown.has(String(edgeMenu.edge.id))
									? "Bring link up"
									: "Bring link down"}
							</Button>
							<Button
								size="sm"
								variant="outline"
								className="w-full"
								disabled={captureLink.isPending}
								onClick={() => {
									setCaptureEdge({
										id: String(edgeMenu.edge.id),
										label: String(edgeMenu.edge.label ?? ""),
									});
									setEdgeMenu(null);
									setCaptureOpen(true);
								}}
							>
								Capture pcap…
							</Button>
							{edgeFlags.lastCaptureByEdge[String(edgeMenu.edge.id)] ? (
								<Button
									size="sm"
									variant="secondary"
									className="w-full"
									onClick={() => {
										const key =
											edgeFlags.lastCaptureByEdge[String(edgeMenu.edge.id)];
										setEdgeMenu(null);
										downloadPcap(key).catch((e) =>
											toast.error("Failed to download pcap", {
												description: (e as Error).message,
											}),
										);
									}}
								>
									Download last pcap
								</Button>
							) : null}
							<Button
								size="sm"
								className="w-full"
								onClick={() => {
									setSelectedEdge({
										id: String(edgeMenu.edge.id),
										label: String(edgeMenu.edge.label ?? ""),
									});
									setEdgeMenu(null);
									setImpairOpen(true);
								}}
							>
								Configure impairment…
							</Button>
							<Button
								size="sm"
								variant="secondary"
								className="w-full"
								disabled={impairSaving}
								onClick={() => {
									const id = String(edgeMenu.edge.id);
									setEdgeMenu(null);
									applyImpairment("clear", id);
								}}
							>
								Clear impairment
							</Button>
							<Button
								size="sm"
								variant="ghost"
								className="w-full"
								onClick={() => setEdgeMenu(null)}
							>
								Close
							</Button>
						</CardContent>
					</Card>
				</div>
			) : null}

			<Dialog
				open={captureOpen}
				onOpenChange={(open) => {
					setCaptureOpen(open);
					if (!open) setCaptureEdge(null);
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Capture pcap</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{captureEdge?.label ? (
							<div className="text-xs text-muted-foreground font-mono truncate">
								{captureEdge.label}
							</div>
						) : null}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label htmlFor="capSide">Side</Label>
								<select
									id="capSide"
									className="h-9 w-full rounded-md border bg-background px-3 text-sm"
									value={capture.side}
									onChange={(e) =>
										setCapture((p) => ({ ...p, side: e.target.value as any }))
									}
								>
									<option value="source">Source</option>
									<option value="target">Target</option>
								</select>
							</div>
							<div className="space-y-1">
								<Label htmlFor="capDuration">Duration (s)</Label>
								<Input
									id="capDuration"
									inputMode="numeric"
									value={capture.duration}
									onChange={(e) =>
										setCapture((p) => ({ ...p, duration: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="capPackets">Max packets</Label>
								<Input
									id="capPackets"
									inputMode="numeric"
									value={capture.packets}
									onChange={(e) =>
										setCapture((p) => ({ ...p, packets: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="capSnaplen">Snaplen</Label>
								<Input
									id="capSnaplen"
									inputMode="numeric"
									value={capture.snaplen}
									onChange={(e) =>
										setCapture((p) => ({ ...p, snaplen: e.target.value }))
									}
								/>
							</div>
						</div>
						<div className="flex gap-2 justify-end">
							<Button
								variant="secondary"
								onClick={() => setCaptureOpen(false)}
								disabled={captureLink.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									const edgeId = String(captureEdge?.id ?? "");
									if (!edgeId) {
										toast.error("No link selected");
										return;
									}
									const durationSeconds = Number(
										capture.duration.trim() || "10",
									);
									const maxPackets = Number(capture.packets.trim() || "2500");
									const snaplen = Number(capture.snaplen.trim() || "192");
									captureLink
										.mutateAsync({
											edgeId,
											side: capture.side,
											durationSeconds,
											maxPackets,
											snaplen,
										})
										.then((resp: LinkCaptureResponse) => {
											toast.success("Pcap ready", {
												description: resp.artifactKey,
											});
											return downloadPcap(resp.artifactKey).catch(() => {});
										})
										.finally(() => setCaptureOpen(false));
								}}
								disabled={captureLink.isPending}
							>
								{captureLink.isPending ? "Capturing…" : "Capture"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={impairOpen}
				onOpenChange={(open) => {
					setImpairOpen(open);
					if (!open) setSelectedEdge(null);
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Configure Link Impairment</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						{selectedEdge?.label ? (
							<div className="text-xs text-muted-foreground font-mono truncate">
								{selectedEdge.label}
							</div>
						) : null}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label htmlFor="delayMs">Delay (ms)</Label>
								<Input
									id="delayMs"
									inputMode="numeric"
									placeholder="e.g. 50"
									value={impair.delayMs}
									onChange={(e) =>
										setImpair((p) => ({ ...p, delayMs: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="jitterMs">Jitter (ms)</Label>
								<Input
									id="jitterMs"
									inputMode="numeric"
									placeholder="e.g. 10"
									value={impair.jitterMs}
									onChange={(e) =>
										setImpair((p) => ({ ...p, jitterMs: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="lossPct">Loss (%)</Label>
								<Input
									id="lossPct"
									inputMode="decimal"
									placeholder="e.g. 1.0"
									value={impair.lossPct}
									onChange={(e) =>
										setImpair((p) => ({ ...p, lossPct: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="dupPct">Duplicate (%)</Label>
								<Input
									id="dupPct"
									inputMode="decimal"
									placeholder="e.g. 0.1"
									value={impair.dupPct}
									onChange={(e) =>
										setImpair((p) => ({ ...p, dupPct: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="corruptPct">Corrupt (%)</Label>
								<Input
									id="corruptPct"
									inputMode="decimal"
									placeholder="e.g. 0.05"
									value={impair.corruptPct}
									onChange={(e) =>
										setImpair((p) => ({ ...p, corruptPct: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="reorderPct">Reorder (%)</Label>
								<Input
									id="reorderPct"
									inputMode="decimal"
									placeholder="e.g. 0.2"
									value={impair.reorderPct}
									onChange={(e) =>
										setImpair((p) => ({ ...p, reorderPct: e.target.value }))
									}
								/>
							</div>
							<div className="space-y-1">
								<Label htmlFor="rateKbps">Rate (kbit/s)</Label>
								<Input
									id="rateKbps"
									inputMode="numeric"
									placeholder="e.g. 100000"
									value={impair.rateKbps}
									onChange={(e) =>
										setImpair((p) => ({ ...p, rateKbps: e.target.value }))
									}
								/>
							</div>
						</div>

						<div className="flex gap-2 justify-end">
							<Button
								variant="secondary"
								onClick={() => setImpairOpen(false)}
								disabled={impairSaving}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									const id = String(selectedEdge?.id ?? "");
									if (!id) {
										toast.error("No link selected");
										return;
									}
									applyImpairment("set", id).finally(() =>
										setImpairOpen(false),
									);
								}}
								disabled={impairSaving}
							>
								Apply
							</Button>
						</div>
					</div>
					<div className="text-xs text-muted-foreground">
						Tip: Right-click a link in the topology to configure impairment.
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function formatBps(bps: number): string {
	if (!(bps > 0)) return "0 bps";
	if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
	if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
	if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
	return `${Math.round(bps)} bps`;
}

function formatBytes(n: number): string {
	if (!Number.isFinite(n) || n <= 0) return "0 B";
	const units = ["B", "KB", "MB", "GB", "TB"] as const;
	let v = n;
	let idx = 0;
	while (v >= 1024 && idx < units.length - 1) {
		v /= 1024;
		idx++;
	}
	const fixed = idx === 0 ? 0 : idx === 1 ? 0 : 1;
	return `${v.toFixed(fixed)} ${units[idx]}`;
}

type EdgeFlags = {
	edgeDown: Set<string>;
	lastCaptureByEdge: Record<string, string>;
};

function buildEdgeFlags(events: any[]): EdgeFlags {
	const edgeDown = new Set<string>();
	const lastCaptureByEdge: Record<string, string> = {};
	for (const ev of events ?? []) {
		const typ = String(ev?.eventType ?? "");
		const payload = (ev as any)?.payload ?? {};
		const edgeId = String((payload as any)?.edgeId ?? "").trim();
		if (edgeId) {
			if (typ === "link.down") edgeDown.add(edgeId);
			if (typ === "link.up") edgeDown.delete(edgeId);
			if (typ === "link.capture") {
				const key = String((payload as any)?.artifactKey ?? "").trim();
				if (key) lastCaptureByEdge[edgeId] = key;
			}
		}
	}
	return { edgeDown, lastCaptureByEdge };
}

function decorateEdges(
	edges: Edge[],
	rates: Record<string, { bps: number; pps: number; drops: number }>,
	enabled: boolean,
	baseLabels: Record<string, string | undefined>,
	flags: EdgeFlags,
): Edge[] {
	return edges.map((e) => {
		const edgeId = String(e.id);
		const base =
			baseLabels[edgeId] ?? (typeof e.label === "string" ? e.label : undefined);
		const isDown = flags.edgeDown.has(edgeId);
		if (!enabled) {
			return {
				...e,
				label: isDown ? (base ? `${base} · DOWN` : "DOWN") : base,
				animated: false,
				style: isDown
					? {
							stroke: "hsl(var(--destructive))",
							strokeWidth: 2,
							strokeDasharray: "6 6",
						}
					: undefined,
			};
		}
		const r = rates[edgeId];
		if (!r) {
			return {
				...e,
				label: isDown ? (base ? `${base} · DOWN` : "DOWN") : base,
				animated: false,
				style: isDown
					? {
							stroke: "hsl(var(--destructive))",
							strokeWidth: 2,
							strokeDasharray: "6 6",
						}
					: undefined,
			};
		}
		const bps = r.bps ?? 0;
		const width = 1 + Math.min(9, Math.log10(Math.max(1, bps)) / 1.2);
		const labelBase = base ? `${base} · ${formatBps(bps)}` : formatBps(bps);
		const label = isDown ? `${labelBase} · DOWN` : labelBase;
		return {
			...e,
			label,
			animated: !isDown && bps > 0,
			style: {
				...(e.style ?? {}),
				strokeWidth: width,
				...(isDown
					? { stroke: "hsl(var(--destructive))", strokeDasharray: "6 6" }
					: {}),
			},
		};
	});
}

function applyLayoutAndHighlights(
	nodes: Node[],
	mode: "grid" | "circle",
	pinned: Record<string, { x: number; y: number }>,
	search: string,
): Node[] {
	const term = search.trim().toLowerCase();
	const matched = new Set<string>();
	if (term) {
		for (const n of nodes) {
			const label = String((n as any)?.data?.label ?? n.id).toLowerCase();
			const id = String(n.id).toLowerCase();
			const ip = String((n as any)?.data?.ip ?? "").toLowerCase();
			if (label.includes(term) || id.includes(term) || ip.includes(term)) {
				matched.add(String(n.id));
			}
		}
	}

	const count = nodes.length || 1;
	const radius = Math.max(260, count * 30);
	return nodes.map((n, idx) => {
		const id = String(n.id);
		const pinnedPos = pinned[id];
		let pos = pinnedPos ?? n.position;
		if (!pinnedPos && mode === "circle") {
			const angle = (idx / count) * Math.PI * 2;
			pos = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
		}
		const highlight = term ? matched.has(id) : false;
		const dim = term ? !matched.has(id) : false;
		return {
			...n,
			position: pos,
			data: { ...(n.data as any), highlight },
			style: dim ? { ...(n.style ?? {}), opacity: 0.25 } : n.style,
		};
	});
}

function InterfacesBody(props: {
	node: string;
	data?: DeploymentNodeInterfacesResponse;
	loading: boolean;
	error: string;
	autoRefresh: boolean;
	onToggleAutoRefresh: () => void;
}) {
	if (props.loading)
		return <div className="text-sm text-muted-foreground">Loading…</div>;
	if (props.error)
		return <div className="text-sm text-destructive">{props.error}</div>;
	const rows = props.data?.interfaces ?? [];
	if (!rows.length)
		return (
			<div className="text-sm text-muted-foreground">No interfaces found.</div>
		);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div className="text-xs text-muted-foreground font-mono truncate">
					{props.node}
				</div>
				<Button
					size="sm"
					variant={props.autoRefresh ? "default" : "outline"}
					onClick={props.onToggleAutoRefresh}
				>
					{props.autoRefresh ? "Auto refresh: on" : "Auto refresh: off"}
				</Button>
			</div>
			<div className="rounded-md border overflow-auto max-h-[60vh]">
				<table className="w-full text-xs">
					<thead className="bg-muted/50 sticky top-0">
						<tr>
							<th className="text-left p-2">Interface</th>
							<th className="text-left p-2">Peer</th>
							<th className="text-left p-2">State</th>
							<th className="text-right p-2">RX</th>
							<th className="text-right p-2">TX</th>
							<th className="text-right p-2">Drops</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.ifName} className="border-t">
								<td className="p-2 font-mono">{r.ifName}</td>
								<td className="p-2 font-mono text-muted-foreground">
									{r.peerNode ? `${r.peerNode}:${r.peerIf ?? ""}` : "—"}
								</td>
								<td className="p-2">{r.operState ?? "—"}</td>
								<td className="p-2 text-right font-mono">
									{formatBytes(Number(r.rxBytes ?? 0))}
								</td>
								<td className="p-2 text-right font-mono">
									{formatBytes(Number(r.txBytes ?? 0))}
								</td>
								<td className="p-2 text-right font-mono">
									{Number(r.rxDropped ?? 0) + Number(r.txDropped ?? 0)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

function RunningConfigBody(props: {
	node: string;
	data?: DeploymentNodeRunningConfigResponse;
	loading: boolean;
	error: string;
}) {
	if (props.loading)
		return <div className="text-sm text-muted-foreground">Loading…</div>;
	if (props.error)
		return <div className="text-sm text-destructive">{props.error}</div>;
	if (props.data?.skipped) {
		return (
			<div className="text-sm text-muted-foreground">
				{props.data.message || "Skipped"}
			</div>
		);
	}
	const cfg = String(props.data?.stdout ?? "");
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div className="text-xs text-muted-foreground font-mono truncate">
					{props.node}
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						void navigator.clipboard?.writeText(cfg);
						toast.success("Copied running config");
					}}
					disabled={!cfg}
				>
					Copy
				</Button>
			</div>
			<pre className="max-h-[65vh] overflow-auto rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 whitespace-pre-wrap">
				{cfg || "No output"}
			</pre>
			{props.data?.stderr ? (
				<div className="text-xs text-muted-foreground whitespace-pre-wrap">
					{props.data.stderr}
				</div>
			) : null}
		</div>
	);
}
