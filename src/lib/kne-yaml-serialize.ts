import YAML from "yaml";

import {
	nextInterfaceName,
	sanitizeKneNodeName,
	uniqueNodeNames,
} from "./kne-yaml-helpers";
import type { LabDesign } from "./kne-yaml-types";

export function designToKneYaml(design: LabDesign): {
	yaml: string;
	warnings: string[];
} {
	const warnings: string[] = [];
	const name = sanitizeKneNodeName(design.name || "lab");
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
	const defaultDevice = String(design.defaultKind ?? "").trim();
	for (const node of design.nodes) {
		const nodeName = nameMap.get(node.id) || sanitizeKneNodeName(node.id);
		const rawName = String(node.id || node.label || "").trim();
		if (rawName && sanitizeKneNodeName(rawName) !== rawName) {
			warnings.push(`Node ${rawName}: name will be '${sanitizeKneNodeName(rawName)}'`);
		}
		if (rawName && nodeName !== sanitizeKneNodeName(rawName)) {
			warnings.push(`Node ${rawName}: name adjusted to '${nodeName}'`);
		}
		if (!String(node.image ?? "").trim()) {
			warnings.push(`Node ${nodeName}: missing image`);
		}
		const device = String(node.kind ?? "").trim() || defaultDevice;
		if (!device) {
			warnings.push(`Node ${nodeName}: missing device`);
		}

		const env = node.env && Object.keys(node.env).length ? node.env : undefined;
		nodes[nodeName] = {
			...(device ? { device } : {}),
			...(node.image ? { image: node.image.trim() } : {}),
			...(node.mgmtIpv4
				? { mgmt: { ipv4: node.mgmtIpv4.trim() } }
				: {}),
			...(node.startupConfig ? { config: node.startupConfig.trim() } : {}),
			...(env ? { environment: env } : {}),
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
			[sourceNode]: { ifname: sourceIf },
			[targetNode]: { ifname: targetIf },
			...(link.label ? { name: link.label.trim() } : {}),
			...(Number.isFinite(link.mtu) ? { mtu: link.mtu } : {}),
		});
	}

	const doc = {
		name,
		provider: "kne",
		nodes,
		...(links.length ? { links } : {}),
	};

	return { yaml: YAML.stringify(doc), warnings };
}
