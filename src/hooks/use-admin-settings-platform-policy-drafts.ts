import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type AdminForwardTenantResetRunsResponse,
	type AdminPlatformUserPolicyResponse,
	getAdminForwardTenantRebuildRuns,
	getAdminPlatformUserPolicy,
	putAdminPlatformUserProfiles,
	putAdminPlatformUserQuota,
	requestAdminForwardTenantRebuild,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

interface Props {
	platformPolicyTargetUser: string;
}

export function useAdminSettingsPlatformPolicyDrafts({
	platformPolicyTargetUser,
}: Props) {
	const queryClient = useQueryClient();
	const [platformProfileDraft, setPlatformProfileDraft] = useState<string[]>(
		[],
	);
	const [platformQuotaDraft, setPlatformQuotaDraft] = useState({
		maxConcurrentLabs: "",
		maxPersistentLabs: "",
		maxPersistentHours: "",
		maxResourceClass: "standard",
	});
	const [adminForwardTenantResetMode, setAdminForwardTenantResetMode] =
		useState<"hard-reset" | "curated-reset">("curated-reset");
	const [adminForwardTenantResetConfirm, setAdminForwardTenantResetConfirm] =
		useState("");

	const platformPolicyQ = useQuery({
		queryKey: queryKeys.adminPlatformUserPolicy(platformPolicyTargetUser),
		queryFn: () => getAdminPlatformUserPolicy(platformPolicyTargetUser),
		enabled: platformPolicyTargetUser.trim().length > 0,
		staleTime: 15_000,
		retry: false,
	});
	const adminForwardTenantResetRunsQ =
		useQuery<AdminForwardTenantResetRunsResponse>({
			queryKey: queryKeys.adminForwardTenantRebuildRuns(
				platformPolicyTargetUser,
			),
			queryFn: () => getAdminForwardTenantRebuildRuns(platformPolicyTargetUser),
			enabled: platformPolicyTargetUser.trim().length > 0,
			staleTime: 10_000,
			retry: false,
		});

	useEffect(() => {
		if (!platformPolicyQ.data) return;
		syncPlatformPolicyDrafts(
			platformPolicyQ.data,
			setPlatformProfileDraft,
			setPlatformQuotaDraft,
		);
	}, [platformPolicyQ.data]);

	useEffect(() => {
		setAdminForwardTenantResetConfirm("");
	}, [platformPolicyTargetUser]);

	const savePlatformProfiles = useMutation({
		mutationFn: async () => {
			if (!platformPolicyTargetUser.trim()) {
				throw new Error("Target user is required");
			}
			return putAdminPlatformUserProfiles(platformPolicyTargetUser, {
				profiles: platformProfileDraft,
			});
		},
		onSuccess: async (policy) => {
			toast.success("Platform profiles updated");
			syncPlatformPolicyDrafts(
				policy,
				setPlatformProfileDraft,
				setPlatformQuotaDraft,
			);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformUserPolicy(platformPolicyTargetUser),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformOverview(),
			});
		},
		onError: (err) =>
			toast.error("Failed to update platform profiles", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});
	const savePlatformQuota = useMutation({
		mutationFn: async () => {
			if (!platformPolicyTargetUser.trim()) {
				throw new Error("Target user is required");
			}
			return putAdminPlatformUserQuota(platformPolicyTargetUser, {
				maxConcurrentLabs: parseNumericDraft(
					platformQuotaDraft.maxConcurrentLabs,
				),
				maxPersistentLabs: parseNumericDraft(
					platformQuotaDraft.maxPersistentLabs,
				),
				maxPersistentHours: parseNumericDraft(
					platformQuotaDraft.maxPersistentHours,
				),
				maxResourceClass: platformQuotaDraft.maxResourceClass,
			});
		},
		onSuccess: async (policy) => {
			toast.success("Platform quota updated");
			syncPlatformPolicyDrafts(
				policy,
				setPlatformProfileDraft,
				setPlatformQuotaDraft,
			);
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformUserPolicy(platformPolicyTargetUser),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformOverview(),
			});
		},
		onError: (err) =>
			toast.error("Failed to update platform quota", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});
	const requestAdminForwardTenantReset = useMutation({
		mutationFn: async () => {
			if (!platformPolicyTargetUser.trim()) {
				throw new Error("Target user is required");
			}
			return requestAdminForwardTenantRebuild(platformPolicyTargetUser, {
				tenantKind: "primary",
				mode: adminForwardTenantResetMode,
				reason: "",
				metadata: {},
			});
		},
		onSuccess: async () => {
			toast.success("Forward org reset queued");
			setAdminForwardTenantResetConfirm("");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminForwardTenantRebuildRuns(
					platformPolicyTargetUser,
				),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformOverview(),
			});
		},
		onError: (err) =>
			toast.error("Failed to queue Forward org reset", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const platformPolicyDerivedCapabilities = useMemo(() => {
		const hints = new Set<string>();
		for (const profile of platformProfileDraft) {
			for (const capability of profileCapabilityHints[profile] ?? []) {
				hints.add(capability);
			}
		}
		return Array.from(hints);
	}, [platformProfileDraft]);

	const platformQuotaValidationErrors = useMemo(() => {
		const pattern = /^\d+$/;
		return {
			maxConcurrentLabs:
				platformQuotaDraft.maxConcurrentLabs &&
				!pattern.test(platformQuotaDraft.maxConcurrentLabs)
					? "Use whole numbers only"
					: "",
			maxPersistentLabs:
				platformQuotaDraft.maxPersistentLabs &&
				!pattern.test(platformQuotaDraft.maxPersistentLabs)
					? "Use whole numbers only"
					: "",
			maxPersistentHours:
				platformQuotaDraft.maxPersistentHours &&
				!pattern.test(platformQuotaDraft.maxPersistentHours)
					? "Use whole numbers only"
					: "",
		};
	}, [platformQuotaDraft]);

	const platformQuotaHasErrors = useMemo(
		() =>
			Object.values(platformQuotaValidationErrors).some((value) =>
				Boolean(value),
			),
		[platformQuotaValidationErrors],
	);

	return {
		platformPolicyQ,
		platformProfileDraft,
		setPlatformProfileDraft,
		platformQuotaDraft,
		setPlatformQuotaDraft,
		savePlatformProfiles,
		savePlatformQuota,
		platformPolicyDerivedCapabilities,
		platformQuotaValidationErrors,
		platformQuotaHasErrors,
		platformPolicyOperatingModes: platformPolicyQ.data?.operatingModes ?? [],
		platformPolicyPrimaryOperatingMode:
			platformPolicyQ.data?.primaryOperatingMode ?? "",
		adminForwardTenantResetRunsQ,
		adminForwardTenantResetMode,
		setAdminForwardTenantResetMode,
		adminForwardTenantResetConfirm,
		setAdminForwardTenantResetConfirm,
		requestAdminForwardTenantReset,
	};
}

function parseNumericDraft(value: string): number {
	const parsed = Number.parseInt(String(value ?? "").trim(), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function syncPlatformPolicyDrafts(
	policy: AdminPlatformUserPolicyResponse,
	setProfiles: (next: string[]) => void,
	setQuota: (next: {
		maxConcurrentLabs: string;
		maxPersistentLabs: string;
		maxPersistentHours: string;
		maxResourceClass: string;
	}) => void,
) {
	setProfiles(policy.profiles ?? []);
	setQuota({
		maxConcurrentLabs: String(policy.quota.maxConcurrentLabs ?? 0),
		maxPersistentLabs: String(policy.quota.maxPersistentLabs ?? 0),
		maxPersistentHours: String(policy.quota.maxPersistentHours ?? 0),
		maxResourceClass: String(policy.quota.maxResourceClass ?? "small"),
	});
}

const profileCapabilityHints: Record<string, string[]> = {
	viewer: ["view_overview", "list_deployments"],
	"demo-user": ["view_curated_catalog"],
	"lab-user": [
		"view_curated_catalog",
		"launch_curated_templates",
		"reserve_future_capacity",
	],
	"sandbox-user": ["create_custom_templates", "reserve_resources"],
	trainer: ["persist_labs", "run_training_templates"],
	"integration-user": ["manage_integrations", "consume_external_data"],
	admin: [
		"manage_users",
		"manage_platform_operations",
		"reset_curated_forward_tenant",
	],
};
