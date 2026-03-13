import type {
	DesignEdge,
	DesignNode,
} from "@/components/lab-designer-types";
import {
	type LabDesign,
	designToKneYaml,
} from "@/lib/kne-yaml";
import { useMemo } from "react";

export function useLabDesignerPageModel(opts: {
	nodes: DesignNode[];
	edges: DesignEdge[];
	labName: string;
	defaultKind: string;
	yamlMode: "generated" | "custom";
	customYaml: string;
	templatesDir: string;
	templateFile: string;
}) {
	const design: LabDesign = useMemo(
		() => ({
			name: opts.labName,
			defaultKind: opts.defaultKind || undefined,
			nodes: opts.nodes.map((n) => ({
				id: String(n.id),
				label: String(n.data?.label ?? n.id),
				kind: String((n.data as any)?.kind ?? ""),
				image: String((n.data as any)?.image ?? ""),
				mgmtIpv4: String((n.data as any)?.mgmtIpv4 ?? "").trim() || undefined,
				startupConfig:
					String((n.data as any)?.startupConfig ?? "").trim() || undefined,
				env: (n.data as any)?.env,
				interfaces: (n.data as any)?.interfaces,
				notes: String((n.data as any)?.notes ?? "").trim() || undefined,
				status: String((n.data as any)?.status ?? "").trim() || undefined,
				position: { x: n.position.x, y: n.position.y },
			})),
			links: opts.edges.map((e) => ({
				id: String(e.id),
				source: String(e.source),
				target: String(e.target),
				sourceIf: String(e.data?.sourceIf ?? "").trim() || undefined,
				targetIf: String(e.data?.targetIf ?? "").trim() || undefined,
				label: String(e.data?.label ?? e.label ?? "").trim() || undefined,
				mtu: Number.isFinite(Number(e.data?.mtu))
					? Number(e.data?.mtu)
					: undefined,
				notes: String(e.data?.notes ?? "").trim() || undefined,
			})),
		}),
		[opts.defaultKind, opts.edges, opts.labName, opts.nodes],
	);

	const { yaml } = useMemo(() => designToKneYaml(design), [design]);

	const effectiveYaml = useMemo(() => {
		if (opts.yamlMode === "custom") return String(opts.customYaml ?? "");
		return yaml;
	}, [opts.customYaml, opts.yamlMode, yaml]);

	const effectiveTemplatesDir = useMemo(() => {
		const d = String(opts.templatesDir ?? "")
			.trim()
			.replace(/^\/+|\/+$/g, "");
		return d || "kne/designer";
	}, [opts.templatesDir]);

	const effectiveTemplateFile = useMemo(() => {
		const raw = String(opts.templateFile ?? "").trim();
		const base = raw || `${opts.labName || "lab"}.kne.yml`;
		if (base.endsWith(".yml") || base.endsWith(".yaml")) return base;
		return `${base}.yml`;
	}, [opts.labName, opts.templateFile]);

	return {
		design,
		yaml,
		effectiveYaml,
		effectiveTemplatesDir,
		effectiveTemplateFile,
	};
}
