import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import type { JSONMap } from "../../../lib/api-client";
import {
	type DashboardSnapshot,
	buildLoginUrl,
	cancelRun,
	getDashboardSnapshot,
} from "../../../lib/api-client";
import { loginWithPopup } from "../../../lib/auth-popup";
import { queryKeys } from "../../../lib/query-keys";
import {
	type RunLogState,
	type TaskLogEntry,
	useRunEvents,
} from "../../../lib/run-events";
import {
	type RunLifecycleState,
	type TaskLifecycleEntry,
	useRunLifecycleEvents,
} from "../../../lib/run-lifecycle-events";

export const Route = createFileRoute("/dashboard/runs/$runId")({
	component: RunDetailPage,
});

function RunDetailPage() {
	const { runId } = Route.useParams();
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
		(r: JSONMap) => String(r.id ?? "") === runId,
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

	const provenance = useMemo(
		() => buildRunProvenance(run, lifecycle.data?.entries ?? []),
		[run, lifecycle.data?.entries],
	);
	const lifecycleEntries = lifecycle.data?.entries ?? [];
	const lifecycleRecent = lifecycleEntries.slice(-20).reverse();
	const deployFailureCategories = useMemo(
		() => summarizeClabernetesDeployFailures(lifecycleEntries),
		[lifecycleEntries],
	);
	const nodeSample = provenance.nodeResolutionSample.slice(0, 10);

	const loginHref = buildLoginUrl(
		window.location.pathname + window.location.search,
	);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Run {runId}</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							<Link
								className={buttonVariants({ variant: "outline", size: "sm" })}
								to="/dashboard/deployments"
							>
								Back
							</Link>
							<Button
								variant="destructive"
								size="sm"
								disabled={!run || !canCancel}
								onClick={() => {
									if (!run) return;
									const userId = String((run as any).userId ?? "");
									if (!userId) {
										toast.error("Cannot cancel run", {
											description: "Missing user ID.",
										});
										return;
									}
									void (async () => {
										try {
											await cancelRun(runId, userId);
											toast.success("Run canceled");
											await queryClient.invalidateQueries({
												queryKey: queryKeys.dashboardSnapshot(),
											});
											navigate({
												to: "/dashboard/deployments",
												search: { userId } as any,
											});
										} catch (e) {
											toast.error("Cancel failed", {
												description: (e as Error).message,
											});
										}
									})();
								}}
							>
								Cancel
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									queryClient.setQueryData(queryKeys.runLogs(runId), {
										cursor: 0,
										entries: [],
									} satisfies RunLogState);
									queryClient.setQueryData(queryKeys.runLifecycle(runId), {
										cursor: 0,
										entries: [],
									} satisfies RunLifecycleState);
								}}
							>
								Clear
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			{!snap.data && (
				<Card className="border-dashed">
					<CardContent className="pt-6 text-center text-muted-foreground">
						Loading dashboard…
						<div className="mt-2 text-xs">
							If you are logged out,{" "}
							<a
								className="text-primary underline hover:no-underline"
								href={loginHref}
								onClick={(e) => {
									e.preventDefault();
									void (async () => {
										const ok = await loginWithPopup({ loginHref });
										if (!ok) {
											window.location.href = loginHref;
											return;
										}
										await queryClient.invalidateQueries({
											queryKey: queryKeys.session(),
										});
									})();
								}}
							>
								login
							</a>
							.
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Metadata</CardTitle>
						<div className="text-xs text-muted-foreground">
							Cursor: {String(logs.data?.cursor ?? 0)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Meta label="Type" value={String(run?.tpl_alias ?? "")} />
						<Meta label="Status" value={String(run?.status ?? "")} />
						<Meta label="User" value={String((run as any)?.userId ?? "")} />
						<Meta label="Created" value={String(run?.created ?? "")} />
						<Meta label="Started" value={String(run?.start ?? "")} />
						<Meta label="Finished" value={String(run?.end ?? "")} />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Source Of Truth</CardTitle>
					<CardDescription>
						Netlab catalog {"->"} node resolution {"->"} clabernetes apply
						policy
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Meta label="Source Chain" value={provenance.sourceOfTruth} />
						<Meta label="Catalog Source" value={provenance.catalogSource} />
						<Meta
							label="Catalog Device Count"
							value={String(provenance.catalogDeviceCount)}
						/>
						<Meta
							label="Generator Contract"
							value={provenance.generatorContractVersion}
						/>
						<Meta
							label="Generator Version"
							value={provenance.generatorVersion}
						/>
						<Meta
							label="Resolved Nodes"
							value={`${provenance.resolvedNodes}/${provenance.totalNodes}`}
						/>
						<Meta
							label="Unresolved Nodes"
							value={String(provenance.unresolvedNodes)}
						/>
						<Meta label="Connectivity Mode" value={provenance.connectivity} />
						<Meta label="Expose Type" value={provenance.exposeType} />
						<Meta
							label="Files From ConfigMap Nodes"
							value={String(provenance.filesFromConfigMapNodeCount)}
						/>
						<Meta
							label="Deploy Payload SHA256"
							value={provenance.payloadSha256}
						/>
						<Meta label="Bundle SHA256" value={provenance.bundleSha256} />
					</div>
					{nodeSample.length > 0 && (
						<div className="space-y-2">
							<div className="font-medium text-sm">Node Resolution Sample</div>
							<div className="overflow-auto rounded-md border">
								<table className="w-full text-sm">
									<thead className="bg-muted/60">
										<tr>
											<th className="px-3 py-2 text-left font-medium">Node</th>
											<th className="px-3 py-2 text-left font-medium">Kind</th>
											<th className="px-3 py-2 text-left font-medium">
												Device
											</th>
											<th className="px-3 py-2 text-left font-medium">
												Source
											</th>
											<th className="px-3 py-2 text-left font-medium">
												Resolved
											</th>
										</tr>
									</thead>
									<tbody>
										{nodeSample.map((row, idx) => (
											<tr key={`${row.node}-${idx}`} className="border-t">
												<td className="px-3 py-2">{row.node || "—"}</td>
												<td className="px-3 py-2">{row.kind || "—"}</td>
												<td className="px-3 py-2">{row.device || "—"}</td>
												<td className="px-3 py-2">{row.source || "—"}</td>
												<td className="px-3 py-2">
													<Badge
														variant={row.resolved ? "default" : "secondary"}
													>
														{row.resolved ? "yes" : "no"}
													</Badge>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Lifecycle Events</CardTitle>
						<div className="text-xs text-muted-foreground">
							Cursor: {String(lifecycle.data?.cursor ?? 0)}
						</div>
					</div>
					<CardDescription>
						Structured task events emitted by native engine phases.
					</CardDescription>
					{deployFailureCategories.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-2">
							{deployFailureCategories.map((item) => (
								<Badge key={item.category} variant="outline">
									{item.category}: {item.count}
								</Badge>
							))}
						</div>
					)}
				</CardHeader>
				<CardContent>
					{lifecycleRecent.length === 0 ? (
						<div className="text-muted-foreground text-sm">
							Waiting for lifecycle events…
						</div>
					) : (
						<div className="space-y-2">
							{lifecycleRecent.map((entry, idx) => (
								<div
									key={`${entry.time}-${entry.type}-${idx}`}
									className="rounded-md border p-3"
								>
									<div className="mb-1 flex items-center gap-2">
										<Badge variant="outline">{entry.type || "event"}</Badge>
										<span className="text-muted-foreground text-xs">
											{entry.time || ""}
										</span>
									</div>
									<pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-2 text-[11px]">
										{prettyJSON(entry.payload)}
									</pre>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Output</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
						<RunOutput entries={logs.data?.entries ?? []} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function Meta(props: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<div className="text-[11px] uppercase tracking-wide text-muted-foreground">
				{props.label}
			</div>
			<div className="break-all font-medium text-sm">{props.value || "—"}</div>
		</div>
	);
}

function RunOutput(props: { entries: TaskLogEntry[] }) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [props.entries.length]);

	if (props.entries.length === 0)
		return <div className="text-zinc-500">Waiting for output…</div>;
	return (
		<div
			ref={containerRef}
			className="max-h-[65vh] overflow-auto whitespace-pre-wrap"
		>
			{props.entries.map((e, idx) => (
				<div key={`${e.time}-${idx}`}>
					<span className="text-zinc-500 select-none">
						{e.time ? `${e.time} ` : ""}
					</span>
					<span>{e.output}</span>
				</div>
			))}
		</div>
	);
}

type RunProvenance = {
	sourceOfTruth: string;
	catalogSource: string;
	catalogDeviceCount: number;
	generatorContractVersion: string;
	generatorVersion: string;
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

function buildRunProvenance(
	run: JSONMap | undefined,
	lifecycleEntries: TaskLifecycleEntry[],
): RunProvenance {
	const fallbackCatalog = lifecyclePayloadByType(
		lifecycleEntries,
		"netlab.catalog.provenance",
	);
	const fallbackNodeSummary = lifecyclePayloadByType(
		lifecycleEntries,
		"netlab.node_resolution.summary",
	);
	const fallbackApplySummary = lifecyclePayloadByType(
		lifecycleEntries,
		"clabernetes.apply.summary",
	);
	const fallbackGeneratorContract = lifecyclePayloadByType(
		lifecycleEntries,
		"netlab.generator.contract",
	);

	const catalog =
		asRecord(run?.netlabCatalogProvenance) ?? fallbackCatalog ?? {};
	const nodeSummary =
		asRecord(run?.netlabNodeResolutionSummary) ?? fallbackNodeSummary ?? {};
	const applySummary =
		asRecord(run?.clabernetesApplySummary) ?? fallbackApplySummary ?? {};
	const generatorContract =
		asRecord(run?.netlabGeneratorContract) ?? fallbackGeneratorContract ?? {};
	const deployPolicy = asRecord(run?.clabernetesDeployPolicy) ?? {};

	const sampleRaw = asArray(nodeSummary.sample);
	const sample = sampleRaw
		.map((v) => asRecord(v))
		.filter((v): v is Record<string, unknown> => Boolean(v))
		.map((v) => ({
			node: asString(v.node),
			kind: asString(v.kind),
			device: asString(v.device),
			source: asString(v.source),
			resolved: asBool(v.resolved),
		}));

	return {
		sourceOfTruth: asString(
			applySummary.sourceOfTruth ?? deployPolicy.sourceOfTruth ?? "—",
		),
		catalogSource: asString(catalog.source ?? "—"),
		catalogDeviceCount: asInt(catalog.deviceCount),
		generatorContractVersion: asString(
			generatorContract.contractVersion ?? "—",
		),
		generatorVersion: asString(generatorContract.generatorVersion ?? "—"),
		bundleSha256: asString(generatorContract.bundleSha256 ?? "—"),
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

function lifecyclePayloadByType(
	entries: TaskLifecycleEntry[],
	eventType: string,
): Record<string, unknown> | null {
	for (let i = entries.length - 1; i >= 0; i -= 1) {
		const entry = entries[i];
		if (entry.type !== eventType) continue;
		return asRecord(entry.payload) ?? null;
	}
	return null;
}

function summarizeClabernetesDeployFailures(
	entries: TaskLifecycleEntry[],
): Array<{ category: string; count: number }> {
	const counts = new Map<string, number>();
	for (const entry of entries) {
		if (entry.type !== "clabernetes.deploy.failure") continue;
		const payload = asRecord(entry.payload);
		const raw = asString(payload?.category).toLowerCase();
		const category = raw || "unknown";
		counts.set(category, (counts.get(category) ?? 0) + 1);
	}
	return Array.from(counts.entries())
		.map(([category, count]) => ({ category, count }))
		.sort((a, b) => a.category.localeCompare(b.category));
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
	if (typeof value === "number" || typeof value === "boolean")
		return String(value);
	return "";
}

function asInt(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value))
		return Math.trunc(value);
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

function prettyJSON(value: unknown): string {
	if (value === null || value === undefined) return "{}";
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "{}";
	}
}
