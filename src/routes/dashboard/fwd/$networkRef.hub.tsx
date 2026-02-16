import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Switch } from "../../../components/ui/switch";
import type { AssuranceScenarioSpec } from "../../../lib/assurance-studio-api";
import { postAssuranceStudioEvaluate } from "../../../lib/assurance-studio-api";
import {
	type AssuranceStudioRun,
	createAssuranceStudioRun,
	listAssuranceStudioRuns,
} from "../../../lib/assurance-studio-runs-api";
import { postAssuranceTrafficSeeds } from "../../../lib/assurance-traffic-api";
import { queryKeys } from "../../../lib/query-keys";
import {
	type ForwardAssuranceSummaryResponse,
	type PolicyReportForwardNetwork,
	getForwardNetworkAssuranceSummary,
	listUserForwardNetworks,
	refreshForwardNetworkAssurance,
	seedForwardNetworkAssuranceDemo,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/fwd/$networkRef/hub")({
	component: ForwardNetworkHubPage,
});

type PresetKind = "routing" | "capacity" | "security";

function fmtRFC3339(s?: string): string {
	const v = String(s ?? "").trim();
	if (!v) return "—";
	const t = Date.parse(v);
	if (!Number.isFinite(t)) return v;
	return new Date(t).toISOString();
}

function indexingUsable(overall?: string): boolean {
	const state = String(overall ?? "")
		.trim()
		.toLowerCase();
	if (!state) return false;
	if (state === "ok" || state === "warn" || state === "warning") return true;
	if (state.includes("fail") || state.includes("error")) return false;
	return true;
}

function presetTitle(preset: PresetKind): string {
	switch (preset) {
		case "routing":
			return "Routing";
		case "capacity":
			return "Capacity";
		case "security":
			return "Security";
	}
}

function ForwardNetworkHubPage() {
	const qc = useQueryClient();
	const { networkRef } = Route.useParams();

	const [window, setWindow] = useState("24h");
	const [thresholdUtil, setThresholdUtil] = useState("0.8");
	const [maxDemands, setMaxDemands] = useState("120");
	const [maxResults, setMaxResults] = useState("3");
	const [includeHops, setIncludeHops] = useState(true);
	const [includeAcl, setIncludeAcl] = useState(false);
	const [secRequireEnforcement, setSecRequireEnforcement] = useState(true);
	const [secIncludeReturnPath, setSecIncludeReturnPath] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);

	const summaryQ = useQuery({
		queryKey: queryKeys.forwardNetworkAssuranceSummary(networkRef),
		queryFn: () => getForwardNetworkAssuranceSummary(networkRef),
		enabled: Boolean(networkRef),
		staleTime: 5_000,
		retry: false,
	});
	const summary = summaryQ.data as ForwardAssuranceSummaryResponse | undefined;

	const networksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(),
		queryFn: () => listUserForwardNetworks(),
		enabled: true,
		staleTime: 20_000,
		retry: false,
	});
	const network = useMemo(() => {
		const all = (networksQ.data?.networks ??
			[]) as PolicyReportForwardNetwork[];
		return all.find((n) => String(n.id) === String(networkRef)) ?? null;
	}, [networksQ.data?.networks, networkRef]);

	const runsQ = useQuery({
		queryKey: queryKeys.assuranceStudioRuns(networkRef),
		queryFn: () => listAssuranceStudioRuns(networkRef),
		enabled: Boolean(networkRef),
		staleTime: 10_000,
		retry: false,
	});

	const missing = useMemo(() => summary?.missing ?? [], [summary?.missing]);
	const warnings = useMemo(() => summary?.warnings ?? [], [summary?.warnings]);
	const ready = Boolean(summary?.snapshot.snapshotId);
	const hasBlockingMissing = missing.length > 0;
	const indexingReady = indexingUsable(summary?.indexingHealth.overall);
	const canRunPresets = ready && indexingReady && !hasBlockingMissing;

	const refreshM = useMutation({
		mutationFn: async () => refreshForwardNetworkAssurance(networkRef),
		onSuccess: async (next) => {
			qc.setQueryData(
				queryKeys.forwardNetworkAssuranceSummary(networkRef),
				next,
			);
			toast.success("Forward assurance refreshed");
		},
		onError: (e) =>
			toast.error("Refresh failed", { description: (e as Error).message }),
	});

	const seedSignalsM = useMutation({
		mutationFn: async () => seedForwardNetworkAssuranceDemo(networkRef),
		onSuccess: (res) =>
			toast.success("Demo signals seeded", {
				description: `syslog=${res.inserted?.syslog ?? 0}, traps=${res.inserted?.snmpTraps ?? 0}`,
			}),
		onError: (e) =>
			toast.error("Signal seed failed", { description: (e as Error).message }),
	});

	const runPresetM = useMutation({
		mutationFn: async (preset: PresetKind) => {
			if (!summary?.snapshot.snapshotId) {
				throw new Error("No Forward snapshot available yet");
			}

			const maxDemandsNum = Math.max(
				5,
				Math.min(300, Number.parseInt(maxDemands, 10) || 120),
			);
			const seeded = await postAssuranceTrafficSeeds(networkRef, {
				snapshotId: summary.snapshot.snapshotId,
				mode: "mesh",
				includeGroups: true,
				maxDevices: 30,
				maxDemands: maxDemandsNum,
			});
			const demands = (seeded.demands ?? [])
				.filter((d) => String(d.dstIp ?? "").trim())
				.slice(0, maxDemandsNum);
			if (demands.length === 0) {
				throw new Error(
					"No traffic demands could be generated from this Forward snapshot",
				);
			}

			const threshold = Number.parseFloat(thresholdUtil);
			const maxR = Math.max(
				1,
				Math.min(10, Number.parseInt(maxResults, 10) || 3),
			);
			const evalResp = await postAssuranceStudioEvaluate(networkRef, {
				snapshotId: summary.snapshot.snapshotId,
				window: String(window || "24h"),
				demands,
				phases: {
					routing: preset === "routing",
					capacity: preset === "capacity",
					security: preset === "security",
				},
				routing:
					preset === "routing"
						? {
								thresholdUtil: Number.isFinite(threshold) ? threshold : 0.8,
								forward: { maxResults: maxR },
								enforcement: { requireEnforcement: true },
								includeHops,
								includeAcl,
								projectLoad: true,
							}
						: undefined,
				capacity:
					preset === "capacity"
						? { includeHops, includeUpgradeCandidates: true }
						: undefined,
				security:
					preset === "security"
						? {
								requireEnforcement: secRequireEnforcement,
								includeReturnPath: secIncludeReturnPath,
								requireSymmetricDelivery: secIncludeReturnPath
									? true
									: undefined,
								requireReturnEnforcement: secIncludeReturnPath
									? true
									: undefined,
								intent: "PREFER_DELIVERED",
								includeTags: true,
								includeNetworkFunctions: true,
								maxCandidates: 2000,
								maxResults: 1,
								maxReturnPathResults: secIncludeReturnPath ? 1 : 0,
								maxSeconds: 25,
								maxOverallSeconds: 180,
							}
						: undefined,
			});

			const errors: Record<string, string> = { ...(evalResp.errors ?? {}) };
			const results: Record<string, unknown> = {};
			const spec: AssuranceScenarioSpec = {
				snapshotId: summary.snapshot.snapshotId,
				window: String(window || "24h"),
				thresholdUtil:
					preset === "routing" && Number.isFinite(threshold)
						? threshold
						: undefined,
				demands,
				routing:
					preset === "routing"
						? {
								includeHops,
								includeAcl,
								maxResults: maxR,
								requireEnforcement: true,
							}
						: undefined,
				capacity:
					preset === "capacity"
						? { includeHops, includeUpgradeCandidates: true }
						: undefined,
				security:
					preset === "security"
						? {
								requireEnforcement: secRequireEnforcement,
								includeReturnPath: secIncludeReturnPath,
								requireSymmetricDelivery: secIncludeReturnPath
									? true
									: undefined,
								requireReturnEnforcement: secIncludeReturnPath
									? true
									: undefined,
							}
						: undefined,
			};

			if (preset === "routing") {
				if (evalResp.routing) results.routingEval = evalResp.routing;
				else errors.routing = errors.routing ?? "Routing evaluation failed";
			}
			if (preset === "capacity") {
				if (evalResp.capacity) results.capacityBottlenecks = evalResp.capacity;
				else errors.capacity = errors.capacity ?? "Capacity evaluation failed";
				if (evalResp.capacityUpgradeCandidates) {
					results.capacityUpgradeCandidates =
						evalResp.capacityUpgradeCandidates;
				}
			}
			if (preset === "security") {
				if (evalResp.security)
					results.securityPathsAssurance = evalResp.security;
				else errors.security = errors.security ?? "Security evaluation failed";
			}
			if (Object.keys(errors).length > 0) results.errors = errors;

			const status: "SUCCEEDED" | "PARTIAL" | "FAILED" =
				Object.keys(errors).length === 0
					? "SUCCEEDED"
					: Object.keys(results).length > 1
						? "PARTIAL"
						: "FAILED";

			const run = await createAssuranceStudioRun(networkRef, {
				title: `${presetTitle(preset)} preset (${new Date().toISOString()})`,
				status,
				error:
					Object.keys(errors).length > 0 ? JSON.stringify(errors) : undefined,
				request: spec,
				results,
			});

			return {
				preset,
				status,
				runId: run.id,
				demandCount: demands.length,
			};
		},
		onSuccess: async (out) => {
			await qc.invalidateQueries({
				queryKey: queryKeys.assuranceStudioRuns(networkRef),
			});
			toast.success(`${presetTitle(out.preset)} preset finished`, {
				description: `status=${out.status}, run=${out.runId}, demands=${out.demandCount}`,
			});
		},
		onError: (e) =>
			toast.error("Preset run failed", { description: (e as Error).message }),
	});

	return (
		<div className="space-y-6 p-6 pb-20">
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						to="/dashboard/fwd"
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="min-w-0">
						<h1 className="text-2xl font-bold tracking-tight">Assurance Hub</h1>
						<p className="text-sm text-muted-foreground truncate">
							{network?.name ?? networkRef} · Forward network{" "}
							<span className="font-mono">
								{network?.forwardNetworkId ?? "—"}
							</span>
						</p>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => refreshM.mutate()}
						disabled={refreshM.isPending}
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						{refreshM.isPending ? "Refreshing…" : "Refresh"}
					</Button>
					<Button asChild variant="outline">
						<Link
							to="/dashboard/fwd/$networkRef/assurance-studio"
							params={{ networkRef }}
						>
							Advanced
						</Link>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Step 1 · Validate Forward data</CardTitle>
					<CardDescription>
						Confirm snapshot, indexing, and signal readiness before running
						checks.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{summaryQ.isLoading ? (
						<div className="text-sm text-muted-foreground">
							Loading readiness…
						</div>
					) : summaryQ.isError ? (
						<div className="text-sm text-destructive">
							Failed to load readiness: {(summaryQ.error as Error).message}
						</div>
					) : summary ? (
						<div className="grid gap-3 md:grid-cols-3 text-sm">
							<div className="rounded-md border p-3">
								<div className="text-muted-foreground">Snapshot</div>
								<div className="font-mono text-xs mt-1">
									{summary.snapshot.snapshotId || "—"}
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									processed {fmtRFC3339(summary.snapshot.processedAt)}
								</div>
							</div>
							<div className="rounded-md border p-3">
								<div className="text-muted-foreground">Indexing</div>
								<div className="mt-1">
									<Badge
										variant={
											summary.indexingHealth.overall === "ok"
												? "default"
												: "secondary"
										}
									>
										{summary.indexingHealth.overall}
									</Badge>
								</div>
								<div className="text-xs text-muted-foreground mt-1">
									path-search{" "}
									{summary.indexingHealth.pathSearchIndexingStatus || "—"}
								</div>
							</div>
							<div className="rounded-md border p-3">
								<div className="text-muted-foreground">Collection</div>
								<div className="text-xs mt-1">
									success devices{" "}
									<span className="font-mono">
										{summary.collectionHealth.numSuccessfulDevices ?? 0}
									</span>
								</div>
								<div className="text-xs text-muted-foreground">
									failed devices{" "}
									<span className="font-mono">
										{summary.collectionHealth.numCollectionFailureDevices ?? 0}
									</span>
								</div>
							</div>
						</div>
					) : null}

					{missing.length > 0 ? (
						<div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">
							<div className="font-medium text-amber-900">Missing evidence</div>
							<div className="mt-2 flex flex-wrap gap-2">
								{missing.map((m) => (
									<Badge key={m} variant="secondary">
										{m}
									</Badge>
								))}
							</div>
							<div className="mt-3 text-xs text-amber-900">
								Next steps: run a Forward collection for this network, verify
								SNMP credentials are present on the network, then click Refresh.
							</div>
						</div>
					) : null}

					{warnings.length > 0 ? (
						<div className="rounded-md border p-3 text-sm space-y-1">
							<div className="font-medium">Warnings</div>
							{warnings.map((w) => (
								<div key={w} className="text-muted-foreground text-xs">
									{w}
								</div>
							))}
						</div>
					) : null}

					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							onClick={() => seedSignalsM.mutate()}
							disabled={seedSignalsM.isPending}
						>
							{seedSignalsM.isPending ? "Seeding…" : "Seed SNMP/Syslog demo"}
						</Button>
						<Badge variant={canRunPresets ? "default" : "secondary"}>
							{canRunPresets ? "Ready" : "Needs data"}
						</Badge>
					</div>
					{ready && !indexingReady ? (
						<div className="text-xs text-amber-700">
							Indexing is not ready yet. Wait for Forward indexing to complete,
							then refresh before running presets.
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Step 2 · Run preset checks</CardTitle>
					<CardDescription>
						Use one-click presets for routing, capacity, or security. Advanced
						tuning stays hidden by default.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-3">
						<Button
							variant="outline"
							className="justify-start"
							disabled={!canRunPresets || runPresetM.isPending}
							onClick={() => runPresetM.mutate("routing")}
						>
							{runPresetM.isPending && runPresetM.variables === "routing" ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4 mr-2" />
							)}
							Routing preset
						</Button>
						<Button
							variant="outline"
							className="justify-start"
							disabled={!canRunPresets || runPresetM.isPending}
							onClick={() => runPresetM.mutate("capacity")}
						>
							{runPresetM.isPending && runPresetM.variables === "capacity" ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4 mr-2" />
							)}
							Capacity preset
						</Button>
						<Button
							variant="outline"
							className="justify-start"
							disabled={!canRunPresets || runPresetM.isPending}
							onClick={() => runPresetM.mutate("security")}
						>
							{runPresetM.isPending && runPresetM.variables === "security" ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<Sparkles className="h-4 w-4 mr-2" />
							)}
							Security preset
						</Button>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowAdvanced((v) => !v)}
					>
						{showAdvanced ? "Hide advanced options" : "Show advanced options"}
					</Button>

					{showAdvanced ? (
						<div className="rounded-md border p-3 grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Window</Label>
								<Input
									value={window}
									onChange={(e) => setWindow(e.target.value)}
									placeholder="24h"
								/>
							</div>
							<div className="space-y-2">
								<Label>Threshold util (routing)</Label>
								<Input
									value={thresholdUtil}
									onChange={(e) => setThresholdUtil(e.target.value)}
									placeholder="0.8"
								/>
							</div>
							<div className="space-y-2">
								<Label>Max seeded demands</Label>
								<Input
									value={maxDemands}
									onChange={(e) => setMaxDemands(e.target.value)}
									placeholder="120"
								/>
							</div>
							<div className="space-y-2">
								<Label>Max path results (routing)</Label>
								<Input
									value={maxResults}
									onChange={(e) => setMaxResults(e.target.value)}
									placeholder="3"
								/>
							</div>
							<div className="rounded-md border p-3 space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="adv-include-hops">Include hops</Label>
									<Switch
										id="adv-include-hops"
										checked={includeHops}
										onCheckedChange={(v) => setIncludeHops(Boolean(v))}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label htmlFor="adv-include-acl">Include ACL</Label>
									<Switch
										id="adv-include-acl"
										checked={includeAcl}
										onCheckedChange={(v) => setIncludeAcl(Boolean(v))}
									/>
								</div>
							</div>
							<div className="rounded-md border p-3 space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="adv-sec-enforce">Security enforcement</Label>
									<Switch
										id="adv-sec-enforce"
										checked={secRequireEnforcement}
										onCheckedChange={(v) =>
											setSecRequireEnforcement(Boolean(v))
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<Label htmlFor="adv-sec-return">Include return path</Label>
									<Switch
										id="adv-sec-return"
										checked={secIncludeReturnPath}
										onCheckedChange={(v) => setSecIncludeReturnPath(Boolean(v))}
									/>
								</div>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Step 3 · Review findings</CardTitle>
					<CardDescription>
						Recent preset runs are stored as Assurance Studio runs.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{runsQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading runs…</div>
					) : runsQ.isError ? (
						<div className="text-sm text-destructive">
							Failed to load runs: {(runsQ.error as Error).message}
						</div>
					) : (runsQ.data?.runs ?? []).length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No runs yet. Start with a preset in Step 2.
						</div>
					) : (
						<div className="space-y-2">
							{((runsQ.data?.runs ?? []) as AssuranceStudioRun[])
								.slice(0, 8)
								.map((run) => (
									<div
										key={String(run.id)}
										className="rounded-md border p-3 flex items-center justify-between gap-3"
									>
										<div className="min-w-0">
											<div className="font-medium truncate">
												{String(run.title)}
											</div>
											<div className="text-xs text-muted-foreground">
												{fmtRFC3339(run.startedAt || run.createdAt)}
											</div>
											{run.error ? (
												<div className="text-xs text-destructive mt-1 truncate">
													{run.error}
												</div>
											) : null}
										</div>
										<Badge
											variant={
												String(run.status) === "SUCCEEDED"
													? "default"
													: String(run.status) === "PARTIAL"
														? "secondary"
														: "destructive"
											}
										>
											{String(run.status)}
										</Badge>
									</div>
								))}
						</div>
					)}

					<div className="flex flex-wrap gap-2 pt-2">
						<Button asChild variant="outline" size="sm">
							<Link
								to="/dashboard/fwd/$networkRef/assurance"
								params={{ networkRef }}
							>
								Assurance summary
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link
								to="/dashboard/fwd/$networkRef/capacity"
								params={{ networkRef }}
							>
								Capacity explorer
							</Link>
						</Button>
						<Button asChild variant="outline" size="sm">
							<Link
								to="/dashboard/fwd/$networkRef/assurance-studio"
								params={{ networkRef }}
							>
								Legacy studio
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
