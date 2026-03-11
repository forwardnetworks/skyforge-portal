import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
	type UserScopeTemplatesResponse,
	estimateUserScopeTemplateResources,
	getUserScopeContainerlabTemplate,
	getUserScopeContainerlabTemplates,
	getUserScopeEveNgTemplates,
	getUserScopeNetlabTemplate,
	getUserScopeNetlabTemplates,
	getUserScopeTerraformTemplates,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	type DeploymentKind,
	type TemplateSource,
	resourceEstimateFallbackReason,
	toAPITemplateSource,
} from "./create-deployment-shared";
import {
	filterTerraformTemplates,
	getEffectiveTemplateSource,
	getTerraformProviders,
	shouldIncludeTemplateRepo,
} from "./create-deployment-template-catalog-shared";

function getTemplateQuery(source: TemplateSource, templateRepoId: string) {
	const query: { source?: string; repo?: string } = {
		source: toAPITemplateSource(source),
	};
	if (shouldIncludeTemplateRepo(source, templateRepoId)) {
		query.repo = templateRepoId;
	}
	return query;
}

export function useCreateDeploymentTemplateCatalogTemplates(args: {
	queryClient: {
		invalidateQueries: (args: { queryKey: unknown[] }) => Promise<unknown>;
	};
	setTerraformProviderFilter: (value: string) => void;
	terraformProviderFilter: string;
	templatePreviewOpen: boolean;
	templatesUpdatedAt?: string;
	watchKind: DeploymentKind;
	watchSource: string;
	watchSpec: { family: string; engine?: string };
	watchTemplate?: string;
	watchTemplateRepoId?: string;
	watchUserScopeId?: string;
}) {
	const {
		queryClient,
		setTerraformProviderFilter,
		terraformProviderFilter,
		templatePreviewOpen,
		templatesUpdatedAt,
		watchKind,
		watchSource,
		watchSpec,
		watchTemplate,
		watchTemplateRepoId,
		watchUserScopeId,
	} = args;

	const scopeId = watchUserScopeId ?? "";
	const templateName = watchTemplate ?? "";
	const templateRepoId = watchTemplateRepoId ?? "";
	const effectiveSource = useMemo(
		() => getEffectiveTemplateSource(watchKind, watchSource),
		[watchKind, watchSource],
	);

	const templatesQ = useQuery<UserScopeTemplatesResponse>({
		queryKey: queryKeys.userTemplates(
			scopeId,
			watchKind,
			effectiveSource,
			templateRepoId || undefined,
			undefined,
		),
		enabled: Boolean(scopeId),
		queryFn: async () => {
			const query = getTemplateQuery(effectiveSource, templateRepoId);
			switch (watchKind) {
				case "netlab":
				case "c9s_netlab":
					return getUserScopeNetlabTemplates(scopeId, query);
				case "eve_ng":
					return getUserScopeEveNgTemplates(scopeId, query);
				case "containerlab":
				case "c9s_containerlab":
					return getUserScopeContainerlabTemplates(scopeId, query);
				case "terraform":
					return getUserScopeTerraformTemplates(scopeId, query);
				default:
					return getUserScopeNetlabTemplates(scopeId, query);
			}
		},
		staleTime: 5 * 60_000,
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		if (!templatesUpdatedAt) return;
		void queryClient.invalidateQueries({ queryKey: ["userScopeTemplates"] });
	}, [queryClient, templatesUpdatedAt]);

	const rawTemplates = templatesQ.data?.templates ?? [];
	const templates = useMemo(() => {
		if (watchKind !== "terraform") return rawTemplates;
		return filterTerraformTemplates(rawTemplates, terraformProviderFilter);
	}, [rawTemplates, terraformProviderFilter, watchKind]);

	const terraformProviders = useMemo(() => {
		if (watchKind !== "terraform") return [];
		return getTerraformProviders(rawTemplates);
	}, [rawTemplates, watchKind]);

	useEffect(() => {
		if (watchKind !== "terraform") {
			setTerraformProviderFilter("all");
			return;
		}
		if (
			terraformProviderFilter !== "all" &&
			!terraformProviders.includes(terraformProviderFilter)
		) {
			setTerraformProviderFilter("all");
		}
	}, [
		setTerraformProviderFilter,
		terraformProviderFilter,
		terraformProviders,
		watchKind,
	]);

	const templatePreviewQ = useQuery({
		queryKey: [
			"userScopeTemplate",
			watchKind,
			scopeId,
			effectiveSource,
			templateRepoId,
			templatesQ.data?.dir,
			templateName,
		],
		queryFn: async () => {
			if (!scopeId) throw new Error("userId is required");
			if (!templateName) throw new Error("template is required");
			const query: Record<string, string> = getTemplateQuery(
				effectiveSource,
				templateRepoId,
			);
			if (templatesQ.data?.dir) query.dir = templatesQ.data.dir;
			if (watchKind === "containerlab" || watchKind === "c9s_containerlab") {
				return getUserScopeContainerlabTemplate(scopeId, {
					...query,
					file: templateName,
				});
			}
			return getUserScopeNetlabTemplate(scopeId, {
				...query,
				template: templateName,
			});
		},
		enabled:
			templatePreviewOpen &&
			Boolean(scopeId) &&
			Boolean(templateName) &&
			(watchKind === "netlab" ||
				watchKind === "c9s_netlab" ||
				watchKind === "containerlab" ||
				watchKind === "c9s_containerlab"),
		retry: false,
		staleTime: 30_000,
	});

	const templateEstimateQ = useQuery({
		queryKey: [
			"userScopeTemplateEstimate",
			scopeId,
			watchKind,
			effectiveSource,
			templateRepoId,
			templatesQ.data?.dir,
			templateName,
		],
		queryFn: async () => {
			if (!scopeId) throw new Error("userId is required");
			if (!templateName) throw new Error("template is required");
			const body: {
				kind: string;
				engine?: string;
				source: string;
				repo?: string;
				dir?: string;
				template: string;
			} = {
				kind: watchSpec.family,
				engine: watchSpec.engine,
				source: toAPITemplateSource(effectiveSource),
				template: templateName,
			};
			if (shouldIncludeTemplateRepo(effectiveSource, templateRepoId)) {
				body.repo = templateRepoId;
			}
			if (templatesQ.data?.dir) body.dir = templatesQ.data.dir;
			try {
				return await estimateUserScopeTemplateResources(scopeId, body);
			} catch (err) {
				return {
					userId: scopeId,
					kind: body.kind,
					source: body.source,
					template: body.template,
					estimate: {
						supported: false,
						reason: resourceEstimateFallbackReason(err),
						vcpu: 0,
						ramGiB: 0,
						milliCpu: 0,
						memoryBytes: 0,
						nodeCount: 0,
						profiledNodeCount: 0,
					},
				};
			}
		},
		enabled:
			Boolean(scopeId) &&
			Boolean(templateName) &&
			watchSpec.engine === "netlab",
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
		placeholderData: (prev) => prev,
	});

	const selectedTemplateEstimate = templateEstimateQ.data?.estimate;
	const templateEstimatePending =
		templateEstimateQ.isPending &&
		!selectedTemplateEstimate &&
		!templateEstimateQ.error;

	return {
		effectiveSource,
		selectedTemplateEstimate,
		templateEstimatePending,
		templateEstimateQ,
		templatePreviewQ,
		templates,
		templatesQ,
		terraformProviders,
	};
}
