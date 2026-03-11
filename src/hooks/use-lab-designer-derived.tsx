import { inferPaletteItemFromRepo } from "@/components/lab-designer-palette";
import type {
	DesignNode,
	PaletteCategory,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import { hostLabelFromURL } from "@/hooks/lab-designer-utils";
import {
	type LabDesign,
	designToContainerlabYaml,
} from "@/lib/containerlab-yaml";
import { useMemo } from "react";

export function useLabDesignerDerived(opts: {
	nodes: DesignNode[];
	edges: any[];
	labName: string;
	selectedNodeId: string;
	yamlMode: "generated" | "custom";
	customYaml: string;
	templatesDir: string;
	templateFile: string;
	paletteSearch: string;
	paletteVendor: string;
	paletteRole: string;
	registryRepos: string[];
	registryError: Error | null;
	userScopes: any[];
	containerlabServers: any[];
}) {
	const selectedNode = useMemo(
		() => opts.nodes.find((n) => n.id === opts.selectedNodeId) ?? null,
		[opts.nodes, opts.selectedNodeId],
	);

	const design: LabDesign = useMemo(
		() => ({
			name: opts.labName,
			nodes: opts.nodes.map((n) => ({
				id: String(n.id),
				label: String(n.data?.label ?? n.id),
				kind: String((n.data as any)?.kind ?? ""),
				image: String((n.data as any)?.image ?? ""),
				position: { x: n.position.x, y: n.position.y },
			})),
			links: opts.edges.map((e) => ({
				id: String(e.id),
				source: String(e.source),
				target: String(e.target),
			})),
		}),
		[opts.edges, opts.labName, opts.nodes],
	);

	const { yaml, warnings } = useMemo(
		() => designToContainerlabYaml(design),
		[design],
	);
	const missingImageWarnings = useMemo(
		() => warnings.filter((w) => w.toLowerCase().includes("missing image")),
		[warnings],
	);
	const otherWarnings = useMemo(
		() => warnings.filter((w) => !w.toLowerCase().includes("missing image")),
		[warnings],
	);
	const effectiveYaml = useMemo(() => {
		if (opts.yamlMode === "custom") return String(opts.customYaml ?? "");
		return yaml;
	}, [opts.customYaml, opts.yamlMode, yaml]);

	const effectiveTemplatesDir = useMemo(() => {
		const d = String(opts.templatesDir ?? "")
			.trim()
			.replace(/^\/+|\/+$/g, "");
		return d || "containerlab/designer";
	}, [opts.templatesDir]);

	const effectiveTemplateFile = useMemo(() => {
		const raw = String(opts.templateFile ?? "").trim();
		const base = raw || `${opts.labName || "lab"}.clab.yml`;
		if (base.endsWith(".yml") || base.endsWith(".yaml")) return base;
		return `${base}.yml`;
	}, [opts.labName, opts.templateFile]);

	const paletteBaseItems = useMemo(
		() => opts.registryRepos.map(inferPaletteItemFromRepo),
		[opts.registryRepos],
	);
	const paletteVendors = useMemo(() => {
		const set = new Set<string>();
		for (const p of paletteBaseItems) {
			const v = String(p.vendor ?? "").trim();
			if (v) set.add(v);
		}
		return Array.from(set).sort((a, b) => a.localeCompare(b));
	}, [paletteBaseItems]);

	const paletteItems = useMemo(() => {
		const q = opts.paletteSearch.trim().toLowerCase();
		const filtered = paletteBaseItems
			.filter((p) => {
				if (opts.paletteVendor === "all") return true;
				return String(p.vendor ?? "") === opts.paletteVendor;
			})
			.filter((p) => {
				if (opts.paletteRole === "all") return true;
				return String(p.role ?? "other") === opts.paletteRole;
			})
			.filter((p) => {
				if (!q) return true;
				return `${p.label} ${p.kind} ${p.category} ${p.repo ?? ""}`
					.toLowerCase()
					.includes(q);
			});

		const order: Record<PaletteCategory, number> = {
			Hosts: 0,
			Routers: 1,
			Switches: 2,
			Firewalls: 3,
			Other: 4,
		};
		return filtered.sort((a, b) => {
			const oa = order[a.category] ?? 99;
			const ob = order[b.category] ?? 99;
			if (oa !== ob) return oa - ob;
			return a.label.localeCompare(b.label);
		});
	}, [
		opts.paletteRole,
		opts.paletteSearch,
		opts.paletteVendor,
		paletteBaseItems,
	]);

	const paletteHasBaseItems = paletteBaseItems.length > 0;
	const paletteIsFilteredEmpty =
		paletteHasBaseItems && paletteItems.length === 0;
	const registryError = opts.registryError?.message || "Registry unavailable.";

	const userScopeOptions = useMemo(
		() =>
			(opts.userScopes ?? []).map((scope: any) => ({
				value: String(scope.id),
				label: String(scope.name ?? scope.slug ?? scope.id),
			})),
		[opts.userScopes],
	);

	const containerlabServerOptions = useMemo(
		() =>
			(opts.containerlabServers ?? []).map((server: any) => ({
				value: `user:${String(server.id)}`,
				label: hostLabelFromURL(server.apiUrl) || server.name,
			})),
		[opts.containerlabServers],
	);

	return {
		selectedNode,
		yaml,
		missingImageWarnings,
		otherWarnings,
		effectiveYaml,
		effectiveTemplatesDir,
		effectiveTemplateFile,
		paletteVendors,
		paletteItems,
		paletteIsFilteredEmpty,
		registryError,
		userScopeOptions,
		containerlabServerOptions,
	};
}
