import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { UseFormSetValue } from "react-hook-form";
import type { z } from "zod";
import {
	type AwsSsoStatusResponse,
	type AwsSsoStartResponse,
	type DashboardSnapshot,
	type DeploymentLifetimePolicyResponse,
	type SkyforgeUserScope,
	getAwsTerraformReadiness,
	getAwsSsoStatus,
	getDashboardSummary,
	getDeploymentLifetimePolicy,
	getSession,
	getUserAWSSSOCredentials,
	getUserSettings,
	listUserScopes,
	pollAwsSso,
	startAwsSso,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	type DeploymentKind,
	deploymentKindToSpec,
	deploymentModeFromKind,
	fallbackAllowedHours,
	fallbackManagedFamilies,
	type formSchema,
	parsePositiveInt,
} from "./create-deployment-shared";

export function useCreateDeploymentSettings(args: {
	queryClient: { getQueryData: <T>(key: readonly unknown[]) => T | undefined };
	setValue: UseFormSetValue<z.infer<typeof formSchema>>;
	userId?: string;
	watchDeploymentMode?: string;
	watchKind: DeploymentKind;
	watchLabLifetime?: string;
	watchTemplate?: string;
	watchUserScopeId?: string;
}) {
	const {
		queryClient,
		setValue,
		userId,
		watchDeploymentMode,
		watchKind,
		watchLabLifetime,
		watchTemplate,
		watchUserScopeId,
	} = args;
	const queryClientLive = useQueryClient();
	const scopeId = watchUserScopeId ?? "";

	const dash = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSummary(),
		queryFn: getDashboardSummary,
		initialData: () =>
			queryClient.getQueryData<DashboardSnapshot>(
				queryKeys.dashboardSummary(),
			) ??
			queryClient.getQueryData<DashboardSnapshot>(
				queryKeys.dashboardSnapshot(),
			) ?? null,
		retry: false,
		staleTime: 60_000,
		refetchInterval: 60_000,
	});
	const userSettingsQ = useQuery({
		queryKey: queryKeys.userSettings(),
		queryFn: getUserSettings,
		staleTime: 30_000,
		retry: false,
	});
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery<DeploymentLifetimePolicyResponse>({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		staleTime: 30_000,
		retry: false,
	});
	const awsSsoStatusQ = useQuery<AwsSsoStatusResponse>({
		queryKey: queryKeys.awsSsoStatus(),
		queryFn: getAwsSsoStatus,
		staleTime: 30_000,
		retry: false,
	});
	const awsTerraformReadinessQ = useQuery({
		queryKey: queryKeys.awsTerraformReadiness(),
		queryFn: getAwsTerraformReadiness,
		staleTime: 30_000,
		retry: false,
	});
	const userAwsSsoQ = useQuery({
		queryKey: queryKeys.userAwsSsoCredentials(),
		queryFn: getUserAWSSSOCredentials,
		staleTime: 30_000,
		retry: false,
	});
	const [awsSsoSession, setAwsSsoSession] = useState<AwsSsoStartResponse | null>(
		null,
	);
	const [awsSsoPollStatus, setAwsSsoPollStatus] = useState<string>("");

	const startAwsSsoM = useMutation({
		mutationFn: startAwsSso,
		onSuccess: (resp) => {
			setAwsSsoSession(resp);
			setAwsSsoPollStatus("pending");
			window.open(
				resp.verificationUriComplete,
				"_blank",
				"noopener,noreferrer",
			);
		},
		onError: (err: unknown) =>
			toast.error("Failed to start AWS SSO", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const allUserScopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();
	const userScopes = useMemo(() => {
		if (!effectiveUsername) return allUserScopes;
		const mine = allUserScopes.filter((w) => {
			if (String(w.createdBy ?? "").trim() === effectiveUsername) return true;
			if ((w.owners ?? []).includes(effectiveUsername)) return true;
			if (String(w.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return mine.length > 0 ? mine : allUserScopes;
	}, [allUserScopes, effectiveUsername]);
	const templatesUpdatedAt = dash.data?.templatesIndexUpdatedAt ?? "";
	const watchSpec = useMemo(() => deploymentKindToSpec(watchKind), [watchKind]);
	const managedFamilies = useMemo(
		() =>
			new Set(
				(lifetimePolicyQ.data?.managedFamilies ?? fallbackManagedFamilies).map(
					(v) => String(v).trim().toLowerCase(),
				),
			),
		[lifetimePolicyQ.data?.managedFamilies],
	);
	const lifetimeAllowedHours = useMemo(() => {
		const raw = lifetimePolicyQ.data?.allowedHours ?? fallbackAllowedHours;
		const parsed = raw
			.map((h) => Number.parseInt(String(h), 10))
			.filter((h) => Number.isFinite(h) && h > 0);
		return parsed.length > 0 ? parsed : fallbackAllowedHours;
	}, [lifetimePolicyQ.data?.allowedHours]);
	const lifetimeDefaultHours = parsePositiveInt(
		lifetimePolicyQ.data?.defaultHours,
		24,
	);
	const lifetimeManaged = managedFamilies.has(
		String(watchSpec.family ?? "")
			.trim()
			.toLowerCase(),
	);
	const allowDisable = Boolean(lifetimePolicyQ.data?.allowDisable ?? false);
	const lifetimeCanEdit = lifetimeManaged;
	const expiryAction = String(
		lifetimePolicyQ.data?.expiryActions?.[watchSpec.family] ?? "stop",
	)
		.trim()
		.toLowerCase();
	const lifetimeOptions = useMemo(() => {
		if (!lifetimeManaged) return [] as Array<{ value: string; label: string }>;
		const options = lifetimeAllowedHours.map((h) => ({
			value: String(h),
			label: `${h} hours`,
		}));
		if (allowDisable) {
			options.unshift({ value: "never", label: "Never auto-stop" });
		}
		return options;
	}, [allowDisable, lifetimeAllowedHours, lifetimeManaged]);
	const driverSummary =
		watchSpec.family === "kne"
			? "In-cluster (kne)"
			: watchSpec.family === "byos"
				? "BYOS (external server)"
				: "Terraform managed";

	const lastUserScopeKey = "skyforge.lastUserScopeId.deployments";
	useEffect(() => {
		if (scopeId || userScopes.length === 0) return;
		const urlWs = String(userId ?? "").trim();
		if (urlWs && userScopes.some((w) => w.id === urlWs)) {
			setValue("userId", urlWs);
			return;
		}
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(lastUserScopeKey) ?? "")
				: "";
		if (stored && userScopes.some((w) => w.id === stored)) {
			setValue("userId", stored);
			return;
		}
		setValue("userId", userScopes[0].id);
	}, [scopeId, setValue, userId, userScopes]);

	useEffect(() => {
		if (!scopeId || typeof window === "undefined") return;
		try {
			window.localStorage.setItem(lastUserScopeKey, scopeId);
		} catch {
			// ignore
		}
	}, [scopeId]);

	useEffect(() => {
		const derivedMode = deploymentModeFromKind(watchKind);
		if (watchDeploymentMode !== derivedMode) {
			setValue("deploymentMode", derivedMode, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: false,
			});
		}
	}, [setValue, watchDeploymentMode, watchKind]);

	useEffect(() => {
		if (!lifetimeManaged) {
			if (watchLabLifetime !== "not_managed") {
				setValue("labLifetime", "not_managed", {
					shouldDirty: false,
					shouldTouch: false,
					shouldValidate: false,
				});
			}
			return;
		}
		const defaultSelection = allowDisable
			? "never"
			: String(lifetimeDefaultHours);
		const isValidSelection = lifetimeOptions.some(
			(o) => o.value === watchLabLifetime,
		);
		if (!isValidSelection) {
			setValue("labLifetime", defaultSelection, {
				shouldDirty: false,
				shouldTouch: false,
				shouldValidate: false,
			});
		}
	}, [
		allowDisable,
		lifetimeDefaultHours,
		lifetimeManaged,
		lifetimeOptions,
		setValue,
		watchLabLifetime,
	]);

	useEffect(() => {
		const base = (watchTemplate || watchKind).split("/").pop() || watchKind;
		const ts = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\..+/, "")
			.slice(0, 15);
		setValue("name", `${base}-${ts}`);
	}, [setValue, watchKind, watchTemplate]);

	useEffect(() => {
		if (!awsSsoSession?.requestId) return;

		let cancelled = false;
		let timeout: ReturnType<typeof setTimeout> | null = null;

		const pollOnce = async () => {
			try {
				const resp = await pollAwsSso({ requestId: awsSsoSession.requestId });
				if (cancelled) return;

				setAwsSsoPollStatus(resp.status);
				if (resp.status === "ok") {
					setAwsSsoSession(null);
					await queryClientLive.invalidateQueries({
						queryKey: queryKeys.awsSsoStatus(),
					});
					await queryClientLive.invalidateQueries({
						queryKey: queryKeys.awsTerraformReadiness(),
					});
					toast.success("AWS SSO connected");
					return;
				}
				if (resp.status === "pending") {
					timeout = setTimeout(
						pollOnce,
						Math.max(1, awsSsoSession.intervalSeconds) * 1000,
					);
					return;
				}

				setAwsSsoSession(null);
				toast.error("AWS SSO authorization did not complete", {
					description: resp.status,
				});
			} catch (err) {
				if (cancelled) return;
				setAwsSsoSession(null);
				toast.error("AWS SSO polling failed", {
					description: err instanceof Error ? err.message : String(err),
				});
			}
		};

		timeout = setTimeout(
			pollOnce,
			Math.max(1, awsSsoSession.intervalSeconds) * 1000,
		);

		return () => {
			cancelled = true;
			if (timeout) clearTimeout(timeout);
		};
	}, [awsSsoSession, queryClientLive]);

	return {
		dash,
		awsSsoStatusQ,
		awsTerraformReadinessQ,
		userAwsSsoQ,
		awsSsoSession,
		awsSsoPollStatus,
		startAwsSsoM,
		driverSummary,
		effectiveUsername,
		expiryAction,
		allowNoExpiry: allowDisable,
		lifetimeAllowedHours,
		lifetimeCanEdit,
		lifetimeDefaultHours,
		lifetimeManaged,
		lifetimeOptions,
		managedFamilies,
		sessionQ,
		templatesUpdatedAt,
		userScopes,
		userSettingsQ,
		watchSpec,
	};
}
