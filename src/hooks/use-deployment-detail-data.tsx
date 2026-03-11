import {
	type DashboardSnapshot,
	type DeploymentResourceEstimateResponse,
	type UserForwardCollectorConfigSummary,
	type UserScopeDeployment,
	getDeploymentResourceEstimate,
	getDeploymentTopology,
	listUserForwardCollectorConfigs,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { type RunLogState, useRunEvents } from "@/lib/run-events";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
	resolveDeploymentDisplayStatus,
	resolveDeploymentPrimaryAction,
	resourceEstimateReasonFromError,
} from "./deployment-detail-utils";

export function useDeploymentDetailData(args: {
	deploymentId: string;
	tab?: string;
}) {
	const { deploymentId, tab } = args;
	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [forwardEnabled, setForwardEnabled] = useState(false);
	const [forwardCollector, setForwardCollector] = useState("");
	const [forwardAutoSyncOnBringUp, setForwardAutoSyncOnBringUp] =
		useState(false);
	const normalizedTab =
		tab === "logs" || tab === "config" || tab === "topology" ? tab : "topology";
	const [activeTab, setActiveTab] = useState<"topology" | "logs" | "config">(
		normalizedTab,
	);

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: async () => null,
		initialData: null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const deployment = useMemo(
		() =>
			(snap.data?.deployments ?? []).find(
				(d: UserScopeDeployment) => d.id === deploymentId,
			),
		[snap.data?.deployments, deploymentId],
	);

	const userId = String(deployment?.userId ?? "");
	const deploymentType = String(deployment?.family ?? "");
	const deploymentEngine = String(deployment?.engine ?? "")
		.trim()
		.toLowerCase();
	const isC9SDeployment = deploymentType === "c9s";

	useEffect(() => {
		const enabled = Boolean((deployment?.config ?? {})["forwardEnabled"]);
		const collector = String(
			(deployment?.config ?? {})["forwardCollectorId"] ?? "",
		).trim();
		const autoSync =
			Boolean(deployment?.autoSyncOnBringUp) ||
			Boolean((deployment?.config ?? {})["forwardAutoSyncOnBringUp"]);
		setForwardEnabled(enabled);
		setForwardCollector(collector);
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
	const forwardNetworkID = String(
		(deployment?.config ?? {})["forwardNetworkId"] ?? "",
	).trim();

	const runsForDeployment = useMemo(() => {
		if (!deployment) return [];
		const all = (snap.data?.runs ?? []) as Record<string, unknown>[];
		const filtered = all.filter(
			(r) => String(r.userId ?? "") === deployment.userId,
		);
		const depRuns = filtered.filter(
			(r) => String(r.deploymentId ?? "") === deployment.id,
		);
		return depRuns.length > 0 ? depRuns : filtered;
	}, [deployment, snap.data?.runs]);

	const topology = useQuery({
		queryKey: queryKeys.deploymentTopology(userId, deploymentId),
		queryFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			return getDeploymentTopology(deployment.userId, deployment.id);
		},
		enabled: Boolean(deployment) && ["c9s", "byos"].includes(deploymentType),
		retry: false,
		staleTime: 10_000,
	});

	const resourceEstimateQ = useQuery<DeploymentResourceEstimateResponse>({
		queryKey: ["deployment-resource-estimate", userId, deploymentId],
		queryFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			try {
				return await getDeploymentResourceEstimate(
					deployment.userId,
					deployment.id,
				);
			} catch (err) {
				return {
					userId: deployment.userId,
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
						nodeCount: 0,
						profiledNodeCount: 0,
					},
				};
			}
		},
		enabled: Boolean(deployment),
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

	return {
		activeLogs,
		activeTab,
		deployment,
		deploymentEngine,
		deploymentId,
		deploymentType,
		destroyDialogOpen,
		forwardAutoSyncOnBringUp,
		forwardCollector,
		forwardCollectors,
		forwardCollectorsQ,
		forwardEnabled,
		forwardNetworkID,
		isC9SDeployment,
		primaryAction,
		resourceEstimate,
		resourceEstimatePending,
		runsForDeployment,
		setActiveTab,
		setDestroyDialogOpen,
		setForwardAutoSyncOnBringUp,
		setForwardCollector,
		setForwardEnabled,
		snap,
		status,
		topology,
		userId,
	};
}
