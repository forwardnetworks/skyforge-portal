import type { DesignNodeData, LabNodeInterface } from "@/components/lab-designer-types";
import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";

type LabDesignerPageState = ReturnType<typeof useLabDesignerPage>;
type LabDesignerEdge = LabDesignerPageState["edges"][number];

type EnvRecord = Record<string, string>;
type InterfaceData = LabNodeInterface[];

export type LabDesignerNodeEditorProps = {
	page: LabDesignerPageState;
};

export type LabDesignerLinkEditorProps = {
	page: LabDesignerPageState;
	selectedEdge: NonNullable<LabDesignerPageState["selectedEdge"]>;
};

export function updateSelectedNode(
	page: LabDesignerPageState,
	updater: (data: DesignNodeData) => DesignNodeData,
) {
	if (!page.selectedNode) return;
	page.markWarningsVisible();
	page.setNodes((current) =>
		current.map((node) =>
			node.id === page.selectedNode?.id
				? { ...node, data: updater(node.data) }
				: node,
		),
	);
}

export function updateSelectedEdge(
	page: LabDesignerPageState,
	edgeId: string,
	updater: (edge: LabDesignerEdge) => LabDesignerEdge,
) {
	page.setEdges((current) => current.map((edge) => (edge.id === edgeId ? updater(edge) : edge)));
}

export function formatEnv(env?: EnvRecord) {
	return Object.entries(env ?? {})
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");
}

export function parseEnv(raw: string): EnvRecord | undefined {
	const out: EnvRecord = {};
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const idx = trimmed.indexOf("=");
		if (idx <= 0) continue;
		out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
	}
	return Object.keys(out).length ? out : undefined;
}

export function formatInterfaces(interfaces?: InterfaceData) {
	return (interfaces ?? []).map((item) => item.name).join("\n");
}

export function parseInterfaces(raw: string): InterfaceData | undefined {
	const seen = new Set<string>();
	const items = raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((name) => {
			if (seen.has(name)) return false;
			seen.add(name);
			return true;
		})
		.map((name) => ({ id: name, name }));
	return items.length ? items : undefined;
}
