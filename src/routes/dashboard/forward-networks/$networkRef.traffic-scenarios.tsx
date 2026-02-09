import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { listUserForwardNetworks, listWorkspaceForwardNetworks } from "@/lib/skyforge-api";
import {
	type AssuranceTrafficDemand,
	type AssuranceTrafficSeedRequest,
	postAssuranceTrafficEvaluate,
	postAssuranceTrafficSeeds,
} from "@/lib/assurance-traffic-api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Play, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
	workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-networks/$networkRef/traffic-scenarios",
)({
	validateSearch: (search) => searchSchema.parse(search),
	component: ForwardNetworkTrafficScenariosPage,
});

function splitParts(text: string): string[] {
	return String(text ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function demandsToCSV(demands: AssuranceTrafficDemand[]): string {
	const lines = [
		"from,srcIp,dstIp,ipProto,srcPort,dstPort,bandwidthGbps,label",
	];
	for (const d of demands ?? []) {
		const from = String(d.from ?? "")
			.replaceAll(",", " ")
			.trim();
		const srcIp = String(d.srcIp ?? "")
			.replaceAll(",", " ")
			.trim();
		const dstIp = String(d.dstIp ?? "")
			.replaceAll(",", " ")
			.trim();
		const ipProto = d.ipProto === undefined ? "" : String(d.ipProto);
		const srcPort = String(d.srcPort ?? "")
			.replaceAll(",", " ")
			.trim();
		const dstPort = String(d.dstPort ?? "")
			.replaceAll(",", " ")
			.trim();
		const bw = d.bandwidthGbps === undefined ? "" : String(d.bandwidthGbps);
		const label = String(d.label ?? "")
			.replaceAll(",", " ")
			.trim();
		lines.push(
			[from, srcIp, dstIp, ipProto, srcPort, dstPort, bw, label].join(","),
		);
	}
	return lines.join("\n") + "\n";
}

function parseCSVLine(line: string): string[] {
	// Demo-grade parser: no quoted/escaped commas.
	return String(line ?? "")
		.split(",")
		.map((s) => s.trim());
}

function parseDemandsCSV(text: string): AssuranceTrafficDemand[] {
	const out: AssuranceTrafficDemand[] = [];
	const lines = String(text ?? "")
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);
	if (!lines.length) return out;

	const lower0 = lines[0]!.toLowerCase();
	const hasHeader =
		lower0.includes("dstip") ||
		lower0.includes("bandwidth") ||
		lower0.includes("ipproto");

	let headerMap = new Map<string, number>();
	let start = 0;
	if (hasHeader) {
		const header = parseCSVLine(lines[0]!);
		for (let i = 0; i < header.length; i++) {
			const k = String(header[i] ?? "")
				.trim()
				.toLowerCase();
			if (k) headerMap.set(k, i);
		}
		start = 1;
	}

	const get = (parts: string[], key: string, idxFallback: number): string => {
		const idx = headerMap.get(key);
		if (idx !== undefined) return String(parts[idx] ?? "").trim();
		return String(parts[idxFallback] ?? "").trim();
	};

	for (let i = start; i < lines.length; i++) {
		const parts = parseCSVLine(lines[i]!);

		// Back-compat: if no header, accept old 4-col layout: from,dstIp,bandwidthGbps,label.
		// If no header but 8+ cols, treat it as the new layout.
		const noHeaderNewLayout = !hasHeader && parts.length >= 7;

		const from = get(parts, "from", 0);
		const srcIp = hasHeader || noHeaderNewLayout ? get(parts, "srcip", 1) : "";
		const dstIp =
			hasHeader || noHeaderNewLayout
				? get(parts, "dstip", 2)
				: get(parts, "dstip", 1);
		if (!dstIp) continue;

		const ipProtoRaw =
			hasHeader || noHeaderNewLayout ? get(parts, "ipproto", 3) : "";
		const srcPort =
			hasHeader || noHeaderNewLayout ? get(parts, "srcport", 4) : "";
		const dstPort =
			hasHeader || noHeaderNewLayout ? get(parts, "dstport", 5) : "";

		const bwRaw =
			hasHeader || noHeaderNewLayout
				? get(parts, "bandwidthgbps", 6)
				: get(parts, "bandwidthgbps", 2);
		const label =
			hasHeader || noHeaderNewLayout
				? get(parts, "label", 7)
				: get(parts, "label", 3);

		const bw = bwRaw ? Number(bwRaw) : NaN;
		const ipProto = ipProtoRaw ? Number(ipProtoRaw) : NaN;

		out.push({
			from: from || undefined,
			srcIp: srcIp || undefined,
			dstIp,
			ipProto: Number.isFinite(ipProto) ? ipProto : undefined,
			srcPort: srcPort || undefined,
			dstPort: dstPort || undefined,
			bandwidthGbps: Number.isFinite(bw) ? bw : undefined,
			label: label || undefined,
		});
	}
	return out;
}

function ForwardNetworkTrafficScenariosPage() {
	const { networkRef } = Route.useParams();
	const { workspace } = Route.useSearch();
	const workspaceId = String(workspace ?? "").trim();

	const [seedMode, setSeedMode] = useState("mesh");
	const [includeGroups, setIncludeGroups] = useState(true);

	const [tagPartsText, setTagPartsText] = useState("");
	const [namePartsText, setNamePartsText] = useState("");
	const [deviceTypesText, setDeviceTypesText] = useState("");

	const [srcTagPartsText, setSrcTagPartsText] = useState("");
	const [srcNamePartsText, setSrcNamePartsText] = useState("");
	const [srcDeviceTypesText, setSrcDeviceTypesText] = useState("");

	const [dstTagPartsText, setDstTagPartsText] = useState("");
	const [dstNamePartsText, setDstNamePartsText] = useState("");
	const [dstDeviceTypesText, setDstDeviceTypesText] = useState("");

	const [maxDevices, setMaxDevices] = useState("30");
	const [maxDemands, setMaxDemands] = useState("200");
	const [snapshotId, setSnapshotId] = useState("");
	const [window, setWindow] = useState("7d");
	const [threshold, setThreshold] = useState("0.8");
	const [demandsText, setDemandsText] = useState("");
	const [includeHops, setIncludeHops] = useState(false);
	const [projectLoad, setProjectLoad] = useState(true);
	const [includeAcl, setIncludeAcl] = useState(false);
	const [maxResults, setMaxResults] = useState("3");
	const [requireEnforcement, setRequireEnforcement] = useState(true);

	const networksQ = useQuery({
		queryKey: queryKeys.workspaceForwardNetworks(workspaceId),
		queryFn: () => listWorkspaceForwardNetworks(workspaceId),
		enabled: Boolean(workspaceId),
		retry: false,
		staleTime: 30_000,
	});

	const userNetworksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(),
		queryFn: listUserForwardNetworks,
		retry: false,
		staleTime: 30_000,
	});

	const networkName = useMemo(() => {
		const ns = (networksQ.data?.networks ?? []) as any[];
		const us = (userNetworksQ.data?.networks ?? []) as any[];
		const hit =
			ns.find((n) => String(n?.id ?? "") === String(networkRef)) ??
			us.find((n) => String(n?.id ?? "") === String(networkRef));
		return String(hit?.name ?? "");
	}, [networksQ.data?.networks, userNetworksQ.data?.networks, networkRef]);

	const seedMutation = useMutation({
		mutationFn: async () => {
			const mode = String(seedMode ?? "mesh");
			const req: AssuranceTrafficSeedRequest = {
				snapshotId: snapshotId.trim() || undefined,
				maxDevices: Number(maxDevices) || 30,
				maxDemands: Number(maxDemands) || 200,
				mode,
				includeGroups,
			};
			if (mode === "cross") {
				req.srcTagParts = splitParts(srcTagPartsText);
				req.srcNameParts = splitParts(srcNamePartsText);
				req.srcDeviceTypes = splitParts(srcDeviceTypesText);
				req.dstTagParts = splitParts(dstTagPartsText);
				req.dstNameParts = splitParts(dstNamePartsText);
				req.dstDeviceTypes = splitParts(dstDeviceTypesText);
			} else {
				req.tagParts = splitParts(tagPartsText);
				req.nameParts = splitParts(namePartsText);
				req.deviceTypes = splitParts(deviceTypesText);
			}
			return postAssuranceTrafficSeeds(workspaceId, networkRef, req);
		},
		onSuccess: (resp) => {
			setDemandsText(demandsToCSV(resp.demands ?? []));
			const mode = String(seedMode ?? "mesh");
			const srcN =
				mode === "cross"
					? (resp.srcEndpoints?.length ?? 0)
					: (resp.endpoints?.length ?? 0);
			const dstN =
				mode === "cross"
					? (resp.dstEndpoints?.length ?? 0)
					: (resp.endpoints?.length ?? 0);
			toast.success(
				`Seeded src=${srcN}, dst=${dstN}, demands=${resp.demands?.length ?? 0}`,
			);
		},
		onError: (e: any) => {
			toast.error(String(e?.message ?? e ?? "seed failed"));
		},
	});

	const evalMutation = useMutation({
		mutationFn: async () => {
			const demands = parseDemandsCSV(demandsText);
			if (!demands.length) throw new Error("no demands parsed from CSV");
			const thr = Number(threshold);
			const mr = Number(maxResults);
			return postAssuranceTrafficEvaluate(workspaceId, networkRef, {
				snapshotId: snapshotId.trim() || undefined,
				window,
				thresholdUtil: Number.isFinite(thr) ? thr : 0.8,
				forward: {
					maxResults: Number.isFinite(mr) && mr > 0 ? mr : 3,
				},
				enforcement: {
					requireEnforcement,
				},
				demands,
				includeHops,
				includeAcl,
				projectLoad,
			});
		},
		onError: (e: any) => {
			toast.error(String(e?.message ?? e ?? "evaluate failed"));
		},
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="sm">
						<Link
							to="/dashboard/forward-networks"
							search={{ workspace: workspaceId }}
						>
							<ArrowLeft className="h-4 w-4" />
							<span className="ml-2">Forward Networks</span>
						</Link>
					</Button>
					<div>
						<div className="text-sm text-muted-foreground">
							Traffic Scenarios
						</div>
						<div className="text-lg font-semibold">
							{networkName || networkRef}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">Forward Paths + NQE</Badge>
					<Button asChild variant="outline" size="sm">
						<Link
							to="/dashboard/forward-networks/$networkRef/assurance-studio"
							params={{ networkRef }}
							search={{ workspace: workspaceId } as any}
						>
							Assurance Studio
						</Link>
					</Button>
					{networksQ.isLoading ? <Skeleton className="h-6 w-24" /> : null}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Scenario Inputs</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Workspace</div>
							<Input value={workspaceId} readOnly />
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">
								Forward snapshotId (optional)
							</div>
							<Input
								value={snapshotId}
								onChange={(e) => setSnapshotId(e.target.value)}
								placeholder="latest processed"
							/>
						</div>
					</div>

					<Tabs defaultValue="seed">
						<TabsList>
							<TabsTrigger value="seed">
								<Sparkles className="h-4 w-4" />
								<span className="ml-2">Seed</span>
							</TabsTrigger>
							<TabsTrigger value="demands">
								<Play className="h-4 w-4" />
								<span className="ml-2">Demands</span>
							</TabsTrigger>
						</TabsList>
						<TabsContent value="seed" className="space-y-3">
							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">Mode</div>
									<Select value={seedMode} onValueChange={setSeedMode}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="mesh">Mesh (src=dst set)</SelectItem>
											<SelectItem value="cross">
												Cross (separate src and dst sets)
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Include groups in tag matching
									</div>
									<div className="flex h-10 items-center gap-2 rounded-md border px-3">
										<input
											type="checkbox"
											checked={includeGroups}
											onChange={(e) => setIncludeGroups(e.target.checked)}
										/>
										<span className="text-sm text-muted-foreground">
											Match <span className="font-mono">tagParts</span> against
											group names too
										</span>
									</div>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Seed behavior
									</div>
									<div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
										Seeds demands from device management IPs discovered via NQE
										against the Forward snapshot.
									</div>
								</div>
							</div>

							{seedMode === "cross" ? (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div className="space-y-2 rounded-md border p-3">
										<div className="text-sm font-medium">Source endpoints</div>
										<div className="space-y-1">
											<div className="text-sm text-muted-foreground">
												Src tag parts
											</div>
											<Input
												value={srcTagPartsText}
												onChange={(e) => setSrcTagPartsText(e.target.value)}
												placeholder="core,bng"
											/>
										</div>
										<div className="space-y-1">
											<div className="text-sm text-muted-foreground">
												Src name parts
											</div>
											<Input
												value={srcNamePartsText}
												onChange={(e) => setSrcNamePartsText(e.target.value)}
												placeholder="nyc,den"
											/>
										</div>
										<div className="space-y-1">
											<div className="text-sm text-muted-foreground">
												Src device types
											</div>
											<Input
												value={srcDeviceTypesText}
												onChange={(e) => setSrcDeviceTypesText(e.target.value)}
												placeholder="ROUTER,SWITCH"
											/>
										</div>
									</div>
									<div className="space-y-2 rounded-md border p-3">
										<div className="text-sm font-medium">
											Destination endpoints
										</div>
										<div className="space-y-1">
											<div className="text-sm text-muted-foreground">
												Dst tag parts
											</div>
											<Input
												value={dstTagPartsText}
												onChange={(e) => setDstTagPartsText(e.target.value)}
												placeholder="peering,edge"
											/>
										</div>
										<div className="space-y-1">
											<div className="text-sm text-muted-foreground">
												Dst name parts
											</div>
											<Input
												value={dstNamePartsText}
												onChange={(e) => setDstNamePartsText(e.target.value)}
												placeholder="sjc,iad"
											/>
										</div>
										<div className="space-y-1">
											<div className="text-sm text-muted-foreground">
												Dst device types
											</div>
											<Input
												value={dstDeviceTypesText}
												onChange={(e) => setDstDeviceTypesText(e.target.value)}
												placeholder="ROUTER"
											/>
										</div>
									</div>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Tag parts (comma-separated)
										</div>
										<Input
											value={tagPartsText}
											onChange={(e) => setTagPartsText(e.target.value)}
											placeholder="core,bng,peering"
										/>
									</div>
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Name parts (comma-separated)
										</div>
										<Input
											value={namePartsText}
											onChange={(e) => setNamePartsText(e.target.value)}
											placeholder="nyc,den"
										/>
									</div>
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Device types (comma-separated)
										</div>
										<Input
											value={deviceTypesText}
											onChange={(e) => setDeviceTypesText(e.target.value)}
											placeholder="ROUTER,SWITCH"
										/>
									</div>
								</div>
							)}

							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Max devices
									</div>
									<Input
										value={maxDevices}
										onChange={(e) => setMaxDevices(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Max demands
									</div>
									<Input
										value={maxDemands}
										onChange={(e) => setMaxDemands(e.target.value)}
									/>
								</div>
								<div className="flex items-end">
									<Button
										disabled={!workspaceId || seedMutation.isPending}
										onClick={() => seedMutation.mutate()}
									>
										Seed demands
									</Button>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="demands" className="space-y-3">
							<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">Window</div>
									<Select value={window} onValueChange={setWindow}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="24h">24h</SelectItem>
											<SelectItem value="7d">7d</SelectItem>
											<SelectItem value="30d">30d</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Threshold util (0-1)
									</div>
									<Input
										value={threshold}
										onChange={(e) => setThreshold(e.target.value)}
									/>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Max results
									</div>
									<Input
										value={maxResults}
										onChange={(e) => setMaxResults(e.target.value)}
									/>
								</div>
								<div className="flex items-end gap-2">
									<Button
										disabled={!workspaceId || evalMutation.isPending}
										onClick={() => evalMutation.mutate()}
									>
										Evaluate
									</Button>
									<Button
										variant="secondary"
										onClick={() => setDemandsText("")}
									>
										Clear
									</Button>
								</div>
							</div>

							<div className="space-y-1">
								<div className="text-sm text-muted-foreground">
									Demands CSV:{" "}
									<span className="font-mono">
										from,srcIp,dstIp,ipProto,srcPort,dstPort,bandwidthGbps,label
									</span>
								</div>
								<textarea
									className="min-h-[220px] w-full rounded-md border bg-background p-3 font-mono text-sm"
									value={demandsText}
									onChange={(e) => setDemandsText(e.target.value)}
									placeholder="from,srcIp,dstIp,ipProto,srcPort,dstPort,bandwidthGbps,label\ncore-r1,,10.0.0.1,,,,2.5,svc-a"
								/>
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={includeHops}
											onChange={(e) => setIncludeHops(e.target.checked)}
										/>
										Include hops
									</label>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={projectLoad}
											onChange={(e) => {
												const v = e.target.checked;
												setProjectLoad(v);
												if (v) setIncludeHops(true);
											}}
										/>
										Project load (needs bandwidthGbps; turns on hops)
									</label>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={requireEnforcement}
											onChange={(e) => setRequireEnforcement(e.target.checked)}
										/>
										Require enforcement traversal
									</label>
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={includeAcl}
											onChange={(e) => setIncludeAcl(e.target.checked)}
										/>
										Include ACL/NF details (slower)
									</label>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Results</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{evalMutation.isPending ? <Skeleton className="h-20 w-full" /> : null}
					{evalMutation.data ? (
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge variant="secondary">
									Demands: {evalMutation.data.summary.totalDemands}
								</Badge>
								<Badge variant="secondary">
									Delivered: {evalMutation.data.summary.delivered}
								</Badge>
								<Badge variant="secondary">
									Timed out: {evalMutation.data.summary.timedOut}
								</Badge>
								<Badge variant="secondary">
									Missing enforcement:{" "}
									{evalMutation.data.summary.missingEnforcement}
								</Badge>
								<Badge variant="secondary">
									Crosses threshold:{" "}
									{evalMutation.data.summary.crossesThreshold}
								</Badge>
							</div>

							{(evalMutation.data.interfaceImpacts ?? []).length > 0 ? (
								<div className="space-y-2">
									<div className="text-sm font-medium">Interface impacts</div>
									<div className="overflow-x-auto">
										<table className="w-full border-collapse text-sm">
											<thead>
												<tr className="border-b">
													<th className="p-2 text-left">Device</th>
													<th className="p-2 text-left">Interface</th>
													<th className="p-2 text-left">Dir</th>
													<th className="p-2 text-right">Base p95</th>
													<th className="p-2 text-right">Added (Gbps)</th>
													<th className="p-2 text-right">Projected</th>
													<th className="p-2 text-left">Crosses</th>
												</tr>
											</thead>
											<tbody>
												{[...(evalMutation.data.interfaceImpacts ?? [])]
													.sort(
														(a, b) =>
															Number(b.projectedUtil ?? 0) -
															Number(a.projectedUtil ?? 0),
													)
													.slice(0, 50)
													.map((r) => (
														<tr
															key={`${r.deviceName}:${r.interfaceName}:${r.direction}`}
															className="border-b"
														>
															<td className="p-2 font-mono text-xs">
																{r.deviceName}
															</td>
															<td className="p-2 font-mono text-xs">
																{r.interfaceName}
															</td>
															<td className="p-2 font-mono text-xs">
																{r.direction}
															</td>
															<td className="p-2 text-right font-mono text-xs">
																{r.baseP95Util !== undefined
																	? r.baseP95Util.toFixed(3)
																	: "—"}
															</td>
															<td className="p-2 text-right font-mono text-xs">
																{r.addedGbps !== undefined
																	? r.addedGbps.toFixed(3)
																	: "—"}
															</td>
															<td className="p-2 text-right font-mono text-xs">
																{r.projectedUtil !== undefined
																	? r.projectedUtil.toFixed(3)
																	: "—"}
															</td>
															<td className="p-2">
																{r.crossesThreshold ? (
																	<span className="text-amber-600">yes</span>
																) : (
																	<span className="text-muted-foreground">
																		no
																	</span>
																)}
															</td>
														</tr>
													))}
											</tbody>
										</table>
									</div>
									<div className="text-xs text-muted-foreground">
										Showing top 50 by projected utilization.
									</div>
								</div>
							) : null}

							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-sm">
									<thead>
										<tr className="border-b">
											<th className="p-2 text-left">#</th>
											<th className="p-2 text-left">Demand</th>
											<th className="p-2 text-left">Forward</th>
											<th className="p-2 text-left">Recommended</th>
											<th className="p-2 text-left">Outcome</th>
											<th className="p-2 text-left">Bottleneck</th>
											<th className="p-2 text-left">Candidates</th>
										</tr>
									</thead>
									<tbody>
										{evalMutation.data.items.map((it) => {
											const rec = it.candidates?.[it.recommended];
											const bn = rec?.bottleneck;
											return (
												<tr key={it.index} className="border-b">
													<td className="p-2 text-muted-foreground">
														{it.index + 1}
													</td>
													<td className="p-2">
														<div className="font-mono">
															{String(it.demand.from ?? "")} -&gt;{" "}
															{it.demand.dstIp}
														</div>
														{it.demand.bandwidthGbps !== undefined ? (
															<div className="text-muted-foreground">
																bw={it.demand.bandwidthGbps}G
															</div>
														) : null}
														{it.demand.label ? (
															<div className="text-muted-foreground">
																{it.demand.label}
															</div>
														) : null}
													</td>
													<td className="p-2">
														{it.queryUrl ? (
															<a
																className="text-primary underline"
																href={it.queryUrl}
																target="_blank"
																rel="noreferrer noopener"
															>
																query
															</a>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</td>
													<td className="p-2">{it.recommended}</td>
													<td className="p-2">
														<div>
															{rec?.forwardingOutcome ?? it.error ?? ""}
														</div>
														{rec && !rec.enforced ? (
															<div className="text-amber-600">
																missing enforcement
															</div>
														) : null}
													</td>
													<td className="p-2">
														{bn ? (
															<div className="font-mono">
																{bn.deviceName}:{bn.interfaceName} (
																{bn.direction})
																{bn.headroomGbps !== undefined
																	? ` headroom=${bn.headroomGbps.toFixed(2)}G`
																	: ""}
																{bn.crossesThreshold ? " crosses" : ""}
															</div>
														) : (
															<span className="text-muted-foreground">—</span>
														)}
													</td>
													<td className="p-2">
														<details>
															<summary className="cursor-pointer text-muted-foreground">
																{it.candidates?.length ?? 0}
															</summary>
															<div className="mt-2 space-y-2">
																{(it.candidates ?? []).map((c) => (
																	<div
																		key={c.index}
																		className="rounded-md border p-2"
																	>
																		<div className="flex flex-wrap items-center justify-between gap-2">
																			<div className="font-mono text-xs">
																				cand={c.index}
																			</div>
																			<div className="text-xs text-muted-foreground">
																				{c.enforced
																					? "enforced"
																					: "not enforced"}
																				{c.timedOut ? " • timeout" : ""}
																			</div>
																		</div>
																		<div className="mt-1 text-xs">
																			<span className="font-medium">fwd:</span>{" "}
																			<span className="font-mono">
																				{c.forwardingOutcome ?? "—"}
																			</span>
																		</div>
																		{c.securityOutcome ? (
																			<div className="mt-1 text-xs">
																				<span className="font-medium">
																					sec:
																				</span>{" "}
																				<span className="font-mono">
																					{c.securityOutcome}
																				</span>
																			</div>
																		) : null}
																		{c.bottleneck ? (
																			<div className="mt-1 text-xs font-mono text-muted-foreground">
																				{c.bottleneck.deviceName}:
																				{c.bottleneck.interfaceName} (
																				{c.bottleneck.direction})
																			</div>
																		) : null}
																		{(c.hops ?? []).length ? (
																			<div className="mt-1 text-xs text-muted-foreground">
																				hops={c.hops?.length ?? 0}
																			</div>
																		) : null}
																	</div>
																))}
															</div>
														</details>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">
							Seed demands and evaluate to see ranked path candidates.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
