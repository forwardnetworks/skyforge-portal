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
	const addNode = () => {
		const base = "n";
		let i = opts.nodes.length + 1;
		let id = `${base}${i}`;
		const used = new Set(opts.nodes.map((n) => n.id));
		while (used.has(id)) {
			i++;
			id = `${base}${i}`;
		}
		const pos = {
			x: 120 + opts.nodes.length * 40,
			y: 120 + opts.nodes.length * 30,
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
					opts.qsSwitchImage,
				),
			);
		}

		for (let i = 0; i < leafIds.length; i++) {
			nextNodes.push(
				mkNode(
					leafIds[i],
					x0 + i * dx,
					yLeaf,
					opts.qsSwitchKind,
					opts.qsSwitchImage,
				),
			);
		}

		for (const l of leafIds) {
			for (const s of spineIds) {
				nextEdges.push({
					id: `e-${l}-${s}`,
					source: l,
					target: s,
					label: `${l} ↔ ${s}`,
					data: { label: `${l} ↔ ${s}` },
				});
			}
		}

		let hostCounter = 1;
		for (let li = 0; li < leafIds.length; li++) {
			const leafId = leafIds[li];
			for (let hi = 0; hi < hostsPerLeaf; hi++) {
				const hostId = `h${hostCounter++}`;
				const hostX = x0 + li * dx + hi * 70;
				nextNodes.push(
					mkNode(hostId, hostX, yHost, opts.qsHostKind, opts.qsHostImage),
				);
				nextEdges.push({
					id: `e-${hostId}-${leafId}`,
					source: hostId,
					target: leafId,
					label: `${hostId} ↔ ${leafId}`,
					data: { label: `${hostId} ↔ ${leafId}` },
				});
			}
		}

		opts.setNodes(nextNodes);
		opts.setEdges(nextEdges);
		opts.setYamlMode("generated");
		opts.setCustomYaml("");
		opts.setSelectedNodeId("");
		opts.setQuickstartOpen(false);
		requestAnimationFrame(() =>
			opts.rfInstance?.fitView({ padding: 0.15, duration: 250 }),
		);

		const missingImages = nextNodes.filter(
			(n) => !String(n.data?.image ?? "").trim(),
		);
		if (missingImages.length) {
			toast.message("Quickstart created (missing images)", {
				description: "Pick images per-node (or use defaults) before deploying.",
			});
			return;
		}
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
