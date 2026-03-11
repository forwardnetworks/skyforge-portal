import type { Edge, Node } from "@xyflow/react";

export function formatBps(bps: number): string {
	if (!(bps > 0)) return "0 bps";
	if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`;
	if (bps >= 1e6) return `${(bps / 1e6).toFixed(1)} Mbps`;
	if (bps >= 1e3) return `${(bps / 1e3).toFixed(0)} Kbps`;
	return `${Math.round(bps)} bps`;
}

export function formatBytes(n: number): string {
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

export type EdgeFlags = {
	edgeDown: Set<string>;
	lastCaptureByEdge: Record<string, string>;
};

export function buildEdgeFlags(events: any[]): EdgeFlags {
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

export function decorateEdges(
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

export function applyLayoutAndHighlights(
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
