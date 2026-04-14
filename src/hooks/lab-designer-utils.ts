import { listRegistryTags } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { QueryClient } from "@tanstack/react-query";
import YAML from "yaml";

export function hostLabelFromURL(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "";
	try {
		const u = new URL(s);
		return u.hostname || s;
	} catch {
		return s.replace(/^https?:\/\//, "").split("/")[0] ?? s;
	}
}

export async function resolveRepoTag(opts: {
	repo: string;
	queryClient: QueryClient;
	fallbackTag?: string;
}): Promise<string> {
	const repo = String(opts.repo ?? "")
		.trim()
		.replace(/^\/+|\/+$/g, "");
	if (!repo) return "latest";
	const fallback = String(opts.fallbackTag ?? "").trim() || "latest";
	try {
		const resp = await opts.queryClient.fetchQuery({
			queryKey: queryKeys.registryTags(repo, ""),
			queryFn: async () => listRegistryTags(repo, { q: "" }),
			retry: false,
			staleTime: 30_000,
		});
		const tags = Array.isArray(resp?.tags) ? resp.tags : [];
		if (tags.includes("latest")) return "latest";
		if (tags.length > 0) return String(tags[tags.length - 1]);
		return fallback;
	} catch {
		return fallback;
	}
}

export function imageRefParts(rawImage: string): {
	repo: string;
	tag: string;
	digest: string;
} {
	const image = String(rawImage ?? "").trim();
	if (!image) return { repo: "", tag: "", digest: "" };

	const digestIdx = image.indexOf("@");
	if (digestIdx > 0) {
		return {
			repo: image.slice(0, digestIdx).trim(),
			tag: "",
			digest: image.slice(digestIdx + 1).trim(),
		};
	}

	const slashIdx = image.lastIndexOf("/");
	const colonIdx = image.lastIndexOf(":");
	if (colonIdx > slashIdx) {
		return {
			repo: image.slice(0, colonIdx).trim(),
			tag: image.slice(colonIdx + 1).trim(),
			digest: "",
		};
	}
	return { repo: image, tag: "", digest: "" };
}

export function imageDisplayName(rawImage: string): string {
	const parts = imageRefParts(rawImage);
	const repo = String(parts.repo ?? "").trim();
	if (!repo) return "";
	const leaf = repo.split("/").filter(Boolean).pop() ?? repo;
	if (parts.tag) return `${leaf}:${parts.tag}`;
	if (parts.digest) return `${leaf}@${parts.digest}`;
	return leaf;
}

export function imageIsRepoOnly(rawImage: string): boolean {
	const parts = imageRefParts(rawImage);
	return Boolean(parts.repo) && !parts.tag && !parts.digest;
}

export async function resolveTopologyImageTags(opts: {
	topologyYAML: string;
	queryClient: QueryClient;
	fallbackTagByRepo?: Record<string, string>;
}): Promise<{
	topologyYAML: string;
	updatedImages: Array<{ nodeName: string; image: string }>;
}> {
	const raw = String(opts.topologyYAML ?? "");
	if (!raw.trim()) return { topologyYAML: raw, updatedImages: [] };

	const parsed = YAML.parse(raw) as Record<string, unknown> | null;
	const nodes = (parsed?.nodes ?? null) as Record<string, unknown> | null;
	if (!parsed || !nodes || typeof nodes !== "object") {
		return { topologyYAML: raw, updatedImages: [] };
	}

	const fallbackByRepo = opts.fallbackTagByRepo ?? {};
	const updatedImages: Array<{ nodeName: string; image: string }> = [];

	for (const [nodeName, nodeAny] of Object.entries(nodes)) {
		if (!nodeAny || typeof nodeAny !== "object") continue;
		const node = nodeAny as Record<string, unknown>;
		const configAny = node.config;
		if (!configAny || typeof configAny !== "object") continue;
		const config = configAny as Record<string, unknown>;
		const image = String(config.image ?? "").trim();
		if (!image || !imageIsRepoOnly(image)) continue;

		const repo = imageRefParts(image)
			.repo.trim()
			.replace(/^\/+|\/+$/g, "");
		if (!repo) continue;
		const resolvedTag = await resolveRepoTag({
			repo,
			queryClient: opts.queryClient,
			fallbackTag: fallbackByRepo[repo],
		});
		const resolvedImage = `${repo}:${resolvedTag}`;
		config.image = resolvedImage;
		updatedImages.push({ nodeName, image: resolvedImage });
	}

	if (updatedImages.length === 0) {
		return { topologyYAML: raw, updatedImages };
	}

	return {
		topologyYAML: YAML.stringify(parsed),
		updatedImages,
	};
}
