import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type AdminTenantPodCleanupResponse,
	adminCleanupTenantPods,
	adminImpersonateStart,
	adminImpersonateStop,
	getAdminImpersonateStatus,
	reconcileQueuedTasks,
	reconcileRunningTasks,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useAdminSettingsOperations({
	isAdmin,
	knownUsersFromScopes,
}: {
	isAdmin: boolean;
	knownUsersFromScopes: string[];
}) {
	const impersonateStatusQ = useQuery({
		queryKey: queryKeys.adminImpersonateStatus(),
		queryFn: getAdminImpersonateStatus,
		enabled: isAdmin,
		staleTime: 5_000,
		retry: false,
	});

	const reconcileQueued = useMutation({
		mutationFn: async (limit: number) => reconcileQueuedTasks({ limit }),
		onSuccess: (res) => {
			toast.success("Reconciled queued tasks", {
				description: `Considered ${res.consideredTasks}, republished ${res.republished}, errors ${res.publishErrors}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to reconcile queued tasks", {
				description: (e as Error).message,
			});
		},
	});

	const reconcileRunning = useMutation({
		mutationFn: async (body: {
			limit: number;
			hardMaxRuntimeMinutes: number;
			maxIdleMinutes: number;
		}) =>
			reconcileRunningTasks({
				limit: body.limit,
				hardMaxRuntimeMinutes: body.hardMaxRuntimeMinutes,
				maxIdleMinutes: body.maxIdleMinutes,
			}),
		onSuccess: (res) => {
			toast.success("Reconciled running tasks", {
				description: `Considered ${res.consideredTasks}, marked failed ${res.markedFailed}, errors ${res.finishErrors}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to reconcile running tasks", {
				description: (e as Error).message,
			});
		},
	});

	const [cleanupScopeMode, setCleanupScopeMode] = useState<"all" | "scope">(
		"all",
	);
	const [cleanupScopeID, setCleanupScopeID] = useState("");
	const [cleanupNamespace, setCleanupNamespace] = useState("");
	const [cleanupResult, setCleanupResult] =
		useState<AdminTenantPodCleanupResponse | null>(null);
	const cleanupTenantPods = useMutation({
		mutationFn: async (dryRun: boolean) =>
			adminCleanupTenantPods({
				dryRun,
				userScopeId:
					cleanupScopeMode === "scope" ? cleanupScopeID.trim() : undefined,
				namespace: cleanupNamespace.trim() || undefined,
			}),
		onSuccess: (res, dryRun) => {
			setCleanupResult(res);
			toast.success(
				dryRun ? "Pod cleanup preview complete" : "Pod cleanup complete",
				{
					description: `Namespaces ${res.namespacesConsidered}, owners ${res.topologyOwnersFound}, deleted topologies ${res.topologiesDeleted}`,
				},
			);
		},
		onError: (e) => {
			toast.error("Failed to clean scoped pods", {
				description: (e as Error).message,
			});
		},
	});

	const [impersonateTarget, setImpersonateTarget] = useState("");
	const impersonateUserOptions = useMemo(() => {
		const users = new Set(knownUsersFromScopes);
		const current = String(
			impersonateStatusQ.data?.effectiveUsername ?? "",
		).trim();
		if (current) users.delete(current);
		return Array.from(users).sort((a, b) => a.localeCompare(b));
	}, [knownUsersFromScopes, impersonateStatusQ.data?.effectiveUsername]);

	const impersonateStart = useMutation({
		mutationFn: async () =>
			adminImpersonateStart({ username: impersonateTarget }),
		onSuccess: () => {
			toast.success("Impersonation started");
			void impersonateStatusQ.refetch();
			window.location.reload();
		},
		onError: (e) => {
			toast.error("Failed to impersonate", {
				description: (e as Error).message,
			});
		},
	});

	const impersonateStop = useMutation({
		mutationFn: async () => adminImpersonateStop(),
		onSuccess: () => {
			toast.success("Impersonation stopped");
			void impersonateStatusQ.refetch();
			window.location.reload();
		},
		onError: (e) => {
			toast.error("Failed to stop impersonation", {
				description: (e as Error).message,
			});
		},
	});

	return {
		impersonateStatusQ,
		reconcileQueued,
		reconcileRunning,
		cleanupScopeMode,
		setCleanupScopeMode,
		cleanupScopeID,
		setCleanupScopeID,
		cleanupNamespace,
		setCleanupNamespace,
		cleanupResult,
		cleanupTenantPods,
		impersonateTarget,
		setImpersonateTarget,
		impersonateUserOptions,
		impersonateStart,
		impersonateStop,
	};
}
