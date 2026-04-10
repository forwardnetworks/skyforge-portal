import {
	getRegistryCatalog,
	getUserScopeKNETemplate,
	getUserScopeKNETemplates,
	listRegistryRepositories,
	listUserKNEServers,
	listUserScopes,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import type { UseLabDesignerDataOptions } from "./use-lab-designer-data-types";

export function useLabDesignerDataQueries(opts: UseLabDesignerDataOptions) {
	const toAPISource = (value: string) => (value === "user" ? "user" : value);

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		retry: false,
		staleTime: 30_000,
	});

	const registryReposQ = useQuery({
		queryKey: queryKeys.registryRepos(""),
		queryFn: async () => listRegistryRepositories({ q: "", n: 2000 }),
		retry: false,
		staleTime: 60_000,
	});
	const registryCatalogQ = useQuery({
		queryKey: queryKeys.registryCatalog(),
		queryFn: getRegistryCatalog,
		retry: false,
		staleTime: 60_000,
	});

	const kneServersQ = useQuery({
		queryKey: queryKeys.userKNEServers(),
		queryFn: listUserKNEServers,
		enabled: false,
		retry: false,
		staleTime: 30_000,
	});

	const templatesQ = useQuery({
		queryKey: opts.userId
			? [
					"kneTemplates",
					opts.userId,
					opts.importSource,
					opts.importDir,
				]
			: ["kneTemplates", "none"],
		queryFn: async () =>
			getUserScopeKNETemplates(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
			}),
		enabled: Boolean(opts.userId) && opts.importOpen,
		retry: false,
		staleTime: 30_000,
	});

	const templatePreviewQ = useQuery({
		queryKey: opts.userId
			? [
					"kneTemplate",
					opts.userId,
					opts.importSource,
					opts.importDir,
					opts.importFile,
				]
			: ["kneTemplate", "none"],
		queryFn: async () => {
			if (!opts.userId) throw new Error("missing user");
			if (!opts.importFile) return null;
			return getUserScopeKNETemplate(opts.userId, {
				source: toAPISource(opts.importSource),
				dir: opts.importDir,
				file: opts.importFile,
			});
		},
		enabled:
			Boolean(opts.userId) && opts.importOpen && Boolean(opts.importFile),
		retry: false,
		staleTime: 30_000,
	});

	return {
		userScopesQ,
		registryReposQ,
		registryCatalogQ,
		kneServersQ,
		templatesQ,
		templatePreviewQ,
	};
}
