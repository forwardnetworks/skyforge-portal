import type { DeploymentMap, DeploymentTopology } from "./api-client";

export function deploymentMapToTopology(map: DeploymentMap): DeploymentTopology {
	return {
		generatedAt: map.generatedAt,
		source: map.source,
		artifactKey: map.artifactKey,
		nodes: map.nodes.map((node) => ({
			id: node.id,
			label: node.label,
			podName: node.podName,
			kind: node.resourceType || node.class,
			mgmtIp: node.mgmtIp,
			status: node.status,
		})),
		edges: map.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label || edge.kind,
			sourceIf:
				typeof edge.details?.sourceIf === "string" ? edge.details.sourceIf : "",
			targetIf:
				typeof edge.details?.targetIf === "string" ? edge.details.targetIf : "",
		})),
	};
}
