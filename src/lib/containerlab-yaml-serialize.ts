import YAML from "yaml";

import {
	nextInterfaceName,
	sanitizeNodeName,
	uniqueNodeNames,
} from "./containerlab-yaml-helpers";
import type { LabDesign } from "./containerlab-yaml-types";

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
		const sourceIf =
			String(link.sourceIf ?? "").trim() ||
			nextInterfaceName(interfaceCounters, link.source);
		const targetIf =
			String(link.targetIf ?? "").trim() ||
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
