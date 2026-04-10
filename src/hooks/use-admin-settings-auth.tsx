import { type QueryClient, useQuery } from "@tanstack/react-query";
import {
	getAdminAuthSettings,
	getAdminEffectiveConfig,
	getAdminForwardDemoSeedCatalog,
	getAdminHetznerBurstRuntimePolicy,
	getAdminHetznerBurstStatus,
	getAdminOIDCSettings,
	getAdminQuickDeployCatalog,
	getAdminQuickDeployTemplateOptions,
	getAdminRegistryCatalog,
	getAdminServiceNowGlobalConfig,
	getAdminTeamsGlobalConfig,
	getUserScopeNetlabTemplates,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useAdminSettingsAuthForwardDemoSeeds } from "./use-admin-settings-auth-forward-demo-seeds";
import { useAdminSettingsAuthHetznerBurst } from "./use-admin-settings-auth-hetzner-burst";
import { useAdminSettingsAuthLocal } from "./use-admin-settings-auth-local";
import { useAdminSettingsAuthOIDC } from "./use-admin-settings-auth-oidc";
import { useAdminSettingsAuthQuickDeploy } from "./use-admin-settings-auth-quick-deploy";
import { useAdminSettingsAuthRegistryCatalog } from "./use-admin-settings-auth-registry-catalog";
import { useAdminSettingsAuthServiceNow } from "./use-admin-settings-auth-servicenow";
import { useAdminSettingsAuthTeams } from "./use-admin-settings-auth-teams";

export function useAdminSettingsAuth({
	queryClient,
	adminScopeID,
}: {
	queryClient: QueryClient;
	adminScopeID: string;
}) {
	const cfgQ = useQuery({
		queryKey: queryKeys.adminConfig(),
		queryFn: getAdminEffectiveConfig,
		staleTime: 15_000,
		retry: false,
	});
	const authSettingsQ = useQuery({
		queryKey: queryKeys.adminAuthSettings(),
		queryFn: getAdminAuthSettings,
		staleTime: 15_000,
		retry: false,
	});
	const oidcSettingsQ = useQuery({
		queryKey: queryKeys.adminOidcSettings(),
		queryFn: getAdminOIDCSettings,
		staleTime: 15_000,
		retry: false,
	});
	const quickDeployCatalogQ = useQuery({
		queryKey: queryKeys.adminQuickDeployCatalog(),
		queryFn: getAdminQuickDeployCatalog,
		staleTime: 15_000,
		retry: false,
	});
	const quickDeployTemplateOptionsQ = useQuery({
		queryKey: ["adminQuickDeployTemplateOptions"],
		queryFn: getAdminQuickDeployTemplateOptions,
		staleTime: 15_000,
		retry: false,
	});
	const blueprintNetlabTemplatesQ = useQuery({
		queryKey: queryKeys.userTemplates(
			adminScopeID || "none",
			"netlab",
			"blueprints",
			"",
			"netlab",
		),
		queryFn: () =>
			getUserScopeNetlabTemplates(adminScopeID, {
				source: "blueprints",
				dir: "netlab",
			}),
		enabled: adminScopeID.length > 0,
		staleTime: 15_000,
		retry: false,
	});
	const serviceNowGlobalConfigQ = useQuery({
		queryKey: queryKeys.adminServiceNowGlobalConfig(),
		queryFn: getAdminServiceNowGlobalConfig,
		staleTime: 15_000,
		retry: false,
	});
	const forwardDemoSeedCatalogQ = useQuery({
		queryKey: queryKeys.adminForwardDemoSeedCatalog(),
		queryFn: getAdminForwardDemoSeedCatalog,
		staleTime: 15_000,
		retry: false,
	});
	const teamsGlobalConfigQ = useQuery({
		queryKey: queryKeys.adminTeamsGlobalConfig(),
		queryFn: getAdminTeamsGlobalConfig,
		staleTime: 15_000,
		retry: false,
	});
	const hetznerBurstStatusQ = useQuery({
		queryKey: queryKeys.adminHetznerBurstStatus(),
		queryFn: getAdminHetznerBurstStatus,
		staleTime: 15_000,
		retry: false,
	});
	const hetznerBurstRuntimePolicyQ = useQuery({
		queryKey: queryKeys.adminHetznerBurstRuntimePolicy(),
		queryFn: getAdminHetznerBurstRuntimePolicy,
		staleTime: 15_000,
		retry: false,
	});
	const adminRegistryCatalogQ = useQuery({
		queryKey: queryKeys.adminRegistryCatalog(),
		queryFn: getAdminRegistryCatalog,
		staleTime: 15_000,
		retry: false,
	});

	const authLocal = useAdminSettingsAuthLocal({
		queryClient,
		authSettings: authSettingsQ.data,
		refetchAuthSettings: authSettingsQ.refetch,
	});
	const oidc = useAdminSettingsAuthOIDC({
		queryClient,
		oidcSettings: oidcSettingsQ.data,
		refetchOIDCSettings: oidcSettingsQ.refetch,
		refetchAuthSettings: authSettingsQ.refetch,
	});
	const quickDeploy = useAdminSettingsAuthQuickDeploy({
		quickDeployCatalog: quickDeployCatalogQ.data,
		refetchQuickDeployCatalog: quickDeployCatalogQ.refetch,
		quickDeployTemplateOptions: quickDeployTemplateOptionsQ.data,
		blueprintNetlabTemplates: blueprintNetlabTemplatesQ.data,
	});
	const serviceNow = useAdminSettingsAuthServiceNow({
		queryClient,
		serviceNowGlobalConfig: serviceNowGlobalConfigQ.data,
		refetchServiceNowGlobalConfig: serviceNowGlobalConfigQ.refetch,
	});
	const forwardDemoSeeds = useAdminSettingsAuthForwardDemoSeeds({
		queryClient,
		forwardDemoSeedCatalog: forwardDemoSeedCatalogQ.data,
		refetchForwardDemoSeedCatalog: forwardDemoSeedCatalogQ.refetch,
	});
	const teams = useAdminSettingsAuthTeams({
		queryClient,
		teamsGlobalConfig: teamsGlobalConfigQ.data,
		refetchTeamsGlobalConfig: teamsGlobalConfigQ.refetch,
	});
	const registryCatalog = useAdminSettingsAuthRegistryCatalog({
		queryClient,
		registryCatalog: adminRegistryCatalogQ.data,
		refetchRegistryCatalog: adminRegistryCatalogQ.refetch,
	});
	const hetznerBurst = useAdminSettingsAuthHetznerBurst({
		queryClient,
		runtimePolicy: hetznerBurstRuntimePolicyQ.data,
		refetchRuntimePolicy: hetznerBurstRuntimePolicyQ.refetch,
		refetchStatus: hetznerBurstStatusQ.refetch,
	});

	return {
		cfgQ,
		authSettingsQ,
		...authLocal,
		oidcSettingsQ,
		...oidc,
		quickDeployCatalogQ,
		quickDeployTemplateOptionsQ,
		blueprintNetlabTemplatesQ,
		...quickDeploy,
		serviceNowGlobalConfigQ,
		...serviceNow,
		forwardDemoSeedCatalogQ,
		...forwardDemoSeeds,
		teamsGlobalConfigQ,
		...teams,
		adminRegistryCatalogQ,
		...registryCatalog,
		hetznerBurstStatusQ,
		hetznerBurstRuntimePolicyQ,
		...hetznerBurst,
	};
}
