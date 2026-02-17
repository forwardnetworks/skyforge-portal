import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
	type AssuranceScenario,
	type AssuranceScenarioSpec,
	createAssuranceStudioScenario,
	deleteAssuranceStudioScenario,
	listAssuranceStudioScenarios,
	postAssuranceStudioEvaluate,
	updateAssuranceStudioScenario,
} from "@/lib/assurance-studio-api";
import {
	type AssuranceStudioRun,
	createAssuranceStudioRun,
	getAssuranceStudioRun,
	listAssuranceStudioRuns,
} from "@/lib/assurance-studio-runs-api";
import {
	type AssuranceTrafficDemand,
	type AssuranceTrafficSeedRequest,
	postAssuranceTrafficSeeds,
} from "@/lib/assurance-traffic-api";
import { queryKeys } from "@/lib/query-keys";
import {
	type ForwardAssuranceSummaryResponse,
	type ForwardNetworkCapacityPathBottlenecksResponse,
	type ForwardNetworkCapacityUpgradeCandidatesResponse,
	type PolicyReportNQEResponse,
	type PolicyReportPathQuery,
	getForwardNetworkAssuranceSummary,
	getSession,
	listUserForwardNetworks,
	refreshForwardNetworkAssurance,
	seedForwardNetworkAssuranceDemo,
	storeUserPolicyReportPathsEnforcementBypass,
} from "@/lib/skyforge-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Play, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({
	scenario: z.string().optional().catch(""),
	tab: z.string().optional().catch("routing"),
});

export const Route = createFileRoute(
	"/dashboard/fwd/$networkRef/assurance-studio",
)({
	validateSearch: (search) => searchSchema.parse(search),
	component: AssuranceStudioPage,
});

function fmtRFC3339(s: string | undefined): string {
	const v = String(s ?? "").trim();
	if (!v) return "—";
	const t = Date.parse(v);
	if (!Number.isFinite(t)) return v;
	return new Date(t).toISOString();
}

function fmtAgeSeconds(ageSeconds: number | undefined): string {
	const s = Number(ageSeconds ?? Number.NaN);
	if (!Number.isFinite(s) || s < 0) return "—";
	const mins = Math.floor(s / 60);
	const hrs = Math.floor(mins / 60);
	if (hrs > 0) return `${hrs}h ${mins % 60}m`;
	if (mins > 0) return `${mins}m`;
	return `${Math.floor(s)}s`;
}

function splitParts(text: string): string[] {
	return String(text ?? "")
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

function downloadTextFile(name: string, mime: string, contents: string) {
	const blob = new Blob([contents], { type: mime });
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement("a");
		a.href = url;
		a.download = name;
		a.click();
	} finally {
		URL.revokeObjectURL(url);
	}
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

	const start = hasHeader ? 1 : 0;
	for (let i = start; i < lines.length; i++) {
		const parts = lines[i]!.split(",").map((s) => s.trim());
		if (!parts.length) continue;

		// Back-compat: old 4-col layout: from,dstIp,bandwidthGbps,label
		const isOld4 = !hasHeader && parts.length <= 4;
		const from = (parts[0] ?? "").trim();
		const srcIp = isOld4 ? "" : (parts[1] ?? "").trim();
		const dstIp = isOld4 ? (parts[1] ?? "").trim() : (parts[2] ?? "").trim();
		if (!dstIp) continue;

		const ipProtoRaw = isOld4 ? "" : (parts[3] ?? "").trim();
		const srcPort = isOld4 ? "" : (parts[4] ?? "").trim();
		const dstPort = isOld4 ? "" : (parts[5] ?? "").trim();
		const bwRaw = isOld4 ? (parts[2] ?? "").trim() : (parts[6] ?? "").trim();
		const label = isOld4 ? (parts[3] ?? "").trim() : (parts[7] ?? "").trim();

		const bw = bwRaw ? Number(bwRaw) : Number.NaN;
		const ipProto = ipProtoRaw ? Number(ipProtoRaw) : Number.NaN;

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

function demandsToPolicyReportsFlowSuite(
	demands: AssuranceTrafficDemand[],
): string {
	// Format per line: srcIp dstIp [ipProto] [dstPort]
	const lines: string[] = [];
	for (const d of demands ?? []) {
		const src = String(d.srcIp ?? "").trim();
		const dst = String(d.dstIp ?? "").trim();
		if (!src || !dst) continue;
		const ipProto = d.ipProto === undefined ? "" : String(d.ipProto);
		const dstPort = String(d.dstPort ?? "").trim();
		const parts = [src, dst];
		if (ipProto) parts.push(ipProto);
		if (dstPort) parts.push(dstPort);
		lines.push(parts.join(" "));
	}
	return lines.join("\n");
}

function AssuranceStudioPage() {
	const { networkRef } = Route.useParams();
	const { scenario, tab } = Route.useSearch();
	const navigate = Route.useNavigate();
	const qc = useQueryClient();
	const userContextId = "personal";
	const selectedScenarioId = String(scenario ?? "").trim();
	const activeTab = String(tab ?? "routing") || "routing";

	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const isAdmin = !!sessionQ.data?.isAdmin;

	const [newOpen, setNewOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDesc, setNewDesc] = useState("");

	// Draft editor state (derived from selected scenario).
	const [draftName, setDraftName] = useState("");
	const [draftDesc, setDraftDesc] = useState("");
	const [snapshotId, setSnapshotId] = useState("");
	const [baselineSnapshotId, setBaselineSnapshotId] = useState("");
	const [compareToBaseline, setCompareToBaseline] = useState(false);
	const [window, setWindow] = useState("7d");
	const [threshold, setThreshold] = useState("0.8");
	const [demandsText, setDemandsText] = useState("");
	const [dirty, setDirty] = useState(false);

	// Seed controls (same as Traffic Scenarios)
	const [seedMode, setSeedMode] = useState("mesh");
	const [includeGroups, setIncludeGroups] = useState(true);
	const [tagPartsText, setTagPartsText] = useState("");
	const [namePartsText, setNamePartsText] = useState("");
	const [deviceTypesText, setDeviceTypesText] = useState("");
	const [maxDevices, setMaxDevices] = useState("30");
	const [maxDemands, setMaxDemands] = useState("200");

	// Evaluate controls
	const [includeHops, setIncludeHops] = useState(false);
	const [projectLoad, setProjectLoad] = useState(true);
	const [includeAcl, setIncludeAcl] = useState(false);
	const [maxResults, setMaxResults] = useState("3");
	const [requireEnforcement, setRequireEnforcement] = useState(true);
	const [includeSecurityInRun, setIncludeSecurityInRun] = useState(true);
	const [runDetailOpen, setRunDetailOpen] = useState(false);
	const [runDetailId, setRunDetailId] = useState("");
	const [runStatusFilter, setRunStatusFilter] = useState<
		"ALL" | "SUCCEEDED" | "PARTIAL" | "FAILED"
	>("ALL");

	const [runPhases, setRunPhases] = useState<{
		routing: "idle" | "running" | "succeeded" | "failed";
		capacity: "idle" | "running" | "succeeded" | "failed";
		security: "idle" | "running" | "succeeded" | "failed" | "skipped";
	}>({ routing: "idle", capacity: "idle", security: "idle" });

	// Capacity tab knobs/results (scenario lens).
	const [capIncludeHops, setCapIncludeHops] = useState(false);

	// Security tab knobs/results (Paths Assurance runner).
	const [secRequireEnforcement, setSecRequireEnforcement] = useState(true);
	const [secIncludeNetworkFunctions, setSecIncludeNetworkFunctions] =
		useState(false);
	const [secIncludeReturnPath, setSecIncludeReturnPath] = useState(false);
	const [secRequireSymmetricDelivery, setSecRequireSymmetricDelivery] =
		useState(false);
	const [secRequireReturnEnforcement, setSecRequireReturnEnforcement] =
		useState(false);
	const [secEnfNamePartsText, setSecEnfNamePartsText] =
		useState("fw, firewall");
	const [secEnfTagPartsText, setSecEnfTagPartsText] = useState("");

	const networksQ = useQuery({
		queryKey: queryKeys.userContextForwardNetworks(userContextId),
		queryFn: listUserForwardNetworks,
		enabled: Boolean(userContextId),
		retry: false,
		staleTime: 30_000,
	});

	const userNetworksQ = useQuery({
		queryKey: queryKeys.userForwardNetworks(),
		queryFn: listUserForwardNetworks,
		retry: false,
		staleTime: 30_000,
	});

	const networkRow = useMemo(() => {
		const ns = (networksQ.data?.networks ?? []) as any[];
		const us = (userNetworksQ.data?.networks ?? []) as any[];
		return (
			ns.find((n) => String(n?.id ?? "") === String(networkRef)) ??
			us.find((n) => String(n?.id ?? "") === String(networkRef))
		);
	}, [networksQ.data?.networks, userNetworksQ.data?.networks, networkRef]);

	const forwardNetworkId = String(networkRow?.forwardNetworkId ?? "");
	const networkName = String(networkRow?.name ?? "") || String(networkRef);

	const assuranceQ = useQuery({
		queryKey: queryKeys.forwardNetworkAssuranceSummary(
			userContextId,
			networkRef,
		),
		queryFn: () => getForwardNetworkAssuranceSummary(userContextId, networkRef),
		enabled: Boolean(userContextId && networkRef),
		staleTime: 5_000,
		retry: false,
	});
	const assurance = assuranceQ.data as
		| ForwardAssuranceSummaryResponse
		| undefined;

	const refreshAssuranceM = useMutation({
		mutationFn: () => refreshForwardNetworkAssurance(userContextId, networkRef),
		onSuccess: async (res) => {
			toast.success("Assurance refreshed");
			qc.setQueryData(
				queryKeys.forwardNetworkAssuranceSummary(userContextId, networkRef),
				res,
			);
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkAssuranceHistory(
					userContextId,
					networkRef,
				),
			});
		},
		onError: (e: any) =>
			toast.error("Assurance refresh failed", {
				description: String(e?.message ?? e ?? "unknown error"),
			}),
	});

	const seedDemoM = useMutation({
		mutationFn: () =>
			seedForwardNetworkAssuranceDemo(userContextId, networkRef),
		onSuccess: async (res) => {
			toast.success("Seeded demo signals", {
				description: `syslog CIDR ${res.syslogCidr}`,
			});
			await qc.invalidateQueries({
				queryKey: queryKeys.forwardNetworkAssuranceSummary(
					userContextId,
					networkRef,
				),
			});
		},
		onError: (e: any) =>
			toast.error("Seed failed", {
				description: String(e?.message ?? e ?? "unknown error"),
			}),
	});

	const scenariosQ = useQuery({
		queryKey: queryKeys.assuranceStudioScenarios(userContextId, networkRef),
		queryFn: () => listAssuranceStudioScenarios(userContextId, networkRef),
		enabled: Boolean(userContextId && networkRef),
		retry: false,
		staleTime: 10_000,
	});

	const scenarios = useMemo(() => {
		return (scenariosQ.data?.scenarios ?? []) as AssuranceScenario[];
	}, [scenariosQ.data?.scenarios]);

	const selectedScenario = useMemo(() => {
		return scenarios.find((s) => s.id === selectedScenarioId) ?? null;
	}, [scenarios, selectedScenarioId]);

	const runsQ = useQuery({
		queryKey: queryKeys.assuranceStudioRuns(userContextId, networkRef),
		queryFn: () => listAssuranceStudioRuns(userContextId, networkRef),
		enabled: Boolean(userContextId && networkRef),
		retry: false,
		staleTime: 10_000,
	});

	const runs = useMemo(() => {
		const raw = (runsQ.data?.runs ?? []) as AssuranceStudioRun[];
		if (runStatusFilter === "ALL") return raw;
		return raw.filter((r) => String(r.status) === runStatusFilter);
	}, [runsQ.data?.runs, runStatusFilter]);

	const runDetailQ = useQuery({
		queryKey: queryKeys.assuranceStudioRun(
			userContextId,
			networkRef,
			runDetailId,
		),
		queryFn: () =>
			getAssuranceStudioRun(userContextId, networkRef, runDetailId),
		enabled: Boolean(
			runDetailOpen && userContextId && networkRef && runDetailId,
		),
		retry: false,
		staleTime: 30_000,
	});

	// If no scenario is selected, default to the newest.
	useEffect(() => {
		if (!userContextId) return;
		if (!networkRef) return;
		if (selectedScenarioId) return;
		if (scenarios.length === 0) return;
		void navigate({
			search: (prev) => ({ ...prev, scenario: scenarios[0]!.id }),
			replace: true,
		});
	}, [userContextId, networkRef, selectedScenarioId, scenarios, navigate]);

	// Load scenario -> draft.
	useEffect(() => {
		if (!selectedScenario) return;
		setDraftName(String(selectedScenario.name ?? ""));
		setDraftDesc(String(selectedScenario.description ?? ""));
		setSnapshotId(String(selectedScenario.spec?.snapshotId ?? ""));
		setWindow(String(selectedScenario.spec?.window ?? "7d") || "7d");
		setThreshold(
			selectedScenario.spec?.thresholdUtil === undefined
				? "0.8"
				: String(selectedScenario.spec.thresholdUtil),
		);
		setDemandsText(demandsToCSV(selectedScenario.spec?.demands ?? []));

		const routing = (selectedScenario.spec?.routing ?? {}) as Record<
			string,
			unknown
		>;
		if (routing.includeHops !== undefined)
			setIncludeHops(Boolean(routing.includeHops));
		if (routing.projectLoad !== undefined)
			setProjectLoad(Boolean(routing.projectLoad));
		if (routing.includeAcl !== undefined)
			setIncludeAcl(Boolean(routing.includeAcl));
		if (routing.maxResults !== undefined)
			setMaxResults(String(routing.maxResults));
		{
			const v =
				routing.baselineSnapshotId !== undefined
					? String(routing.baselineSnapshotId ?? "")
					: "";
			setBaselineSnapshotId(v);
			setCompareToBaseline(Boolean(v.trim()));
		}
		if (routing.requireEnforcement !== undefined)
			setRequireEnforcement(Boolean(routing.requireEnforcement));

		const cap = (selectedScenario.spec?.capacity ?? {}) as Record<
			string,
			unknown
		>;
		if (cap.includeHops !== undefined)
			setCapIncludeHops(Boolean(cap.includeHops));

		const sec = (selectedScenario.spec?.security ?? {}) as Record<
			string,
			unknown
		>;
		if (sec.requireEnforcement !== undefined)
			setSecRequireEnforcement(Boolean(sec.requireEnforcement));
		if (sec.includeNetworkFunctions !== undefined)
			setSecIncludeNetworkFunctions(Boolean(sec.includeNetworkFunctions));
		if (sec.includeReturnPath !== undefined)
			setSecIncludeReturnPath(Boolean(sec.includeReturnPath));
		if (sec.requireSymmetricDelivery !== undefined)
			setSecRequireSymmetricDelivery(Boolean(sec.requireSymmetricDelivery));
		if (sec.requireReturnEnforcement !== undefined)
			setSecRequireReturnEnforcement(Boolean(sec.requireReturnEnforcement));
		if (Array.isArray(sec.enforcementDeviceNameParts)) {
			setSecEnfNamePartsText(
				(sec.enforcementDeviceNameParts as string[]).join(", "),
			);
		}
		if (Array.isArray(sec.enforcementTagParts)) {
			setSecEnfTagPartsText((sec.enforcementTagParts as string[]).join(", "));
		}

		setDirty(false);
	}, [selectedScenario?.id]);

	const createM = useMutation({
		mutationFn: async () => {
			const name = newName.trim();
			if (!name) throw new Error("name is required");
			const thr = Number(threshold);
			const spec: AssuranceScenarioSpec = {
				snapshotId: snapshotId.trim() || undefined,
				window,
				thresholdUtil: Number.isFinite(thr) ? thr : undefined,
				demands: parseDemandsCSV(demandsText),
			};
			return createAssuranceStudioScenario(userContextId, networkRef, {
				name,
				description: newDesc.trim() || undefined,
				spec,
			});
		},
		onSuccess: async (sc) => {
			await qc.invalidateQueries({
				queryKey: queryKeys.assuranceStudioScenarios(userContextId, networkRef),
			});
			setNewOpen(false);
			setNewName("");
			setNewDesc("");
			toast.success("Scenario created");
			void navigate({ search: (prev) => ({ ...prev, scenario: sc.id }) });
		},
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "create failed")),
	});

	const duplicateM = useMutation({
		mutationFn: async () => {
			if (!userContextId) throw new Error("user context is required");
			if (!selectedScenarioId) throw new Error("select a scenario first");
			const name = (draftName.trim() || "Scenario") + " copy";
			const thr = Number(threshold);
			const spec: AssuranceScenarioSpec = {
				snapshotId: snapshotId.trim() || undefined,
				window,
				thresholdUtil: Number.isFinite(thr) ? thr : undefined,
				demands: parseDemandsCSV(demandsText),
				routing: {
					includeHops,
					projectLoad,
					includeAcl,
					maxResults: Number(maxResults) || 3,
					baselineSnapshotId: baselineSnapshotId.trim() || undefined,
					requireEnforcement,
				},
				capacity: { includeHops: capIncludeHops },
				security: {
					requireEnforcement: secRequireEnforcement,
					includeNetworkFunctions: secIncludeNetworkFunctions,
					includeReturnPath: secIncludeReturnPath,
					requireSymmetricDelivery: secRequireSymmetricDelivery,
					requireReturnEnforcement: secRequireReturnEnforcement,
					enforcementDeviceNameParts: splitParts(secEnfNamePartsText),
					enforcementTagParts: splitParts(secEnfTagPartsText),
				},
			};
			return createAssuranceStudioScenario(userContextId, networkRef, {
				name,
				description: draftDesc.trim() || undefined,
				spec,
			});
		},
		onSuccess: async (sc) => {
			await qc.invalidateQueries({
				queryKey: queryKeys.assuranceStudioScenarios(userContextId, networkRef),
			});
			toast.success("Scenario duplicated", { description: sc.id });
			void navigate({ search: (prev) => ({ ...prev, scenario: sc.id }) });
		},
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "duplicate failed")),
	});

	const saveM = useMutation({
		mutationFn: async () => {
			if (!selectedScenarioId) throw new Error("select a scenario first");
			const demands = parseDemandsCSV(demandsText);
			const thr = Number(threshold);
			const spec: AssuranceScenarioSpec = {
				snapshotId: snapshotId.trim() || undefined,
				window,
				thresholdUtil: Number.isFinite(thr) ? thr : undefined,
				demands,
				routing: {
					includeHops,
					projectLoad,
					includeAcl,
					maxResults: Number(maxResults) || 3,
					baselineSnapshotId: baselineSnapshotId.trim() || undefined,
					requireEnforcement,
				},
				capacity: {
					includeHops: capIncludeHops,
				},
				security: {
					requireEnforcement: secRequireEnforcement,
					includeNetworkFunctions: secIncludeNetworkFunctions,
					includeReturnPath: secIncludeReturnPath,
					requireSymmetricDelivery: secRequireSymmetricDelivery,
					requireReturnEnforcement: secRequireReturnEnforcement,
					enforcementDeviceNameParts: splitParts(secEnfNamePartsText),
					enforcementTagParts: splitParts(secEnfTagPartsText),
				},
			};
			return updateAssuranceStudioScenario(
				userContextId,
				networkRef,
				selectedScenarioId,
				{
					name: draftName.trim() || undefined,
					description: draftDesc.trim() === "" ? null : draftDesc.trim(),
					spec,
				},
			);
		},
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: queryKeys.assuranceStudioScenarios(userContextId, networkRef),
			});
			setDirty(false);
			toast.success("Scenario saved");
		},
		onError: (e: any) => toast.error(String(e?.message ?? e ?? "save failed")),
	});

	const deleteM = useMutation({
		mutationFn: async () => {
			if (!selectedScenarioId) throw new Error("select a scenario first");
			return deleteAssuranceStudioScenario(
				userContextId,
				networkRef,
				selectedScenarioId,
			);
		},
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: queryKeys.assuranceStudioScenarios(userContextId, networkRef),
			});
			toast.success("Scenario deleted");
			void navigate({
				search: (prev) => ({ ...prev, scenario: "" }),
				replace: true,
			});
		},
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "delete failed")),
	});

	const seedM = useMutation({
		mutationFn: async () => {
			const req: AssuranceTrafficSeedRequest = {
				snapshotId: snapshotId.trim() || undefined,
				mode: seedMode,
				includeGroups,
				tagParts: splitParts(tagPartsText),
				nameParts: splitParts(namePartsText),
				deviceTypes: splitParts(deviceTypesText),
				maxDevices: Number(maxDevices) || 30,
				maxDemands: Number(maxDemands) || 200,
			};
			return postAssuranceTrafficSeeds(userContextId, networkRef, req);
		},
		onSuccess: (resp) => {
			setDemandsText(demandsToCSV(resp.demands ?? []));
			setDirty(true);
			toast.success(`Seeded demands=${resp.demands?.length ?? 0}`);
		},
		onError: (e: any) => toast.error(String(e?.message ?? e ?? "seed failed")),
	});

	const evalM = useMutation({
		mutationFn: async () => {
			const demands = parseDemandsCSV(demandsText);
			if (!demands.length) throw new Error("no demands parsed from CSV");
			if (compareToBaseline && !baselineSnapshotId.trim()) {
				throw new Error(
					"baselineSnapshotId is required when compareToBaseline is enabled",
				);
			}
			const thr = Number(threshold);
			const mr = Number(maxResults);
			const resp = await postAssuranceStudioEvaluate(
				userContextId,
				networkRef,
				{
					snapshotId: snapshotId.trim() || undefined,
					baselineSnapshotId:
						compareToBaseline && baselineSnapshotId.trim()
							? baselineSnapshotId.trim()
							: undefined,
					window,
					demands,
					phases: { routing: true, capacity: false, security: false },
					routing: {
						thresholdUtil: Number.isFinite(thr) ? thr : 0.8,
						forward: { maxResults: Number.isFinite(mr) && mr > 0 ? mr : 3 },
						enforcement: { requireEnforcement },
						includeHops,
						includeAcl,
						projectLoad,
					},
				},
			);
			if (resp?.routing) return resp;
			throw new Error(resp?.errors?.routing ?? "routing evaluation failed");
		},
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "evaluate failed")),
	});

	const scenarioDemands = useMemo(
		() => parseDemandsCSV(demandsText),
		[demandsText],
	);

	const flowsText = useMemo(() => {
		const demands = parseDemandsCSV(demandsText);
		return demandsToPolicyReportsFlowSuite(demands);
	}, [demandsText]);

	const policyReportsUrl = useMemo(() => {
		if (!forwardNetworkId) return "";
		const qs = new URLSearchParams();
		qs.set("embed", "1");
		qs.set("forwardNetworkId", forwardNetworkId);
		if (snapshotId.trim()) qs.set("snapshotId", snapshotId.trim());
		if (flowsText.trim()) qs.set("flows", flowsText);
		return `/dashboard/policy-reports?${qs.toString()}`;
	}, [forwardNetworkId, snapshotId, flowsText]);

	const policyReportsIntentUrl = useMemo(() => {
		if (!forwardNetworkId) return "";
		const qs = new URLSearchParams();
		qs.set("embed", "1");
		qs.set("tab", "intent");
		qs.set("forwardNetworkId", forwardNetworkId);
		if (snapshotId.trim()) qs.set("snapshotId", snapshotId.trim());
		if (flowsText.trim()) qs.set("flows", flowsText);
		return `/dashboard/policy-reports?${qs.toString()}`;
	}, [forwardNetworkId, snapshotId, flowsText]);

	const policyReportsSegmentationUrl = useMemo(() => {
		if (!forwardNetworkId) return "";
		const qs = new URLSearchParams();
		qs.set("embed", "1");
		qs.set("tab", "segmentation");
		qs.set("forwardNetworkId", forwardNetworkId);
		if (snapshotId.trim()) qs.set("snapshotId", snapshotId.trim());
		return `/dashboard/policy-reports?${qs.toString()}`;
	}, [forwardNetworkId, snapshotId]);

	const capacityUrl = useMemo(() => {
		const qs = new URLSearchParams();
		qs.set("embed", "1");
		return `/dashboard/fwd/${encodeURIComponent(networkRef)}/capacity?${qs.toString()}`;
	}, [networkRef]);

	const runScenarioM = useMutation({
		mutationFn: async () => {
			if (!userContextId) throw new Error("user context is required");
			if (!selectedScenarioId) throw new Error("select a scenario first");
			if (compareToBaseline && !baselineSnapshotId.trim()) {
				throw new Error(
					"baselineSnapshotId is required when compareToBaseline is enabled",
				);
			}

			const demands = scenarioDemands.slice(0, 200);
			if (!demands.length) throw new Error("no demands parsed from CSV");

			const thr = Number(threshold);
			const mr = Number(maxResults);

			setRunPhases({
				routing: "running",
				capacity: "running",
				security:
					includeSecurityInRun && forwardNetworkId ? "running" : "skipped",
			});

			const spec: AssuranceScenarioSpec = {
				snapshotId: snapshotId.trim() || undefined,
				window,
				thresholdUtil: Number.isFinite(thr) ? thr : undefined,
				demands,
				routing: {
					includeHops,
					projectLoad,
					includeAcl,
					maxResults: Number.isFinite(mr) && mr > 0 ? mr : 3,
					baselineSnapshotId: baselineSnapshotId.trim() || undefined,
					requireEnforcement,
				},
				capacity: { includeHops: capIncludeHops },
				security: {
					requireEnforcement: secRequireEnforcement,
					includeNetworkFunctions: secIncludeNetworkFunctions,
					includeReturnPath: secIncludeReturnPath,
					requireSymmetricDelivery: secRequireSymmetricDelivery,
					requireReturnEnforcement: secRequireReturnEnforcement,
					enforcementDeviceNameParts: splitParts(secEnfNamePartsText),
					enforcementTagParts: splitParts(secEnfTagPartsText),
				},
			};

			const resp = await postAssuranceStudioEvaluate(
				userContextId,
				networkRef,
				{
					snapshotId: snapshotId.trim() || undefined,
					baselineSnapshotId:
						compareToBaseline && baselineSnapshotId.trim()
							? baselineSnapshotId.trim()
							: undefined,
					window,
					demands,
					phases: {
						routing: true,
						capacity: true,
						security: includeSecurityInRun,
					},
					routing: {
						thresholdUtil: Number.isFinite(thr) ? thr : 0.8,
						forward: { maxResults: Number.isFinite(mr) && mr > 0 ? mr : 3 },
						enforcement: { requireEnforcement },
						includeHops,
						includeAcl,
						projectLoad,
					},
					capacity: { includeHops: capIncludeHops },
					security: includeSecurityInRun
						? {
								requireEnforcement: secRequireEnforcement,
								includeReturnPath: secIncludeReturnPath,
								requireSymmetricDelivery: secIncludeReturnPath
									? secRequireSymmetricDelivery
									: undefined,
								requireReturnEnforcement: secIncludeReturnPath
									? secRequireReturnEnforcement
									: undefined,
								enforcementDeviceNameParts: splitParts(secEnfNamePartsText),
								enforcementTagParts: splitParts(secEnfTagPartsText),
								intent: "PREFER_DELIVERED",
								includeTags: true,
								includeNetworkFunctions: secIncludeNetworkFunctions,
								maxCandidates: 5000,
								maxResults: 1,
								maxReturnPathResults: secIncludeReturnPath ? 1 : 0,
								maxSeconds: 30,
								maxOverallSeconds: 300,
							}
						: undefined,
				},
			);

			const errors: Record<string, string> = { ...(resp.errors ?? {}) };
			const results: Record<string, unknown> = {};

			if (resp.routing) results.routingEval = resp.routing;
			else
				errors.routingEval =
					errors.routingEval ?? errors.routing ?? "routing failed";
			if (resp.routingBaseline) results.routingBaseline = resp.routingBaseline;
			if (resp.routingDiff) results.routingDiff = resp.routingDiff;

			if (resp.capacity) results.capacityBottlenecks = resp.capacity;
			else
				errors.capacityBottlenecks =
					errors.capacityBottlenecks ?? errors.capacity ?? "capacity failed";
			if (resp.capacityUpgradeCandidates)
				results.capacityUpgradeCandidates = resp.capacityUpgradeCandidates;

			if (includeSecurityInRun) {
				if (resp.security) results.securityPathsAssurance = resp.security;
				else
					errors.securityPathsAssurance =
						errors.securityPathsAssurance ??
						errors.security ??
						"security failed";
			}

			if (Object.keys(errors).length) results.errors = errors;

			setRunPhases({
				routing: resp.routing && !resp.errors?.routing ? "succeeded" : "failed",
				capacity:
					resp.capacity && !resp.errors?.capacity ? "succeeded" : "failed",
				security: !includeSecurityInRun
					? "skipped"
					: resp.security && !resp.errors?.security
						? "succeeded"
						: "failed",
			});

			const okCount = [
				"routingEval",
				"capacityBottlenecks",
				"securityPathsAssurance",
			].filter((k) => k in results).length;
			const expected = includeSecurityInRun ? 3 : 2;
			const status: "SUCCEEDED" | "PARTIAL" | "FAILED" =
				okCount === 0
					? "FAILED"
					: okCount === expected
						? "SUCCEEDED"
						: "PARTIAL";

			const title = `${draftName.trim() || "Scenario"} (${new Date().toISOString()})`;
			const run = await createAssuranceStudioRun(userContextId, networkRef, {
				scenarioId: selectedScenarioId,
				title,
				status,
				error: Object.keys(errors).length ? JSON.stringify(errors) : undefined,
				request: spec,
				results,
			});

			return { run, results };
		},
		onSuccess: async (out) => {
			toast.success("Scenario run stored", { description: out.run.id });
			await qc.invalidateQueries({
				queryKey: queryKeys.assuranceStudioRuns(userContextId, networkRef),
			});
			setRunDetailId(out.run.id);
			setRunDetailOpen(true);
		},
		onError: (e: any) => toast.error(String(e?.message ?? e ?? "run failed")),
	});

	const capBottlenecksM = useMutation({
		mutationFn: async () => {
			if (!userContextId) throw new Error("user context is required");
			const demands = scenarioDemands
				.filter((d) => String(d.dstIp ?? "").trim())
				.slice(0, 200);
			if (demands.length === 0) throw new Error("no valid demands to evaluate");
			const resp = await postAssuranceStudioEvaluate(
				userContextId,
				networkRef,
				{
					window,
					snapshotId: snapshotId.trim() || undefined,
					demands,
					phases: { routing: false, capacity: true, security: false },
					capacity: { includeHops: capIncludeHops },
				},
			);
			if (resp?.capacity)
				return {
					bottlenecks: resp.capacity,
					upgradeCandidates: resp.capacityUpgradeCandidates,
				};
			throw new Error(resp?.errors?.capacity ?? "capacity evaluation failed");
		},
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "capacity bottlenecks failed")),
	});

	function parsePolicyReportResults(
		resp: PolicyReportNQEResponse | null,
	): any[] {
		try {
			const raw: any = (resp as any)?.results;
			if (!raw) return [];
			if (Array.isArray(raw)) return raw;
			if (typeof raw === "string") return JSON.parse(raw);
			return JSON.parse(String(raw));
		} catch {
			return [];
		}
	}

	const secRunM = useMutation({
		mutationFn: async () => {
			if (!userContextId) throw new Error("user context is required");
			const demands = scenarioDemands
				.filter((d) => String(d.dstIp ?? "").trim())
				.slice(0, 200);
			if (demands.length === 0) throw new Error("no valid demands to evaluate");
			const resp = await postAssuranceStudioEvaluate(
				userContextId,
				networkRef,
				{
					snapshotId: snapshotId.trim() || undefined,
					window,
					demands,
					phases: { routing: false, capacity: false, security: true },
					security: {
						requireEnforcement: secRequireEnforcement,
						includeReturnPath: secIncludeReturnPath,
						requireSymmetricDelivery: secIncludeReturnPath
							? secRequireSymmetricDelivery
							: undefined,
						requireReturnEnforcement: secIncludeReturnPath
							? secRequireReturnEnforcement
							: undefined,
						enforcementDeviceNameParts: splitParts(secEnfNamePartsText),
						enforcementTagParts: splitParts(secEnfTagPartsText),
						intent: "PREFER_DELIVERED",
						includeTags: true,
						includeNetworkFunctions: secIncludeNetworkFunctions,
						maxCandidates: 5000,
						maxResults: 1,
						maxReturnPathResults: secIncludeReturnPath ? 1 : 0,
						maxSeconds: 30,
						maxOverallSeconds: 300,
					},
				},
			);
			if (resp?.security) return resp.security;
			throw new Error(resp?.errors?.security ?? "security evaluation failed");
		},
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "paths assurance failed")),
	});

	const secStoreM = useMutation({
		mutationFn: async () => {
			if (!userContextId) throw new Error("user context is required");
			if (!forwardNetworkId) throw new Error("forwardNetworkId is required");
			const queries: PolicyReportPathQuery[] = scenarioDemands
				.filter((d) => String(d.dstIp ?? "").trim())
				.slice(0, 200)
				.map((d) => ({
					from: d.from,
					srcIp: d.srcIp,
					dstIp: d.dstIp,
					ipProto: d.ipProto,
					srcPort: d.srcPort,
					dstPort: d.dstPort,
				}));
			if (queries.length === 0) throw new Error("no valid demands to evaluate");
			return storeUserPolicyReportPathsEnforcementBypass(userContextId, {
				title: `Assurance Studio Paths Assurance (${queries.length} flows)`,
				forwardNetworkId,
				snapshotId: snapshotId.trim() || undefined,
				queries,
				requireEnforcement: secRequireEnforcement,
				requireSymmetricDelivery: secIncludeReturnPath
					? secRequireSymmetricDelivery
					: undefined,
				requireReturnEnforcement: secIncludeReturnPath
					? secRequireReturnEnforcement
					: undefined,
				enforcementDeviceNameParts: splitParts(secEnfNamePartsText),
				enforcementTagParts: splitParts(secEnfTagPartsText),
				intent: "PREFER_DELIVERED",
				includeTags: true,
				includeNetworkFunctions: secIncludeNetworkFunctions,
				maxCandidates: 5000,
				maxResults: 1,
				maxReturnPathResults: secIncludeReturnPath ? 1 : 0,
				maxSeconds: 30,
				maxOverallSeconds: 300,
			});
		},
		onSuccess: (resp) =>
			toast.success("Stored as Policy Report run", {
				description: resp.run.id,
			}),
		onError: (e: any) =>
			toast.error(String(e?.message ?? e ?? "store paths assurance failed")),
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="sm">
						<Link to="/dashboard/fwd">
							<ArrowLeft className="h-4 w-4" />
							<span className="ml-2">Forward Networks</span>
						</Link>
					</Button>
					<div>
						<div className="text-sm text-muted-foreground">
							Assurance Studio
						</div>
						<div className="text-lg font-semibold">{networkName}</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Badge variant="secondary">Forward Paths + NQE</Badge>
					{networksQ.isLoading ? <Skeleton className="h-6 w-24" /> : null}
					<Button
						variant="outline"
						size="sm"
						onClick={() => refreshAssuranceM.mutate()}
						disabled={!userContextId || refreshAssuranceM.isPending}
					>
						<RefreshCw className="h-4 w-4 mr-2" />
						{refreshAssuranceM.isPending ? "Refreshing…" : "Refresh Assurance"}
					</Button>
					{isAdmin ? (
						<Button
							variant="outline"
							size="sm"
							onClick={() => seedDemoM.mutate()}
							disabled={!userContextId || seedDemoM.isPending}
						>
							{seedDemoM.isPending ? "Seeding…" : "Seed demo signals"}
						</Button>
					) : null}
					<Button asChild variant="outline" size="sm">
						<Link
							to="/dashboard/fwd/$networkRef/assurance"
							params={{ networkRef }}
						>
							Assurance page
						</Link>
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
					<div className="space-y-1">
						<CardTitle>Assurance Summary</CardTitle>
						<CardDescription>
							Live Forward snapshot health, vulnerabilities, capacity cache, and
							inbox signals.
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						{assuranceQ.isLoading ? (
							<Skeleton className="h-9 w-36" />
						) : assuranceQ.isError ? (
							<Badge variant="destructive">summary unavailable</Badge>
						) : assurance ? (
							<Badge variant="outline" className="font-mono text-xs">
								as of {fmtRFC3339(assurance.generatedAt)}
							</Badge>
						) : null}
					</div>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 text-sm">
					<div className="rounded-md border p-3">
						<div className="text-xs text-muted-foreground">Snapshot</div>
						<div className="font-mono text-xs mt-1 truncate">
							{assurance?.snapshot.snapshotId || "—"}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							age {fmtAgeSeconds(assurance?.snapshot.ageSeconds)} · state{" "}
							<span className="font-mono">
								{assurance?.snapshot.state || "—"}
							</span>
						</div>
					</div>

					<div className="rounded-md border p-3">
						<div className="text-xs text-muted-foreground">Indexing</div>
						<div className="mt-1">
							<Badge
								variant={
									assurance?.indexingHealth.overall === "ok"
										? "default"
										: assurance?.indexingHealth.overall === "warn"
											? "secondary"
											: "outline"
								}
							>
								{assurance?.indexingHealth.overall || "unknown"}
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground mt-1 font-mono">
							pathSearch=
							{assurance?.indexingHealth.pathSearchIndexingStatus || "—"}
						</div>
					</div>

					<div className="rounded-md border p-3">
						<div className="text-xs text-muted-foreground">Vulnerabilities</div>
						<div className="mt-1">
							<span className="font-mono text-xs">
								{assurance?.vulnerabilities.total ?? "—"}
							</span>
							{assurance?.vulnerabilities.partial ? (
								<Badge variant="secondary" className="ml-2">
									partial
								</Badge>
							) : null}
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							known exploit{" "}
							<span className="font-mono text-xs">
								{assurance?.vulnerabilities.knownExploitCount ?? "—"}
							</span>
						</div>
					</div>

					<div className="rounded-md border p-3">
						<div className="text-xs text-muted-foreground">Capacity cache</div>
						<div className="mt-1 text-xs">
							hot ifaces ({">="}85% max):{" "}
							<span className="font-mono">
								{assurance?.capacity.hotInterfaces ?? 0}
							</span>
						</div>
						<div className="text-xs text-muted-foreground mt-1">
							stale{" "}
							<Badge
								variant={assurance?.capacity.stale ? "secondary" : "default"}
							>
								{assurance?.capacity.stale ? "yes" : "no"}
							</Badge>
						</div>
					</div>

					<div className="rounded-md border p-3">
						<div className="text-xs text-muted-foreground">
							Live signals (60m)
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							syslog{" "}
							<span className="font-mono text-xs">
								{assurance?.liveSignals.syslog.total ?? 0}
							</span>{" "}
							(crit{" "}
							<span className="font-mono text-xs">
								{assurance?.liveSignals.syslog.critical ?? 0}
							</span>
							)
						</div>
						<div className="text-xs text-muted-foreground">
							snmp{" "}
							<span className="font-mono text-xs">
								{assurance?.liveSignals.snmpTraps.total ?? 0}
							</span>{" "}
							webhooks{" "}
							<span className="font-mono text-xs">
								{assurance?.liveSignals.webhooks.total ?? 0}
							</span>
						</div>
					</div>

					<div className="rounded-md border p-3">
						<div className="text-xs text-muted-foreground">Notes</div>
						{(assurance?.missing ?? []).length > 0 ? (
							<div className="mt-1 flex flex-wrap gap-2">
								{(assurance?.missing ?? []).slice(0, 6).map((m) => (
									<Badge key={m} variant="secondary">
										missing:{m}
									</Badge>
								))}
							</div>
						) : (
							<div className="mt-1 text-xs text-muted-foreground">
								No missing evidence detected.
							</div>
						)}
						{(assurance?.warnings ?? []).length > 0 ? (
							<div className="mt-2 text-xs text-muted-foreground">
								{(assurance?.warnings ?? []).slice(0, 3).join(" · ")}
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
					<div className="space-y-1">
						<CardTitle>Scenario</CardTitle>
						<CardDescription>
							One saved scenario feeds Routing, Capacity, and Security tabs.
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => scenariosQ.refetch()}
							disabled={scenariosQ.isFetching}
						>
							<RefreshCw className="h-4 w-4 mr-2" />
							Refresh
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setNewOpen(true)}
						>
							<Plus className="h-4 w-4 mr-2" />
							New
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={
								!userContextId || !selectedScenarioId || duplicateM.isPending
							}
							onClick={() => duplicateM.mutate()}
						>
							Duplicate
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!selectedScenarioId || deleteM.isPending}
							onClick={() => {
								if (!selectedScenarioId) return;
								if (!confirm("Delete this scenario?")) return;
								deleteM.mutate();
							}}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete
						</Button>
						<Button
							size="sm"
							disabled={
								!userContextId ||
								!selectedScenarioId ||
								saveM.isPending ||
								!dirty
							}
							onClick={() => saveM.mutate()}
						>
							<Save className="h-4 w-4 mr-2" />
							Save
						</Button>
						<Button
							size="sm"
							disabled={
								!userContextId || !selectedScenarioId || runScenarioM.isPending
							}
							onClick={() => runScenarioM.mutate()}
						>
							<Play className="h-4 w-4 mr-2" />
							Run scenario
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{runScenarioM.isPending || runPhases.routing !== "idle" ? (
						<div className="flex flex-wrap items-center gap-2 text-sm">
							<Badge variant="secondary">Run phases</Badge>
							<Badge variant="secondary">
								routing:{" "}
								<span className="font-mono text-xs">{runPhases.routing}</span>
							</Badge>
							<Badge variant="secondary">
								capacity:{" "}
								<span className="font-mono text-xs">{runPhases.capacity}</span>
							</Badge>
							<Badge variant="secondary">
								security:{" "}
								<span className="font-mono text-xs">{runPhases.security}</span>
							</Badge>
						</div>
					) : null}
					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Scenario</div>
							<Select
								value={selectedScenarioId}
								onValueChange={(v) => {
									setDirty(false);
									void navigate({
										search: (prev) => ({ ...prev, scenario: String(v ?? "") }),
									});
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select scenario" />
								</SelectTrigger>
								<SelectContent>
									{scenarios.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Name</div>
							<Input
								value={draftName}
								onChange={(e) => {
									setDraftName(e.target.value);
									setDirty(true);
								}}
								placeholder="Scenario name"
							/>
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">
								SnapshotId (optional)
							</div>
							<Input
								value={snapshotId}
								onChange={(e) => {
									setSnapshotId(e.target.value);
									setDirty(true);
								}}
								placeholder="latest processed"
							/>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<div className="space-y-1 md:col-span-2">
							<div className="text-sm text-muted-foreground">
								Baseline SnapshotId (optional)
							</div>
							<Input
								value={baselineSnapshotId}
								onChange={(e) => {
									setBaselineSnapshotId(e.target.value);
									setDirty(true);
								}}
								placeholder="for routing regressions"
							/>
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">
								Compare routing
							</div>
							<label className="flex h-10 items-center gap-2 rounded-md border px-3">
								<input
									type="checkbox"
									checked={compareToBaseline}
									onChange={(e) => {
										const v = e.target.checked;
										setCompareToBaseline(v);
										// For regression diffs, hop lists make the story much stronger.
										if (v) setIncludeHops(true);
									}}
								/>
								<span className="text-sm text-muted-foreground">
									vs baseline
								</span>
							</label>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
						<div className="space-y-1 md:col-span-2">
							<div className="text-sm text-muted-foreground">Description</div>
							<Input
								value={draftDesc}
								onChange={(e) => {
									setDraftDesc(e.target.value);
									setDirty(true);
								}}
								placeholder="Optional notes"
							/>
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Window</div>
							<Select
								value={window}
								onValueChange={(v) => {
									setWindow(v);
									setDirty(true);
								}}
							>
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
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">
								Threshold util (0-1)
							</div>
							<Input
								value={threshold}
								onChange={(e) => {
									setThreshold(e.target.value);
									setDirty(true);
								}}
							/>
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Max results</div>
							<Input
								value={maxResults}
								onChange={(e) => setMaxResults(e.target.value)}
							/>
						</div>
						<div className="flex items-end gap-2 md:col-span-2">
							<Button
								disabled={!userContextId || evalM.isPending}
								onClick={() => evalM.mutate()}
							>
								<Play className="h-4 w-4 mr-2" />
								Evaluate routing
							</Button>
							<Button variant="secondary" onClick={() => setDemandsText("")}>
								Clear demands
							</Button>
							<label className="ml-2 flex items-center gap-2 text-sm text-muted-foreground">
								<input
									type="checkbox"
									checked={includeSecurityInRun}
									onChange={(e) => setIncludeSecurityInRun(e.target.checked)}
								/>
								Include security in run
							</label>
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<div className="text-sm font-medium">Recent runs</div>
							<div className="flex flex-wrap items-center gap-2">
								<Select
									value={runStatusFilter}
									onValueChange={(v) =>
										setRunStatusFilter(
											v === "SUCCEEDED" || v === "PARTIAL" || v === "FAILED"
												? v
												: "ALL",
										)
									}
								>
									<SelectTrigger className="h-8 w-[160px]">
										<SelectValue placeholder="Filter" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">All</SelectItem>
										<SelectItem value="SUCCEEDED">SUCCEEDED</SelectItem>
										<SelectItem value="PARTIAL">PARTIAL</SelectItem>
										<SelectItem value="FAILED">FAILED</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									onClick={() => runsQ.refetch()}
									disabled={runsQ.isFetching}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Refresh
								</Button>
							</div>
						</div>
						{runsQ.isLoading ? (
							<Skeleton className="h-14 w-full" />
						) : runs.length === 0 ? (
							<div className="text-sm text-muted-foreground">
								No stored runs yet.
							</div>
						) : (
							<div className="overflow-x-auto rounded-md border">
								<table className="w-full border-collapse text-sm">
									<thead className="border-b text-xs text-muted-foreground">
										<tr>
											<th className="p-2 text-left">Started</th>
											<th className="p-2 text-left">Status</th>
											<th className="p-2 text-left">Title</th>
											<th className="p-2 text-left">Run ID</th>
											<th className="p-2 text-right">Actions</th>
										</tr>
									</thead>
									<tbody>
										{runs.slice(0, 10).map((r) => (
											<tr key={r.id} className="border-b">
												<td className="p-2 font-mono text-xs">{r.startedAt}</td>
												<td className="p-2">
													<Badge
														variant={
															r.status === "FAILED"
																? "destructive"
																: "secondary"
														}
													>
														{r.status}
													</Badge>
												</td>
												<td className="p-2">{r.title}</td>
												<td className="p-2 font-mono text-xs">{r.id}</td>
												<td className="p-2 text-right">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setRunDetailId(r.id);
															setRunDetailOpen(true);
														}}
													>
														View
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>

					<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
						<Card className="border-dashed">
							<CardHeader>
								<CardTitle className="text-base">Seed demands</CardTitle>
								<CardDescription>
									Uses NQE to discover device endpoints, then generates a demand
									set.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">Mode</div>
										<Select value={seedMode} onValueChange={setSeedMode}>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="mesh">Mesh</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Include groups
										</div>
										<div className="flex h-10 items-center gap-2 rounded-md border px-3">
											<input
												type="checkbox"
												checked={includeGroups}
												onChange={(e) => setIncludeGroups(e.target.checked)}
											/>
											<span className="text-sm text-muted-foreground">
												match tagParts to groups too
											</span>
										</div>
									</div>
								</div>
								<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Tag parts
										</div>
										<Input
											value={tagPartsText}
											onChange={(e) => setTagPartsText(e.target.value)}
										/>
									</div>
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Name parts
										</div>
										<Input
											value={namePartsText}
											onChange={(e) => setNamePartsText(e.target.value)}
										/>
									</div>
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Device types
										</div>
										<Input
											value={deviceTypesText}
											onChange={(e) => setDeviceTypesText(e.target.value)}
											placeholder="ROUTER,SWITCH"
										/>
									</div>
								</div>
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
											variant="outline"
											disabled={!userContextId || seedM.isPending}
											onClick={() => seedM.mutate()}
										>
											Seed
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="border-dashed">
							<CardHeader>
								<CardTitle className="text-base">Demands CSV</CardTitle>
								<CardDescription>
									Canonical schema:{" "}
									<span className="font-mono text-xs">
										from,srcIp,dstIp,ipProto,srcPort,dstPort,bandwidthGbps,label
									</span>
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2">
								<Textarea
									className="min-h-[260px] font-mono text-xs"
									value={demandsText}
									onChange={(e) => {
										setDemandsText(e.target.value);
										setDirty(true);
									}}
									placeholder="from,srcIp,dstIp,ipProto,srcPort,dstPort,bandwidthGbps,label"
								/>
								<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
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
										Project load
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
										Include ACL/NF details
									</label>
								</div>
							</CardContent>
						</Card>
					</div>
				</CardContent>
			</Card>

			<Tabs
				value={activeTab}
				onValueChange={(v) =>
					void navigate({ search: (prev) => ({ ...prev, tab: v }) })
				}
			>
				<TabsList>
					<TabsTrigger value="routing">Routing</TabsTrigger>
					<TabsTrigger value="capacity">Capacity</TabsTrigger>
					<TabsTrigger value="security">Security</TabsTrigger>
					<TabsTrigger value="actions">Actions</TabsTrigger>
				</TabsList>

				<TabsContent value="routing" className="space-y-3">
					<Card>
						<CardHeader>
							<CardTitle>Routing Results</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{evalM.isPending ? <Skeleton className="h-20 w-full" /> : null}
							{evalM.data?.routing ? (
								<div className="space-y-4">
									<div className="flex flex-wrap gap-2">
										<Badge variant="secondary">
											Demands: {evalM.data.routing.summary.totalDemands}
										</Badge>
										<Badge variant="secondary">
											Delivered: {evalM.data.routing.summary.delivered}
										</Badge>
										<Badge variant="secondary">
											Timed out: {evalM.data.routing.summary.timedOut}
										</Badge>
										<Badge variant="secondary">
											Missing enforcement:{" "}
											{evalM.data.routing.summary.missingEnforcement}
										</Badge>
										<Badge variant="secondary">
											Crosses threshold:{" "}
											{evalM.data.routing.summary.crossesThreshold}
										</Badge>
									</div>

									{evalM.data.routingDiff ? (
										<div className="space-y-2">
											<div className="text-sm font-medium">
												Regression vs baseline
											</div>
											<div className="flex flex-wrap gap-2">
												<Badge variant="secondary">
													Baseline:{" "}
													<span className="font-mono text-xs">
														{evalM.data.routingDiff.baselineSnapshotId ??
															evalM.data.baselineSnapshotId ??
															"—"}
													</span>
												</Badge>
												<Badge variant="secondary">
													Compare:{" "}
													<span className="font-mono text-xs">
														{evalM.data.routingDiff.compareSnapshotId ??
															evalM.data.snapshotId ??
															"latest"}
													</span>
												</Badge>
												<Badge variant="secondary">
													Changed: {evalM.data.routingDiff.summary.changed}/
													{evalM.data.routingDiff.summary.totalDemands}
												</Badge>
												<Badge variant="secondary">
													Regressions:{" "}
													{evalM.data.routingDiff.summary.deliveryRegression}
												</Badge>
												<Badge variant="secondary">
													Improvements:{" "}
													{evalM.data.routingDiff.summary.deliveryImprovement}
												</Badge>
												<Badge variant="secondary">
													Path changed:{" "}
													{evalM.data.routingDiff.summary.pathChanged}
												</Badge>
											</div>

											<div className="overflow-x-auto">
												<table className="w-full border-collapse text-sm">
													<thead>
														<tr className="border-b">
															<th className="p-2 text-left">#</th>
															<th className="p-2 text-left">Flow</th>
															<th className="p-2 text-left">Reasons</th>
															<th className="p-2 text-left">Baseline</th>
															<th className="p-2 text-left">Compare</th>
															<th className="p-2 text-left">Evidence</th>
														</tr>
													</thead>
													<tbody>
														{(evalM.data.routingDiff.items ?? [])
															.filter((it) => Boolean(it.changed))
															.slice(0, 50)
															.map((it) => (
																<tr key={it.index} className="border-b">
																	<td className="p-2 text-muted-foreground">
																		{it.index + 1}
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{String(
																			it.demand.srcIp ?? it.demand.from ?? "",
																		)}{" "}
																		-&gt; {it.demand.dstIp}
																	</td>
																	<td className="p-2 text-xs">
																		{(it.reasons ?? []).includes(
																			"delivery_regression",
																		) ? (
																			<span className="text-amber-600">
																				delivery_regression
																			</span>
																		) : (
																			<span className="text-muted-foreground">
																				{(it.reasons ?? []).join(", ") || "—"}
																			</span>
																		)}
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{it.baselineForwardingOutcome ?? "—"}
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{it.compareForwardingOutcome ?? "—"}
																	</td>
																	<td className="p-2 text-xs">
																		<div className="flex flex-wrap gap-2">
																			{it.baselineQueryUrl ? (
																				<a
																					href={it.baselineQueryUrl}
																					target="_blank"
																					rel="noreferrer noopener"
																					className="underline text-muted-foreground"
																				>
																					baseline
																				</a>
																			) : null}
																			{it.compareQueryUrl ? (
																				<a
																					href={it.compareQueryUrl}
																					target="_blank"
																					rel="noreferrer noopener"
																					className="underline text-muted-foreground"
																				>
																					compare
																				</a>
																			) : null}
																		</div>
																	</td>
																</tr>
															))}
													</tbody>
												</table>
											</div>
											<div className="text-xs text-muted-foreground">
												Showing first 50 changed flows.
											</div>
										</div>
									) : null}

									{(evalM.data.routing.interfaceImpacts ?? []).length ? (
										<div className="space-y-2">
											<div className="text-sm font-medium">
												Interface impacts
											</div>
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
														{[...(evalM.data.routing.interfaceImpacts ?? [])]
															.sort(
																(a, b) =>
																	Number(b.projectedUtil ?? 0) -
																	Number(a.projectedUtil ?? 0),
															)
															.slice(0, 25)
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
																			<span className="text-amber-600">
																				yes
																			</span>
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
												Showing top 25 by projected utilization.
											</div>
										</div>
									) : null}

									<div className="overflow-x-auto">
										<table className="w-full border-collapse text-sm">
											<thead>
												<tr className="border-b">
													<th className="p-2 text-left">#</th>
													<th className="p-2 text-left">Demand</th>
													<th className="p-2 text-left">Recommended</th>
													<th className="p-2 text-left">Outcome</th>
													<th className="p-2 text-left">Bottleneck</th>
													<th className="p-2 text-left">Forward</th>
												</tr>
											</thead>
											<tbody>
												{evalM.data.routing.items.slice(0, 50).map((it) => {
													const rec = it.candidates?.[it.recommended];
													const bn = rec?.bottleneck;
													return (
														<tr key={it.index} className="border-b">
															<td className="p-2 text-muted-foreground">
																{it.index + 1}
															</td>
															<td className="p-2">
																<div className="font-mono">
																	{String(
																		it.demand.srcIp ?? it.demand.from ?? "",
																	)}{" "}
																	-&gt; {it.demand.dstIp}
																</div>
																{it.demand.label ? (
																	<div className="text-muted-foreground">
																		{it.demand.label}
																	</div>
																) : null}
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
																	<span className="text-muted-foreground">
																		—
																	</span>
																)}
															</td>
															<td className="p-2 text-xs">
																{it.queryUrl ? (
																	<a
																		href={it.queryUrl}
																		target="_blank"
																		rel="noreferrer noopener"
																		className="underline text-muted-foreground"
																	>
																		open
																	</a>
																) : (
																	<span className="text-muted-foreground">
																		—
																	</span>
																)}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
									<div className="text-xs text-muted-foreground">
										Showing first 50 demands.
									</div>
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									Click <span className="font-medium">Evaluate routing</span> to
									run Forward paths-bulk and rank candidates.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="capacity" className="space-y-3">
					<Card>
						<CardHeader>
							<CardTitle>Capacity (Scenario Lens)</CardTitle>
							<CardDescription>
								Run capacity path-bottleneck analysis for the scenario demand
								set.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex flex-wrap items-center gap-2">
								<Button
									disabled={!userContextId || capBottlenecksM.isPending}
									onClick={() => capBottlenecksM.mutate()}
								>
									Evaluate capacity bottlenecks
								</Button>
								<Button asChild variant="outline">
									<a
										href={capacityUrl || "#"}
										target="_blank"
										rel="noreferrer noopener"
									>
										Open full Capacity
									</a>
								</Button>
								<label className="flex items-center gap-2 text-sm text-muted-foreground">
									<input
										type="checkbox"
										checked={capIncludeHops}
										onChange={(e) => setCapIncludeHops(e.target.checked)}
									/>
									Include hops
								</label>
							</div>

							{capBottlenecksM.isPending ? (
								<Skeleton className="h-20 w-full" />
							) : null}

							{capBottlenecksM.data ? (
								<div className="space-y-4">
									<div className="text-xs text-muted-foreground">
										asOf={capBottlenecksM.data.bottlenecks.asOf ?? "—"}{" "}
										coverage=
										{capBottlenecksM.data.bottlenecks.coverage
											? `${capBottlenecksM.data.bottlenecks.coverage.rollupMatched}/${capBottlenecksM.data.bottlenecks.coverage.hopInterfaceKeys} matched`
											: "—"}
									</div>

									{(() => {
										const up = capBottlenecksM.data.upgradeCandidates as
											| ForwardNetworkCapacityUpgradeCandidatesResponse
											| undefined;
										if (!up?.items?.length) return null;
										return (
											<div className="rounded-md border p-3 space-y-2">
												<div className="flex flex-wrap items-center justify-between gap-2">
													<div className="text-sm font-medium">
														Upgrade candidates
													</div>
													<div className="text-xs text-muted-foreground">
														asOf={up.asOf ?? "—"}
													</div>
												</div>
												<div className="overflow-x-auto">
													<table className="w-full border-collapse text-sm">
														<thead>
															<tr className="border-b">
																<th className="p-2 text-left">Type</th>
																<th className="p-2 text-left">Target</th>
																<th className="p-2 text-left">Speed</th>
																<th className="p-2 text-left">Worst</th>
																<th className="p-2 text-left">Max</th>
																<th className="p-2 text-left">P95</th>
																<th className="p-2 text-left">Recommend</th>
															</tr>
														</thead>
														<tbody>
															{up.items.slice(0, 5).map((it, idx) => (
																<tr key={idx} className="border-b">
																		<td className="p-2 font-mono text-xs">
																			{it.targetType}
																		</td>
																	<td className="p-2 font-mono text-xs">
																		{it.device}:{it.name}
																		{it.members?.length ? (
																			<span className="text-muted-foreground">
																				{" "}
																				({it.members.length} members)
																			</span>
																		) : null}
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{Math.round(it.speedMbps / 1000)}G
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{it.worstDirection}
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{(it.maxUtil * 100).toFixed(0)}%
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{(it.p95Util * 100).toFixed(0)}%
																	</td>
																	<td className="p-2 font-mono text-xs">
																		{it.recommendedSpeedMbps ? (
																			<span>
																				{Math.round(
																					it.recommendedSpeedMbps / 1000,
																				)}
																				G{" "}
																				<span className="text-muted-foreground">
																					({it.reason ?? "upgrade"})
																				</span>
																			</span>
																		) : (
																			<span className="text-muted-foreground">
																				—
																			</span>
																		)}
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
												<div className="text-xs text-muted-foreground">
													Showing top 5 candidates.
												</div>
											</div>
										);
									})()}

									{(() => {
										const resp = capBottlenecksM.data
											.bottlenecks as ForwardNetworkCapacityPathBottlenecksResponse;
										const counts = new Map<string, number>();
										for (const it of resp.items ?? []) {
											const b = it.bottleneck;
											if (!b) continue;
											const k = `${b.deviceName}:${b.interfaceName}:${b.direction}`;
											counts.set(k, (counts.get(k) ?? 0) + 1);
										}
										const top = Array.from(counts.entries())
											.sort((a, b) => b[1] - a[1])
											.slice(0, 10);
										if (!top.length) return null;
										return (
											<div className="flex flex-wrap gap-2">
												{top.map(([k, v]) => (
													<Badge key={k} variant="secondary">
														<span className="font-mono">{v}</span>{" "}
														<span className="text-muted-foreground">{k}</span>
													</Badge>
												))}
											</div>
										);
									})()}

									<div className="overflow-x-auto">
										<table className="w-full border-collapse text-sm">
											<thead>
												<tr className="border-b">
													<th className="p-2 text-left">#</th>
													<th className="p-2 text-left">Flow</th>
													<th className="p-2 text-left">Outcome</th>
													<th className="p-2 text-left">Bottleneck</th>
													<th className="p-2 text-left">Headroom</th>
													<th className="p-2 text-left">Forecast</th>
												</tr>
											</thead>
											<tbody>
												{capBottlenecksM.data.bottlenecks.items
													.slice(0, 50)
													.map((it) => {
														const b = it.bottleneck;
														return (
															<tr key={it.index} className="border-b">
																<td className="p-2 text-muted-foreground">
																	{it.index + 1}
																</td>
																<td className="p-2 font-mono text-xs">
																	{String(
																		it.query.srcIp ?? it.query.from ?? "",
																	)}{" "}
																	-&gt; {it.query.dstIp}
																</td>
																<td className="p-2 font-mono text-xs">
																	{it.forwardingOutcome ?? it.error ?? "—"}
																</td>
																<td className="p-2 font-mono text-xs">
																	{b
																		? `${b.deviceName}:${b.interfaceName} (${b.direction})`
																		: "—"}
																</td>
																<td className="p-2 font-mono text-xs">
																	{b?.headroomGbps !== null &&
																	b?.headroomGbps !== undefined
																		? `${Number(b.headroomGbps).toFixed(2)}G`
																		: "—"}
																</td>
																<td className="p-2 font-mono text-xs">
																	{String(b?.forecastCrossingTs ?? "—")}
																</td>
															</tr>
														);
													})}
											</tbody>
										</table>
									</div>
									<div className="text-xs text-muted-foreground">
										Showing first 50 flows.
									</div>
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									Click Evaluate to compute bottlenecks from Forward paths +
									capacity rollups.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-3">
					<Card>
						<CardHeader>
							<CardTitle>Security (Paths Assurance)</CardTitle>
							<CardDescription>
								Run enforcement-bypass detection against the scenario demand
								set.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Require enforcement
									</div>
									<label className="flex h-10 items-center gap-2 rounded-md border px-3">
										<input
											type="checkbox"
											checked={secRequireEnforcement}
											onChange={(e) =>
												setSecRequireEnforcement(e.target.checked)
											}
										/>
										<span className="text-sm text-muted-foreground">
											violate if not enforced
										</span>
									</label>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Include return path
									</div>
									<label className="flex h-10 items-center gap-2 rounded-md border px-3">
										<input
											type="checkbox"
											checked={secIncludeReturnPath}
											onChange={(e) =>
												setSecIncludeReturnPath(e.target.checked)
											}
										/>
										<span className="text-sm text-muted-foreground">
											also evaluate return path
										</span>
									</label>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Include networkFunctions
									</div>
									<label className="flex h-10 items-center gap-2 rounded-md border px-3">
										<input
											type="checkbox"
											checked={secIncludeNetworkFunctions}
											onChange={(e) =>
												setSecIncludeNetworkFunctions(e.target.checked)
											}
										/>
										<span className="text-sm text-muted-foreground">
											ACL/NAT evidence (slower)
										</span>
									</label>
								</div>
							</div>

							{secIncludeReturnPath ? (
								<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Require symmetric delivery
										</div>
										<label className="flex h-10 items-center gap-2 rounded-md border px-3">
											<input
												type="checkbox"
												checked={secRequireSymmetricDelivery}
												onChange={(e) =>
													setSecRequireSymmetricDelivery(e.target.checked)
												}
											/>
											<span className="text-sm text-muted-foreground">
												delivered both ways
											</span>
										</label>
									</div>
									<div className="space-y-1">
										<div className="text-sm text-muted-foreground">
											Require return enforcement
										</div>
										<label className="flex h-10 items-center gap-2 rounded-md border px-3">
											<input
												type="checkbox"
												checked={secRequireReturnEnforcement}
												onChange={(e) =>
													setSecRequireReturnEnforcement(e.target.checked)
												}
											/>
											<span className="text-sm text-muted-foreground">
												enforced on return path
											</span>
										</label>
									</div>
								</div>
							) : null}

							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Enforcement device name parts
									</div>
									<Input
										value={secEnfNamePartsText}
										onChange={(e) => setSecEnfNamePartsText(e.target.value)}
										placeholder="fw, firewall"
									/>
								</div>
								<div className="space-y-1">
									<div className="text-sm text-muted-foreground">
										Enforcement tag parts
									</div>
									<Input
										value={secEnfTagPartsText}
										onChange={(e) => setSecEnfTagPartsText(e.target.value)}
										placeholder="enforcement, inspection"
									/>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<Button
									disabled={
										!userContextId || secRunM.isPending || !forwardNetworkId
									}
									onClick={() => secRunM.mutate()}
								>
									Run Paths Assurance
								</Button>
								<Button
									variant="secondary"
									disabled={
										!userContextId || secStoreM.isPending || !forwardNetworkId
									}
									onClick={() => secStoreM.mutate()}
								>
									Store as run
								</Button>
								<Button asChild variant="outline">
									<a
										href={policyReportsUrl || "#"}
										target="_blank"
										rel="noreferrer noopener"
									>
										Open full Policy Reports
									</a>
								</Button>
								<Button asChild variant="outline">
									<a
										href={policyReportsSegmentationUrl || "#"}
										target="_blank"
										rel="noreferrer noopener"
									>
										Segmentation posture
									</a>
								</Button>
								<Button asChild variant="outline">
									<a
										href={policyReportsIntentUrl || "#"}
										target="_blank"
										rel="noreferrer noopener"
									>
										Intent suite
									</a>
								</Button>
								{!forwardNetworkId ? (
									<span className="text-sm text-amber-600">
										missing forwardNetworkId for this saved network
									</span>
								) : null}
							</div>

							{secRunM.isPending ? <Skeleton className="h-20 w-full" /> : null}

							{secRunM.data ? (
								<div className="space-y-3">
									<div className="flex flex-wrap gap-2">
										<Badge variant="secondary">
											Total: {secRunM.data.total}
										</Badge>
										<Badge variant="secondary">
											Snapshot: {secRunM.data.snapshotId ?? "latest"}
										</Badge>
									</div>
									{(() => {
										const arr = parsePolicyReportResults(secRunM.data as any);
										const viol = arr.filter((r) =>
											Boolean((r as any)?.violation),
										);
										if (!viol.length) {
											return (
												<div className="text-sm text-muted-foreground">
													No violations detected.
												</div>
											);
										}
										return (
											<div className="overflow-x-auto">
												<table className="w-full border-collapse text-sm">
													<thead>
														<tr className="border-b">
															<th className="p-2 text-left">Flow</th>
															<th className="p-2 text-left">Outcome</th>
															<th className="p-2 text-left">Enforced</th>
															<th className="p-2 text-left">Reason</th>
														</tr>
													</thead>
													<tbody>
														{viol.slice(0, 50).map((r, idx) => (
															<tr key={idx} className="border-b">
																<td className="p-2 font-mono text-xs">
																	{String((r as any)?.srcIp ?? "")} -&gt;{" "}
																	{String((r as any)?.dstIp ?? "")}{" "}
																	{(r as any)?.ipProto !== undefined
																		? `p=${String((r as any)?.ipProto)}`
																		: ""}
																	{(r as any)?.dstPort
																		? ` dport=${String((r as any)?.dstPort)}`
																		: ""}
																</td>
																<td className="p-2 font-mono text-xs">
																	{String((r as any)?.forwardingOutcome ?? "—")}
																</td>
																<td className="p-2 font-mono text-xs">
																	{String((r as any)?.enforced ?? "—")}
																</td>
																<td className="p-2 text-xs text-muted-foreground">
																	{Array.isArray((r as any)?.riskReasons) &&
																	(r as any).riskReasons.length
																		? String((r as any).riskReasons[0])
																		: "—"}
																</td>
															</tr>
														))}
													</tbody>
												</table>
											</div>
										);
									})()}
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									Run Paths Assurance to detect enforcement bypass and delivery
									anomalies.
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="actions" className="space-y-3">
					<Card>
						<CardHeader>
							<CardTitle>Actions</CardTitle>
							<CardDescription>
								Demo artifacts and future closed-loop hooks.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="text-sm text-muted-foreground">
								V1: export/copy artifacts; future: Ansible/tickets/change
								planning integrations.
							</div>
							<Button
								variant="outline"
								onClick={async () => {
									const demands = parseDemandsCSV(demandsText);
									const thr = Number(threshold);
									const spec: AssuranceScenarioSpec = {
										snapshotId: snapshotId.trim() || undefined,
										window,
										thresholdUtil: Number.isFinite(thr) ? thr : undefined,
										demands,
									};
									await navigator.clipboard.writeText(
										JSON.stringify(spec, null, 2),
									);
									toast.success("Copied scenario spec JSON to clipboard");
								}}
								disabled={!demandsText.trim()}
							>
								Copy scenario spec JSON
							</Button>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			<Dialog open={newOpen} onOpenChange={setNewOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>New Scenario</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Name</div>
							<Input
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<div className="text-sm text-muted-foreground">Description</div>
							<Input
								value={newDesc}
								onChange={(e) => setNewDesc(e.target.value)}
							/>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button variant="outline" onClick={() => setNewOpen(false)}>
								Cancel
							</Button>
							<Button
								onClick={() => createM.mutate()}
								disabled={createM.isPending}
							>
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={runDetailOpen}
				onOpenChange={(v) => {
					setRunDetailOpen(v);
					if (!v) setRunDetailId("");
				}}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Run Detail</DialogTitle>
					</DialogHeader>
					{runDetailQ.isLoading ? (
						<Skeleton className="h-24 w-full" />
					) : runDetailQ.isError ? (
						<div className="text-sm text-destructive">Failed to load run.</div>
					) : runDetailQ.data ? (
						<div className="space-y-3">
							<div className="flex flex-wrap gap-2">
								<Badge variant="secondary">{runDetailQ.data.run.status}</Badge>
								<Badge variant="secondary">
									<span className="font-mono text-xs">
										{runDetailQ.data.run.id}
									</span>
								</Badge>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={async () => {
										await navigator.clipboard.writeText(
											JSON.stringify(runDetailQ.data, null, 2),
										);
										toast.success("Copied run JSON to clipboard");
									}}
								>
									Copy JSON
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const id = runDetailQ.data.run.id;
										downloadTextFile(
											`assurance-studio-run-${id}.json`,
											"application/json",
											JSON.stringify(runDetailQ.data, null, 2) + "\n",
										);
									}}
								>
									Download JSON
								</Button>
							</div>
							<Textarea
								readOnly
								className="min-h-[420px] font-mono text-xs"
								value={JSON.stringify(runDetailQ.data, null, 2)}
							/>
						</div>
					) : (
						<div className="text-sm text-muted-foreground">—</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
