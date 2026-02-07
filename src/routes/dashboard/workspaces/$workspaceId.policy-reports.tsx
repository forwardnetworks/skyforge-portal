import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowLeft,
	Download,
	Play,
	RefreshCw,
	Settings2,
	Shield,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../../components/ui/tabs";
import { Textarea } from "../../../components/ui/textarea";
import { queryKeys } from "../../../lib/query-keys";
import {
	type JSONMap,
	type PolicyReportCatalogCheck,
	type PolicyReportCatalogParam,
	type PolicyReportNQEResponse,
	type PolicyReportPack,
	type PolicyReportPackDeltaResponse,
	type PolicyReportRunPackResponse,
	getWorkspacePolicyReportCheck,
	getWorkspacePolicyReportChecks,
	getWorkspacePolicyReportPacks,
	getWorkspacePolicyReportSnapshots,
	runWorkspacePolicyReportCheck,
	runWorkspacePolicyReportPack,
	runWorkspacePolicyReportPackDelta,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute(
	"/dashboard/workspaces/$workspaceId/policy-reports",
)({
	component: PolicyReportsPage,
});

function jsonPretty(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function downloadJSON(filename: string, value: unknown) {
	const blob = new Blob([JSON.stringify(value, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
	} finally {
		URL.revokeObjectURL(url);
	}
}

function downloadText(filename: string, contentType: string, content: string) {
	const blob = new Blob([content], { type: contentType });
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
	} finally {
		URL.revokeObjectURL(url);
	}
}

function csvEscape(value: unknown): string {
	const s = value === null || value === undefined ? "" : String(value);
	// Basic RFC4180-ish escaping.
	if (
		s.includes('"') ||
		s.includes(",") ||
		s.includes("\n") ||
		s.includes("\r")
	) {
		return `"${s.replaceAll('"', '""')}"`;
	}
	return s;
}

function resultsToCSV(value: unknown): string {
	if (!Array.isArray(value) || value.length === 0) return "";
	const rows = value.filter((r) => r && typeof r === "object") as Record<
		string,
		unknown
	>[];
	if (rows.length === 0) return "";
	const keys = Array.from(
		new Set(rows.flatMap((r) => Object.keys(r ?? {}))),
	).sort();
	const header = keys.map(csvEscape).join(",");
	const lines = rows.map((r) =>
		keys
			.map((k) => {
				const v = (r as any)[k];
				if (v === null || v === undefined) return "";
				if (
					typeof v === "string" ||
					typeof v === "number" ||
					typeof v === "boolean"
				)
					return csvEscape(v);
				return csvEscape(JSON.stringify(v));
			})
			.join(","),
	);
	return [header, ...lines].join("\n");
}

function severityVariant(
	sev: string | undefined,
): "default" | "destructive" | "secondary" {
	const v = String(sev ?? "").toLowerCase();
	if (v === "high" || v === "critical") return "destructive";
	if (v === "medium") return "default";
	return "secondary";
}

function defaultParamsForCheck(check: PolicyReportCatalogCheck): JSONMap {
	const out: JSONMap = {};
	const params = check.params ?? [];
	for (const p of params) {
		const name = String(p.name ?? "").trim();
		if (!name) continue;
		if (p.default === undefined) continue;
		out[name] = p.default as any;
	}
	return out;
}

function isListType(paramType: string | undefined): boolean {
	const t = String(paramType ?? "")
		.replaceAll(" ", "")
		.toLowerCase();
	return t.startsWith("list<") || t.startsWith("list[") || t.endsWith("[]");
}

function PolicyReportsPage() {
	const { workspaceId } = Route.useParams();

	const [networkId, setNetworkId] = useState("");
	const [snapshotId, setSnapshotId] = useState<string>("");
	const [baselineSnapshotId, setBaselineSnapshotId] = useState<string>("");
	const [compareSnapshotId, setCompareSnapshotId] = useState<string>("");
	const [deltaPackId, setDeltaPackId] = useState<string>("");

	const [activeTab, setActiveTab] = useState<"checks" | "packs" | "deltas">(
		"checks",
	);
	const [resultsByCheck, setResultsByCheck] = useState<
		Record<string, PolicyReportNQEResponse>
	>({});
	const [lastPackRun, setLastPackRun] =
		useState<PolicyReportRunPackResponse | null>(null);
	const [lastDeltaRun, setLastDeltaRun] =
		useState<PolicyReportPackDeltaResponse | null>(null);

	const [openCheckId, setOpenCheckId] = useState<string>("");

	const [paramsByCheck, setParamsByCheck] = useState<Record<string, JSONMap>>(
		{},
	);
	const [paramsDialogCheckId, setParamsDialogCheckId] = useState<string>("");
	const [paramsDraft, setParamsDraft] = useState<JSONMap>({});
	const [paramsDraftText, setParamsDraftText] = useState<
		Record<string, string>
	>({});
	const [paramsDraftErrors, setParamsDraftErrors] = useState<
		Record<string, string>
	>({});

	const checks = useQuery({
		queryKey: queryKeys.policyReportsChecks(workspaceId),
		queryFn: () => getWorkspacePolicyReportChecks(workspaceId),
		staleTime: 60_000,
	});

	const packs = useQuery({
		queryKey: queryKeys.policyReportsPacks(workspaceId),
		queryFn: () => getWorkspacePolicyReportPacks(workspaceId),
		staleTime: 60_000,
	});

	const snapshots = useQuery({
		queryKey: queryKeys.policyReportsSnapshots(workspaceId, networkId.trim()),
		queryFn: async () => {
			return getWorkspacePolicyReportSnapshots(
				workspaceId,
				networkId.trim(),
				25,
			);
		},
		enabled: networkId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const snapshotItems = useMemo(() => {
		const body = snapshots.data?.body as any;
		const list = body?.snapshots ?? body?.items ?? [];
		if (!Array.isArray(list)) return [];
		return list
			.map((s: any) => ({
				id: String(s?.id ?? ""),
				createdAt: String(s?.createdAt ?? s?.timestamp ?? ""),
			}))
			.filter((s: any) => s.id);
	}, [snapshots.data]);

	const openCheck = useMutation({
		mutationFn: async (id: string) => {
			return getWorkspacePolicyReportCheck(workspaceId, id);
		},
		onError: (e) =>
			toast.error("Failed to load check", {
				description: (e as Error).message,
			}),
	});

	const runCheck = useMutation({
		mutationFn: async (checkId: string) => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId,
				parameters: paramsByCheck[checkId],
			});
		},
		onSuccess: (resp, checkId) => {
			setResultsByCheck((prev) => ({ ...prev, [checkId]: resp }));
			toast.success("Check completed", { description: checkId });
		},
		onError: (e) =>
			toast.error("Check failed", { description: (e as Error).message }),
	});

	const runPack = useMutation({
		mutationFn: async (packId: string) => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return runWorkspacePolicyReportPack(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				packId,
			});
		},
		onSuccess: (resp) => {
			setResultsByCheck((prev) => ({ ...prev, ...resp.results }));
			setLastPackRun(resp);
			toast.success("Pack completed", { description: resp.packId });
		},
		onError: (e) =>
			toast.error("Pack failed", { description: (e as Error).message }),
	});

	const runDelta = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const packId = deltaPackId.trim();
			if (!packId) throw new Error("Pack is required");
			const base = baselineSnapshotId.trim();
			const comp = compareSnapshotId.trim();
			if (!base || !comp)
				throw new Error("Baseline and compare snapshots required");
			return runWorkspacePolicyReportPackDelta(workspaceId, {
				networkId: net,
				packId,
				baselineSnapshotId: base,
				compareSnapshotId: comp,
				maxSamplesPerBucket: 20,
			});
		},
		onSuccess: (resp) => {
			setLastDeltaRun(resp);
			toast.success("Delta completed", { description: resp.packId });
		},
		onError: (e) =>
			toast.error("Delta failed", { description: (e as Error).message }),
	});

	const checksList: PolicyReportCatalogCheck[] = checks.data?.checks ?? [];
	const packsList: PolicyReportPack[] = packs.data?.packs ?? [];

	const activeParamsCheck = useMemo(() => {
		if (!paramsDialogCheckId) return null;
		return checksList.find((c) => c.id === paramsDialogCheckId) ?? null;
	}, [checksList, paramsDialogCheckId]);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-muted-foreground" />
						<h1 className="text-2xl font-bold tracking-tight">
							Policy Reports
						</h1>
						<Badge variant="secondary">Demo</Badge>
					</div>
					<p className="text-muted-foreground text-sm">
						Run parameterized NQE checks and packs against a Forward network and
						snapshot. Export findings as JSON for lightweight reporting.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link
						to="/dashboard/workspaces/$workspaceId"
						params={{ workspaceId }}
						className={buttonVariants({ variant: "outline" })}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Workspace
					</Link>
					<Button
						variant="outline"
						onClick={() => {
							const net = networkId.trim();
							downloadJSON(
								`policy-reports_${workspaceId}_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
								{
									workspaceId,
									networkId: net,
									snapshotId: snapshotId.trim() || undefined,
									generatedAt: new Date().toISOString(),
									resultsByCheck,
									lastPackRun,
									paramsByCheck,
								},
							);
						}}
						disabled={Object.keys(resultsByCheck).length === 0}
					>
						<Download className="mr-2 h-4 w-4" />
						Export results
					</Button>
					<Button
						variant="outline"
						onClick={() => {
							const net = networkId.trim();
							const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Policy Reports</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; }
    h1 { margin: 0 0 6px 0; }
    .meta { color: #555; margin-bottom: 16px; }
    pre { background: #0b1020; color: #e9edf7; padding: 12px; border-radius: 8px; overflow-x: auto; }
    .card { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin: 14px 0; }
  </style>
</head>
<body>
  <h1>Policy Reports</h1>
  <div class="meta">
    workspaceId=${workspaceId}<br/>
    networkId=${net || ""}<br/>
    snapshotId=${snapshotId.trim() || "latest"}<br/>
    generatedAt=${new Date().toISOString()}
  </div>
  <div class="card">
    <h2>Last Pack Run</h2>
    <pre>${jsonPretty(lastPackRun)}</pre>
  </div>
  <div class="card">
    <h2>Results By Check</h2>
    <pre>${jsonPretty(resultsByCheck)}</pre>
  </div>
</body>
</html>`;
							downloadText(
								`policy-reports_${workspaceId}_${net || "network"}_${snapshotId.trim() || "latest"}.html`,
								"text/html",
								html,
							);
						}}
						disabled={Object.keys(resultsByCheck).length === 0}
					>
						<Download className="mr-2 h-4 w-4" />
						Export HTML
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Target</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<div className="text-sm font-medium">Forward Network ID</div>
						<Input
							value={networkId}
							onChange={(e) => setNetworkId(e.target.value)}
							placeholder="e.g. 235216"
						/>
						<p className="text-xs text-muted-foreground">
							This is the Forward network id (not the name). Policy Reports uses
							the workspace Forward credentials on the server.
						</p>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="text-sm font-medium">Snapshot</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => snapshots.refetch()}
								disabled={!networkId.trim() || snapshots.isFetching}
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Refresh
							</Button>
						</div>
						<Select value={snapshotId} onValueChange={(v) => setSnapshotId(v)}>
							<SelectTrigger>
								<SelectValue placeholder="Latest or choose one" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">(Let Forward choose)</SelectItem>
								{snapshotItems.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.id}
										{s.createdAt ? ` (${s.createdAt})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{snapshots.isError ? (
							<p className="text-xs text-destructive">
								Failed to load snapshots: {(snapshots.error as Error).message}
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
				<TabsList>
					<TabsTrigger value="checks">Checks</TabsTrigger>
					<TabsTrigger value="packs">Packs</TabsTrigger>
					<TabsTrigger value="deltas">Deltas</TabsTrigger>
				</TabsList>

				<TabsContent value="checks" className="space-y-4">
					{checks.isLoading ? (
						<Card>
							<CardContent className="p-6 text-sm text-muted-foreground">
								Loading checks…
							</CardContent>
						</Card>
					) : null}

					{checks.isError ? (
						<Card>
							<CardContent className="p-6 text-sm text-destructive">
								Failed to load checks: {(checks.error as Error).message}
							</CardContent>
						</Card>
					) : null}

					{checksList.map((c) => {
						const id = c.id;
						const result = resultsByCheck[id];
						const hasParams = (c.params ?? []).length > 0;
						const customParams = paramsByCheck[id];
						return (
							<Card key={id}>
								<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<CardTitle className="text-base">
												{c.title ?? id}
											</CardTitle>
											{c.severity ? (
												<Badge variant={severityVariant(c.severity)}>
													{c.severity}
												</Badge>
											) : null}
											{c.category ? (
												<Badge variant="secondary">{c.category}</Badge>
											) : null}
											{hasParams ? (
												<Badge variant="outline">params</Badge>
											) : null}
											{customParams && Object.keys(customParams).length > 0 ? (
												<Badge variant="outline">customized</Badge>
											) : null}
										</div>
										{c.description ? (
											<p className="text-sm text-muted-foreground">
												{c.description}
											</p>
										) : null}
										<p className="text-xs text-muted-foreground">{id}</p>
									</div>
									<div className="flex items-center gap-2">
										{hasParams ? (
											<Button
												variant="outline"
												onClick={() => {
													setParamsDialogCheckId(id);
													const base =
														paramsByCheck[id] ?? defaultParamsForCheck(c);
													setParamsDraft(base);

													const text: Record<string, string> = {};
													for (const p of c.params ?? []) {
														const name = String(p.name ?? "").trim();
														if (!name) continue;
														if (!isListType(p.type)) continue;
														const v = (base as any)[name] ?? p.default ?? [];
														text[name] = JSON.stringify(v, null, 0);
													}
													setParamsDraftText(text);
													setParamsDraftErrors({});
												}}
											>
												<Settings2 className="mr-2 h-4 w-4" />
												Parameters
											</Button>
										) : null}
										<Button
											variant="outline"
											onClick={async () => {
												setOpenCheckId(id);
												await openCheck.mutateAsync(id);
											}}
										>
											View query
										</Button>
										<Button
											onClick={() => runCheck.mutate(id)}
											disabled={runCheck.isPending}
										>
											<Play className="mr-2 h-4 w-4" />
											Run
										</Button>
										<Button
											variant="outline"
											onClick={() => {
												const net = networkId.trim();
												downloadJSON(
													`policy-report_${id}_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
													{
														workspaceId,
														networkId: net,
														snapshotId: snapshotId.trim() || undefined,
														checkId: id,
														parameters: paramsByCheck[id],
														result,
													},
												);
											}}
											disabled={!result}
										>
											<Download className="mr-2 h-4 w-4" />
											Export
										</Button>
										<Button
											variant="outline"
											onClick={() => {
												const net = networkId.trim();
												const csv = resultsToCSV(result?.results);
												if (!csv) {
													toast.error(
														"CSV export only supports array-of-object results",
													);
													return;
												}
												downloadText(
													`policy-report_${id}_${net || "network"}_${snapshotId.trim() || "latest"}.csv`,
													"text/csv",
													csv,
												);
											}}
											disabled={!result}
										>
											<Download className="mr-2 h-4 w-4" />
											CSV
										</Button>
									</div>
								</CardHeader>
								{result ? (
									<CardContent className="space-y-3">
										<div className="grid gap-3 md:grid-cols-2">
											<div className="text-sm">
												<div className="text-muted-foreground">Total</div>
												<div className="font-medium">{result.total}</div>
											</div>
											<div className="text-sm">
												<div className="text-muted-foreground">Snapshot</div>
												<div className="font-medium">
													{result.snapshotId ?? "(unknown)"}
												</div>
											</div>
										</div>
										<Textarea
											readOnly
											className="font-mono text-xs"
											rows={10}
											value={jsonPretty(result.results)}
										/>
									</CardContent>
								) : null}
							</Card>
						);
					})}
				</TabsContent>

				<TabsContent value="packs" className="space-y-4">
					{packs.isLoading ? (
						<Card>
							<CardContent className="p-6 text-sm text-muted-foreground">
								Loading packs…
							</CardContent>
						</Card>
					) : null}

					{packs.isError ? (
						<Card>
							<CardContent className="p-6 text-sm text-destructive">
								Failed to load packs: {(packs.error as Error).message}
							</CardContent>
						</Card>
					) : null}

					{packsList.map((p) => (
						<Card key={p.id}>
							<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base">{p.title ?? p.id}</CardTitle>
									{p.description ? (
										<p className="text-sm text-muted-foreground">
											{p.description}
										</p>
									) : null}
									<p className="text-xs text-muted-foreground">
										{(p.checks ?? []).length} checks
									</p>
								</div>
								<div className="flex items-center gap-2">
									<Button
										onClick={() => runPack.mutate(p.id)}
										disabled={runPack.isPending}
									>
										<Play className="mr-2 h-4 w-4" />
										Run pack
									</Button>
									<Button
										variant="outline"
										onClick={() => {
											const net = networkId.trim();
											downloadJSON(
												`policy-pack_${p.id}_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
												{
													workspaceId,
													networkId: net,
													snapshotId: snapshotId.trim() || undefined,
													pack: p,
													lastPackRun:
														lastPackRun?.packId === p.id ? lastPackRun : null,
												},
											);
										}}
										disabled={!lastPackRun || lastPackRun.packId !== p.id}
									>
										<Download className="mr-2 h-4 w-4" />
										Export pack
									</Button>
								</div>
							</CardHeader>
						</Card>
					))}
				</TabsContent>

				<TabsContent value="deltas" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Snapshot Delta</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<div className="text-sm font-medium">Pack</div>
								<Select value={deltaPackId} onValueChange={setDeltaPackId}>
									<SelectTrigger>
										<SelectValue placeholder="Choose a pack" />
									</SelectTrigger>
									<SelectContent>
										{packsList.map((p) => (
											<SelectItem key={p.id} value={p.id}>
												{p.title ?? p.id}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Baseline snapshot</div>
								<Select
									value={baselineSnapshotId}
									onValueChange={setBaselineSnapshotId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select baseline" />
									</SelectTrigger>
									<SelectContent>
										{snapshotItems.map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{s.id}
												{s.createdAt ? ` (${s.createdAt})` : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Compare snapshot</div>
								<Select
									value={compareSnapshotId}
									onValueChange={setCompareSnapshotId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select compare" />
									</SelectTrigger>
									<SelectContent>
										{snapshotItems.map((s) => (
											<SelectItem key={s.id} value={s.id}>
												{s.id}
												{s.createdAt ? ` (${s.createdAt})` : ""}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</CardContent>
						<CardContent className="flex items-center gap-2 pt-0">
							<Button
								onClick={() => runDelta.mutate()}
								disabled={runDelta.isPending}
							>
								<Play className="mr-2 h-4 w-4" />
								Run delta
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									if (!lastDeltaRun) return;
									const net = networkId.trim();
									downloadJSON(
										`policy-pack-delta_${lastDeltaRun.packId}_${net || "network"}_${lastDeltaRun.baselineSnapshotId}_to_${lastDeltaRun.compareSnapshotId}.json`,
										lastDeltaRun,
									);
								}}
								disabled={!lastDeltaRun}
							>
								<Download className="mr-2 h-4 w-4" />
								Export delta
							</Button>
						</CardContent>
					</Card>

					{lastDeltaRun ? (
						<Card>
							<CardHeader>
								<CardTitle>Delta Results</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<Textarea
									readOnly
									className="font-mono text-xs"
									rows={14}
									value={jsonPretty(lastDeltaRun)}
								/>
							</CardContent>
						</Card>
					) : null}
				</TabsContent>
			</Tabs>

			<Dialog
				open={!!openCheckId}
				onOpenChange={(v) => {
					if (!v) setOpenCheckId("");
				}}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Check Query</DialogTitle>
						<DialogDescription>{openCheckId}</DialogDescription>
					</DialogHeader>
					<Textarea
						readOnly
						className="font-mono text-xs"
						rows={18}
						value={
							openCheck.data?.content ?? (openCheck.isPending ? "Loading…" : "")
						}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!paramsDialogCheckId}
				onOpenChange={(v) => {
					if (!v) setParamsDialogCheckId("");
				}}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Check Parameters</DialogTitle>
						<DialogDescription>{paramsDialogCheckId}</DialogDescription>
					</DialogHeader>

					{activeParamsCheck ? (
						<div className="space-y-4">
							{(activeParamsCheck.params ?? []).map(
								(p: PolicyReportCatalogParam) => {
									const name = String(p.name ?? "").trim();
									if (!name) return null;
									const t = String(p.type ?? "").replaceAll(" ", "");
									const err = paramsDraftErrors[name];

									if (isListType(t)) {
										const v =
											paramsDraftText[name] ??
											JSON.stringify(
												(paramsDraft as any)[name] ?? p.default ?? [],
												null,
												0,
											);
										return (
											<div key={name} className="space-y-2">
												<div className="flex items-center justify-between gap-2">
													<div className="text-sm font-medium">{name}</div>
													<Badge variant="secondary">{t || "List"}</Badge>
												</div>
												{p.description ? (
													<p className="text-xs text-muted-foreground">
														{p.description}
													</p>
												) : null}
												<Textarea
													className="font-mono text-xs"
													rows={4}
													value={v}
													onChange={(e) => {
														const next = e.target.value;
														setParamsDraftText((prev) => ({
															...prev,
															[name]: next,
														}));
														try {
															const parsed = JSON.parse(next);
															setParamsDraft((prev) => ({
																...prev,
																[name]: parsed,
															}));
															setParamsDraftErrors((prev) => {
																const copy = { ...prev };
																delete copy[name];
																return copy;
															});
														} catch (e2) {
															setParamsDraftErrors((prev) => ({
																...prev,
																[name]: (e2 as Error).message,
															}));
														}
													}}
												/>
												{err ? (
													<p className="text-xs text-destructive">
														Invalid JSON: {err}
													</p>
												) : null}
											</div>
										);
									}

									if (t.toLowerCase() === "bool") {
										const cur = Boolean(
											(paramsDraft as any)[name] ?? p.default ?? false,
										);
										return (
											<div key={name} className="space-y-2">
												<div className="flex items-center justify-between gap-2">
													<div className="text-sm font-medium">{name}</div>
													<Badge variant="secondary">Bool</Badge>
												</div>
												{p.description ? (
													<p className="text-xs text-muted-foreground">
														{p.description}
													</p>
												) : null}
												<Select
													value={cur ? "true" : "false"}
													onValueChange={(v) =>
														setParamsDraft((prev) => ({
															...prev,
															[name]: v === "true",
														}))
													}
												>
													<SelectTrigger>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="true">true</SelectItem>
														<SelectItem value="false">false</SelectItem>
													</SelectContent>
												</Select>
											</div>
										);
									}

									if (t.toLowerCase() === "integer") {
										const cur = (paramsDraft as any)[name];
										const v =
											typeof cur === "number"
												? String(cur)
												: cur === undefined
													? String((p.default as any) ?? "")
													: String(cur);
										return (
											<div key={name} className="space-y-2">
												<div className="flex items-center justify-between gap-2">
													<div className="text-sm font-medium">{name}</div>
													<Badge variant="secondary">Integer</Badge>
												</div>
												{p.description ? (
													<p className="text-xs text-muted-foreground">
														{p.description}
													</p>
												) : null}
												<Input
													inputMode="numeric"
													value={v}
													onChange={(e) => {
														const raw = e.target.value;
														const n = Number(raw);
														setParamsDraft((prev) => ({
															...prev,
															[name]: Number.isFinite(n) ? n : raw,
														}));
													}}
												/>
											</div>
										);
									}

									// Default: treat as string.
									const cur = (paramsDraft as any)[name] ?? p.default ?? "";
									return (
										<div key={name} className="space-y-2">
											<div className="flex items-center justify-between gap-2">
												<div className="text-sm font-medium">{name}</div>
												<Badge variant="secondary">{t || "String"}</Badge>
											</div>
											{p.description ? (
												<p className="text-xs text-muted-foreground">
													{p.description}
												</p>
											) : null}
											<Input
												value={String(cur)}
												onChange={(e) =>
													setParamsDraft((prev) => ({
														...prev,
														[name]: e.target.value,
													}))
												}
											/>
										</div>
									);
								},
							)}

							<div className="flex items-center justify-between gap-2 pt-2">
								<Button
									variant="outline"
									onClick={() => {
										const base = defaultParamsForCheck(activeParamsCheck);
										setParamsDraft(base);
										setParamsDraftText({});
										setParamsDraftErrors({});
									}}
								>
									Reset to defaults
								</Button>
								<Button
									onClick={() => {
										if (Object.keys(paramsDraftErrors).length > 0) {
											toast.error("Fix parameter errors before saving");
											return;
										}
										const id = paramsDialogCheckId;
										setParamsByCheck((prev) => ({
											...prev,
											[id]: paramsDraft,
										}));
										setParamsDialogCheckId("");
										toast.success("Parameters saved", { description: id });
									}}
								>
									Save
								</Button>
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">No parameters.</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
