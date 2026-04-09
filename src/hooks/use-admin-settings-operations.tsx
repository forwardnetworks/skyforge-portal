import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
	import {
		type AdminEphemeralRuntimeCleanupResponse,
		type AdminEphemeralRuntimeFinalizeResponse,
		type AdminTenantPodCleanupResponse,
		adminCleanupEphemeralRuntimes,
		adminCleanupTenantPods,
		adminForceFinalizeEphemeralRuntimes,
		adminImpersonateStart,
	adminImpersonateStop,
	adminListEphemeralRuntimes,
	getAdminForwardSupportCredential,
	getAdminImpersonateStatus,
	reconcileAdminForwardCustomerBannerAllUsers,
	reconcileQueuedTasks,
	reconcileRunningTasks,
	revealAdminForwardSupportCredentialPassword,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useAdminSettingsOperations({
	knownUsersFromScopes,
}: {
	knownUsersFromScopes: string[];
}) {
	const impersonateStatusQ = useQuery({
		queryKey: queryKeys.adminImpersonateStatus(),
		queryFn: getAdminImpersonateStatus,
		staleTime: 5_000,
		retry: false,
	});
	const adminForwardSupportCredentialQ = useQuery({
		queryKey: queryKeys.adminForwardSupportCredential(),
		queryFn: getAdminForwardSupportCredential,
		staleTime: 30_000,
		retry: false,
	});
	const [adminForwardSupportPassword, setAdminForwardSupportPassword] =
		useState("");
	const revealAdminForwardSupportCredentialMutation = useMutation({
		mutationFn: revealAdminForwardSupportCredentialPassword,
		onSuccess: (resp) => {
			const password = String(resp.password ?? "").trim();
			if (!password) {
				toast.error("Support credential password unavailable");
				return;
			}
			setAdminForwardSupportPassword(password);
			toast.success("Support credential password revealed");
		},
		onError: (e) => {
			toast.error("Failed to reveal support credential password", {
				description: (e as Error).message,
			});
		},
	});
	const reconcileAdminForwardCustomerBannerMutation = useMutation({
		mutationFn: reconcileAdminForwardCustomerBannerAllUsers,
		onSuccess: (resp) => {
			toast.success("Customer banners reconciled", {
				description: `users ok ${resp.succeededUsers}, failed ${resp.failedUsers}, networks ${resp.networkCount}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to reconcile customer banners", {
				description: (e as Error).message,
			});
		},
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

	const adminEphemeralRuntimesQ = useQuery({
		queryKey: queryKeys.adminEphemeralRuntimes(),
		queryFn: adminListEphemeralRuntimes,
		staleTime: 10_000,
		retry: false,
	});
	const [cleanupEphemeralRuntimesResult, setCleanupEphemeralRuntimesResult] =
		useState<AdminEphemeralRuntimeCleanupResponse | null>(null);
	const [
		forceFinalizeEphemeralRuntimesResult,
		setForceFinalizeEphemeralRuntimesResult,
	] = useState<AdminEphemeralRuntimeFinalizeResponse | null>(null);
	const cleanupEphemeralRuntimes = useMutation({
		mutationFn: async (namespaces?: string[]) =>
			adminCleanupEphemeralRuntimes({
				namespaces:
					namespaces && namespaces.length > 0 ? namespaces : undefined,
			}),
		onSuccess: (res, namespaces) => {
			setCleanupEphemeralRuntimesResult(res);
			toast.success("Ephemeral runtime cleanup complete", {
				description: `Selected ${res.namespacesSelected}, cleaned ${res.namespacesCleaned}, skipped active ${res.skippedActive}`,
			});
			void adminEphemeralRuntimesQ.refetch();
			if (
				res.status !== "ok" &&
				res.errors &&
				res.errors.length > 0 &&
				(!namespaces || namespaces.length <= 1)
			) {
				toast.error("Some runtime cleanup actions failed", {
					description: res.errors[0],
				});
			}
		},
		onError: (e) => {
			toast.error("Failed to clean ephemeral runtimes", {
				description: (e as Error).message,
			});
		},
	});
	const forceFinalizeEphemeralRuntimes = useMutation({
		mutationFn: async (namespaces?: string[]) =>
			adminForceFinalizeEphemeralRuntimes({
				namespaces:
					namespaces && namespaces.length > 0 ? namespaces : undefined,
			}),
		onSuccess: (res, namespaces) => {
			setForceFinalizeEphemeralRuntimesResult(res);
			toast.success("Ephemeral runtime finalization complete", {
				description: `Selected ${res.namespacesSelected}, finalized ${res.namespacesFinalized}, skipped ineligible ${res.skippedIneligible}`,
			});
			void adminEphemeralRuntimesQ.refetch();
			if (
				res.status !== "ok" &&
				res.errors &&
				res.errors.length > 0 &&
				(!namespaces || namespaces.length <= 1)
			) {
				toast.error("Some runtime finalization actions failed", {
					description: res.errors[0],
				});
			}
		},
		onError: (e) => {
			toast.error("Failed to finalize ephemeral runtimes", {
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
		adminForwardSupportCredentialQ,
		adminForwardSupportPassword,
		setAdminForwardSupportPassword,
		revealAdminForwardSupportCredentialMutation,
		reconcileAdminForwardCustomerBannerMutation,
		reconcileQueued,
		reconcileRunning,
			adminEphemeralRuntimesQ,
			cleanupEphemeralRuntimesResult,
			cleanupEphemeralRuntimes,
			forceFinalizeEphemeralRuntimesResult,
			forceFinalizeEphemeralRuntimes,
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
