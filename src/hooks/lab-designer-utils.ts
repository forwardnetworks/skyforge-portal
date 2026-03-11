import { listRegistryTags } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { QueryClient } from "@tanstack/react-query";

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
}): Promise<string> {
	const repo = String(opts.repo ?? "")
		.trim()
		.replace(/^\/+|\/+$/g, "");
	if (!repo) return "latest";
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
		return "latest";
	} catch {
		return "latest";
	}
}
