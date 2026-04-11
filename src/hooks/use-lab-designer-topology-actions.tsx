import type {
	DesignEdge,
	DesignNode,
	DesignNodeData,
} from "@/components/lab-designer-types";
import type { Node } from "@xyflow/react";
import type { KeyboardEvent } from "react";
import { toast } from "sonner";
import type { LabDesignerActionsOptions } from "./lab-designer-action-types";

export function createLabDesignerTopologyActions(
	opts: LabDesignerActionsOptions,
) {
	const normalizeKind = (value: string) =>
		String(value ?? "")
			.trim()
			.toLowerCase();

	const addNode = () => {
		const base = "n";
		let i = opts.nodes.length + 1;
		let id = `${base}${i}`;
		const used = new Set(opts.nodes.map((n) => n.id));
		while (used.has(id)) {
			i++;
			id = `${base}${i}`;
		}
		// Place new nodes on a predictable grid to avoid overlap with existing nodes.
		const index = opts.nodes.length;
		const columns = 4;
		const pos = {
			x: 120 + (index % columns) * 260,
			y: 260 + Math.floor(index / columns) * 180,
		};
		const next: Node<DesignNodeData> = {
			id,
			position: pos,
			data: { label: id, kind: "linux", image: "", interfaces: [] },
			type: "designerNode",
		};
		opts.setNodes((prev) => [...prev, next]);
		opts.setSelectedNodeId(id);
	};

	const applyQuickstartClos = () => {
		const spines = Math.max(
			1,
			Math.min(16, Number.isFinite(opts.qsSpines) ? opts.qsSpines : 2),
		);
		const leaves = Math.max(
			1,
			Math.min(64, Number.isFinite(opts.qsLeaves) ? opts.qsLeaves : 4),
		);
		const hostsPerLeaf = Math.max(
			0,
			Math.min(
				16,
				Number.isFinite(opts.qsHostsPerLeaf) ? opts.qsHostsPerLeaf : 1,
			),
		);

		const name = (opts.qsName || "clos").trim() || "clos";
		opts.setLabName(name);
		const switchImage =
			String(opts.qsSwitchImage ?? "").trim() ||
			opts.quickstartImageByKind[normalizeKind(opts.qsSwitchKind)] ||
			"";
		const hostImage =
			String(opts.qsHostImage ?? "").trim() ||
			opts.quickstartImageByKind[normalizeKind(opts.qsHostKind)] ||
			"";

		if (!switchImage) {
			toast.error("Switch image is required", {
				description:
					"Pick a switch image in Quickstart so deployments are repeatable.",
			});
			return;
		}
		if (hostsPerLeaf > 0 && !hostImage) {
			toast.error("Host image is required", {
				description:
					"Pick a host image in Quickstart so deployments are repeatable.",
			});
			return;
		}

		const mkNode = (
			id: string,
			x: number,
			y: number,
			kind: string,
			image: string,
		): DesignNode => ({
			id,
			position: { x, y },
			data: { label: id, kind, image, interfaces: [] },
			type: "designerNode",
		});

		const nextNodes: DesignNode[] = [];
		const nextEdges: DesignEdge[] = [];
		const interfaceIndexByNode: Record<string, number> = {};
		const interfaceNamesByNode: Record<string, string[]> = {};
		const x0 = 120;
		const dx = 260;
		const ySpine = 120;
		const yLeaf = 320;
		const yHost = 520;

		const spineIds = Array.from({ length: spines }, (_, i) => `s${i + 1}`);
		const leafIds = Array.from({ length: leaves }, (_, i) => `l${i + 1}`);

		for (let i = 0; i < spineIds.length; i++) {
			nextNodes.push(
				mkNode(
					spineIds[i],
					x0 + i * dx,
					ySpine,
					opts.qsSwitchKind,
					switchImage,
				),
			);
		}

		for (let i = 0; i < leafIds.length; i++) {
			nextNodes.push(
				mkNode(leafIds[i], x0 + i * dx, yLeaf, opts.qsSwitchKind, switchImage),
			);
		}

		const nextInterfaceName = (nodeId: string): string => {
			const current = interfaceIndexByNode[nodeId] ?? 0;
			const next = current + 1;
			interfaceIndexByNode[nodeId] = next;
			const name = `eth${next}`;
			if (!interfaceNamesByNode[nodeId]) interfaceNamesByNode[nodeId] = [];
			interfaceNamesByNode[nodeId].push(name);
			return name;
		};

		const appendEdge = (id: string, source: string, target: string) => {
			const sourceIf = nextInterfaceName(source);
			const targetIf = nextInterfaceName(target);
			const label = `${source}:${sourceIf} ↔ ${target}:${targetIf}`;
			nextEdges.push({
				id,
				source,
				target,
				label,
				data: { label, sourceIf, targetIf },
			});
		};

		for (const l of leafIds) {
			for (const s of spineIds) {
				appendEdge(`e-${l}-${s}`, l, s);
			}
		}

		let hostCounter = 1;
		for (let li = 0; li < leafIds.length; li++) {
			const leafId = leafIds[li];
			for (let hi = 0; hi < hostsPerLeaf; hi++) {
				const hostId = `h${hostCounter++}`;
				const hostX = x0 + li * dx + hi * 70;
				nextNodes.push(
					mkNode(hostId, hostX, yHost, opts.qsHostKind, hostImage),
				);
				appendEdge(`e-${hostId}-${leafId}`, hostId, leafId);
			}
		}

		const nodesWithInterfaces = nextNodes.map((node) => ({
			...node,
			data: {
				...node.data,
				interfaces: (interfaceNamesByNode[node.id] ?? []).map((name) => ({
					id: name,
					name,
				})),
			},
		}));

		opts.setNodes(nodesWithInterfaces);
		opts.setEdges(nextEdges);
		opts.setYamlMode("generated");
		opts.setCustomYaml("");
		opts.setSelectedNodeId("");
		opts.setInspectorTab("lab");
		opts.setQuickstartOpen(false);
		requestAnimationFrame(() =>
			opts.rfInstance?.fitView({ padding: 0.15, duration: 250 }),
		);
		toast.success("Starter topology created");
	};

	const autoLayout = () => {
		const count = opts.nodes.length;
		if (!count) return;
		const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
		const cellW = 260;
		const cellH = 180;
		const startX = 120;
		const startY = 120;
		opts.setNodes((prev) =>
			prev.map((n, idx) => ({
				...n,
				position: {
					x: startX + (idx % cols) * cellW,
					y: startY + Math.floor(idx / cols) * cellH,
				},
			})),
		);
		requestAnimationFrame(() =>
			opts.rfInstance?.fitView({ padding: 0.15, duration: 300 }),
		);
	};

	const closeMenus = () => {
		opts.setNodeMenu(null);
		opts.setEdgeMenu(null);
		opts.setCanvasMenu(null);
	};

	const renameNode = (nodeId: string) => {
		const n = opts.nodes.find((x) => String(x.id) === nodeId);
		if (!n) return;
		const current = String(n.data?.label ?? n.id);
		const nextRaw = window.prompt("Node name", current);
		if (nextRaw == null) return;
		const nextTrim = nextRaw.trim();
		if (!nextTrim) return;

		const used = new Set(opts.nodes.map((x) => String(x.id)));
		used.delete(nodeId);
		let nextId = nextTrim;
		let i = 2;
		while (used.has(nextId)) nextId = `${nextTrim}-${i++}`;

		opts.setNodes((prev) =>
			prev.map((x) =>
				String(x.id) === nodeId
					? { ...x, id: nextId, data: { ...x.data, label: nextTrim } }
					: x,
			),
		);
		opts.setEdges((prev) =>
			prev.map((e) => ({
				...e,
				source: String(e.source) === nodeId ? nextId : e.source,
				target: String(e.target) === nodeId ? nextId : e.target,
				label:
					String(e.source) === nodeId || String(e.target) === nodeId
						? `${String(e.source) === nodeId ? nextId : e.source}:${
								String(e.data?.sourceIf ?? "").trim() || "?"
							} ↔ ${String(e.target) === nodeId ? nextId : e.target}:${
								String(e.data?.targetIf ?? "").trim() || "?"
							}`
						: e.label,
				data:
					String(e.source) === nodeId || String(e.target) === nodeId
						? {
								...e.data,
								label: `${String(e.source) === nodeId ? nextId : e.source}:${
									String(e.data?.sourceIf ?? "").trim() || "?"
								} ↔ ${String(e.target) === nodeId ? nextId : e.target}:${
									String(e.data?.targetIf ?? "").trim() || "?"
								}`,
							}
						: e.data,
			})),
		);
		if (opts.selectedNodeId === nodeId) opts.setSelectedNodeId(nextId);
		opts.setNodeMenu((m) =>
			m && m.nodeId === nodeId ? { ...m, nodeId: nextId } : m,
		);
	};

	const onCanvasKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		const target = event.target as HTMLElement | null;
		const tag = target?.tagName?.toUpperCase?.() ?? "";
		if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) {
			return;
		}
		if (event.key === "Escape") {
			closeMenus();
			return;
		}
		if (event.key !== "Delete" && event.key !== "Backspace") return;
		const selectedNodeIds = new Set(
			opts.nodes
				.filter((n) => (n as DesignNode & { selected?: boolean }).selected)
				.map((n) => String(n.id)),
		);
		const selectedEdgeIds = new Set(
			opts.edges
				.filter((e) => (e as DesignEdge & { selected?: boolean }).selected)
				.map((e) => String(e.id)),
		);
		if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
		event.preventDefault();
		opts.setNodes((prev) =>
			prev.filter((n) => !selectedNodeIds.has(String(n.id))),
		);
		opts.setEdges((prev) =>
			prev.filter((e) => {
				if (selectedEdgeIds.has(String(e.id))) return false;
				if (
					selectedNodeIds.has(String(e.source)) ||
					selectedNodeIds.has(String(e.target))
				) {
					return false;
				}
				return true;
			}),
		);
		if (selectedEdgeIds.has(opts.selectedEdgeId)) {
			opts.setSelectedEdgeId("");
		}
	};

	return {
		addNode,
		applyQuickstartClos,
		autoLayout,
		closeMenus,
		renameNode,
		onCanvasKeyDown,
	};
}
