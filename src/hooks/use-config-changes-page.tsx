import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	approveAdminConfigChangeRun,
	createCurrentConfigChangeRun,
	executeAdminConfigChangeRun,
	rollbackAdminConfigChangeRun,
	getAdminConfigChangeRunLifecycle,
	getAdminConfigChangeRunReview,
	listAdminConfigChangeRuns,
	getCurrentConfigChangeRunLifecycle,
	getCurrentConfigChangeRunReview,
	getSession,
	listCurrentConfigChangeRuns,
	rejectAdminConfigChangeRun,
	renderCurrentConfigChangeRun,
	type ConfigChangeRunRecord,
} from "../lib/api-client";
import {
	defaultConfigChangeSpecJson,
} from "../components/config-changes-shared";
import { queryKeys } from "../lib/query-keys";
import { sessionIsAdmin } from "../lib/rbac";

export function useConfigChangesPage() {
	const qc = useQueryClient();
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		retry: false,
	});
	const isAdmin = sessionIsAdmin(sessionQ.data);
	const listQ = useQuery({
		queryKey: [...queryKeys.configChangeRuns(), isAdmin ? "admin" : "current"],
		queryFn: () =>
			isAdmin ? listAdminConfigChangeRuns() : listCurrentConfigChangeRuns(),
		retry: false,
		enabled: !sessionQ.isLoading,
	});

	const runs = useMemo(() => listQ.data?.runs ?? [], [listQ.data]);
	const [selectedRunId, setSelectedRunId] = useState("");

	useEffect(() => {
		if (selectedRunId) return;
		if (runs.length === 0) return;
		setSelectedRunId(runs[0]?.id ?? "");
	}, [runs, selectedRunId]);

	const selectedRun = useMemo(
		() => runs.find((run) => run.id === selectedRunId) ?? null,
		[runs, selectedRunId],
	);

	const reviewQ = useQuery({
		queryKey: [
			...queryKeys.configChangeRunReview(selectedRunId),
			isAdmin ? "admin" : "current",
		],
		queryFn: () =>
			isAdmin
				? getAdminConfigChangeRunReview(selectedRunId)
				: getCurrentConfigChangeRunReview(selectedRunId),
		enabled: Boolean(selectedRunId),
		retry: false,
	});

	const lifecycleQ = useQuery({
		queryKey: [
			...queryKeys.configChangeRunLifecycle(selectedRunId),
			isAdmin ? "admin" : "current",
		],
		queryFn: () =>
			isAdmin
				? getAdminConfigChangeRunLifecycle(selectedRunId)
				: getCurrentConfigChangeRunLifecycle(selectedRunId),
		enabled: Boolean(selectedRunId),
		retry: false,
	});

	const [targetType, setTargetType] = useState("deployment");
	const [targetRef, setTargetRef] = useState("");
	const [targetName, setTargetName] = useState("");
	const [sourceKind, setSourceKind] = useState("change-plan");
	const [executionMode, setExecutionMode] = useState("dry-run");
	const [summary, setSummary] = useState("");
	const [ticketRef, setTicketRef] = useState("");
	const [specJson, setSpecJson] = useState(defaultConfigChangeSpecJson("change-plan"));

	useEffect(() => {
		setSpecJson(defaultConfigChangeSpecJson(sourceKind));
	}, [sourceKind]);

	const createMutation = useMutation({
		mutationFn: async () =>
			createCurrentConfigChangeRun({
				targetType,
				targetRef: targetRef.trim(),
				targetName: targetName.trim(),
				sourceKind,
				executionMode,
				summary: summary.trim(),
				ticketRef: ticketRef.trim(),
				specJson: specJson.trim(),
			}),
		onSuccess: async (run) => {
			toast.success("Config change run created");
			setSelectedRunId(run.id);
			await qc.invalidateQueries({ queryKey: queryKeys.configChangeRuns() });
			await qc.invalidateQueries({ queryKey: queryKeys.configChangeRun(run.id) });
		},
		onError: (error) =>
			toast.error("Failed to create config change run", {
				description: (error as Error).message,
			}),
	});

	const renderMutation = useMutation({
		mutationFn: async (id: string) => renderCurrentConfigChangeRun(id),
		onSuccess: async (run) => {
			toast.success("Rendered config change review");
			await Promise.all([
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRuns() }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunReview(run.id) }),
				qc.invalidateQueries({
					queryKey: queryKeys.configChangeRunLifecycle(run.id),
				}),
			]);
		},
		onError: (error) =>
			toast.error("Failed to render change run", {
				description: (error as Error).message,
			}),
	});

	const approveMutation = useMutation({
		mutationFn: async (id: string) => approveAdminConfigChangeRun(id),
		onSuccess: async (run) => {
			toast.success("Approved change run");
			await Promise.all([
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRuns() }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunLifecycle(run.id) }),
			]);
		},
		onError: (error) =>
			toast.error("Failed to approve change run", {
				description: (error as Error).message,
			}),
	});

	const rejectMutation = useMutation({
		mutationFn: async (id: string) => rejectAdminConfigChangeRun(id),
		onSuccess: async (run) => {
			toast.success("Rejected change run");
			await Promise.all([
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRuns() }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunLifecycle(run.id) }),
			]);
		},
		onError: (error) =>
			toast.error("Failed to reject change run", {
				description: (error as Error).message,
			}),
	});

	const executeMutation = useMutation({
		mutationFn: async (id: string) => executeAdminConfigChangeRun(id),
		onSuccess: async (run) => {
			toast.success("Queued change run for execution");
			await Promise.all([
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRuns() }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunLifecycle(run.id) }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunReview(run.id) }),
			]);
		},
		onError: (error) =>
			toast.error("Failed to execute change run", {
				description: (error as Error).message,
			}),
	});

	const rollbackMutation = useMutation({
		mutationFn: async (id: string) => rollbackAdminConfigChangeRun(id),
		onSuccess: async (run) => {
			toast.success("Queued change run rollback");
			await Promise.all([
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRuns() }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunLifecycle(run.id) }),
				qc.invalidateQueries({ queryKey: queryKeys.configChangeRunReview(run.id) }),
			]);
		},
		onError: (error) =>
			toast.error("Failed to queue rollback", {
				description: (error as Error).message,
			}),
	});

	return {
		sessionQ,
		isAdmin,
		listQ,
		runs,
		selectedRunId,
		setSelectedRunId,
		selectedRun,
		reviewQ,
		lifecycleQ,
		targetType,
		setTargetType,
		targetRef,
		setTargetRef,
		targetName,
		setTargetName,
		sourceKind,
		setSourceKind,
		executionMode,
		setExecutionMode,
		summary,
		setSummary,
		ticketRef,
		setTicketRef,
		specJson,
		setSpecJson,
		createMutation,
		renderMutation,
		approveMutation,
		rejectMutation,
		executeMutation,
		rollbackMutation,
		canRenderRun: canRenderRun(selectedRun),
		canApproveRun: canApproveRun(selectedRun),
		canRejectRun: canRejectRun(selectedRun),
		canExecuteRun: canExecuteRun(selectedRun),
		canRollbackRun: canRollbackRun(selectedRun),
	};
}

function canRenderRun(run: ConfigChangeRunRecord | null): boolean {
	if (!run) return false;
	const status = String(run.status || "").trim().toLowerCase();
	return status === "requested" || status === "validating";
}

function canApproveRun(run: ConfigChangeRunRecord | null): boolean {
	if (!run) return false;
	const status = String(run.status || "").trim().toLowerCase();
	return status === "awaiting-approval" || status === "rendered";
}

function canRejectRun(run: ConfigChangeRunRecord | null): boolean {
	if (!run) return false;
	const status = String(run.status || "").trim().toLowerCase();
	return (
		status === "awaiting-approval" ||
		status === "rendered" ||
		status === "approved"
	);
}

function canExecuteRun(run: ConfigChangeRunRecord | null): boolean {
	if (!run) return false;
	const targetType = String(run.targetType || "").trim().toLowerCase();
	const sourceKind = String(run.sourceKind || "").trim().toLowerCase();
	if (targetType !== "deployment") return false;
	if (sourceKind !== "change-plan") {
		return false;
	}
	const status = String(run.status || "").trim().toLowerCase();
	const mode = String(run.executionMode || "").trim().toLowerCase();
	if (mode === "dry-run") {
		return status === "rendered" || status === "approved";
	}
	return status === "approved";
}

function canRollbackRun(run: ConfigChangeRunRecord | null): boolean {
	if (!run) return false;
	const targetType = String(run.targetType || "").trim().toLowerCase();
	const sourceKind = String(run.sourceKind || "").trim().toLowerCase();
	if (targetType !== "deployment") return false;
	if (sourceKind !== "change-plan") {
		return false;
	}
	const status = String(run.status || "").trim().toLowerCase();
	if (status === "queued" || status === "applying" || status === "verifying" || status === "rolled-back") {
		return false;
	}
	return Boolean(run.rollbackSummary?.previousDeploymentConfigJson);
}

export type ConfigChangesPageData = ReturnType<typeof useConfigChangesPage>;
