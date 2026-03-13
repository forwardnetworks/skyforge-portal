import type { LabDesignNode, LabNodeInterface } from "./kne-yaml-types";

export function sanitizeKneNodeName(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "node";
	const out = s
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return out || "node";
}

export function uniqueNodeNames(nodes: LabDesignNode[]): Map<string, string> {
	const used = new Set<string>();
	const out = new Map<string, string>();
	for (const node of nodes) {
		const rawName = String(node.id || node.label || "node");
		const base = sanitizeKneNodeName(rawName);
		let next = base;
		let suffix = 2;
		while (used.has(next)) {
			next = `${base}-${suffix++}`;
		}
		used.add(next);
		out.set(node.id, next);
	}
	return out;
}

export function nextInterfaceName(counter: Map<string, number>, nodeId: string): string {
	const current = counter.get(nodeId) ?? 0;
	const next = current + 1;
	counter.set(nodeId, next);
	return `eth${next}`;
}

export function splitEndpoint(raw: unknown): { node: string; iface: string } | null {
	const value = String(raw ?? "").trim();
	if (!value) return null;
	const idx = value.indexOf(":");
	if (idx < 0) {
		return { node: value, iface: "" };
	}
	return {
		node: value.slice(0, idx).trim(),
		iface: value.slice(idx + 1).trim(),
	};
}

export function normalizeInterfaceList(
	explicit: LabNodeInterface[] | undefined,
	linkInterfaces: string[],
): LabNodeInterface[] {
	const out: LabNodeInterface[] = [];
	const used = new Set<string>();
	for (const item of explicit ?? []) {
		const name = String(item?.name ?? "").trim();
		if (!name || used.has(name)) continue;
		used.add(name);
		out.push({ id: item.id || name, name });
	}
	for (const iface of linkInterfaces) {
		const name = String(iface ?? "").trim();
		if (!name || used.has(name)) continue;
		used.add(name);
		out.push({ id: name, name });
	}
	return out;
}
