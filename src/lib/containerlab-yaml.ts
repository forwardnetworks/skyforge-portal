import YAML from "yaml";

export type LabNodeInterface = {
	id: string;
	name: string;
};

export type LabDesignNode = {
	id: string;
	label?: string;
	kind?: string;
	image?: string;
	mgmtIpv4?: string;
	startupConfig?: string;
	env?: Record<string, string>;
	interfaces?: LabNodeInterface[];
	notes?: string;
	position?: { x: number; y: number };
	status?: string;
};

export type LabDesignLink = {
	id: string;
	source: string;
	target: string;
	sourceIf?: string;
	targetIf?: string;
	label?: string;
	mtu?: number;
	notes?: string;
};

export type LabDesign = {
	name: string;
	defaultKind?: string;
	nodes: LabDesignNode[];
	links: LabDesignLink[];
};

export function sanitizeNodeName(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "node";
	const out = s
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);
	return out || "node";
}

function uniqueNodeNames(nodes: LabDesignNode[]): Map<string, string> {
	const used = new Set<string>();
	const out = new Map<string, string>();
	for (const node of nodes) {
		const rawName = String(node.id || node.label || "node");
		const base = sanitizeNodeName(rawName);
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

function nextInterfaceName(counter: Map<string, number>, nodeId: string): string {
	const current = counter.get(nodeId) ?? 0;
	const next = current + 1;
	counter.set(nodeId, next);
	return `eth${next}`;
}

function splitEndpoint(raw: unknown): { node: string; iface: string } | null {
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

function normalizeInterfaceList(
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

export function designToContainerlabYaml(design: LabDesign): {
	yaml: string;
	warnings: string[];
} {
	const warnings: string[] = [];
	const name = sanitizeNodeName(design.name || "lab");
	const nameMap = uniqueNodeNames(design.nodes);
	const interfaceCounters = new Map<string, number>();
	const nodeLinkInterfaces = new Map<string, string[]>();

	for (const link of design.links) {
		const sourceIf = String(link.sourceIf ?? "").trim();
		const targetIf = String(link.targetIf ?? "").trim();
		if (sourceIf) {
			nodeLinkInterfaces.set(link.source, [
				...(nodeLinkInterfaces.get(link.source) ?? []),
				sourceIf,
			]);
		}
		if (targetIf) {
			nodeLinkInterfaces.set(link.target, [
				...(nodeLinkInterfaces.get(link.target) ?? []),
				targetIf,
			]);
		}
	}

	const nodes: Record<string, Record<string, unknown>> = {};
	for (const node of design.nodes) {
		const nodeName = nameMap.get(node.id) || sanitizeNodeName(node.id);
		const rawName = String(node.id || node.label || "").trim();
		if (rawName && sanitizeNodeName(rawName) !== rawName) {
			warnings.push(`Node ${rawName}: name will be '${sanitizeNodeName(rawName)}'`);
		}
		if (rawName && nodeName !== sanitizeNodeName(rawName)) {
			warnings.push(`Node ${rawName}: name adjusted to '${nodeName}'`);
		}
		if (!String(node.image ?? "").trim()) {
			warnings.push(`Node ${nodeName}: missing image`);
		}

		const env = node.env && Object.keys(node.env).length ? node.env : undefined;
		nodes[nodeName] = {
			...(node.kind ? { kind: node.kind.trim() } : {}),
			...(node.image ? { image: node.image.trim() } : {}),
			...(node.mgmtIpv4 ? { mgmt_ipv4: node.mgmtIpv4.trim() } : {}),
			...(node.startupConfig
				? { "startup-config": node.startupConfig.trim() }
				: {}),
			...(env ? { env } : {}),
		};
	}

	const links: Record<string, unknown>[] = [];
	for (const link of design.links) {
		const sourceNode = nameMap.get(link.source);
		const targetNode = nameMap.get(link.target);
		if (!sourceNode || !targetNode) {
			warnings.push(`Link ${link.id}: missing endpoint(s)`);
			continue;
		}
		const sourceIf = String(link.sourceIf ?? "").trim() ||
			nextInterfaceName(interfaceCounters, link.source);
		const targetIf = String(link.targetIf ?? "").trim() ||
			nextInterfaceName(interfaceCounters, link.target);
		if (!String(link.sourceIf ?? "").trim()) {
			warnings.push(`Link ${link.id}: source interface auto-assigned to '${sourceIf}'`);
		}
		if (!String(link.targetIf ?? "").trim()) {
			warnings.push(`Link ${link.id}: target interface auto-assigned to '${targetIf}'`);
		}
		links.push({
			endpoints: [`${sourceNode}:${sourceIf}`, `${targetNode}:${targetIf}`],
			...(link.label ? { label: link.label.trim() } : {}),
			...(Number.isFinite(link.mtu) ? { mtu: link.mtu } : {}),
		});
	}

	const doc = {
		name,
		topology: {
			...(design.defaultKind
				? { defaults: { kind: design.defaultKind.trim() } }
				: {}),
			nodes,
			...(links.length ? { links } : {}),
		},
	};

	return { yaml: YAML.stringify(doc), warnings };
}

export function containerlabYamlToDesign(yamlContent: string): {
	design: LabDesign;
	warnings: string[];
} {
	const warnings: string[] = [];
	const parsed = YAML.parse(String(yamlContent ?? "").trim()) as
		| Record<string, unknown>
		| null
		| undefined;
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid containerlab YAML");
	}

	const topology = parsed.topology as Record<string, unknown> | undefined;
	if (!topology || typeof topology !== "object") {
		throw new Error("YAML missing topology");
	}

	const defaults = topology.defaults as Record<string, unknown> | undefined;
	const defaultKind = String(defaults?.kind ?? "").trim();
	const nodesRecord = topology.nodes as Record<string, unknown> | undefined;
	if (!nodesRecord || typeof nodesRecord !== "object") {
		throw new Error("YAML missing topology.nodes");
	}

	const designNodes: LabDesignNode[] = [];
	const layoutCols = Math.max(1, Math.ceil(Math.sqrt(Object.keys(nodesRecord).length)));
	let idx = 0;
	for (const [nodeName, nodeConfigAny] of Object.entries(nodesRecord)) {
		const nodeConfig =
			nodeConfigAny && typeof nodeConfigAny === "object"
				? (nodeConfigAny as Record<string, unknown>)
				: {};
		const envAny = nodeConfig.env;
		const env =
			envAny && typeof envAny === "object" && !Array.isArray(envAny)
				? Object.fromEntries(
						Object.entries(envAny as Record<string, unknown>).map(([key, value]) => [
							key,
							String(value ?? ""),
						]),
					)
				: undefined;

		designNodes.push({
			id: nodeName,
			label: nodeName,
			kind: String(nodeConfig.kind ?? defaultKind).trim(),
			image: String(nodeConfig.image ?? "").trim(),
			mgmtIpv4: String(nodeConfig.mgmt_ipv4 ?? "").trim() || undefined,
			startupConfig:
				String(nodeConfig["startup-config"] ?? "").trim() || undefined,
			env: env && Object.keys(env).length ? env : undefined,
			position: {
				x: 120 + (idx % layoutCols) * 260,
				y: 120 + Math.floor(idx / layoutCols) * 180,
			},
			interfaces: [],
		});
		idx += 1;
	}

	const linksArray = Array.isArray(topology.links)
		? (topology.links as Array<Record<string, unknown>>)
		: [];
	const nodeInterfaces = new Map<string, string[]>();
	const designLinks: LabDesignLink[] = linksArray.map((link, linkIdx) => {
		const endpoints = Array.isArray(link.endpoints) ? link.endpoints : [];
		const source = splitEndpoint(endpoints[0]);
		const target = splitEndpoint(endpoints[1]);
		if (!source || !target) {
			warnings.push(`Link ${linkIdx + 1}: missing endpoint(s)`);
		}
		if (source?.iface) {
			nodeInterfaces.set(source.node, [
				...(nodeInterfaces.get(source.node) ?? []),
				source.iface,
			]);
		}
		if (target?.iface) {
			nodeInterfaces.set(target.node, [
				...(nodeInterfaces.get(target.node) ?? []),
				target.iface,
			]);
		}
		const mtuRaw = Number(link.mtu);
		return {
			id: String(link.id ?? `e-${linkIdx + 1}`),
			source: source?.node ?? "",
			target: target?.node ?? "",
			sourceIf: source?.iface || undefined,
			targetIf: target?.iface || undefined,
			label: String(link.label ?? "").trim() || undefined,
			mtu: Number.isFinite(mtuRaw) ? mtuRaw : undefined,
		};
	});

	for (const node of designNodes) {
		node.interfaces = normalizeInterfaceList(
			node.interfaces,
			nodeInterfaces.get(node.id) ?? [],
		);
	}

	return {
		design: {
			name: String(parsed.name ?? "lab").trim() || "lab",
			defaultKind,
			nodes: designNodes,
			links: designLinks.filter((link) => link.source && link.target),
		},
		warnings,
	};
}
