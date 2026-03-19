import {
	type DashboardSnapshot,
	type JSONMap,
	buildLoginUrl,
	cancelRun,
	getDashboardSnapshot,
} from "@/lib/api-client";
import { loginWithPopup } from "@/lib/auth-popup";
import { queryKeys } from "@/lib/query-keys";
import { type RunLogState, useRunEvents } from "@/lib/run-events";
import {
	type RunLifecycleState,
	type TaskLifecycleEntry,
	useRunLifecycleEvents,
} from "@/lib/run-lifecycle-events";
import { getRuntimeAuthMode } from "@/lib/skyforge-config";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";

export function useRunDetailPage(args: { runId: string }) {
	const { runId } = args;
	useRunEvents(runId, true);
	useRunLifecycleEvents(runId, true);

	const queryClient = useQueryClient();
	const navigate = useNavigate();

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

	const run = (snap.data?.runs ?? []).find(
		(entry: JSONMap) => String(entry.id ?? "") === runId,
	) as JSONMap | undefined;
	const runStatus = String(run?.status ?? "").toLowerCase();
	const canCancel = runStatus === "queued" || runStatus === "running";

	const logs = useQuery({
		queryKey: queryKeys.runLogs(runId),
		queryFn: async () => ({ cursor: 0, entries: [] }) as RunLogState,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const lifecycle = useQuery({
		queryKey: queryKeys.runLifecycle(runId),
		queryFn: async () => ({ cursor: 0, entries: [] }) as RunLifecycleState,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const provenance = useMemo(() => buildRunProvenance(run), [run]);
	const lifecycleEntries = lifecycle.data?.entries ?? [];
	const lifecycleRecent = lifecycleEntries.slice(-20).reverse();
	const deployFailureCategories = useMemo(
		() => summarizeKneDeployFailures(lifecycleEntries),
		[lifecycleEntries],
	);
	const deployTimeline = useMemo(
		() => summarizeKneDeployTimeline(lifecycleEntries),
		[lifecycleEntries],
	);
	const nodeSample = provenance.nodeResolutionSample.slice(0, 10);

	const loginHref = buildLoginUrl(
		window.location.pathname + window.location.search,
	);
	const authMode = getRuntimeAuthMode();

	async function handleCancel() {
		if (!run) return;

		const userId = String((run as { userId?: unknown }).userId ?? "");
		if (!userId) {
			toast.error("Cannot cancel run", {
				description: "Missing user ID.",
			});
			return;
		}

		try {
			await cancelRun(runId, userId);
			toast.success("Run canceled");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			navigate({
				to: "/dashboard/deployments",
				search: { userId } as never,
			});
		} catch (error) {
			toast.error("Cancel failed", {
				description: (error as Error).message,
			});
		}
	}

	function handleClear() {
		queryClient.setQueryData(queryKeys.runLogs(runId), {
			cursor: 0,
			entries: [],
		} satisfies RunLogState);
		queryClient.setQueryData(queryKeys.runLifecycle(runId), {
			cursor: 0,
			entries: [],
		} satisfies RunLifecycleState);
	}

	async function handleLogin() {
		if (authMode !== "oidc") {
			window.location.href = loginHref;
			return;
		}

		const ok = await loginWithPopup({ loginHref });
		if (!ok) {
			window.location.href = loginHref;
			return;
		}

		await queryClient.invalidateQueries({
			queryKey: queryKeys.session(),
		});
	}

	return {
		canCancel,
		deployFailureCategories,
		deployTimeline,
		handleCancel,
		handleClear,
		handleLogin,
		lifecycle,
		lifecycleRecent,
		logs,
		loginHref,
		nodeSample,
		provenance,
		run,
		runId,
		snap,
	};
}

export type RunDetailPageState = ReturnType<typeof useRunDetailPage>;

export type RunProvenance = {
	sourceOfTruth: string;
	catalogSource: string;
	catalogDeviceCount: number;
	contractVersion: string;
	runtimeVersion: string;
	bundleSha256: string;
	totalNodes: number;
	resolvedNodes: number;
	unresolvedNodes: number;
	connectivity: string;
	exposeType: string;
	filesFromConfigMapNodeCount: number;
	payloadSha256: string;
	nodeResolutionSample: Array<{
		node: string;
		kind: string;
		device: string;
		source: string;
		resolved: boolean;
	}>;
};

export type KneDeployTimelineSummary = {
	latestElapsedSeconds: number;
	phases: Array<{
		phase: string;
		time: string;
		elapsedSeconds: number;
		status: "phase" | "failure";
		detail: string;
	}>;
};

function buildRunProvenance(run: JSONMap | undefined): RunProvenance {
	const catalog = asRecord(run?.netlabCatalogProvenance) ?? {};
	const nodeSummary = asRecord(run?.netlabNodeResolutionSummary) ?? {};
	const applySummary = asRecord(run?.kneApplySummary) ?? {};
	const contract = asRecord(run?.netlabContract) ?? {};
	const deployPolicy = asRecord(run?.kneDeployPolicy) ?? {};

	const sampleRaw = asArray(nodeSummary.sample);
	const sample = sampleRaw
		.map((value) => asRecord(value))
		.filter((value): value is Record<string, unknown> => Boolean(value))
		.map((value) => ({
			node: asString(value.node),
			kind: asString(value.kind),
			device: asString(value.device),
			source: asString(value.source),
			resolved: asBool(value.resolved),
		}));

	return {
		sourceOfTruth: asString(
			applySummary.sourceOfTruth ?? deployPolicy.sourceOfTruth ?? "—",
		),
		catalogSource: asString(catalog.source ?? "—"),
		catalogDeviceCount: asInt(catalog.deviceCount),
		contractVersion: asString(contract.contractVersion ?? "—"),
		runtimeVersion: asString(contract.generatorVersion ?? "—"),
		bundleSha256: asString(contract.bundleSha256 ?? "—"),
		totalNodes: asInt(nodeSummary.totalNodes),
		resolvedNodes: asInt(nodeSummary.resolvedNodes),
		unresolvedNodes: asInt(nodeSummary.unresolvedNodes),
		connectivity: asString(
			deployPolicy.connectivity ?? applySummary.connectivity ?? "—",
		),
		exposeType: asString(
			deployPolicy.exposeType ?? applySummary.exposeType ?? "—",
		),
		filesFromConfigMapNodeCount: asInt(
			applySummary.filesFromConfigMapNodeCount,
		),
		payloadSha256: asString(applySummary.payloadSha256 ?? "—"),
		nodeResolutionSample: sample,
	};
}

function summarizeKneDeployFailures(
	entries: TaskLifecycleEntry[],
): Array<{ category: string; count: number }> {
	const counts = new Map<string, number>();

	for (const entry of entries) {
		if (entry.type !== "kne.deploy.failure") continue;
		const payload = asRecord(entry.payload);
		const raw = asString(payload?.category).toLowerCase();
		const category = raw || "unknown";
		counts.set(category, (counts.get(category) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([category, count]) => ({ category, count }))
		.sort((left, right) => left.category.localeCompare(right.category));
}

function summarizeKneDeployTimeline(
	entries: TaskLifecycleEntry[],
): KneDeployTimelineSummary {
	const phases: KneDeployTimelineSummary["phases"] = [];

	for (const entry of entries) {
		if (entry.type !== "kne.deploy.phase" && entry.type !== "kne.deploy.failure") {
			continue;
		}
		const payload = asRecord(entry.payload);
		const phase = asString(payload?.phase);
		if (!phase) continue;
		const elapsedSeconds = asInt(payload?.elapsedSeconds);
		const detail =
			entry.type === "kne.deploy.failure"
				? asString(payload?.error) || asString(payload?.category) || "failed"
				: phase;
		phases.push({
			phase,
			time: entry.time,
			elapsedSeconds,
			status: entry.type === "kne.deploy.failure" ? "failure" : "phase",
			detail,
		});
	}

	phases.sort((left, right) => {
		if (left.elapsedSeconds !== right.elapsedSeconds) {
			return left.elapsedSeconds - right.elapsedSeconds;
		}
		return left.time.localeCompare(right.time);
	});

	return {
		latestElapsedSeconds: phases.reduce(
			(maxValue, entry) => Math.max(maxValue, entry.elapsedSeconds),
			0,
		),
		phases,
	};
}

function asRecord(value: unknown): Record<string, unknown> | null {
	if (!value || typeof value !== "object" || Array.isArray(value)) return null;
	return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
	return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string {
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return "";
}

function asInt(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.trunc(value);
	}
	if (typeof value === "string") {
		const parsed = Number.parseInt(value, 10);
		if (Number.isFinite(parsed)) return parsed;
	}
	return 0;
}

function asBool(value: unknown): boolean {
	if (typeof value === "boolean") return value;
	if (typeof value === "string") return value.toLowerCase() === "true";
	return false;
}
