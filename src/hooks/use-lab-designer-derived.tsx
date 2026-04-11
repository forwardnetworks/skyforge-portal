import { inferPaletteItemFromRepo } from "@/components/lab-designer-palette";
import type {
	DesignEdge,
	DesignNode,
	PaletteCategory,
	PaletteItem,
	SavedConfigRef,
} from "@/components/lab-designer-types";
import { hostLabelFromURL } from "@/hooks/lab-designer-utils";
import { type LabDesign, designToKneYaml } from "@/lib/kne-yaml";
import { useMemo } from "react";

const BUILTIN_PALETTE_ITEMS = [
	{
		id: "builtin:linux",
		label: "Host · Linux",
		category: "Hosts",
		kind: "linux",
		role: "host",
		vendor: "Linux",
		model: "Generic",
	},
	{
		id: "builtin:ceos",
		label: "Switch · Arista cEOS",
		category: "Switches",
		kind: "ceos",
		role: "switch",
		vendor: "Arista",
		model: "cEOS",
	},
	{
		id: "builtin:cisco_iol",
		label: "Router · Cisco IOL (IOS)",
		category: "Routers",
		kind: "cisco_iol",
		role: "router",
		vendor: "Cisco",
		model: "IOL",
	},
	{
		id: "builtin:juniper_vjunos-router",
		label: "Router · Juniper vJunos Router",
		category: "Routers",
		kind: "juniper_vjunos-router",
		role: "router",
		vendor: "Juniper",
		model: "vJunos-router",
	},
	{
		id: "builtin:vsrx",
		label: "Firewall · Juniper SRX",
		category: "Firewalls",
		kind: "vsrx",
		role: "firewall",
		vendor: "Juniper",
		model: "SRX",
	},
] as const;

type RegistryCatalogImage = {
	id?: string;
	label?: string;
	nos?: string;
	vendor?: string;
	model?: string;
	kind?: string;
	role?: string;
	repository: string;
	defaultTag?: string;
	enabled: boolean;
};

function normalizeRepo(repo: string | undefined): string {
	return String(repo ?? "")
		.trim()
		.replace(/^\/+|\/+$/g, "");
}

export function buildPaletteBaseItems(args: {
	registryCatalogImages: RegistryCatalogImage[];
	registryRepos: string[];
}): PaletteItem[] {
	const catalogRows = (args.registryCatalogImages ?? []).map((entry) => ({
		...entry,
		repo: normalizeRepo(entry.repository),
	}));
	const catalogRepos = new Set(
		catalogRows.map((entry) => entry.repo).filter(Boolean),
	);
	const fromCatalog = catalogRows
		.filter((entry) => Boolean(entry?.enabled) && Boolean(entry.repo))
		.map((entry) => {
			const defaultTag =
				String(entry.defaultTag ?? "latest").trim() || "latest";
			const label = String(entry.label ?? "").trim();
			const kind = String(entry.kind ?? "").trim();
			const inferred = inferPaletteItemFromRepo(entry.repo);
			const role = String(entry.role ?? inferred.role ?? "other")
				.trim()
				.toLowerCase() as "host" | "router" | "switch" | "firewall" | "other";
			const category: PaletteCategory =
				role === "host"
					? "Hosts"
					: role === "router"
						? "Routers"
						: role === "switch"
							? "Switches"
							: role === "firewall"
								? "Firewalls"
								: "Other";
			return {
				...inferred,
				id: String(
					entry.id ?? `${kind || inferred.kind}:${entry.repo}:${defaultTag}`,
				),
				label: label || inferred.label,
				kind: kind || inferred.kind,
				role,
				category,
				repo: entry.repo,
				defaultTag,
				image: `${entry.repo}:${defaultTag}`,
				vendor:
					String(entry.vendor ?? inferred.vendor ?? "").trim() || inferred.vendor,
				model:
					String(entry.model ?? inferred.model ?? "").trim() || inferred.model,
			};
		});
	const fromRepos = (args.registryRepos ?? [])
		.map((repo) => normalizeRepo(repo))
		.filter((repo) => Boolean(repo) && !catalogRepos.has(repo))
		.map((repo) => inferPaletteItemFromRepo(repo));
	if (fromCatalog.length > 0 || fromRepos.length > 0) {
		return [...fromCatalog, ...fromRepos];
	}
	return BUILTIN_PALETTE_ITEMS.map((item) => ({
		...item,
		image: "",
		repo: undefined,
		defaultTag: "latest",
	}));
}

export function useLabDesignerDerived(opts: {
	nodes: DesignNode[];
	edges: DesignEdge[];
	labName: string;
	defaultKind: string;
	selectedNodeId: string;
	selectedEdgeId: string;
	yamlMode: "generated" | "custom";
	customYaml: string;
	templatesDir: string;
	templateFile: string;
	paletteSearch: string;
	paletteVendor: string;
	paletteRole: string;
	registryRepos: string[];
	registryCatalogImages: RegistryCatalogImage[];
	registryError: Error | null;
	userScopes: any[];
	kneServers: any[];
}) {
	const selectedNode = useMemo(
		() => opts.nodes.find((n) => n.id === opts.selectedNodeId) ?? null,
		[opts.nodes, opts.selectedNodeId],
	);
	const selectedEdge = useMemo(
		() => opts.edges.find((edge) => String(edge.id) === opts.selectedEdgeId) ?? null,
		[opts.edges, opts.selectedEdgeId],
	);

	const design: LabDesign = useMemo(
		() => ({
			name: opts.labName,
			defaultKind: String(opts.defaultKind ?? "").trim() || undefined,
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

	const { yaml, warnings } = useMemo(() => designToKneYaml(design), [design]);
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
		return d || "kne/designer";
	}, [opts.templatesDir]);

	const effectiveTemplateFile = useMemo(() => {
		const raw = String(opts.templateFile ?? "").trim();
		const base = raw || `${opts.labName || "lab"}.kne.yml`;
		if (base.endsWith(".yml") || base.endsWith(".yaml")) return base;
		return `${base}.yml`;
	}, [opts.labName, opts.templateFile]);

	const paletteBaseItems = useMemo(
		() =>
			buildPaletteBaseItems({
				registryCatalogImages: opts.registryCatalogImages,
				registryRepos: opts.registryRepos,
			}),
		[opts.registryCatalogImages, opts.registryRepos],
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
			const oa = order[a.category as PaletteCategory] ?? 99;
			const ob = order[b.category as PaletteCategory] ?? 99;
			if (oa !== ob) return oa - ob;
			return a.label.localeCompare(b.label);
		});
	}, [
		opts.paletteRole,
		opts.paletteSearch,
		opts.paletteVendor,
		paletteBaseItems,
	]);

	const quickstartImageByKind = useMemo(() => {
		const images: Record<string, string> = {};
		for (const item of paletteBaseItems) {
			const kind = String(item.kind ?? "")
				.trim()
				.toLowerCase();
			const image = String(item.image ?? "").trim();
			if (!kind || !image || images[kind]) continue;
			images[kind] = image;
		}
		return images;
	}, [paletteBaseItems]);

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

	const kneServerOptions = useMemo(
		() =>
			(opts.kneServers ?? []).map((server: any) => ({
				value: `user:${String(server.id)}`,
				label: hostLabelFromURL(server.apiUrl) || server.name,
			})),
		[opts.kneServers],
	);

	return {
		selectedNode,
		selectedEdge,
		yaml,
		missingImageWarnings,
		otherWarnings,
		effectiveYaml,
		effectiveTemplatesDir,
		effectiveTemplateFile,
		paletteVendors,
		paletteItems,
		quickstartImageByKind,
		paletteIsFilteredEmpty,
		registryError,
		userScopeOptions,
		kneServerOptions,
	};
}
