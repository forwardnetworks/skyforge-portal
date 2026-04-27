import {
	type SkyforgeUserScope,
	getCurrentPlatformAvailability,
	getDeploymentLifetimePolicy,
	getQuickDeployCatalog,
	getSession,
	getUserScopeNetlabTemplate,
	listUserScopes,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export function useQuickDeployPageQueries(args: {
	previewOpen: boolean;
	previewTemplate: string;
	previewSource: "blueprints" | "custom";
	previewRepo: string;
	previewDir: string;
}) {
	const {
		previewOpen,
		previewTemplate,
		previewSource,
		previewRepo,
		previewDir,
	} = args;
	const catalogQ = useQuery({
		queryKey: ["quick-deploy", "catalog"],
		queryFn: getQuickDeployCatalog,
		staleTime: 60_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		staleTime: 60_000,
		retry: false,
	});
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
		retry: false,
	});
	const availabilityQ = useQuery({
		queryKey: queryKeys.currentPlatformAvailability(),
		queryFn: getCurrentPlatformAvailability,
		staleTime: 30_000,
		retry: false,
		enabled: sessionQ.isSuccess,
	});

	const previewUserScopeId = useMemo(() => {
		const scopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
		const username = String(sessionQ.data?.username ?? "").trim();
		if (scopes.length === 0) return "";
		if (!username) return scopes[0]?.id ?? "";
		const mine = scopes.filter((w) => {
			if (String(w.createdBy ?? "").trim() === username) return true;
			if ((w.owners ?? []).includes(username)) return true;
			if (String(w.slug ?? "").trim() === username) return true;
			return false;
		});
		return (mine[0] ?? scopes[0])?.id ?? "";
	}, [sessionQ.data?.username, userScopesQ.data]);

	const previewQ = useQuery({
		queryKey: [
			"quick-deploy",
			"template-preview",
			previewUserScopeId,
			previewSource,
			previewRepo,
			previewDir,
			previewTemplate,
		],
		queryFn: async () => {
			if (!previewUserScopeId) {
				throw new Error("No user scope available for preview.");
			}
			if (!previewTemplate) throw new Error("Template is required.");
			return getUserScopeNetlabTemplate(previewUserScopeId, {
				source: previewSource,
				repo: previewSource === "custom" ? previewRepo : undefined,
				dir: previewSource === "custom" ? previewDir : undefined,
				template: previewTemplate,
			});
		},
		enabled:
			previewOpen &&
			Boolean(previewTemplate) &&
			Boolean(previewUserScopeId) &&
			(previewSource !== "custom" || Boolean(previewRepo.trim())),
		retry: false,
		staleTime: 30_000,
	});

	return {
		catalogQ,
		lifetimePolicyQ,
		sessionQ,
		userScopesQ,
		availabilityQ,
		previewUserScopeId,
		previewQ,
	};
}
