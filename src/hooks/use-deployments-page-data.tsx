import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
	DashboardSnapshot,
	DeploymentLifetimePolicyResponse,
	SkyforgeUserScope,
	UserScopeDeployment,
} from "../lib/api-client";
import {
	buildLoginUrl,
	getDashboardSnapshot,
	getDeploymentLifetimePolicy,
	getSession,
	listUserScopes,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { getRuntimeAuthMode } from "../lib/skyforge-config";
import {
	filterDeployments,
	filterRunsForUserScope,
	formatLifetimeCellFor,
	isManagedDeploymentType,
	pickPreferredUserScopeID,
	selectVisibleUserScopes,
} from "./deployments-page-utils";

const LAST_USER_SCOPE_KEY = "skyforge.lastUserScopeId.deployments";
const FALLBACK_MANAGED_FAMILIES = ["kne", "byos", "terraform"];
const FALLBACK_LIFETIME_HOURS = [4, 8, 24, 72];

export function useDeploymentsPageData(args: {
	navigate: ReturnType<typeof useNavigate>;
	userId?: string;
}) {
	const { navigate, userId } = args;
	const queryClient = useQueryClient();
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [isFeedOpen, setIsFeedOpen] = useState(true);

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: getDashboardSnapshot,
		initialData: () =>
			(queryClient.getQueryData(queryKeys.dashboardSnapshot()) as
				| DashboardSnapshot
				| undefined) ?? null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery<DeploymentLifetimePolicyResponse>({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		retry: false,
		staleTime: 30_000,
	});
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});

	const allUserScopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
	const effectiveUsername = String(session.data?.username ?? "").trim();
	const isAdmin = Boolean(session.data?.isAdmin);
	const userScopes = useMemo(
		() => selectVisibleUserScopes(allUserScopes, effectiveUsername, isAdmin),
		[allUserScopes, effectiveUsername, isAdmin],
	);

	const selectedUserScopeId = useMemo(() => {
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(LAST_USER_SCOPE_KEY) ?? "")
				: "";
		return pickPreferredUserScopeID({
			userScopes,
			effectiveUsername,
			isAdmin,
			requestedUserScopeID: userId,
			storedUserScopeID: stored,
		});
	}, [effectiveUsername, isAdmin, userId, userScopes]);

	useEffect(() => {
		if (!selectedUserScopeId) return;
		if (typeof window !== "undefined") {
			window.localStorage.setItem(LAST_USER_SCOPE_KEY, selectedUserScopeId);
		}
		if (userId !== selectedUserScopeId) {
			void navigate({
				search: { userId: selectedUserScopeId } as never,
				replace: true,
			});
		}
	}, [navigate, selectedUserScopeId, userId]);

	const selectedUserScope = useMemo(
		() => userScopes.find((scope) => scope.id === selectedUserScopeId) ?? null,
		[selectedUserScopeId, userScopes],
	);

	const allDeployments = useMemo(() => {
		const all = (snap.data?.deployments ?? []) as UserScopeDeployment[];
		if (!selectedUserScopeId) return all;
		return all.filter(
			(deployment) => deployment.userId === selectedUserScopeId,
		);
	}, [selectedUserScopeId, snap.data?.deployments]);

	const deployments = useMemo(
		() =>
			filterDeployments(allDeployments, {
				searchQuery,
				statusFilter,
				typeFilter,
			}),
		[allDeployments, searchQuery, statusFilter, typeFilter],
	);

	const managedFamilies = useMemo(
		() =>
			new Set(
				(
					lifetimePolicyQ.data?.managedFamilies ?? FALLBACK_MANAGED_FAMILIES
				).map((value) => String(value).trim().toLowerCase()),
			),
		[lifetimePolicyQ.data?.managedFamilies],
	);
	const lifetimeHoursOptions = useMemo(() => {
		const values = (
			lifetimePolicyQ.data?.allowedHours ?? FALLBACK_LIFETIME_HOURS
		)
			.map((hours) => Number.parseInt(String(hours), 10))
			.filter((hours) => Number.isFinite(hours) && hours > 0);
		return values.length > 0 ? values : FALLBACK_LIFETIME_HOURS;
	}, [lifetimePolicyQ.data?.allowedHours]);
	const defaultLifetimeHours =
		Number.parseInt(String(lifetimePolicyQ.data?.defaultHours ?? 24), 10) || 24;
	const allowNoExpiry = Boolean(lifetimePolicyQ.data?.allowDisable ?? false);

	const isManagedDeploymentFamily = useCallback(
		(family: string) => isManagedDeploymentType(managedFamilies, family),
		[managedFamilies],
	);
	const formatLifetimeCell = useCallback(
		(deployment: UserScopeDeployment) =>
			formatLifetimeCellFor(
				deployment,
				isManagedDeploymentFamily(deployment.family),
			),
		[isManagedDeploymentFamily],
	);

	const runs = useMemo(
		() =>
			filterRunsForUserScope(
				(snap.data?.runs ?? []) as Record<string, unknown>[],
				selectedUserScopeId,
			),
		[selectedUserScopeId, snap.data?.runs],
	);

	const loginHref = buildLoginUrl(
		typeof window === "undefined"
			? "/dashboard/deployments"
			: `${window.location.pathname}${window.location.search}`,
	);
	const authMode = getRuntimeAuthMode();

	return {
		allowNoExpiry,
		authMode,
		defaultLifetimeHours,
		deployments,
		formatLifetimeCell,
		isFeedOpen,
		isManagedDeploymentType: isManagedDeploymentFamily,
		lifetimeHoursOptions,
		loginHref,
		runs,
		searchQuery,
		userScopes,
		selectedUserScope,
		selectedUserScopeId,
		setIsFeedOpen,
		setSearchQuery,
		setStatusFilter,
		setTypeFilter,
		snap,
		statusFilter,
		typeFilter,
	};
}
