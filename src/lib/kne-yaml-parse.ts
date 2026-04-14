import YAML from "yaml";

import { normalizeStartupConfig } from "./lab-designer-startup-config";
import {
	normalizeInterfaceList,
	splitEndpoint,
} from "./kne-yaml-helpers";
import type { LabDesign, LabDesignLink, LabDesignNode } from "./kne-yaml-types";

export function kneYamlToDesign(yamlContent: string): {
	design: LabDesign;
	warnings: string[];
} {
	const warnings: string[] = [];
	const parsed = YAML.parse(String(yamlContent ?? "").trim()) as
		| Record<string, unknown>
		| null
		| undefined;
	if (!parsed || typeof parsed !== "object") {
		throw new Error("Invalid KNE YAML");
	}
	if (parsed.topology && typeof parsed.topology === "object") {
		throw new Error("KNE YAML must use top-level nodes (not kne topology wrapper)");
	}
	const nodesRecord = parsed.nodes as Record<string, unknown> | undefined;
	if (!nodesRecord || typeof nodesRecord !== "object") {
		throw new Error("YAML missing nodes");
	}

	const designNodes: LabDesignNode[] = [];
	const layoutCols = Math.max(1, Math.ceil(Math.sqrt(Object.keys(nodesRecord).length)));
	let idx = 0;
	for (const [nodeName, nodeConfigAny] of Object.entries(nodesRecord)) {
		const nodeConfig =
			nodeConfigAny && typeof nodeConfigAny === "object"
				? (nodeConfigAny as Record<string, unknown>)
				: {};
		const envAny = nodeConfig.environment ?? nodeConfig.env;
		const env =
			envAny && typeof envAny === "object" && !Array.isArray(envAny)
				? Object.fromEntries(
						Object.entries(envAny as Record<string, unknown>).map(([key, value]) => [
							key,
							String(value ?? ""),
						]),
					)
				: undefined;
		const config = nodeConfig.config as Record<string, unknown> | undefined;
		const runtime = String(nodeConfig.runtime ?? "").trim() || undefined;
		const startupConfig = normalizeStartupConfig(
			(config?.startupConfig as unknown) ??
				nodeConfig.startupConfig ??
				nodeConfig["startup-config"] ??
				nodeConfig.config_path ??
				nodeConfig.config_file,
		);
		const importMetaAny = nodeConfig.importMeta;
		const importMeta =
			importMetaAny && typeof importMetaAny === "object" && !Array.isArray(importMetaAny)
				? {
						isPlaceholder: Boolean(
							(importMetaAny as Record<string, unknown>).isPlaceholder,
						),
						sourceType:
							String(
								(importMetaAny as Record<string, unknown>).sourceType ?? "",
							).trim() || undefined,
						sourceTemplate:
							String(
								(importMetaAny as Record<string, unknown>).sourceTemplate ?? "",
							).trim() || undefined,
						sourceImage:
							String(
								(importMetaAny as Record<string, unknown>).sourceImage ?? "",
							).trim() || undefined,
					}
				: undefined;

		designNodes.push({
			id: nodeName,
			label: nodeName,
			kind: [
				String(nodeConfig.vendor ?? "").trim(),
				String(nodeConfig.model ?? "").trim(),
			]
				.filter(Boolean)
				.join("/")
				.trim(),
			image: String(
				config?.image ??
					nodeConfig.image ??
					"",
			).trim(),
			runtime,
			mgmtIpv4:
				String(
					(nodeConfig.mgmt as Record<string, unknown> | undefined)?.ipv4 ?? "",
				).trim() || undefined,
			startupConfig,
			env: env && Object.keys(env).length ? env : undefined,
			position: {
				x: 120 + (idx % layoutCols) * 260,
				y: 120 + Math.floor(idx / layoutCols) * 180,
			},
			interfaces: [],
			notes: String(nodeConfig.notes ?? "").trim() || undefined,
			status: String(nodeConfig.status ?? "").trim() || undefined,
			importMeta,
		});
		idx += 1;
	}

	const linksArray = Array.isArray(parsed.links)
		? (parsed.links as Array<Record<string, unknown>>)
		: [];
	const nodeInterfaces = new Map<string, string[]>();
	const designLinks: LabDesignLink[] = linksArray.map((link, linkIdx) => {
		const endpoints = Array.isArray(link.endpoints) ? link.endpoints : [];
		let source = splitEndpoint(endpoints[0]);
		let target = splitEndpoint(endpoints[1]);
		if (!source || !target) {
			const endpointEntries = Object.entries(link).filter(([k]) => {
				const key = String(k).trim().toLowerCase();
				return key !== "name" && key !== "mtu" && key !== "bridge" && key !== "type";
			});
			if (endpointEntries.length >= 2) {
				const [sourceNode, sourceCfg] = endpointEntries[0];
				const [targetNode, targetCfg] = endpointEntries[1];
				source = {
					node: sourceNode,
					iface: String((sourceCfg as Record<string, unknown> | undefined)?.ifname ?? "").trim(),
				};
				target = {
					node: targetNode,
					iface: String((targetCfg as Record<string, unknown> | undefined)?.ifname ?? "").trim(),
				};
			}
		}
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
			label: String(link.name ?? link.label ?? "").trim() || undefined,
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
			defaultKind: "",
			nodes: designNodes,
			links: designLinks.filter((link) => link.source && link.target),
		},
		warnings,
	};
}
