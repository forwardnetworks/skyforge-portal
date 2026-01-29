export type LabDesignNode = {
	id: string; // clab node name
	label?: string;
	kind?: string;
	image?: string; // repo:tag
	mgmtIpv4?: string;
	env?: Record<string, string>;
	position?: { x: number; y: number };
};

export type LabDesignLink = {
	id: string;
	source: string;
	target: string;
};

export type LabDesign = {
	name: string;
	nodes: LabDesignNode[];
	links: LabDesignLink[];
};

function sanitizeNodeName(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "node";
	const out = s
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return out || "node";
}

function uniqueNames(nodes: LabDesignNode[]): Map<string, string> {
	const used = new Set<string>();
	const map = new Map<string, string>();
	for (const n of nodes) {
		const base = sanitizeNodeName(n.id || n.label || "node");
		let name = base;
		let i = 2;
		while (used.has(name)) {
			name = `${base}-${i++}`;
		}
		used.add(name);
		map.set(n.id, name);
	}
	return map;
}

export function designToContainerlabYaml(design: LabDesign): {
	yaml: string;
	warnings: string[];
} {
	const warnings: string[] = [];
	const name = sanitizeNodeName(design.name || "lab");

	const nameMap = uniqueNames(design.nodes);
	const portCounters = new Map<string, number>();
	const nextIf = (nodeId: string) => {
		const cur = portCounters.get(nodeId) ?? 0;
		const next = cur + 1;
		portCounters.set(nodeId, next);
		return `eth${next}`;
	};

	const nodes: Record<string, any> = {};
	for (const n of design.nodes) {
		const nodeName = nameMap.get(n.id) || sanitizeNodeName(n.id);
		const rawName = String(n.id || n.label || "").trim();
		if (rawName && sanitizeNodeName(rawName) !== rawName) {
			warnings.push(
				`Node ${rawName}: name will be '${sanitizeNodeName(rawName)}'`,
			);
		}
		if (rawName && sanitizeNodeName(rawName) !== nodeName) {
			warnings.push(`Node ${rawName}: name adjusted to '${nodeName}'`);
		}
		const kind = (n.kind || "").trim() || undefined;
		const image = (n.image || "").trim() || undefined;

		if (!image) warnings.push(`Node ${nodeName}: missing image`);
		nodes[nodeName] = {
			...(kind ? { kind } : {}),
			...(image ? { image } : {}),
			...(n.env && Object.keys(n.env).length ? { env: n.env } : {}),
			...(n.mgmtIpv4 ? { mgmt_ipv4: n.mgmtIpv4 } : {}),
		};
	}

	const links: Array<{ endpoints: [string, string] }> = [];
	for (const l of design.links) {
		const a = nameMap.get(l.source);
		const b = nameMap.get(l.target);
		if (!a || !b) {
			warnings.push(`Link ${l.id}: missing endpoint(s)`);
			continue;
		}
		const aIf = nextIf(l.source);
		const bIf = nextIf(l.target);
		links.push({ endpoints: [`${a}:${aIf}`, `${b}:${bIf}`] });
	}

	const doc: any = {
		name,
		topology: {
			nodes,
			...(links.length ? { links } : {}),
		},
	};

	// Minimal YAML serializer for our constrained structure (keeps deps out).
	const dump = (v: any, indent = 0): string => {
		const sp = "  ".repeat(indent);
		if (v === null || v === undefined) return "null";
		if (typeof v === "string") return JSON.stringify(v);
		if (typeof v === "number" || typeof v === "boolean") return String(v);
		if (Array.isArray(v)) {
			if (v.length === 0) return "[]";
			return v
				.map((item) => {
					if (typeof item === "object" && item && !Array.isArray(item)) {
						const body = dump(item, indent + 1);
						const lines = body.split("\n");
						return `${sp}- ${lines[0].trimStart()}\n${lines
							.slice(1)
							.map((ln) => `${sp}  ${ln}`)
							.join("\n")}`;
					}
					return `${sp}- ${dump(item, 0)}`;
				})
				.join("\n");
		}
		if (typeof v === "object") {
			const keys = Object.keys(v);
			if (keys.length === 0) return "{}";
			return keys
				.map((k) => {
					const val = v[k];
					if (val === undefined) return "";
					if (typeof val === "object" && val !== null) {
						const body = dump(val, indent + 1);
						return `${sp}${k}:\n${body}`;
					}
					return `${sp}${k}: ${dump(val, 0)}`;
				})
				.filter(Boolean)
				.join("\n");
		}
		return JSON.stringify(String(v));
	};

	return { yaml: dump(doc, 0) + "\n", warnings };
}
