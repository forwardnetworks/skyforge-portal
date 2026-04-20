import { useMemo } from "react";
import type {
	AdminAuditSectionProps,
	AdminConfigSectionProps,
	AdminTasksSectionProps,
} from "../components/settings-section-types";
import type { SkyforgeUserScope } from "../lib/api-client";
import { useAdminSettingsAudit } from "./use-admin-settings-audit";
import { useAdminSettingsAuth } from "./use-admin-settings-auth";
import { useAdminSettingsOperations } from "./use-admin-settings-operations";

export function buildRuntimeSummary(data: {
	total?: number;
	active?: number;
	inactive?: number;
	expired?: number;
	eligibleForCleanup?: number;
	eligibleForForceFinalize?: number;
	terminating?: number;
	resourceTotals?: {
		pods?: number;
		services?: number;
		jobs?: number;
		configMaps?: number;
		topologies?: number;
		virtualMachines?: number;
		virtualMachineInstances?: number;
	};
} | null | undefined) {
	return {
		total: data?.total ?? 0,
		active: data?.active ?? 0,
		inactive: data?.inactive ?? 0,
		expired: data?.expired ?? 0,
		eligibleForCleanup: data?.eligibleForCleanup ?? 0,
		eligibleForForceFinalize: data?.eligibleForForceFinalize ?? 0,
		terminating: data?.terminating ?? 0,
		resourceTotals: {
			pods: data?.resourceTotals?.pods ?? 0,
			services: data?.resourceTotals?.services ?? 0,
			jobs: data?.resourceTotals?.jobs ?? 0,
			configMaps: data?.resourceTotals?.configMaps ?? 0,
			topologies: data?.resourceTotals?.topologies ?? 0,
			virtualMachines: data?.resourceTotals?.virtualMachines ?? 0,
			virtualMachineInstances:
				data?.resourceTotals?.virtualMachineInstances ?? 0,
		},
	};
}

function useAdminSettingsConfigSection(args: {
	auth: ReturnType<typeof useAdminSettingsAuth>;
}): AdminConfigSectionProps {
	const { auth } = args;
	return useMemo(
		() => ({
			config: auth.cfgQ.data,
			configLoading: auth.cfgQ.isLoading,
		}),
		[auth.cfgQ.data, auth.cfgQ.isLoading],
	);
}

function useAdminSettingsAuditSection(args: {
	audit: ReturnType<typeof useAdminSettingsAudit>;
}): AdminAuditSectionProps {
	const { audit } = args;
	return useMemo(
		() => ({
			auditLimit: audit.auditLimit,
			onAuditLimitChange: audit.setAuditLimit,
			auditActor: audit.auditActor,
			onAuditActorChange: audit.setAuditActor,
			auditActorType: audit.auditActorType,
			onAuditActorTypeChange: audit.setAuditActorType,
			auditImpersonated: audit.auditImpersonated,
			onAuditImpersonatedChange: audit.setAuditImpersonated,
			auditEventType: audit.auditEventType,
			onAuditEventTypeChange: audit.setAuditEventType,
			auditCategory: audit.auditCategory,
			onAuditCategoryChange: audit.setAuditCategory,
			auditOutcome: audit.auditOutcome,
			onAuditOutcomeChange: audit.setAuditOutcome,
			auditSeverity: audit.auditSeverity,
			onAuditSeverityChange: audit.setAuditSeverity,
			auditTargetType: audit.auditTargetType,
			onAuditTargetTypeChange: audit.setAuditTargetType,
			auditTarget: audit.auditTarget,
			onAuditTargetChange: audit.setAuditTarget,
			auditAuthMethod: audit.auditAuthMethod,
			onAuditAuthMethodChange: audit.setAuditAuthMethod,
			auditSourceIP: audit.auditSourceIP,
			onAuditSourceIPChange: audit.setAuditSourceIP,
			auditQuery: audit.auditQuery,
			onAuditQueryChange: audit.setAuditQuery,
			auditSince: audit.auditSince,
			onAuditSinceChange: audit.setAuditSince,
			auditUntil: audit.auditUntil,
			onAuditUntilChange: audit.setAuditUntil,
			onAuditQuickRangeChange: audit.onAuditQuickRangeChange,
			onAuditClearFilters: audit.onAuditClearFilters,
			auditTimestamp: audit.auditQ.data?.timestamp,
			auditEvents: audit.auditQ.data?.events ?? [],
			auditColumns: audit.auditColumns,
			auditSummary: audit.auditQ.data?.summary,
			auditIntegrityStatus: audit.auditIntegrityQ.data?.status,
			auditIntegrityLoading: audit.auditIntegrityQ.isLoading,
			auditExportSignatures: audit.auditExportSignaturesQ.data?.signatures ?? [],
			auditExportSignaturesLoading: audit.auditExportSignaturesQ.isLoading,
			auditVerifyResult: audit.auditVerifyResult,
			auditVerifyPending: audit.auditVerifyPending,
			auditVerifyTargetID: audit.auditVerifyTargetID,
			auditVerifyError: audit.auditVerifyError,
			auditLoading: audit.auditQ.isLoading,
			selectedAuditEventID: audit.selectedAuditEventID,
			onSelectAuditEvent: audit.setSelectedAuditEventID,
			selectedAuditEvent: audit.selectedAuditEventQ.data?.event,
			selectedAuditEventLoading: audit.selectedAuditEventQ.isLoading,
			selectedAuditEventJSON: audit.selectedAuditEventJSON,
			auditSavedViewName: audit.auditSavedViewName,
			onAuditSavedViewNameChange: audit.setAuditSavedViewName,
			auditSavedViews: audit.savedAuditViews.map((view) => ({
				id: view.id,
				name: view.name,
			})),
			onAuditSaveView: audit.onAuditSaveView,
			onAuditLoadView: audit.onAuditLoadView,
			onAuditDeleteView: audit.onAuditDeleteView,
			onAuditExport: audit.onAuditExport,
			onAuditVerifySignature: audit.onAuditVerifySignature,
		}),
		[audit],
	);
}

function useAdminSettingsTasksSection(args: {
	allUserScopes: SkyforgeUserScope[];
	ops: ReturnType<typeof useAdminSettingsOperations>;
}): AdminTasksSectionProps {
	const { allUserScopes, ops } = args;
	return useMemo(
		() => ({
			reconcileQueuedPending: ops.reconcileQueued.isPending,
			reconcileRunningPending: ops.reconcileRunning.isPending,
			onReconcileQueued: () => ops.reconcileQueued.mutate(200),
			onReconcileRunning: () =>
				ops.reconcileRunning.mutate({
					limit: 50,
					hardMaxRuntimeMinutes: 12 * 60,
					maxIdleMinutes: 120,
				}),
			cleanupScopeMode: ops.cleanupScopeMode,
			onCleanupScopeModeChange: ops.setCleanupScopeMode,
			cleanupScopeID: ops.cleanupScopeID,
			onCleanupScopeIDChange: ops.setCleanupScopeID,
			cleanupNamespace: ops.cleanupNamespace,
			onCleanupNamespaceChange: ops.setCleanupNamespace,
			workspaceCleanupPrefixes: ops.workspaceCleanupPrefixes,
			onWorkspaceCleanupPrefixesChange: ops.setWorkspaceCleanupPrefixes,
			workspaceCleanupIncludeK8s: ops.workspaceCleanupIncludeK8s,
			onWorkspaceCleanupIncludeK8sChange: ops.setWorkspaceCleanupIncludeK8s,
			workspaceCleanupPending: ops.cleanupWorkspaces.isPending,
			onPreviewWorkspaceCleanup: () => ops.cleanupWorkspaces.mutate(true),
			onRunWorkspaceCleanup: () => ops.cleanupWorkspaces.mutate(false),
			workspaceCleanupResult: ops.workspaceCleanupResult,
			allUserScopes,
			cleanupTenantPodsPending: ops.cleanupTenantPods.isPending,
			onPreviewCleanup: () => ops.cleanupTenantPods.mutate(true),
			onRunCleanup: () => ops.cleanupTenantPods.mutate(false),
			cleanupResult: ops.cleanupResult,
			adminEphemeralRuntimesLoading: ops.adminEphemeralRuntimesQ.isLoading,
			adminEphemeralRuntimes: ops.adminEphemeralRuntimesQ.data?.items ?? [],
			adminEphemeralRuntimeSummary: buildRuntimeSummary(
				ops.adminEphemeralRuntimesQ.data,
			),
			cleanupEphemeralRuntimesPending:
				ops.cleanupEphemeralRuntimes.isPending,
			cleanupEphemeralRuntimesResult:
				ops.cleanupEphemeralRuntimesResult,
			forceFinalizeEphemeralRuntimesPending:
				ops.forceFinalizeEphemeralRuntimes.isPending,
			forceFinalizeEphemeralRuntimesResult:
				ops.forceFinalizeEphemeralRuntimesResult,
			onRefreshEphemeralRuntimes: () => {
				void ops.adminEphemeralRuntimesQ.refetch();
			},
			onCleanupEligibleEphemeralRuntimes: () =>
				ops.cleanupEphemeralRuntimes.mutate(undefined),
			onCleanupEphemeralRuntimeNamespace: (namespace) =>
				ops.cleanupEphemeralRuntimes.mutate([namespace]),
			onForceFinalizeEligibleEphemeralRuntimes: () =>
				ops.forceFinalizeEphemeralRuntimes.mutate(undefined),
			onForceFinalizeEphemeralRuntimeNamespace: (namespace) =>
				ops.forceFinalizeEphemeralRuntimes.mutate([namespace]),
		}),
		[allUserScopes, ops],
	);
}

export function useAdminSettingsMaintenanceSection(args: {
	auth: ReturnType<typeof useAdminSettingsAuth>;
	audit: ReturnType<typeof useAdminSettingsAudit>;
	allUserScopes: SkyforgeUserScope[];
	ops: ReturnType<typeof useAdminSettingsOperations>;
}) {
	const { auth, audit, allUserScopes, ops } = args;
	const config = useAdminSettingsConfigSection({ auth });
	const auditSection = useAdminSettingsAuditSection({ audit });
	const tasks = useAdminSettingsTasksSection({ allUserScopes, ops });

	return useMemo(
		() => ({
			config,
			audit: auditSection,
			tasks,
		}),
		[config, auditSection, tasks],
	);
}
