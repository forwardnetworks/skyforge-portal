import type { DeploymentTopology } from "@/lib/api-client";
import type { Edge, Node } from "@xyflow/react";
import { useCallback, useMemo } from "react";

export function useTopologyViewerGraph(topology?: DeploymentTopology | null) {
	const vendorFromKind = useCallback(
		(kindRaw: string): "cisco" | "arista" | "linux" | "unknown" => {
			const kind = String(kindRaw ?? "").toLowerCase();
			if (!kind) return "unknown";
			if (
				kind.includes("arista") ||
				kind.includes("eos") ||
				kind.includes("ceos") ||
				kind.includes("veos")
			) {
				return "arista";
			}
			if (
				kind.includes("cisco") ||
				kind.includes("ios") ||
				kind.includes("nxos") ||
				kind.includes("csr") ||
				kind.includes("c8k") ||
				kind.includes("iosxr")
			) {
				return "cisco";
			}
			if (
				kind.includes("linux") ||
				kind.includes("ubuntu") ||
				kind.includes("debian") ||
				kind.includes("alpine") ||
				kind.includes("rocky") ||
				kind.includes("centos")
			) {
				return "linux";
			}
			return "unknown";
		},
		[],
	);

	return useMemo(() => {
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
		const nodes: Node[] = topology.nodes.map((node, idx) => {
			const col = idx % cols;
			const row = Math.floor(idx / cols);
			const kind = String(node.kind ?? "");
			const vendor = vendorFromKind(kind);
			const icon =
				vendor === "linux"
					? "client"
					: vendor === "arista" || vendor === "cisco"
						? "switch"
						: "server";
			const status = String(node.status ?? "unknown");
			const pingIp = String((node as any).pingIp ?? node.mgmtIp ?? "");
			const mgmtHost = String((node as any).mgmtHost ?? "");
			return {
				id: String(node.id),
				position: { x: col * gapX, y: row * gapY },
				data: {
					label: String(node.label ?? node.id),
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
		const edges: Edge[] = (topology.edges ?? []).map((edge) => ({
			id: String(edge.id),
			source: String(edge.source),
			target: String(edge.target),
			label: edge.label ? String(edge.label) : undefined,
			animated: false,
		}));
		return { nodes, edges };
	}, [topology, vendorFromKind]);
}
