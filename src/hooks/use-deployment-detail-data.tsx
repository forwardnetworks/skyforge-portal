import {
	type DeploymentInfoResponse,
	type DeploymentManagementAccessResponse,
	type DeploymentMap,
	type DeploymentResourceEstimateResponse,
	type DeploymentSourceShare,
	type SharedDeploymentSource,
	type UserForwardCollectorConfigSummary,
	getDeploymentInfoById,
	getDeploymentManagementAccess,
	getDeploymentMap,
	getDeploymentResourceEstimate,
	getDeploymentTopology,
	listAssignableUsers,
	listDeploymentSourceShares,
	listSharedDeploymentSources,
	listUserForwardCollectorConfigs,
} from "@/lib/api-client";
import { listUserScopeRuns } from "@/lib/api-client-composite-plans";
import { queryKeys } from "@/lib/query-keys";
import { type RunLogState, useRunEvents } from "@/lib/run-events";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	resolveDeploymentDisplayStatus,
	resolveDeploymentPrimaryAction,
	resourceEstimateReasonFromError,
} from "./deployment-detail-utils";

export type DeploymentDetailTab = "topology" | "logs" | "config" | "access";

export function useDeploymentDetailData(args: {
	deploymentId: string;
	tab?: string;
}) {
	const { deploymentId, tab } = args;
	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [forwardEnabled, setForwardEnabled] = useState(false);
	const [forwardCollector, setForwardCollector] = useState("");
	const [forwardTopologySourceUserId, setForwardTopologySourceUserId] =
		useState("");
	const [
		forwardTopologySourceDeploymentId,
		setForwardTopologySourceDeploymentId,
	] = useState("");
	const [forwardAutoSyncOnBringUp, setForwardAutoSyncOnBringUp] =
		useState(false);
	const normalizedTab: DeploymentDetailTab =
		tab === "logs" || tab === "config" || tab === "topology" || tab === "access"
			? tab
			: "topology";
	const [activeTab, setActiveTab] =
		useState<DeploymentDetailTab>(normalizedTab);

	const deploymentInfoQ = useQuery<DeploymentInfoResponse>({
		queryKey: queryKeys.deploymentDetail(deploymentId),
		queryFn: async () => getDeploymentInfoById(deploymentId),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
	});

	const deployment = deploymentInfoQ.data?.deployment;

	const userId = String(deployment?.userId ?? "");
	const deploymentType = String(deployment?.family ?? "");
	const deploymentEngine = String(deployment?.engine ?? "")
		.trim()
		.toLowerCase();
	const isKNEDeployment = deploymentType === "kne";

	useEffect(() => {
		const enabled = Boolean((deployment?.config ?? {})["forwardEnabled"]);
		const collector = String(
			(deployment?.config ?? {})["forwardCollectorId"] ?? "",
		).trim();
		const topologySourceUserId = String(
			(deployment?.config ?? {})["forwardTopologySourceUserId"] ?? "",
		).trim();
		const topologySourceDeploymentId = String(
			(deployment?.config ?? {})["forwardTopologySourceDeploymentId"] ?? "",
		).trim();
		const autoSync =
			Boolean(deployment?.autoSyncOnBringUp) ||
			Boolean((deployment?.config ?? {})["forwardAutoSyncOnBringUp"]);
		setForwardEnabled(enabled);
		setForwardCollector(collector);
		setForwardTopologySourceUserId(topologySourceUserId);
		setForwardTopologySourceDeploymentId(topologySourceDeploymentId);
		setForwardAutoSyncOnBringUp(autoSync);
	}, [deployment?.id, deployment?.config, deployment?.autoSyncOnBringUp]);

	useEffect(() => {
		setActiveTab(normalizedTab);
	}, [normalizedTab, deploymentId]);

	const activeRunId = String(deployment?.activeTaskId ?? "");
	useRunEvents(activeRunId, Boolean(activeRunId));
	const activeLogs = useQuery({
		queryKey: queryKeys.runLogs(activeRunId),
		queryFn: async () => ({ cursor: 0, entries: [] }) as RunLogState,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
		enabled: Boolean(activeRunId),
	});

	const status = deployment
		? resolveDeploymentDisplayStatus(deployment)
		: "unknown";
	const primaryAction = deployment
		? resolveDeploymentPrimaryAction(deployment)
		: "none";

	const runsForDeploymentQ = useQuery({
		queryKey: queryKeys.userScopeRuns(userId, 50),
		queryFn: async () => listUserScopeRuns(userId, { limit: 50 }),
		enabled: Boolean(userId),
		retry: false,
		staleTime: 30_000,
	});

	const runsForDeployment = useMemo(() => {
		if (!deployment) return [];
		const all = (runsForDeploymentQ.data?.tasks ?? []) as Record<
			string,
			unknown
		>[];
		const depRuns = all.filter(
			(r) => String(r.deploymentId ?? "") === deployment.id,
		);
		return depRuns.length > 0 ? depRuns : all;
	}, [deployment, runsForDeploymentQ.data?.tasks]);

	const topology = useQuery({
		queryKey: queryKeys.deploymentTopology(userId, deploymentId),
		queryFn: async () => {
			if (!userId || !deployment) throw new Error("deployment not found");
			return getDeploymentTopology(userId, deployment.id);
		},
		enabled:
			Boolean(userId && deployment) && ["kne", "byos"].includes(deploymentType),
		retry: false,
		staleTime: 10_000,
	});

	const deploymentMap = useQuery<DeploymentMap>({
		queryKey: queryKeys.deploymentMap(userId, deploymentId),
		queryFn: async () => {
			if (!userId || !deployment) throw new Error("deployment not found");
			return getDeploymentMap(userId, deployment.id);
		},
		enabled: Boolean(userId && deployment),
		retry: false,
		staleTime: 10_000,
	});
	const deploymentManagementAccessQ =
		useQuery<DeploymentManagementAccessResponse>({
			queryKey: queryKeys.deploymentManagementAccess(userId, deploymentId),
			queryFn: async () => {
				if (!userId || !deployment) throw new Error("deployment not found");
				return getDeploymentManagementAccess(userId, deployment.id);
			},
			enabled: Boolean(userId && deployment && isKNEDeployment),
			retry: false,
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		});
	const forwardNetworkID = String(
		deploymentInfoQ.data?.forwardNetworkId ?? "",
	).trim();
	const forwardSnapshotURL = String(
		deploymentInfoQ.data?.forwardSnapshotUrl ?? "",
	).trim();

	const resourceEstimateQ = useQuery<DeploymentResourceEstimateResponse>({
		queryKey: ["deployment-resource-estimate", userId, deploymentId],
		queryFn: async () => {
			if (!userId || !deployment) throw new Error("deployment not found");
			try {
				return await getDeploymentResourceEstimate(userId, deployment.id);
			} catch (err) {
				return {
					userId,
					deploymentId: deployment.id,
					family: String(deployment.family ?? ""),
					engine: String(deployment.engine ?? ""),
					estimate: {
						supported: false,
						reason: resourceEstimateReasonFromError(err),
						vcpu: 0,
						ramGiB: 0,
						milliCpu: 0,
						memoryBytes: 0,
						storageGiB: 0,
						storageBytes: 0,
						nodeCount: 0,
						profiledNodeCount: 0,
					},
				};
			}
		},
		enabled: Boolean(userId && deployment),
		retry: false,
		staleTime: 30_000,
		refetchOnWindowFocus: false,
		placeholderData: (prev) => prev,
	});
	const resourceEstimate = (
		resourceEstimateQ.data as DeploymentResourceEstimateResponse | undefined
	)?.estimate;
	const resourceEstimatePending =
		resourceEstimateQ.isPending &&
		!resourceEstimate &&
		!resourceEstimateQ.error;

	const forwardCollectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		enabled: forwardEnabled,
		retry: false,
		staleTime: 30_000,
	});
	const forwardCollectors = (forwardCollectorsQ.data?.collectors ??
		[]) as UserForwardCollectorConfigSummary[];
	const deploymentSourceSharesQ = useQuery({
		queryKey: queryKeys.deploymentSourceShares(userId, deploymentId),
		queryFn: async () => {
			if (!userId || !deployment) throw new Error("deployment not found");
			return listDeploymentSourceShares(userId, deployment.id);
		},
		enabled: Boolean(userId && deployment),
		retry: false,
		staleTime: 30_000,
	});
	const deploymentSourceShares = (deploymentSourceSharesQ.data?.shares ??
		[]) as DeploymentSourceShare[];
	const sharedDeploymentSourcesQ = useQuery({
		queryKey: queryKeys.sharedDeploymentSources(),
		queryFn: listSharedDeploymentSources,
		enabled: Boolean(deployment),
		retry: false,
		staleTime: 30_000,
	});
	const sharedDeploymentSources = (sharedDeploymentSourcesQ.data?.sources ??
		[]) as SharedDeploymentSource[];
	const assignableUsersQ = useQuery({
		queryKey: queryKeys.assignableUsers(),
		queryFn: listAssignableUsers,
		enabled: Boolean(deployment),
		retry: false,
		staleTime: 30_000,
	});

	return {
		activeLogs,
		activeTab,
		deployment,
		deploymentEngine,
		deploymentInfoQ,
		deploymentManagementAccessQ,
		deploymentMap,
		deploymentId,
		deploymentType,
		destroyDialogOpen,
		forwardAutoSyncOnBringUp,
		forwardCollector,
		forwardCollectors,
		forwardCollectorsQ,
		forwardEnabled,
		forwardTopologySourceDeploymentId,
		forwardTopologySourceUserId,
		forwardNetworkID,
		forwardSnapshotURL,
		isKNEDeployment,
		primaryAction,
		resourceEstimate,
		resourceEstimatePending,
		runsForDeployment,
		setActiveTab,
		setDestroyDialogOpen,
		setForwardAutoSyncOnBringUp,
		setForwardCollector,
		setForwardEnabled,
		setForwardTopologySourceDeploymentId,
		setForwardTopologySourceUserId,
		assignableUsersQ,
		deploymentSourceShares,
		deploymentSourceSharesQ,
		sharedDeploymentSources,
		sharedDeploymentSourcesQ,
		status,
		topology,
		userId,
	};
}
