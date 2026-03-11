import { type QueryClient, useQuery } from "@tanstack/react-query";
import {
	getAdminAuthSettings,
	getAdminEffectiveConfig,
	getAdminOIDCSettings,
	getAdminQuickDeployCatalog,
	getAdminQuickDeployTemplateOptions,
	getAdminServiceNowGlobalConfig,
	getUserScopeNetlabTemplates,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { useAdminSettingsAuthLocal } from "./use-admin-settings-auth-local";
import { useAdminSettingsAuthOIDC } from "./use-admin-settings-auth-oidc";
import { useAdminSettingsAuthQuickDeploy } from "./use-admin-settings-auth-quick-deploy";
import { useAdminSettingsAuthServiceNow } from "./use-admin-settings-auth-servicenow";

export function useAdminSettingsAuth({
	queryClient,
	isAdmin,
	adminScopeID,
}: {
	queryClient: QueryClient;
	isAdmin: boolean;
	adminScopeID: string;
}) {
	const cfgQ = useQuery({
		queryKey: queryKeys.adminConfig(),
		queryFn: getAdminEffectiveConfig,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const authSettingsQ = useQuery({
		queryKey: queryKeys.adminAuthSettings(),
		queryFn: getAdminAuthSettings,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const oidcSettingsQ = useQuery({
		queryKey: queryKeys.adminOidcSettings(),
		queryFn: getAdminOIDCSettings,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const quickDeployCatalogQ = useQuery({
		queryKey: queryKeys.adminQuickDeployCatalog(),
		queryFn: getAdminQuickDeployCatalog,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const quickDeployTemplateOptionsQ = useQuery({
		queryKey: ["adminQuickDeployTemplateOptions"],
		queryFn: getAdminQuickDeployTemplateOptions,
		enabled: isAdmin,
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
		enabled: isAdmin && adminScopeID.length > 0,
		staleTime: 15_000,
		retry: false,
	});
	const serviceNowGlobalConfigQ = useQuery({
		queryKey: queryKeys.adminServiceNowGlobalConfig(),
		queryFn: getAdminServiceNowGlobalConfig,
		enabled: isAdmin,
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
	};
}
