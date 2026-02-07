import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	ArrowLeft,
	Download,
	FolderClock,
	Layers,
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
	CardDescription,
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
import { Switch } from "../../../components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../components/ui/table";
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
	type PolicyReportException,
	type PolicyReportForwardCredentialsStatus,
	type PolicyReportForwardNetwork,
	type PolicyReportNQEResponse,
	type PolicyReportPack,
	type PolicyReportPackDeltaResponse,
	type PolicyReportRecertAssignment,
	type PolicyReportRecertCampaignWithCounts,
	type PolicyReportRun,
	type PolicyReportRunCheck,
	type PolicyReportRunFinding,
	type PolicyReportRunPackResponse,
	type PolicyReportZone,
	approveWorkspacePolicyReportException,
	attestWorkspacePolicyReportRecertAssignment,
	createWorkspacePolicyReportCustomRun,
	createWorkspacePolicyReportException,
	createWorkspacePolicyReportForwardNetwork,
	createWorkspacePolicyReportRecertCampaign,
	createWorkspacePolicyReportRun,
	createWorkspacePolicyReportZone,
	deleteWorkspacePolicyReportForwardNetwork,
	deleteWorkspacePolicyReportForwardNetworkCredentials,
	deleteWorkspacePolicyReportZone,
	generateWorkspacePolicyReportRecertAssignments,
	getWorkspacePolicyReportCheck,
	getWorkspacePolicyReportChecks,
	getWorkspacePolicyReportForwardNetworkCredentials,
	getWorkspacePolicyReportPacks,
	getWorkspacePolicyReportRun,
	getWorkspacePolicyReportSnapshots,
	listWorkspacePolicyReportExceptions,
	listWorkspacePolicyReportFindings,
	listWorkspacePolicyReportForwardNetworks,
	listWorkspacePolicyReportRecertAssignments,
	listWorkspacePolicyReportRecertCampaigns,
	listWorkspacePolicyReportRunFindings,
	listWorkspacePolicyReportRuns,
	listWorkspacePolicyReportZones,
	putWorkspacePolicyReportForwardNetworkCredentials,
	rejectWorkspacePolicyReportException,
	runWorkspacePolicyReportCheck,
	runWorkspacePolicyReportPack,
	runWorkspacePolicyReportPackDelta,
	simulateWorkspacePolicyReportChangePlanning,
	waiveWorkspacePolicyReportRecertAssignment,
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

function splitListText(text: string): string[] {
	const parts = text
		.split(/[\n,]+/g)
		.map((s) => s.trim())
		.filter(Boolean);
	const out: string[] = [];
	const seen = new Set<string>();
	for (const p of parts) {
		if (seen.has(p)) continue;
		seen.add(p);
		out.push(p);
	}
	return out;
}

function splitPortsText(text: string): number[] {
	const parts = text
		.split(/[\n,]+/g)
		.map((s) => s.trim())
		.filter(Boolean);
	const out: number[] = [];
	const seen = new Set<number>();
	for (const p of parts) {
		const n = Number(p);
		if (!Number.isFinite(n) || n <= 0 || n > 65535) continue;
		const v = Math.trunc(n);
		if (seen.has(v)) continue;
		seen.add(v);
		out.push(v);
	}
	return out;
}

function parseFlowSuiteText(
	text: string,
): Array<{ srcIp: string; dstIp: string; ipProto: number; dstPort: number }> {
	const lines = text.split(/\r?\n/g).map((l) => l.trim());
	const out: Array<{
		srcIp: string;
		dstIp: string;
		ipProto: number;
		dstPort: number;
	}> = [];
	for (const ln of lines) {
		if (!ln) continue;
		if (ln.startsWith("#")) continue;
		const parts = ln
			.split(/[,\s]+/g)
			.map((p) => p.trim())
			.filter(Boolean);
		if (parts.length < 2) continue;
		const srcIp = parts[0] ?? "";
		const dstIp = parts[1] ?? "";
		const ipProto = Number(parts[2] ?? "6");
		const dstPort = Number(parts[3] ?? "443");
		if (!srcIp || !dstIp) continue;
		out.push({
			srcIp,
			dstIp,
			ipProto: Number.isFinite(ipProto) ? Math.trunc(ipProto) : 6,
			dstPort: Number.isFinite(dstPort) ? Math.trunc(dstPort) : 443,
		});
	}
	return out;
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
	const [suppressApprovedExceptions, setSuppressApprovedExceptions] =
		useState<boolean>(false);
	const [savedNetworkRef, setSavedNetworkRef] = useState<string>("");
	const [addNetworkOpen, setAddNetworkOpen] = useState<boolean>(false);
	const [addNetworkForwardId, setAddNetworkForwardId] = useState<string>("");
	const [addNetworkName, setAddNetworkName] = useState<string>("");
	const [addNetworkDesc, setAddNetworkDesc] = useState<string>("");
	const [credsOpen, setCredsOpen] = useState<boolean>(false);
	const [credsBaseUrl, setCredsBaseUrl] = useState<string>("https://fwd.app");
	const [credsSkipTLSVerify, setCredsSkipTLSVerify] = useState<boolean>(false);
	const [credsUsername, setCredsUsername] = useState<string>("");
	const [credsPassword, setCredsPassword] = useState<string>("");
	const [flowSrcIp, setFlowSrcIp] = useState<string>("");
	const [flowDstIp, setFlowDstIp] = useState<string>("");
	const [flowIpProto, setFlowIpProto] = useState<string>("6");
	const [flowDstPort, setFlowDstPort] = useState<string>("443");
	const [flowFirewallsOnly, setFlowFirewallsOnly] = useState<boolean>(true);
	const [flowIncludeImplicitDefault, setFlowIncludeImplicitDefault] =
		useState<boolean>(false);

	// Intent suite (batch flows)
	const [intentFlowsText, setIntentFlowsText] = useState<string>("");
	const [intentSuiteRows, setIntentSuiteRows] = useState<
		Array<{
			flow: { srcIp: string; dstIp: string; ipProto: number; dstPort: number };
			permits: number;
			denies: number;
			noMatch: number;
			resp: PolicyReportNQEResponse;
		}>
	>([]);
	const [intentDetailOpen, setIntentDetailOpen] = useState<boolean>(false);
	const [intentDetail, setIntentDetail] = useState<any>(null);
	const [baselineSnapshotId, setBaselineSnapshotId] = useState<string>("");
	const [compareSnapshotId, setCompareSnapshotId] = useState<string>("");
	const [deltaPackId, setDeltaPackId] = useState<string>("");

	const [activeTab, setActiveTab] = useState<
		| "flow"
		| "intent"
		| "checks"
		| "packs"
		| "deltas"
		| "segmentation"
		| "runs"
		| "governance"
		| "change"
	>("flow");
	const [resultsByCheck, setResultsByCheck] = useState<
		Record<string, PolicyReportNQEResponse>
	>({});
	const [lastPackRun, setLastPackRun] =
		useState<PolicyReportRunPackResponse | null>(null);
	const [lastDeltaRun, setLastDeltaRun] =
		useState<PolicyReportPackDeltaResponse | null>(null);

	const [openCheckId, setOpenCheckId] = useState<string>("");
	const [flowEvidenceOpen, setFlowEvidenceOpen] = useState<boolean>(false);
	const [flowEvidence, setFlowEvidence] = useState<string>("");
	const [flowSelectedDevice, setFlowSelectedDevice] = useState<string>("");
	const [flowMatchesResp, setFlowMatchesResp] =
		useState<PolicyReportNQEResponse | null>(null);
	const [flowRuleEvidenceOpen, setFlowRuleEvidenceOpen] =
		useState<boolean>(false);
	const [flowRuleEvidence, setFlowRuleEvidence] = useState<string>("");

	const [genericEvidenceOpen, setGenericEvidenceOpen] = useState(false);
	const [genericEvidence, setGenericEvidence] = useState("");

	const [deltaCheckDialogOpen, setDeltaCheckDialogOpen] = useState(false);
	const [deltaCheckDialogCheckId, setDeltaCheckDialogCheckId] =
		useState<string>("");
	const [deltaChangedDialogOpen, setDeltaChangedDialogOpen] = useState(false);
	const [deltaChangedDialogPayload, setDeltaChangedDialogPayload] = useState<{
		findingId: string;
		baseline: unknown;
		compare: unknown;
	} | null>(null);

	const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
	const [createCampaignOpen, setCreateCampaignOpen] = useState<boolean>(false);
	const [campaignName, setCampaignName] = useState<string>("");
	const [campaignDesc, setCampaignDesc] = useState<string>("");
	const [campaignPackId, setCampaignPackId] = useState<string>("policy-recert");
	const [campaignDueAt, setCampaignDueAt] = useState<string>("");
	const [campaignAssignee, setCampaignAssignee] = useState<string>("");

	const [exceptionCreateOpen, setExceptionCreateOpen] =
		useState<boolean>(false);
	const [exceptionFindingId, setExceptionFindingId] = useState<string>("");
	const [exceptionCheckId, setExceptionCheckId] = useState<string>("");
	const [exceptionJustification, setExceptionJustification] =
		useState<string>("");
	const [exceptionTicketUrl, setExceptionTicketUrl] = useState<string>("");
	const [exceptionExpiresAt, setExceptionExpiresAt] = useState<string>("");

	const [assignmentDecisionOpen, setAssignmentDecisionOpen] =
		useState<boolean>(false);
	const [assignmentDecisionMode, setAssignmentDecisionMode] = useState<
		"ATTEST" | "WAIVE"
	>("ATTEST");
	const [assignmentDecisionId, setAssignmentDecisionId] = useState<string>("");
	const [assignmentDecisionJustification, setAssignmentDecisionJustification] =
		useState<string>("");

	const [cpDeviceName, setCpDeviceName] = useState<string>("");
	const [cpOp, setCpOp] = useState<string>("ADD");
	const [cpRuleIndex, setCpRuleIndex] = useState<string>("0");
	const [cpRuleAction, setCpRuleAction] = useState<string>("DENY");
	const [cpIpv4Src, setCpIpv4Src] = useState<string>("0.0.0.0/0");
	const [cpIpv4Dst, setCpIpv4Dst] = useState<string>("0.0.0.0/0");
	const [cpIpProto, setCpIpProto] = useState<string>("6,17");
	const [cpTpDst, setCpTpDst] = useState<string>("");
	const [cpFlowsText, setCpFlowsText] = useState<string>("");
	const [cpResult, setCpResult] = useState<any>(null);

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

	// Segmentation (zones)
	const [zoneCreateOpen, setZoneCreateOpen] = useState<boolean>(false);
	const [zoneName, setZoneName] = useState<string>("");
	const [zoneDesc, setZoneDesc] = useState<string>("");
	const [zoneSubnetsText, setZoneSubnetsText] = useState<string>("");
	const [segSrcZoneId, setSegSrcZoneId] = useState<string>("");
	const [segDstZoneId, setSegDstZoneId] = useState<string>("");
	const [segSensitivePortsText, setSegSensitivePortsText] = useState<string>(
		"22,23,3389,445,1433,1521,3306,5432,6379,9200,27017",
	);
	const [segAnyServiceResp, setSegAnyServiceResp] =
		useState<PolicyReportNQEResponse | null>(null);
	const [segSensitiveResp, setSegSensitiveResp] =
		useState<PolicyReportNQEResponse | null>(null);
	const [segAnyToZoneAnyServiceResp, setSegAnyToZoneAnyServiceResp] =
		useState<PolicyReportNQEResponse | null>(null);
	const [segAnyToZoneSensitiveResp, setSegAnyToZoneSensitiveResp] =
		useState<PolicyReportNQEResponse | null>(null);
	const [segStoredRun, setSegStoredRun] = useState<PolicyReportRun | null>(
		null,
	);

	// Runs history
	const [runDialogOpen, setRunDialogOpen] = useState<boolean>(false);
	const [runDialogId, setRunDialogId] = useState<string>("");
	const [runDialogCheckId, setRunDialogCheckId] = useState<string>("");

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

	const forwardNetworks = useQuery({
		queryKey: ["policyReportsForwardNetworks", workspaceId],
		queryFn: () => listWorkspacePolicyReportForwardNetworks(workspaceId),
		staleTime: 10_000,
	});

	const campaigns = useQuery({
		queryKey: queryKeys.policyReportsRecertCampaigns(workspaceId),
		queryFn: () => listWorkspacePolicyReportRecertCampaigns(workspaceId),
		staleTime: 10_000,
	});

	const assignments = useQuery({
		queryKey: queryKeys.policyReportsRecertAssignments(
			workspaceId,
			selectedCampaignId,
		),
		queryFn: () =>
			listWorkspacePolicyReportRecertAssignments(
				workspaceId,
				selectedCampaignId || undefined,
				undefined,
				undefined,
				200,
			),
		enabled: !!selectedCampaignId,
		staleTime: 10_000,
	});

	const exceptions = useQuery({
		queryKey: queryKeys.policyReportsExceptions(workspaceId, networkId.trim()),
		queryFn: () =>
			listWorkspacePolicyReportExceptions(
				workspaceId,
				networkId.trim() || undefined,
				undefined,
				500,
			),
		enabled: networkId.trim().length > 0,
		staleTime: 10_000,
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

	const forwardCreds = useQuery({
		queryKey: ["policyReportsForwardCreds", workspaceId, networkId.trim()],
		queryFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return getWorkspacePolicyReportForwardNetworkCredentials(
				workspaceId,
				net,
			);
		},
		enabled: networkId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const zones = useQuery({
		queryKey: queryKeys.policyReportsZones(workspaceId, networkId.trim()),
		queryFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return listWorkspacePolicyReportZones(workspaceId, net);
		},
		enabled: networkId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const runs = useQuery({
		queryKey: queryKeys.policyReportsRuns(workspaceId, networkId.trim()),
		queryFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return listWorkspacePolicyReportRuns(
				workspaceId,
				net,
				undefined,
				undefined,
				50,
			);
		},
		enabled: networkId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const runDetail = useQuery({
		queryKey: queryKeys.policyReportsRun(workspaceId, runDialogId),
		queryFn: () => getWorkspacePolicyReportRun(workspaceId, runDialogId),
		enabled: runDialogOpen && runDialogId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const runFindings = useQuery({
		queryKey: queryKeys.policyReportsRunFindings(
			workspaceId,
			runDialogId,
			runDialogCheckId.trim() || undefined,
		),
		queryFn: async () => {
			const runId = runDialogId.trim();
			if (!runId) throw new Error("Run ID is required");
			return listWorkspacePolicyReportRunFindings(
				workspaceId,
				runId,
				runDialogCheckId.trim() || undefined,
				500,
			);
		},
		enabled: runDialogOpen && runDialogId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const aggFindings = useQuery({
		queryKey: queryKeys.policyReportsFindings(workspaceId, networkId.trim()),
		queryFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return listWorkspacePolicyReportFindings(
				workspaceId,
				net,
				undefined,
				"ACTIVE",
				500,
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

	const runFlowDecision = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const src = flowSrcIp.trim();
			const dst = flowDstIp.trim();
			if (!src || !dst)
				throw new Error("Source and destination IP are required");

			const ipProto = Number(flowIpProto.trim() || "-1");
			const dstPort = Number(flowDstPort.trim() || "-1");

			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "acl-flow-decision.nqe",
				parameters: {
					srcIp: src,
					dstIp: dst,
					ipProto: Number.isFinite(ipProto) ? ipProto : -1,
					dstPort: Number.isFinite(dstPort) ? dstPort : -1,
					firewallsOnly: flowFirewallsOnly,
					includeImplicitDefault: flowIncludeImplicitDefault,
				},
			});
		},
		onSuccess: (resp) => {
			setResultsByCheck((prev) => ({
				...prev,
				["acl-flow-decision.nqe"]: resp,
			}));
			toast.success("Flow decision completed");
		},
		onError: (e) =>
			toast.error("Flow decision failed", {
				description: (e as Error).message,
			}),
	});

	const runFlowToRules = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const src = flowSrcIp.trim();
			const dst = flowDstIp.trim();
			if (!src || !dst)
				throw new Error("Source and destination IP are required");

			const ipProto = Number(flowIpProto.trim() || "-1");
			const dstPort = Number(flowDstPort.trim() || "-1");

			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "acl-flow-to-rules.nqe",
				parameters: {
					srcIp: src,
					dstIp: dst,
					ipProto: Number.isFinite(ipProto) ? ipProto : -1,
					dstPort: Number.isFinite(dstPort) ? dstPort : -1,
					firewallsOnly: flowFirewallsOnly,
					includeImplicitDefault: flowIncludeImplicitDefault,
				},
			});
		},
		onSuccess: (resp) => {
			setFlowMatchesResp(resp);
			toast.success("Flow matches completed");
		},
		onError: (e) =>
			toast.error("Flow matches failed", {
				description: (e as Error).message,
			}),
	});

	const runNatFlowMatches = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const src = flowSrcIp.trim();
			const dst = flowDstIp.trim();
			if (!src || !dst)
				throw new Error("Source and destination IP are required");

			const ipProto = Number(flowIpProto.trim() || "-1");
			const dstPort = Number(flowDstPort.trim() || "-1");

			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "nat-flow-matches.nqe",
				parameters: {
					srcIp: src,
					dstIp: dst,
					ipProto: Number.isFinite(ipProto) ? ipProto : -1,
					dstPort: Number.isFinite(dstPort) ? dstPort : -1,
				},
			});
		},
		onSuccess: (resp) => {
			setResultsByCheck((prev) => ({
				...prev,
				["nat-flow-matches.nqe"]: resp,
			}));
			toast.success("NAT matches completed");
		},
		onError: (e) =>
			toast.error("NAT matches failed", {
				description: (e as Error).message,
			}),
	});

	const runIntentSuite = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const flows = parseFlowSuiteText(intentFlowsText);
			if (flows.length === 0)
				throw new Error(
					"Add at least one flow (srcIp dstIp [ipProto] [dstPort])",
				);

			const rows: Array<{
				flow: {
					srcIp: string;
					dstIp: string;
					ipProto: number;
					dstPort: number;
				};
				permits: number;
				denies: number;
				noMatch: number;
				resp: PolicyReportNQEResponse;
			}> = [];

			for (const f of flows) {
				const resp = await runWorkspacePolicyReportCheck(workspaceId, {
					networkId: net,
					snapshotId: snapshotId.trim() || undefined,
					checkId: "acl-flow-decision.nqe",
					parameters: {
						srcIp: f.srcIp,
						dstIp: f.dstIp,
						ipProto: f.ipProto,
						dstPort: f.dstPort,
						firewallsOnly: flowFirewallsOnly,
						includeImplicitDefault: flowIncludeImplicitDefault,
					},
				});
				const list = asArray((resp as any)?.results);
				let permits = 0;
				let denies = 0;
				let noMatch = 0;
				for (const r of list) {
					const d = String((r as any)?.decision ?? "");
					if (d === "PERMIT") permits++;
					else if (d === "DENY") denies++;
					else noMatch++;
				}
				rows.push({ flow: f, permits, denies, noMatch, resp });
			}
			return rows;
		},
		onSuccess: (rows) => {
			setIntentSuiteRows(rows);
			toast.success("Intent suite completed", {
				description: `${rows.length} flows`,
			});
		},
		onError: (e) =>
			toast.error("Intent suite failed", { description: (e as Error).message }),
	});

	const storeIntentSuiteAsRuns = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const flows = parseFlowSuiteText(intentFlowsText);
			if (flows.length === 0)
				throw new Error(
					"Add at least one flow (srcIp dstIp [ipProto] [dstPort])",
				);
			if (flows.length > 20)
				throw new Error("Limit is 20 flows for stored runs");

			const created: string[] = [];
			for (const f of flows) {
				const title = `${f.srcIp} -> ${f.dstIp} proto=${f.ipProto} port=${f.dstPort}`;
				const resp = await createWorkspacePolicyReportCustomRun(workspaceId, {
					forwardNetworkId: net,
					snapshotId: snapshotId.trim() || undefined,
					packId: "intent",
					title,
					checks: [
						{
							checkId: "acl-flow-decision.nqe",
							parameters: {
								srcIp: f.srcIp,
								dstIp: f.dstIp,
								ipProto: f.ipProto,
								dstPort: f.dstPort,
								firewallsOnly: flowFirewallsOnly,
								includeImplicitDefault: flowIncludeImplicitDefault,
							},
						},
						{
							checkId: "nat-flow-matches.nqe",
							parameters: {
								srcIp: f.srcIp,
								dstIp: f.dstIp,
								ipProto: f.ipProto,
								dstPort: f.dstPort,
							},
						},
					],
				});
				created.push(resp.run.id);
			}
			return created;
		},
		onSuccess: async (ids) => {
			toast.success("Stored intent runs", {
				description: `${ids.length} runs`,
			});
			await runs.refetch();
		},
		onError: (e) =>
			toast.error("Store intent runs failed", {
				description: (e as Error).message,
			}),
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

	const runPackAndStore = useMutation({
		mutationFn: async (packId: string) => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			if (!packId.trim()) throw new Error("Pack is required");
			return createWorkspacePolicyReportRun(workspaceId, {
				forwardNetworkId: net,
				snapshotId: snapshotId.trim() || undefined,
				packId: packId.trim(),
			});
		},
		onSuccess: async (resp) => {
			if (resp.results) {
				setResultsByCheck((prev) => ({ ...prev, ...resp.results }));
				setLastPackRun({
					packId: resp.run.packId,
					networkId: resp.run.forwardNetworkId,
					snapshotId: resp.run.snapshotId,
					results: resp.results,
				});
			}
			toast.success("Pack stored", { description: resp.run.id });
			await runs.refetch();
		},
		onError: (e) =>
			toast.error("Pack store failed", {
				description: (e as Error).message,
			}),
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

	const createForwardNetwork = useMutation({
		mutationFn: async () => {
			const forwardNetworkId = addNetworkForwardId.trim();
			const name = addNetworkName.trim();
			if (!forwardNetworkId) throw new Error("Forward Network ID is required");
			if (!name) throw new Error("Name is required");
			return createWorkspacePolicyReportForwardNetwork(workspaceId, {
				forwardNetworkId,
				name,
				description: addNetworkDesc.trim() || undefined,
			});
		},
		onSuccess: async (n) => {
			toast.success("Network saved", { description: n.forwardNetworkId });
			setAddNetworkOpen(false);
			setAddNetworkForwardId("");
			setAddNetworkName("");
			setAddNetworkDesc("");
			await forwardNetworks.refetch();
		},
		onError: (e) =>
			toast.error("Save network failed", {
				description: (e as Error).message,
			}),
	});

	const deleteForwardNetwork = useMutation({
		mutationFn: async (networkRef: string) => {
			if (!networkRef.trim()) throw new Error("Select a saved network");
			return deleteWorkspacePolicyReportForwardNetwork(
				workspaceId,
				networkRef.trim(),
			);
		},
		onSuccess: async () => {
			toast.success("Network deleted");
			setSavedNetworkRef("");
			await forwardNetworks.refetch();
		},
		onError: (e) =>
			toast.error("Delete network failed", {
				description: (e as Error).message,
			}),
	});

	const putForwardCreds = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const baseUrl = credsBaseUrl.trim();
			if (!baseUrl) throw new Error("Forward URL is required");
			const username = credsUsername.trim();
			if (!username) throw new Error("Forward username is required");
			return putWorkspacePolicyReportForwardNetworkCredentials(
				workspaceId,
				net,
				{
					baseUrl,
					skipTlsVerify: credsSkipTLSVerify,
					username,
					password: credsPassword.trim() || undefined,
				},
			);
		},
		onSuccess: async () => {
			toast.success("Credentials saved");
			setCredsPassword("");
			setCredsOpen(false);
			await forwardCreds.refetch();
		},
		onError: (e) =>
			toast.error("Save credentials failed", {
				description: (e as Error).message,
			}),
	});

	const deleteForwardCreds = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return deleteWorkspacePolicyReportForwardNetworkCredentials(
				workspaceId,
				net,
			);
		},
		onSuccess: async () => {
			toast.success("Credentials cleared");
			setCredsPassword("");
			await forwardCreds.refetch();
		},
		onError: (e) =>
			toast.error("Clear credentials failed", {
				description: (e as Error).message,
			}),
	});

	const createZone = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const name = zoneName.trim();
			if (!name) throw new Error("Zone name is required");
			const subnets = splitListText(zoneSubnetsText);
			if (subnets.length === 0)
				throw new Error("At least one subnet is required");
			return createWorkspacePolicyReportZone(workspaceId, net, {
				name,
				description: zoneDesc.trim() || undefined,
				subnets,
			});
		},
		onSuccess: async (z) => {
			toast.success("Zone created", { description: z.name });
			setZoneCreateOpen(false);
			setZoneName("");
			setZoneDesc("");
			setZoneSubnetsText("");
			await zones.refetch();
		},
		onError: (e) =>
			toast.error("Create zone failed", {
				description: (e as Error).message,
			}),
	});

	const deleteZone = useMutation({
		mutationFn: async (zoneId: string) => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return deleteWorkspacePolicyReportZone(workspaceId, net, zoneId);
		},
		onSuccess: async () => {
			toast.success("Zone deleted");
			await zones.refetch();
		},
		onError: (e) =>
			toast.error("Delete zone failed", {
				description: (e as Error).message,
			}),
	});

	const runSegAnyService = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const zonesList: PolicyReportZone[] = zones.data?.zones ?? [];
			const src = zonesList.find((z) => z.id === segSrcZoneId);
			const dst = zonesList.find((z) => z.id === segDstZoneId);
			if (!src || !dst) throw new Error("Select source and destination zones");
			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "acl-zone-to-zone-any-service.nqe",
				parameters: {
					srcSubnets: src.subnets,
					dstSubnets: dst.subnets,
					firewallsOnly: true,
					includeImplicitDefault: false,
				},
			});
		},
		onSuccess: (resp) => {
			setSegAnyServiceResp(resp);
			toast.success("Segmentation check completed");
		},
		onError: (e) =>
			toast.error("Segmentation check failed", {
				description: (e as Error).message,
			}),
	});

	const runSegSensitivePorts = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const zonesList: PolicyReportZone[] = zones.data?.zones ?? [];
			const src = zonesList.find((z) => z.id === segSrcZoneId);
			const dst = zonesList.find((z) => z.id === segDstZoneId);
			if (!src || !dst) throw new Error("Select source and destination zones");
			const ports = splitPortsText(segSensitivePortsText);
			if (ports.length === 0) throw new Error("Sensitive ports is required");
			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "acl-zone-to-zone-sensitive-ports.nqe",
				parameters: {
					srcSubnets: src.subnets,
					dstSubnets: dst.subnets,
					sensitivePorts: ports,
					firewallsOnly: true,
					includeImplicitDefault: false,
				},
			});
		},
		onSuccess: (resp) => {
			setSegSensitiveResp(resp);
			toast.success("Sensitive ports check completed");
		},
		onError: (e) =>
			toast.error("Sensitive ports check failed", {
				description: (e as Error).message,
			}),
	});

	const storeSegmentationReport = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const zonesList: PolicyReportZone[] = zones.data?.zones ?? [];
			const src = zonesList.find((z) => z.id === segSrcZoneId);
			const dst = zonesList.find((z) => z.id === segDstZoneId);
			if (!src || !dst) throw new Error("Select source and destination zones");
			const ports = splitPortsText(segSensitivePortsText);
			if (ports.length === 0) throw new Error("Sensitive ports is required");
			const title = `${src.name} -> ${dst.name}`;
			return createWorkspacePolicyReportCustomRun(workspaceId, {
				forwardNetworkId: net,
				snapshotId: snapshotId.trim() || undefined,
				packId: "segmentation",
				title,
				checks: [
					{
						checkId: "acl-zone-to-zone-any-service.nqe",
						parameters: {
							srcSubnets: src.subnets,
							dstSubnets: dst.subnets,
							firewallsOnly: true,
							includeImplicitDefault: false,
						},
					},
					{
						checkId: "acl-zone-to-zone-sensitive-ports.nqe",
						parameters: {
							srcSubnets: src.subnets,
							dstSubnets: dst.subnets,
							sensitivePorts: ports,
							firewallsOnly: true,
							includeImplicitDefault: false,
						},
					},
				],
			});
		},
		onSuccess: async (resp) => {
			setSegStoredRun(resp.run);
			toast.success("Segmentation report stored", {
				description: resp.run.id,
			});
			await runs.refetch();
		},
		onError: (e) =>
			toast.error("Store segmentation report failed", {
				description: (e as Error).message,
			}),
	});

	const runAnyToZoneAnyService = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const zonesList: PolicyReportZone[] = zones.data?.zones ?? [];
			const dst = zonesList.find((z) => z.id === segDstZoneId);
			if (!dst) throw new Error("Select a destination zone");
			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "acl-any-to-zone-any-service.nqe",
				parameters: {
					dstSubnets: dst.subnets,
					firewallsOnly: true,
					includeImplicitDefault: false,
				},
			});
		},
		onSuccess: (resp) => {
			setSegAnyToZoneAnyServiceResp(resp);
			toast.success("Any-to-zone any-service check completed");
		},
		onError: (e) =>
			toast.error("Any-to-zone any-service failed", {
				description: (e as Error).message,
			}),
	});

	const runAnyToZoneSensitivePorts = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const zonesList: PolicyReportZone[] = zones.data?.zones ?? [];
			const dst = zonesList.find((z) => z.id === segDstZoneId);
			if (!dst) throw new Error("Select a destination zone");
			const ports = splitPortsText(segSensitivePortsText);
			if (ports.length === 0) throw new Error("Sensitive ports is required");
			return runWorkspacePolicyReportCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId: "acl-any-to-zone-sensitive-ports.nqe",
				parameters: {
					dstSubnets: dst.subnets,
					sensitivePorts: ports,
					firewallsOnly: true,
					includeImplicitDefault: false,
				},
			});
		},
		onSuccess: (resp) => {
			setSegAnyToZoneSensitiveResp(resp);
			toast.success("Any-to-zone sensitive ports check completed");
		},
		onError: (e) =>
			toast.error("Any-to-zone sensitive ports failed", {
				description: (e as Error).message,
			}),
	});

	const createCampaign = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			const name = campaignName.trim();
			if (!name) throw new Error("Campaign name is required");
			const packId = campaignPackId.trim();
			if (!packId) throw new Error("Pack is required");
			const dueAt = campaignDueAt.trim();
			return createWorkspacePolicyReportRecertCampaign(workspaceId, {
				name,
				description: campaignDesc.trim() || undefined,
				forwardNetworkId: net,
				snapshotId: snapshotId.trim() || undefined,
				packId,
				dueAt: dueAt || undefined,
			});
		},
		onSuccess: async (resp) => {
			toast.success("Campaign created");
			setCreateCampaignOpen(false);
			setSelectedCampaignId(resp.campaign.id);
			setCampaignName("");
			setCampaignDesc("");
			await campaigns.refetch();
		},
		onError: (e) =>
			toast.error("Create campaign failed", {
				description: (e as Error).message,
			}),
	});

	const generateAssignments = useMutation({
		mutationFn: async () => {
			if (!selectedCampaignId) throw new Error("Select a campaign");
			return generateWorkspacePolicyReportRecertAssignments(
				workspaceId,
				selectedCampaignId,
				{
					assigneeUsername: campaignAssignee.trim() || undefined,
					maxPerCheck: 500,
					maxTotal: 5000,
				},
			);
		},
		onSuccess: async (resp) => {
			toast.success("Assignments generated", {
				description: `${resp.created} stored`,
			});
			await campaigns.refetch();
			await assignments.refetch();
		},
		onError: (e) =>
			toast.error("Generate assignments failed", {
				description: (e as Error).message,
			}),
	});

	const attestAssignment = useMutation({
		mutationFn: async (req: {
			assignmentId: string;
			justification: string;
		}) => {
			const justification = req.justification.trim();
			if (!justification) throw new Error("Justification is required");
			return attestWorkspacePolicyReportRecertAssignment(
				workspaceId,
				req.assignmentId,
				{ justification },
			);
		},
		onSuccess: async () => {
			toast.success("Assignment attested");
			setAssignmentDecisionOpen(false);
			setAssignmentDecisionId("");
			setAssignmentDecisionJustification("");
			await assignments.refetch();
			await campaigns.refetch();
		},
		onError: (e) =>
			toast.error("Attest failed", { description: (e as Error).message }),
	});

	const waiveAssignment = useMutation({
		mutationFn: async (req: {
			assignmentId: string;
			justification: string;
		}) => {
			const justification = req.justification.trim();
			if (!justification) throw new Error("Justification is required");
			return waiveWorkspacePolicyReportRecertAssignment(
				workspaceId,
				req.assignmentId,
				{ justification },
			);
		},
		onSuccess: async () => {
			toast.success("Assignment waived");
			setAssignmentDecisionOpen(false);
			setAssignmentDecisionId("");
			setAssignmentDecisionJustification("");
			await assignments.refetch();
			await campaigns.refetch();
		},
		onError: (e) =>
			toast.error("Waive failed", { description: (e as Error).message }),
	});

	const createException = useMutation({
		mutationFn: async () => {
			const forwardNetworkId = networkId.trim();
			if (!forwardNetworkId) throw new Error("Network ID is required");
			const findingId = exceptionFindingId.trim();
			const checkId = exceptionCheckId.trim();
			const justification = exceptionJustification.trim();
			if (!findingId || !checkId || !justification) {
				throw new Error("findingId, checkId, and justification are required");
			}
			return createWorkspacePolicyReportException(workspaceId, {
				forwardNetworkId,
				findingId,
				checkId,
				justification,
				ticketUrl: exceptionTicketUrl.trim() || undefined,
				expiresAt: exceptionExpiresAt.trim() || undefined,
			});
		},
		onSuccess: async () => {
			toast.success("Exception proposed");
			setExceptionCreateOpen(false);
			setExceptionFindingId("");
			setExceptionCheckId("");
			setExceptionJustification("");
			setExceptionTicketUrl("");
			setExceptionExpiresAt("");
			await exceptions.refetch();
		},
		onError: (e) =>
			toast.error("Create exception failed", {
				description: (e as Error).message,
			}),
	});

	const approveException = useMutation({
		mutationFn: async (exceptionId: string) => {
			return approveWorkspacePolicyReportException(workspaceId, exceptionId);
		},
		onSuccess: async () => {
			toast.success("Exception approved");
			await exceptions.refetch();
		},
		onError: (e) =>
			toast.error("Approve failed", { description: (e as Error).message }),
	});

	const rejectException = useMutation({
		mutationFn: async (exceptionId: string) => {
			return rejectWorkspacePolicyReportException(workspaceId, exceptionId);
		},
		onSuccess: async () => {
			toast.success("Exception rejected");
			await exceptions.refetch();
		},
		onError: (e) =>
			toast.error("Reject failed", { description: (e as Error).message }),
	});

	const runChangePlanning = useMutation({
		mutationFn: async () => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");

			const parseCSV = (s: string) =>
				s
					.split(/[\n,]+/g)
					.map((x) => x.trim())
					.filter(Boolean);
			const parseInts = (s: string) =>
				parseCSV(s)
					.map((x) => Number(x))
					.filter((n) => Number.isFinite(n))
					.map((n) => Math.trunc(n));

			const flows: Array<{
				srcIp: string;
				dstIp: string;
				ipProto?: number;
				dstPort?: number;
			}> = [];

			const rawLines = cpFlowsText
				.split("\n")
				.map((l) => l.trim())
				.filter(Boolean);
			if (rawLines.length === 0) {
				const src = flowSrcIp.trim();
				const dst = flowDstIp.trim();
				if (!src || !dst)
					throw new Error(
						"Provide flows (textarea) or set Source/Destination in Flow tab",
					);
				flows.push({
					srcIp: src,
					dstIp: dst,
					ipProto: Number(flowIpProto.trim() || "-1"),
					dstPort: Number(flowDstPort.trim() || "-1"),
				});
			} else {
				for (const line of rawLines) {
					const parts = line.split(/[,\s]+/g).filter(Boolean);
					if (parts.length < 2) continue;
					const srcIp = parts[0];
					const dstIp = parts[1];
					const ipProto = parts.length >= 3 ? Number(parts[2]) : -1;
					const dstPort = parts.length >= 4 ? Number(parts[3]) : -1;
					flows.push({
						srcIp,
						dstIp,
						ipProto: Number.isFinite(ipProto) ? ipProto : -1,
						dstPort: Number.isFinite(dstPort) ? dstPort : -1,
					});
				}
			}

			const idx = Number(cpRuleIndex.trim() || "0");
			if (!Number.isFinite(idx) || idx < 0)
				throw new Error("Invalid rule index");

			return simulateWorkspacePolicyReportChangePlanning(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				deviceName: cpDeviceName.trim() || undefined,
				firewallsOnly: true,
				includeImplicitDefault: flowIncludeImplicitDefault,
				flows,
				change: {
					op: cpOp.trim() || "ADD",
					rule: {
						index: Math.trunc(idx),
						action: cpRuleAction.trim() || "PERMIT",
						ipv4Src: parseCSV(cpIpv4Src),
						ipv4Dst: parseCSV(cpIpv4Dst),
						ipProto: parseInts(cpIpProto),
						tpDst: parseCSV(cpTpDst),
					},
				},
			});
		},
		onSuccess: (resp) => {
			setCpResult(resp);
			toast.success("Simulation completed");
		},
		onError: (e) =>
			toast.error("Simulation failed", { description: (e as Error).message }),
	});

	function asArray(u: unknown): any[] {
		return Array.isArray(u) ? u : [];
	}

	function evidenceFields(obj: any): Array<{ key: string; value: string }> {
		if (!obj || typeof obj !== "object") return [];
		const out: Array<{ key: string; value: string }> = [];
		for (const [k, v] of Object.entries(obj)) {
			if (k === "evidence" || k.endsWith("Evidence")) {
				const s = typeof v === "string" ? v : "";
				if (s) out.push({ key: k, value: s });
			}
		}
		return out;
	}

	function pickColumns(items: any[]): string[] {
		const preferred = [
			"findingId",
			"riskScore",
			"device",
			"rule",
			"action",
			"decision",
			"severity",
			"category",
			"reason",
			"ruleIndex",
			"firstRuleIndex",
			"shadowedRuleIndex",
			"shadowingRuleIndex",
			"partiallyShadowedRuleIndex",
			"earlierRuleIndex",
			"laterRuleIndex",
			"unreachableRuleIndex",
			"coveringRuleIndex",
			"ospfProcess",
			"os",
		];
		const present = new Set<string>();
		for (const it of items) {
			if (!it || typeof it !== "object") continue;
			for (const k of Object.keys(it)) present.add(k);
		}
		return preferred.filter((k) => present.has(k));
	}

	function fmtValue(v: unknown): string {
		if (v == null) return "";
		if (typeof v === "string") return v;
		if (typeof v === "number" || typeof v === "boolean") return String(v);
		try {
			return JSON.stringify(v);
		} catch {
			return String(v);
		}
	}

	function diffTopLevel(
		a: unknown,
		b: unknown,
	): Array<{
		key: string;
		baseline: string;
		compare: string;
	}> {
		const ao = a && typeof a === "object" ? (a as Record<string, unknown>) : {};
		const bo = b && typeof b === "object" ? (b as Record<string, unknown>) : {};
		const keys = new Set<string>([...Object.keys(ao), ...Object.keys(bo)]);
		keys.delete("findingId");
		const out: Array<{ key: string; baseline: string; compare: string }> = [];
		for (const k of Array.from(keys).sort()) {
			const av = fmtValue(ao[k]);
			const bv = fmtValue(bo[k]);
			if (av === bv) continue;
			out.push({ key: k, baseline: av, compare: bv });
		}
		return out;
	}

	const checksList: PolicyReportCatalogCheck[] = checks.data?.checks ?? [];
	const packsList: PolicyReportPack[] = packs.data?.packs ?? [];
	const forwardNetworksList: PolicyReportForwardNetwork[] =
		forwardNetworks.data?.networks ?? [];
	const forwardCredsStatus: PolicyReportForwardCredentialsStatus | null =
		(forwardCreds.data as any) ?? null;

	const approvedExceptionsByKey = useMemo(() => {
		const now = Date.now();
		const out = new Map<string, PolicyReportException>();
		for (const e of exceptions.data?.exceptions ?? []) {
			const st = String((e as any)?.status ?? "").toUpperCase();
			if (st !== "APPROVED") continue;
			const checkId = String((e as any)?.checkId ?? "").trim();
			const findingId = String((e as any)?.findingId ?? "").trim();
			if (!checkId || !findingId) continue;

			const exp = String((e as any)?.expiresAt ?? "").trim();
			if (exp) {
				const ts = Date.parse(exp);
				if (Number.isFinite(ts) && ts <= now) continue;
			}
			out.set(`${checkId}|${findingId}`, e as any);
		}
		return out;
	}, [exceptions.data]);

	function applyExceptionSuppression(
		checkId: string,
		results: unknown,
	): {
		applicable: boolean;
		suppressed: number;
		results: unknown;
	} {
		if (!suppressApprovedExceptions) {
			return { applicable: false, suppressed: 0, results };
		}
		if (approvedExceptionsByKey.size === 0) {
			return { applicable: false, suppressed: 0, results };
		}
		if (!Array.isArray(results)) {
			return { applicable: false, suppressed: 0, results };
		}

		let hasFindingId = false;
		let suppressed = 0;
		const kept: any[] = [];
		for (const it of results) {
			if (!it || typeof it !== "object") {
				kept.push(it);
				continue;
			}
			const fid = String((it as any)?.findingId ?? "").trim();
			if (!fid) {
				kept.push(it);
				continue;
			}
			hasFindingId = true;
			const key = `${checkId}|${fid}`;
			if (approvedExceptionsByKey.has(key)) {
				suppressed++;
				continue;
			}
			kept.push(it);
		}
		if (!hasFindingId) {
			return { applicable: false, suppressed: 0, results };
		}
		return { applicable: true, suppressed, results: kept };
	}

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
					<div className="flex items-center gap-2 rounded-md border px-3 py-2">
						<div className="text-xs text-muted-foreground">
							Suppress approved exceptions
							{approvedExceptionsByKey.size > 0
								? ` (${approvedExceptionsByKey.size} active)`
								: ""}
						</div>
						<Switch
							checked={suppressApprovedExceptions}
							onCheckedChange={setSuppressApprovedExceptions}
						/>
					</div>
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
							const esc = (s: unknown) =>
								String(s ?? "")
									.replaceAll("&", "&amp;")
									.replaceAll("<", "&lt;")
									.replaceAll(">", "&gt;")
									.replaceAll('"', "&quot;")
									.replaceAll("'", "&#39;");
							const cap = (s: unknown, n: number) => {
								const t = String(s ?? "");
								if (t.length <= n) return t;
								return `${t.slice(0, n)}…`;
							};
							const netId = net || "";
							const snap = snapshotId.trim() || "latest";
							const generatedAt = new Date().toISOString();
							const suppress = suppressApprovedExceptions;

							// Build a lightweight auditor-friendly report.
							const checksMeta = checksList.reduce(
								(acc, c) => {
									acc[c.id] = c;
									return acc;
								},
								{} as Record<string, PolicyReportCatalogCheck>,
							);

							const byCheck = Object.entries(resultsByCheck).map(([id, r]) => {
								const rawTotal = Number((r as any)?.total ?? 0);
								const itemsRaw = asArray((r as any)?.results);
								const supd = applyExceptionSuppression(id, itemsRaw);
								const total = supd.applicable
									? asArray(supd.results).length
									: rawTotal;
								return { id, total };
							});
							byCheck.sort((a, b) => b.total - a.total);

							const exceptionsByKey = approvedExceptionsByKey as any;

							const renderRow = (checkId: string, obj: any, cols: string[]) => {
								const fid = String(obj?.findingId ?? "").trim();
								const exKey = fid ? `${checkId}|${fid}` : "";
								const ex = exKey ? exceptionsByKey.get(exKey) : null;
								const exHTML = ex
									? `<div><div class="mono">${esc(String(ex.status ?? ""))}</div>${
											ex.expiresAt
												? `<div class="hint">expires ${esc(String(ex.expiresAt).slice(0, 10))}</div>`
												: ""
										}</div>`
									: "";
								const ev = evidenceFields(obj);
								const evText = ev[0]?.value ?? "";
								const evHTML = evText
									? `<details><summary>Evidence</summary><pre>${esc(cap(evText, 4000))}</pre></details>`
									: "";
								return `<tr>${cols
									.map(
										(k) => `<td class=\"mono\">${esc(fmtValue(obj?.[k]))}</td>`,
									)
									.join("")}<td>${exHTML}</td><td>${evHTML}</td></tr>`;
							};

							let bodyHTML = "";
							for (const { id } of byCheck.slice(0, 30)) {
								const r = resultsByCheck[id];
								const itemsRaw = asArray((r as any)?.results);
								const rawTotal = Number(
									(r as any)?.total ?? itemsRaw.length ?? 0,
								);
								const supd = applyExceptionSuppression(id, itemsRaw);
								const items = supd.applicable
									? asArray(supd.results)
									: itemsRaw;
								const cols = pickColumns(items).slice(0, 10);
								const meta = checksMeta[id];
								const totalText = supd.applicable
									? `${items.length} (suppressed ${supd.suppressed} of ${rawTotal})`
									: String(rawTotal);
								bodyHTML += `<section class=\"card\">
  <div class=\"h2\">${esc(meta?.title ?? id)}</div>
  <div class=\"sub\">checkId=<span class=\"mono\">${esc(id)}</span> • category=${esc(meta?.category ?? "")} • severity=${esc(meta?.severity ?? "")} • total=${esc(totalText)}</div>
  ${
		items.length
			? `<table>
    <thead><tr>${cols
			.map((c) => `<th>${esc(c)}</th>`)
			.join("")}<th>Exception</th><th>Evidence</th></tr></thead>
    <tbody>
      ${items
				.slice(0, 15)
				.map((it) => renderRow(id, it, cols))
				.join("")}
    </tbody>
  </table>
  <div class=\"hint\">Showing 15 of ${items.length} findings.</div>`
			: `<div class=\"hint\">No findings.</div>`
	}
</section>`;
							}

							const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Policy Reports</title>
  <style>
    :root { --fg:#0b1020; --muted:#5b6477; --border:#d7dbe5; --bg:#ffffff; --chip:#f3f5fa; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 28px; color: var(--fg); background: var(--bg); }
    h1 { margin: 0 0 6px 0; font-size: 22px; }
    .meta { color: var(--muted); margin-bottom: 14px; font-size: 12px; line-height: 1.5; }
    .chip { display:inline-block; background: var(--chip); border:1px solid var(--border); border-radius: 999px; padding: 2px 10px; font-size: 11px; margin-right: 6px; }
    .card { border: 1px solid var(--border); border-radius: 12px; padding: 14px; margin: 14px 0; }
    .h2 { font-weight: 700; margin-bottom: 4px; }
    .sub { font-size: 12px; color: var(--muted); margin-bottom: 10px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-top: 1px solid var(--border); padding: 8px 8px; font-size: 12px; vertical-align: top; }
    th { text-align: left; color: var(--muted); font-weight: 600; background: #fbfcfe; }
    pre { background: #0b1020; color: #e9edf7; padding: 10px; border-radius: 10px; overflow-x: auto; font-size: 11px; }
    details summary { cursor: pointer; color: var(--muted); font-size: 12px; }
    .hint { color: var(--muted); font-size: 11px; margin-top: 8px; }
  </style>
</head>
<body>
  <h1>Policy Reports</h1>
  <div class="meta">
    <span class="chip">workspaceId=<span class="mono">${esc(workspaceId)}</span></span>
    <span class="chip">networkId=<span class="mono">${esc(netId)}</span></span>
    <span class="chip">snapshotId=<span class="mono">${esc(snap)}</span></span>
    <span class="chip">generatedAt=<span class="mono">${esc(generatedAt)}</span></span>
    <span class="chip">suppressApprovedExceptions=<span class="mono">${esc(String(suppress))}</span></span>
  </div>

  <div class="card">
    <div class="h2">Summary</div>
    <div class="sub">Totals by check (top 30)</div>
    <table>
      <thead><tr><th>Check</th><th>Total</th></tr></thead>
      <tbody>
        ${byCheck
					.slice(0, 30)
					.map(
						({ id, total }) =>
							`<tr><td class="mono">${esc(id)}</td><td class="mono">${esc(total)}</td></tr>`,
					)
					.join("")}
      </tbody>
    </table>
  </div>

  ${bodyHTML}
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
				<CardContent className="grid gap-4 md:grid-cols-3">
					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<div className="text-sm font-medium">Saved networks</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => forwardNetworks.refetch()}
									disabled={forwardNetworks.isFetching}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
								<Button
									size="sm"
									onClick={() => {
										setAddNetworkForwardId(networkId.trim());
										setAddNetworkName("");
										setAddNetworkDesc("");
										setAddNetworkOpen(true);
									}}
								>
									Add
								</Button>
							</div>
						</div>
						<Select
							value={savedNetworkRef}
							onValueChange={(v) => {
								setSavedNetworkRef(v);
								const n = forwardNetworksList.find((x) => x.id === v);
								if (n) {
									setNetworkId(n.forwardNetworkId);
									setSnapshotId("");
								}
							}}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pick a saved network" />
							</SelectTrigger>
							<SelectContent>
								{forwardNetworksList.map((n) => (
									<SelectItem key={n.id} value={n.id}>
										{n.name} ({n.forwardNetworkId})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="flex justify-end">
							<Button
								variant="outline"
								size="sm"
								onClick={() => deleteForwardNetwork.mutate(savedNetworkRef)}
								disabled={!savedNetworkRef || deleteForwardNetwork.isPending}
							>
								Delete
							</Button>
						</div>
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<div className="text-xs text-muted-foreground">
								Your Forward credentials for this network:{" "}
								<span className="font-mono">
									{networkId.trim()
										? forwardCreds.isLoading
											? "loading…"
											: forwardCredsStatus?.configured
												? "configured"
												: "not set"
										: "n/a"}
								</span>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const st = forwardCredsStatus;
										setCredsBaseUrl(st?.baseUrl ?? "https://fwd.app");
										setCredsSkipTLSVerify(Boolean(st?.skipTlsVerify ?? false));
										setCredsUsername(st?.username ?? "");
										setCredsPassword("");
										setCredsOpen(true);
									}}
									disabled={!networkId.trim()}
								>
									Configure
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => deleteForwardCreds.mutate()}
									disabled={
										!networkId.trim() ||
										deleteForwardCreds.isPending ||
										!forwardCredsStatus?.configured
									}
								>
									Clear
								</Button>
							</div>
						</div>
						{forwardNetworks.isError ? (
							<p className="text-xs text-destructive">
								Failed to load saved networks:{" "}
								{(forwardNetworks.error as Error).message}
							</p>
						) : null}
					</div>
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
					<TabsTrigger value="flow">Flow</TabsTrigger>
					<TabsTrigger value="intent">Intent</TabsTrigger>
					<TabsTrigger value="segmentation">Segmentation</TabsTrigger>
					<TabsTrigger value="checks">Checks</TabsTrigger>
					<TabsTrigger value="packs">Packs</TabsTrigger>
					<TabsTrigger value="runs">Runs</TabsTrigger>
					<TabsTrigger value="deltas">Deltas</TabsTrigger>
					<TabsTrigger value="governance">Governance</TabsTrigger>
					<TabsTrigger value="change">Change Planning</TabsTrigger>
				</TabsList>

				<TabsContent value="flow" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Flow Analyzer (First Match)</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Source IP</div>
								<Input
									value={flowSrcIp}
									onChange={(e) => setFlowSrcIp(e.target.value)}
									placeholder="e.g. 10.0.0.10"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Destination IP</div>
								<Input
									value={flowDstIp}
									onChange={(e) => setFlowDstIp(e.target.value)}
									placeholder="e.g. 10.0.0.20"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">IP Protocol</div>
								<Input
									value={flowIpProto}
									onChange={(e) => setFlowIpProto(e.target.value)}
									placeholder="6 (TCP), 17 (UDP), or -1"
								/>
								<p className="text-xs text-muted-foreground">
									Use <span className="font-mono">-1</span> to ignore.
								</p>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Destination Port</div>
								<Input
									value={flowDstPort}
									onChange={(e) => setFlowDstPort(e.target.value)}
									placeholder="443 or -1"
								/>
								<p className="text-xs text-muted-foreground">
									Use <span className="font-mono">-1</span> to ignore.
								</p>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Firewalls Only</div>
								<Select
									value={flowFirewallsOnly ? "true" : "false"}
									onValueChange={(v) => setFlowFirewallsOnly(v === "true")}
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
							<div className="space-y-2">
								<div className="text-sm font-medium">
									Include Implicit/Default Rules
								</div>
								<Select
									value={flowIncludeImplicitDefault ? "true" : "false"}
									onValueChange={(v) =>
										setFlowIncludeImplicitDefault(v === "true")
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="false">false</SelectItem>
										<SelectItem value="true">true</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
						<CardContent className="flex items-center gap-2 pt-0">
							<Button
								onClick={() => runFlowDecision.mutate()}
								disabled={runFlowDecision.isPending}
							>
								<Play className="mr-2 h-4 w-4" />
								Decide
							</Button>
							<Button
								variant="outline"
								onClick={() => runFlowToRules.mutate()}
								disabled={runFlowToRules.isPending}
							>
								<Play className="mr-2 h-4 w-4" />
								Matching rules
							</Button>
							<Button
								variant="outline"
								onClick={() => runNatFlowMatches.mutate()}
								disabled={runNatFlowMatches.isPending}
							>
								<Play className="mr-2 h-4 w-4" />
								NAT matches
							</Button>
							<Button
								variant="outline"
								onClick={async () => {
									setOpenCheckId("acl-flow-decision.nqe");
									await openCheck.mutateAsync("acl-flow-decision.nqe");
								}}
							>
								View query
							</Button>
							<Button
								variant="outline"
								onClick={async () => {
									setOpenCheckId("acl-flow-to-rules.nqe");
									await openCheck.mutateAsync("acl-flow-to-rules.nqe");
								}}
							>
								View matches query
							</Button>
							<Button
								variant="outline"
								onClick={async () => {
									setOpenCheckId("nat-flow-matches.nqe");
									await openCheck.mutateAsync("nat-flow-matches.nqe");
								}}
							>
								View NAT query
							</Button>
						</CardContent>
					</Card>

					{resultsByCheck["acl-flow-decision.nqe"] ? (
						<Card>
							<CardHeader>
								<CardTitle>Decision Results</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{(() => {
									const resp = resultsByCheck["acl-flow-decision.nqe"];
									const rows = (resp?.results as any) ?? [];
									const list = Array.isArray(rows) ? rows : [];
									const hasMatch = list.filter((r: any) => r?.matchCount > 0);
									const noMatch = list.filter(
										(r: any) => !r || r?.matchCount <= 0,
									);
									return (
										<div className="space-y-3">
											<div className="flex flex-wrap items-center gap-2 text-sm">
												<Badge variant="secondary">
													Devices: {list.length}
												</Badge>
												<Badge variant="secondary">
													Matched: {hasMatch.length}
												</Badge>
												<Badge variant="secondary">
													No match: {noMatch.length}
												</Badge>
											</div>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Device</TableHead>
														<TableHead>Decision</TableHead>
														<TableHead>First Rule</TableHead>
														<TableHead className="text-right">
															Matches
														</TableHead>
														<TableHead className="text-right">Index</TableHead>
														<TableHead className="text-right">
															Evidence
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{list.map((r: any) => {
														const decision = String(r?.decision ?? "");
														const has = Number(r?.matchCount ?? 0) > 0;
														const dev = String(r?.device ?? "");
														return (
															<TableRow
																key={dev || String(Math.random())}
																className="cursor-pointer"
																onClick={() => {
																	if (!dev) return;
																	setFlowSelectedDevice(dev);
																}}
															>
																<TableCell className="font-medium">
																	{dev}
																</TableCell>
																<TableCell>
																	<Badge
																		variant={
																			decision === "PERMIT"
																				? "default"
																				: decision === "DENY"
																					? "destructive"
																					: "secondary"
																		}
																	>
																		{decision || "UNKNOWN"}
																	</Badge>
																</TableCell>
																<TableCell className="max-w-[520px] truncate">
																	{has ? String(r?.firstRule ?? "") : "(none)"}
																</TableCell>
																<TableCell className="text-right">
																	{Number(r?.matchCount ?? 0)}
																</TableCell>
																<TableCell className="text-right">
																	{has ? Number(r?.firstRuleIndex ?? -1) : "-"}
																</TableCell>
																<TableCell className="text-right">
																	<Button
																		variant="outline"
																		size="sm"
																		disabled={!has || !r?.firstRuleEvidence}
																		onClick={() => {
																			setFlowEvidence(
																				String(r?.firstRuleEvidence ?? ""),
																			);
																			setFlowEvidenceOpen(true);
																		}}
																	>
																		View
																	</Button>
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
											<details className="pt-2">
												<summary className="cursor-pointer text-xs text-muted-foreground">
													Show raw JSON
												</summary>
												<div className="pt-2">
													<Textarea
														readOnly
														className="font-mono text-xs"
														rows={10}
														value={jsonPretty(resp)}
													/>
												</div>
											</details>
										</div>
									);
								})()}
							</CardContent>
						</Card>
					) : null}

					{resultsByCheck["nat-flow-matches.nqe"] ? (
						<Card>
							<CardHeader>
								<CardTitle>NAT Matches</CardTitle>
								<CardDescription>
									Modeled NAT entries that match the flow tuple.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{(() => {
									const resp = resultsByCheck["nat-flow-matches.nqe"];
									const rows = (resp?.results as any) ?? [];
									const list = Array.isArray(rows) ? rows : [];
									return (
										<div className="space-y-3">
											<div className="flex flex-wrap items-center gap-2 text-sm">
												<Badge variant="secondary">
													Matches: {list.length}
												</Badge>
											</div>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Device</TableHead>
														<TableHead>Rule</TableHead>
														<TableHead className="text-right">Index</TableHead>
														<TableHead className="text-right">
															Evidence
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{list.map((r: any, i: number) => {
														const dev = String(r?.device ?? "");
														const rule = String(r?.rule ?? "");
														const idx = Number(r?.ruleIndex ?? i);
														return (
															<TableRow key={`${dev}:${rule}:${idx}:${i}`}>
																<TableCell className="font-medium">
																	{dev}
																</TableCell>
																<TableCell className="max-w-[520px] truncate">
																	{rule || "(unnamed)"}
																</TableCell>
																<TableCell className="text-right">
																	{idx}
																</TableCell>
																<TableCell className="text-right">
																	<Button
																		variant="outline"
																		size="sm"
																		disabled={!r?.evidence && !r?.rewrites}
																		onClick={() => {
																			const ev = String(r?.evidence ?? "");
																			const rw = r?.rewrites
																				? jsonPretty(r?.rewrites)
																				: "";
																			const body = [
																				ev ? "Evidence:\n" + ev : "",
																				rw ? "Rewrites:\n" + rw : "",
																			]
																				.filter(Boolean)
																				.join("\n\n");
																			setGenericEvidence(
																				body || "(no evidence)",
																			);
																			setGenericEvidenceOpen(true);
																		}}
																	>
																		View
																	</Button>
																</TableCell>
															</TableRow>
														);
													})}
												</TableBody>
											</Table>
											<details className="pt-2">
												<summary className="cursor-pointer text-xs text-muted-foreground">
													Show raw JSON
												</summary>
												<div className="pt-2">
													<Textarea
														readOnly
														className="font-mono text-xs"
														rows={10}
														value={jsonPretty(resp)}
													/>
												</div>
											</details>
										</div>
									);
								})()}
							</CardContent>
						</Card>
					) : null}

					{flowMatchesResp ? (
						<Card>
							<CardHeader>
								<CardTitle>Matching Rules</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								{(() => {
									const rows = (flowMatchesResp.results as any) ?? [];
									const list = Array.isArray(rows) ? rows : [];
									const devices = Array.from(
										new Set(
											list
												.map((r: any) => String(r?.device ?? ""))
												.filter(Boolean),
										),
									).sort();
									const filtered = flowSelectedDevice
										? list.filter(
												(r: any) =>
													String(r?.device ?? "") === flowSelectedDevice,
											)
										: list;

									return (
										<div className="space-y-3">
											<div className="grid gap-3 md:grid-cols-2">
												<div className="space-y-2">
													<div className="text-sm font-medium">
														Device filter
													</div>
													<Select
														value={flowSelectedDevice}
														onValueChange={setFlowSelectedDevice}
													>
														<SelectTrigger>
															<SelectValue placeholder="All devices" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="">(All)</SelectItem>
															{devices.map((d) => (
																<SelectItem key={d} value={d}>
																	{d}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<div className="flex items-center gap-2">
														<Button
															variant="outline"
															size="sm"
															onClick={() => setFlowSelectedDevice("")}
															disabled={!flowSelectedDevice}
														>
															Clear filter
														</Button>
														{flowSelectedDevice ? (
															<span className="text-xs text-muted-foreground">
																Filtered to{" "}
																<span className="font-mono">
																	{flowSelectedDevice}
																</span>
															</span>
														) : null}
													</div>
													<p className="text-xs text-muted-foreground">
														{filtered.length} matching rules
													</p>
												</div>
												<div className="flex items-end justify-end gap-2">
													<Button
														variant="outline"
														onClick={() => {
															const net = networkId.trim();
															downloadJSON(
																`flow-matching-rules_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
																flowMatchesResp,
															);
														}}
													>
														<Download className="mr-2 h-4 w-4" />
														Export JSON
													</Button>
													<Button
														variant="outline"
														onClick={() => {
															const csv = resultsToCSV(flowMatchesResp.results);
															if (!csv) {
																toast.error(
																	"CSV export only supports array-of-object results",
																);
																return;
															}
															const net = networkId.trim();
															downloadText(
																`flow-matching-rules_${net || "network"}_${snapshotId.trim() || "latest"}.csv`,
																"text/csv",
																csv,
															);
														}}
													>
														<Download className="mr-2 h-4 w-4" />
														CSV
													</Button>
												</div>
											</div>

											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Device</TableHead>
														<TableHead className="text-right">Index</TableHead>
														<TableHead>Action</TableHead>
														<TableHead>Rule</TableHead>
														<TableHead className="text-right">Hits</TableHead>
														<TableHead className="text-right">
															Evidence
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{filtered
														.slice()
														.sort(
															(a: any, b: any) =>
																String(a?.device ?? "").localeCompare(
																	String(b?.device ?? ""),
																) ||
																Number(a?.ruleIndex ?? 0) -
																	Number(b?.ruleIndex ?? 0),
														)
														.map((r: any, idx: number) => {
															const action = String(r?.action ?? "");
															return (
																<TableRow
																	key={`${String(r?.device ?? "")}:${Number(r?.ruleIndex ?? 0)}:${idx}`}
																>
																	<TableCell className="font-medium">
																		{String(r?.device ?? "")}
																	</TableCell>
																	<TableCell className="text-right">
																		{Number(r?.ruleIndex ?? -1)}
																	</TableCell>
																	<TableCell>
																		<Badge
																			variant={
																				action === "PERMIT"
																					? "default"
																					: action === "DENY"
																						? "destructive"
																						: "secondary"
																			}
																		>
																			{action || "UNKNOWN"}
																		</Badge>
																	</TableCell>
																	<TableCell className="max-w-[520px] truncate">
																		{String(r?.rule ?? "")}
																	</TableCell>
																	<TableCell className="text-right">
																		{r?.hitCount ?? "-"}
																	</TableCell>
																	<TableCell className="text-right">
																		<Button
																			variant="outline"
																			size="sm"
																			disabled={!r?.evidence}
																			onClick={() => {
																				setFlowRuleEvidence(
																					String(r?.evidence ?? ""),
																				);
																				setFlowRuleEvidenceOpen(true);
																			}}
																		>
																			View
																		</Button>
																	</TableCell>
																</TableRow>
															);
														})}
												</TableBody>
											</Table>

											<details className="pt-2">
												<summary className="cursor-pointer text-xs text-muted-foreground">
													Show raw JSON
												</summary>
												<div className="pt-2">
													<Textarea
														readOnly
														className="font-mono text-xs"
														rows={10}
														value={jsonPretty(flowMatchesResp)}
													/>
												</div>
											</details>
										</div>
									);
								})()}
							</CardContent>
						</Card>
					) : null}
				</TabsContent>

				<TabsContent value="intent" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Connectivity Intent Suite</CardTitle>
							<CardDescription>
								Run a batch of flow intents using{" "}
								<span className="font-mono">acl-flow-decision.nqe</span>.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<div className="text-sm font-medium">Flows</div>
								<Textarea
									value={intentFlowsText}
									onChange={(e) => setIntentFlowsText(e.target.value)}
									rows={6}
									placeholder={
										"# srcIp dstIp ipProto dstPort\n10.0.0.10 10.0.0.20 6 443\n10.0.0.10 10.0.0.30 6 22"
									}
									className="font-mono text-xs"
								/>
								<p className="text-xs text-muted-foreground">
									Format per line:{" "}
									<span className="font-mono">
										srcIp dstIp [ipProto] [dstPort]
									</span>
									. Separators: spaces or commas.
								</p>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<Button
									onClick={() => runIntentSuite.mutate()}
									disabled={runIntentSuite.isPending}
								>
									<Play className="mr-2 h-4 w-4" />
									Run suite
								</Button>
								<Button
									variant="secondary"
									onClick={() => storeIntentSuiteAsRuns.mutate()}
									disabled={storeIntentSuiteAsRuns.isPending}
								>
									<FolderClock className="mr-2 h-4 w-4" />
									Store as runs (per flow)
								</Button>
								<Badge variant="outline">
									Firewalls only:{" "}
									<span className="font-mono">
										{flowFirewallsOnly ? "true" : "false"}
									</span>
								</Badge>
								<Badge variant="outline">
									Include implicit/default:{" "}
									<span className="font-mono">
										{flowIncludeImplicitDefault ? "true" : "false"}
									</span>
								</Badge>
							</div>
						</CardContent>
					</Card>

					{intentSuiteRows.length > 0 ? (
						<Card>
							<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base">Suite Results</CardTitle>
									<CardDescription>
										Click a row to view the raw decision results.
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const net = networkId.trim();
											downloadJSON(
												`intent-suite_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
												intentSuiteRows,
											);
										}}
									>
										<Download className="mr-2 h-4 w-4" />
										Export
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Flow</TableHead>
												<TableHead className="text-right">PERMIT</TableHead>
												<TableHead className="text-right">DENY</TableHead>
												<TableHead className="text-right">NO_MATCH</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{intentSuiteRows.map((r, idx) => {
												const f = r.flow;
												const flowStr = `${f.srcIp} -> ${f.dstIp} proto=${f.ipProto} port=${f.dstPort}`;
												return (
													<TableRow
														key={`${flowStr}:${idx}`}
														className="cursor-pointer"
														onClick={() => {
															setIntentDetail({
																flow: f,
																summary: r,
																raw: r.resp,
															});
															setIntentDetailOpen(true);
														}}
													>
														<TableCell className="font-mono text-xs">
															{flowStr}
														</TableCell>
														<TableCell className="text-right">
															<Badge
																variant={
																	r.permits > 0 ? "default" : "secondary"
																}
															>
																{r.permits}
															</Badge>
														</TableCell>
														<TableCell className="text-right">
															<Badge
																variant={
																	r.denies > 0 ? "destructive" : "secondary"
																}
															>
																{r.denies}
															</Badge>
														</TableCell>
														<TableCell className="text-right">
															{r.noMatch}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					) : null}

					<Dialog open={intentDetailOpen} onOpenChange={setIntentDetailOpen}>
						<DialogContent className="max-w-4xl">
							<DialogHeader>
								<DialogTitle>Intent details</DialogTitle>
								<DialogDescription>
									{intentDetail?.flow ? (
										<span className="font-mono">
											{intentDetail.flow.srcIp} -&gt; {intentDetail.flow.dstIp}{" "}
											proto={intentDetail.flow.ipProto} port=
											{intentDetail.flow.dstPort}
										</span>
									) : null}
								</DialogDescription>
							</DialogHeader>
							<Textarea
								readOnly
								className="font-mono text-xs"
								rows={18}
								value={jsonPretty(intentDetail?.raw ?? {})}
							/>
						</DialogContent>
					</Dialog>
				</TabsContent>

				<TabsContent value="segmentation" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
							<div className="space-y-1">
								<CardTitle className="flex items-center gap-2">
									<Layers className="h-5 w-5" />
									Zones
								</CardTitle>
								<CardDescription>
									Define zones (CIDR sets) to drive zone-to-zone policy checks.
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									onClick={() => setZoneCreateOpen(true)}
									disabled={!networkId.trim()}
								>
									Add zone
								</Button>
								<Button
									variant="outline"
									onClick={() => zones.refetch()}
									disabled={!networkId.trim() || zones.isFetching}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{zones.isLoading ? (
								<div className="text-sm text-muted-foreground">
									Loading zones…
								</div>
							) : null}
							{zones.isError ? (
								<div className="text-sm text-destructive">
									Failed to load zones: {(zones.error as Error).message}
								</div>
							) : null}
							{(() => {
								const list: PolicyReportZone[] = zones.data?.zones ?? [];
								if (list.length === 0) {
									return (
										<div className="text-sm text-muted-foreground">
											No zones yet.
										</div>
									);
								}
								return (
									<div className="rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Name</TableHead>
													<TableHead>Subnets</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{list.map((z) => (
													<TableRow key={z.id}>
														<TableCell className="font-medium">
															{z.name}
														</TableCell>
														<TableCell className="font-mono text-xs">
															{(z.subnets ?? []).join(", ")}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="outline"
																size="sm"
																disabled={deleteZone.isPending}
																onClick={() => {
																	if (confirm(`Delete zone "${z.name}"?`)) {
																		deleteZone.mutate(z.id);
																	}
																}}
															>
																Delete
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								);
							})()}
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								Zone-to-Zone Checks
							</CardTitle>
							<CardDescription>
								Run segmentation checks using the modeled firewall ACL view.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{(() => {
								const list: PolicyReportZone[] = zones.data?.zones ?? [];
								return (
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<div className="text-sm font-medium">Source zone</div>
											<Select
												value={segSrcZoneId}
												onValueChange={setSegSrcZoneId}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select source zone" />
												</SelectTrigger>
												<SelectContent>
													{list.map((z) => (
														<SelectItem key={z.id} value={z.id}>
															{z.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<div className="text-sm font-medium">
												Destination zone
											</div>
											<Select
												value={segDstZoneId}
												onValueChange={setSegDstZoneId}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select destination zone" />
												</SelectTrigger>
												<SelectContent>
													{list.map((z) => (
														<SelectItem key={z.id} value={z.id}>
															{z.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2 md:col-span-2">
											<div className="text-sm font-medium">Sensitive ports</div>
											<Input
												value={segSensitivePortsText}
												onChange={(e) =>
													setSegSensitivePortsText(e.target.value)
												}
												placeholder="22,3389,445,…"
											/>
											<p className="text-xs text-muted-foreground">
												Comma or newline separated.
											</p>
										</div>
										<div className="flex flex-wrap gap-2 md:col-span-2">
											<Button
												variant="outline"
												onClick={() => runSegAnyService.mutate()}
												disabled={runSegAnyService.isPending}
											>
												<Play className="mr-2 h-4 w-4" />
												Any-service permits
											</Button>
											<Button
												variant="outline"
												onClick={() => runSegSensitivePorts.mutate()}
												disabled={runSegSensitivePorts.isPending}
											>
												<Play className="mr-2 h-4 w-4" />
												Sensitive ports
											</Button>
											<Button
												variant="outline"
												onClick={() => runAnyToZoneAnyService.mutate()}
												disabled={runAnyToZoneAnyService.isPending}
											>
												<Play className="mr-2 h-4 w-4" />
												Any to dst (any-service)
											</Button>
											<Button
												variant="outline"
												onClick={() => runAnyToZoneSensitivePorts.mutate()}
												disabled={runAnyToZoneSensitivePorts.isPending}
											>
												<Play className="mr-2 h-4 w-4" />
												Any to dst (sensitive ports)
											</Button>
											<Button
												onClick={() => storeSegmentationReport.mutate()}
												disabled={storeSegmentationReport.isPending}
											>
												<FolderClock className="mr-2 h-4 w-4" />
												Run and store report
											</Button>
											{segStoredRun ? (
												<Badge variant="secondary">
													Stored run:{" "}
													<span className="font-mono">{segStoredRun.id}</span>
												</Badge>
											) : null}
										</div>
									</div>
								);
							})()}
						</CardContent>
					</Card>

					{segAnyServiceResp ? (
						<Card>
							<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base">
										Zone-to-zone any-service permits
									</CardTitle>
									<CardDescription>
										Check:{" "}
										<span className="font-mono">
											acl-zone-to-zone-any-service.nqe
										</span>
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const net = networkId.trim();
											downloadJSON(
												`segmentation_any-service_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
												segAnyServiceResp,
											);
										}}
									>
										<Download className="mr-2 h-4 w-4" />
										Export
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<Badge variant="secondary">
										Total: {Number(segAnyServiceResp.total ?? 0)}
									</Badge>
									<Badge variant="secondary">
										Snapshot:{" "}
										<span className="font-mono">
											{segAnyServiceResp.snapshotId ?? "(unknown)"}
										</span>
									</Badge>
								</div>
								<Textarea
									readOnly
									className="font-mono text-xs"
									rows={10}
									value={jsonPretty(segAnyServiceResp)}
								/>
							</CardContent>
						</Card>
					) : null}

					{segSensitiveResp ? (
						<Card>
							<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base">
										Zone-to-zone sensitive ports permits
									</CardTitle>
									<CardDescription>
										Check:{" "}
										<span className="font-mono">
											acl-zone-to-zone-sensitive-ports.nqe
										</span>
									</CardDescription>
								</div>
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => {
											const net = networkId.trim();
											downloadJSON(
												`segmentation_sensitive-ports_${net || "network"}_${snapshotId.trim() || "latest"}.json`,
												segSensitiveResp,
											);
										}}
									>
										<Download className="mr-2 h-4 w-4" />
										Export
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<Badge variant="secondary">
										Total: {Number(segSensitiveResp.total ?? 0)}
									</Badge>
									<Badge variant="secondary">
										Snapshot:{" "}
										<span className="font-mono">
											{segSensitiveResp.snapshotId ?? "(unknown)"}
										</span>
									</Badge>
								</div>
								<Textarea
									readOnly
									className="font-mono text-xs"
									rows={10}
									value={jsonPretty(segSensitiveResp)}
								/>
							</CardContent>
						</Card>
					) : null}

					{segAnyToZoneAnyServiceResp ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Any source to destination zone (any-service)
								</CardTitle>
								<CardDescription>
									Check:{" "}
									<span className="font-mono">
										acl-any-to-zone-any-service.nqe
									</span>
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<Badge variant="secondary">
										Total: {Number(segAnyToZoneAnyServiceResp.total ?? 0)}
									</Badge>
									<Badge variant="secondary">
										Snapshot:{" "}
										<span className="font-mono">
											{segAnyToZoneAnyServiceResp.snapshotId ?? "(unknown)"}
										</span>
									</Badge>
								</div>
								<Textarea
									readOnly
									className="font-mono text-xs"
									rows={10}
									value={jsonPretty(segAnyToZoneAnyServiceResp)}
								/>
							</CardContent>
						</Card>
					) : null}

					{segAnyToZoneSensitiveResp ? (
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									Any source to destination zone (sensitive ports)
								</CardTitle>
								<CardDescription>
									Check:{" "}
									<span className="font-mono">
										acl-any-to-zone-sensitive-ports.nqe
									</span>
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<Badge variant="secondary">
										Total: {Number(segAnyToZoneSensitiveResp.total ?? 0)}
									</Badge>
									<Badge variant="secondary">
										Snapshot:{" "}
										<span className="font-mono">
											{segAnyToZoneSensitiveResp.snapshotId ?? "(unknown)"}
										</span>
									</Badge>
								</div>
								<Textarea
									readOnly
									className="font-mono text-xs"
									rows={10}
									value={jsonPretty(segAnyToZoneSensitiveResp)}
								/>
							</CardContent>
						</Card>
					) : null}
				</TabsContent>

				<TabsContent value="runs" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
							<div className="space-y-1">
								<CardTitle className="flex items-center gap-2">
									<FolderClock className="h-5 w-5" />
									Runs
								</CardTitle>
								<CardDescription>
									Stored Policy Report runs for this Forward network.
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									onClick={() => runs.refetch()}
									disabled={!networkId.trim() || runs.isFetching}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{runs.isLoading ? (
								<div className="text-sm text-muted-foreground">
									Loading runs…
								</div>
							) : null}
							{runs.isError ? (
								<div className="text-sm text-destructive">
									Failed to load runs: {(runs.error as Error).message}
								</div>
							) : null}
							{(() => {
								const list: PolicyReportRun[] = runs.data?.runs ?? [];
								if (list.length === 0) {
									return (
										<div className="text-sm text-muted-foreground">
											No stored runs yet.
										</div>
									);
								}
								return (
									<div className="rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Started</TableHead>
													<TableHead>Pack</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Snapshot</TableHead>
													<TableHead>Run ID</TableHead>
													<TableHead className="text-right">Actions</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{list.map((r) => (
													<TableRow key={r.id}>
														<TableCell className="text-xs text-muted-foreground">
															{String(r.startedAt ?? "")}
														</TableCell>
														<TableCell>
															<Badge variant="secondary">{r.packId}</Badge>
														</TableCell>
														<TableCell>
															<Badge
																variant={
																	String(r.status).toUpperCase() === "FAILED"
																		? "destructive"
																		: "secondary"
																}
															>
																{r.status}
															</Badge>
														</TableCell>
														<TableCell className="font-mono text-xs">
															{r.snapshotId || "latest"}
														</TableCell>
														<TableCell className="font-mono text-xs">
															{r.id}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setRunDialogId(r.id);
																	setRunDialogCheckId("");
																	setRunDialogOpen(true);
																}}
															>
																View
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								);
							})()}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
							<div className="space-y-1">
								<CardTitle className="text-base">Active Findings</CardTitle>
								<CardDescription>
									Aggregated posture findings across stored runs
									(violation-style checks only).
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									onClick={() => aggFindings.refetch()}
									disabled={!networkId.trim() || aggFindings.isFetching}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{aggFindings.isLoading ? (
								<div className="text-sm text-muted-foreground">Loading…</div>
							) : null}
							{aggFindings.isError ? (
								<div className="text-sm text-destructive">
									Failed: {(aggFindings.error as Error).message}
								</div>
							) : null}
							{(() => {
								const list = aggFindings.data?.findings ?? [];
								if (!Array.isArray(list) || list.length === 0) {
									return (
										<div className="text-sm text-muted-foreground">
											No active findings.
										</div>
									);
								}
								const rows = list
									.slice()
									.sort(
										(a: any, b: any) =>
											Number(b?.riskScore ?? 0) - Number(a?.riskScore ?? 0),
									)
									.slice(0, 200);
								return (
									<div className="rounded-md border">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Risk</TableHead>
													<TableHead>Check</TableHead>
													<TableHead>Asset</TableHead>
													<TableHead>Last seen</TableHead>
													<TableHead className="text-right">Details</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{rows.map((f: any) => (
													<TableRow
														key={`${String(f?.checkId ?? "")}:${String(f?.findingId ?? "")}`}
													>
														<TableCell className="text-right">
															<Badge
																variant={
																	Number(f?.riskScore ?? 0) >= 80
																		? "destructive"
																		: Number(f?.riskScore ?? 0) >= 50
																			? "default"
																			: "secondary"
																}
															>
																{Number(f?.riskScore ?? 0)}
															</Badge>
														</TableCell>
														<TableCell className="font-mono text-xs">
															{String(f?.checkId ?? "")}
														</TableCell>
														<TableCell className="font-mono text-xs">
															{String(f?.assetKey ?? "") || "—"}
														</TableCell>
														<TableCell className="text-xs text-muted-foreground">
															{String(f?.lastSeenAt ?? "")}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setGenericEvidence(
																		jsonPretty(f?.finding ?? {}),
																	);
																	setGenericEvidenceOpen(true);
																}}
															>
																View
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								);
							})()}
							<p className="text-xs text-muted-foreground">
								Showing up to 200 findings (sorted by riskScore).
							</p>
						</CardContent>
					</Card>

					<Dialog
						open={runDialogOpen}
						onOpenChange={(o) => {
							setRunDialogOpen(o);
							if (!o) {
								setRunDialogId("");
								setRunDialogCheckId("");
							}
						}}
					>
						<DialogContent className="max-w-4xl">
							<DialogHeader>
								<DialogTitle>Run details</DialogTitle>
								<DialogDescription>
									<span className="font-mono">{runDialogId}</span>
								</DialogDescription>
							</DialogHeader>
							<div className="space-y-3">
								{runDetail.isLoading ? (
									<div className="text-sm text-muted-foreground">Loading…</div>
								) : null}
								{runDetail.isError ? (
									<div className="text-sm text-destructive">
										Failed to load run: {(runDetail.error as Error).message}
									</div>
								) : null}
								{runDetail.data ? (
									<div className="space-y-3">
										<div className="flex flex-wrap items-center gap-2 text-sm">
											<Badge variant="secondary">
												Pack: {runDetail.data.run.packId}
											</Badge>
											<Badge variant="secondary">
												Status: {runDetail.data.run.status}
											</Badge>
											<Badge variant="secondary">
												Snapshot:{" "}
												<span className="font-mono">
													{runDetail.data.run.snapshotId || "latest"}
												</span>
											</Badge>
										</div>

										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<div className="text-sm font-medium">Checks</div>
												<div className="rounded-md border">
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Check</TableHead>
																<TableHead className="text-right">
																	Total
																</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{(runDetail.data.checks ?? []).map((c) => (
																<TableRow
																	key={c.checkId}
																	className="cursor-pointer"
																	onClick={() => setRunDialogCheckId(c.checkId)}
																>
																	<TableCell className="font-mono text-xs">
																		{c.checkId}
																	</TableCell>
																	<TableCell className="text-right">
																		{c.total}
																	</TableCell>
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
												<p className="text-xs text-muted-foreground">
													Click a check to load run findings.
												</p>
											</div>
											<div className="space-y-2">
												<div className="text-sm font-medium">Findings</div>
												<div className="text-xs text-muted-foreground">
													Check filter:{" "}
													<span className="font-mono">
														{runDialogCheckId || "(all)"}
													</span>
												</div>
												<Textarea
													readOnly
													className="font-mono text-xs"
													rows={10}
													value={jsonPretty(runFindings.data?.findings ?? [])}
												/>
											</div>
										</div>

										<details className="pt-2">
											<summary className="cursor-pointer text-xs text-muted-foreground">
												Show request JSON
											</summary>
											<div className="pt-2">
												<Textarea
													readOnly
													className="font-mono text-xs"
													rows={10}
													value={jsonPretty(runDetail.data.run.request)}
												/>
											</div>
										</details>
									</div>
								) : null}
							</div>
						</DialogContent>
					</Dialog>
				</TabsContent>

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
						const sup = result
							? applyExceptionSuppression(id, (result as any)?.results)
							: { applicable: false, suppressed: 0, results: null as any };
						const effectiveResults =
							result && sup.applicable ? sup.results : result?.results;
						const effectiveTotal =
							result && sup.applicable
								? asArray(effectiveResults).length
								: result?.total;
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
												const csv = resultsToCSV(effectiveResults);
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
										<div className="grid gap-3 md:grid-cols-3">
											<div className="text-sm">
												<div className="text-muted-foreground">Total</div>
												<div className="font-medium">
													{effectiveTotal}
													{sup.applicable ? (
														<span className="text-muted-foreground text-xs">
															{" "}
															(of {result.total})
														</span>
													) : null}
												</div>
											</div>
											<div className="text-sm">
												<div className="text-muted-foreground">Suppressed</div>
												<div className="font-medium">
													{sup.applicable ? sup.suppressed : "—"}
												</div>
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
											value={jsonPretty(effectiveResults)}
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
										variant="secondary"
										onClick={() => runPackAndStore.mutate(p.id)}
										disabled={runPackAndStore.isPending}
									>
										<FolderClock className="mr-2 h-4 w-4" />
										Run and store
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

					{lastPackRun ? (
						<Card>
							<CardHeader>
								<CardTitle>Pack Results</CardTitle>
								<CardDescription>
									Last run:{" "}
									<span className="font-mono">{lastPackRun.packId}</span>{" "}
									(snapshot{" "}
									<span className="font-mono">
										{lastPackRun.snapshotId ?? "latest"}
									</span>
									)
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								{(() => {
									const perDevice = new Map<string, number>();
									const perDeviceRisk = new Map<string, number>();
									const perCheck: Array<{
										checkId: string;
										rawTotal: number;
										suppressed: number;
										remaining: number;
									}> = [];
									for (const [checkId, resp] of Object.entries(
										lastPackRun.results ?? {},
									)) {
										const itemsRaw = asArray((resp as any)?.results);
										const rawTotal = Number(
											(resp as any)?.total ?? itemsRaw.length ?? 0,
										);
										const sup = applyExceptionSuppression(checkId, itemsRaw);
										const usedItems = sup.applicable
											? asArray(sup.results)
											: itemsRaw;
										perCheck.push({
											checkId,
											rawTotal,
											suppressed: sup.applicable ? sup.suppressed : 0,
											remaining: usedItems.length,
										});
										for (const it of usedItems) {
											const dev =
												typeof it?.device === "string"
													? it.device
													: typeof it?.Device === "string"
														? it.Device
														: "";
											if (!dev) continue;
											perDevice.set(dev, (perDevice.get(dev) ?? 0) + 1);
											const rs = Number((it as any)?.riskScore ?? 0);
											if (Number.isFinite(rs) && rs > 0) {
												perDeviceRisk.set(
													dev,
													(perDeviceRisk.get(dev) ?? 0) + rs,
												);
											}
										}
									}
									perCheck.sort((a, b) => b.remaining - a.remaining);
									const topDevices = Array.from(perDevice.entries())
										.sort((a, b) => b[1] - a[1])
										.slice(0, 12);
									const topRisk = Array.from(perDeviceRisk.entries())
										.sort((a, b) => b[1] - a[1])
										.slice(0, 12);

									return (
										<div className="grid gap-4 lg:grid-cols-3">
											<div className="space-y-2">
												<div className="text-sm font-medium">By check</div>
												<div className="rounded-md border">
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Check</TableHead>
																<TableHead className="text-right">
																	Total
																</TableHead>
																{suppressApprovedExceptions ? (
																	<>
																		<TableHead className="text-right">
																			Suppressed
																		</TableHead>
																		<TableHead className="text-right">
																			Remaining
																		</TableHead>
																	</>
																) : null}
															</TableRow>
														</TableHeader>
														<TableBody>
															{perCheck.map((r) => (
																<TableRow key={r.checkId}>
																	<TableCell className="font-mono text-xs">
																		{r.checkId}
																	</TableCell>
																	<TableCell className="text-right tabular-nums">
																		{r.rawTotal}
																	</TableCell>
																	{suppressApprovedExceptions ? (
																		<>
																			<TableCell className="text-right tabular-nums">
																				{r.suppressed}
																			</TableCell>
																			<TableCell className="text-right tabular-nums">
																				{r.remaining}
																			</TableCell>
																		</>
																	) : null}
																</TableRow>
															))}
														</TableBody>
													</Table>
												</div>
											</div>

											<div className="space-y-2">
												<div className="text-sm font-medium">Top devices</div>
												<div className="rounded-md border">
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Device</TableHead>
																<TableHead className="text-right">
																	Findings
																</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{topDevices.length === 0 ? (
																<TableRow>
																	<TableCell
																		colSpan={2}
																		className="text-sm text-muted-foreground"
																	>
																		No device field present in pack outputs.
																	</TableCell>
																</TableRow>
															) : (
																topDevices.map(([dev, n]) => (
																	<TableRow key={dev}>
																		<TableCell className="font-medium">
																			{dev}
																		</TableCell>
																		<TableCell className="text-right tabular-nums">
																			{n}
																		</TableCell>
																	</TableRow>
																))
															)}
														</TableBody>
													</Table>
												</div>
											</div>

											<div className="space-y-2">
												<div className="text-sm font-medium">
													Top risk devices
												</div>
												<div className="rounded-md border">
													<Table>
														<TableHeader>
															<TableRow>
																<TableHead>Device</TableHead>
																<TableHead className="text-right">
																	Risk sum
																</TableHead>
															</TableRow>
														</TableHeader>
														<TableBody>
															{topRisk.length === 0 ? (
																<TableRow>
																	<TableCell
																		colSpan={2}
																		className="text-sm text-muted-foreground"
																	>
																		No riskScore present in pack outputs.
																	</TableCell>
																</TableRow>
															) : (
																topRisk.map(([dev, n]) => (
																	<TableRow key={dev}>
																		<TableCell className="font-medium">
																			{dev}
																		</TableCell>
																		<TableCell className="text-right tabular-nums">
																			{Math.round(n)}
																		</TableCell>
																	</TableRow>
																))
															)}
														</TableBody>
													</Table>
												</div>
											</div>
										</div>
									);
								})()}

								<details>
									<summary className="cursor-pointer text-xs text-muted-foreground">
										Show raw JSON
									</summary>
									<div className="pt-2">
										<Textarea
											readOnly
											className="font-mono text-xs"
											rows={12}
											value={jsonPretty(lastPackRun)}
										/>
									</div>
								</details>
							</CardContent>
						</Card>
					) : null}
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
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Check</TableHead>
												<TableHead className="text-right">Baseline</TableHead>
												<TableHead className="text-right">Compare</TableHead>
												<TableHead className="text-right">New</TableHead>
												<TableHead className="text-right">Resolved</TableHead>
												<TableHead className="text-right">Changed</TableHead>
												<TableHead className="text-right">Details</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(lastDeltaRun.checks ?? []).map((c) => (
												<TableRow key={c.checkId}>
													<TableCell className="font-mono text-xs">
														{c.checkId}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.baselineTotal}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.compareTotal}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.newCount}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.resolvedCount}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.changedCount ?? 0}
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="outline"
															size="sm"
															onClick={() => {
																setDeltaCheckDialogCheckId(c.checkId);
																setDeltaCheckDialogOpen(true);
															}}
														>
															View
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>

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

				<TabsContent value="governance" className="space-y-4">
					<Card>
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<div>
								<CardTitle>Recert Campaigns</CardTitle>
								<CardDescription>
									Persisted review workflows (no config push): generate
									assignments, attest, waive, and export evidence.
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									onClick={() => campaigns.refetch()}
									disabled={campaigns.isFetching}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
								<Button onClick={() => setCreateCampaignOpen(true)}>
									New campaign
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							{campaigns.isError ? (
								<p className="text-xs text-destructive">
									Failed to load campaigns: {(campaigns.error as Error).message}
								</p>
							) : null}
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Pack</TableHead>
											<TableHead>Status</TableHead>
											<TableHead className="text-right">Pending</TableHead>
											<TableHead className="text-right">Attested</TableHead>
											<TableHead className="text-right">Waived</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(campaigns.data?.campaigns ?? []).length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={6}
													className="text-sm text-muted-foreground"
												>
													No campaigns yet.
												</TableCell>
											</TableRow>
										) : (
											(campaigns.data?.campaigns ?? []).map((c) => (
												<TableRow
													key={c.campaign.id}
													className="cursor-pointer"
													onClick={() => setSelectedCampaignId(c.campaign.id)}
												>
													<TableCell className="font-medium">
														{c.campaign.name}
														{selectedCampaignId === c.campaign.id ? (
															<Badge className="ml-2" variant="secondary">
																selected
															</Badge>
														) : null}
													</TableCell>
													<TableCell className="font-mono text-xs">
														{c.campaign.packId}
													</TableCell>
													<TableCell>
														<Badge variant="secondary">
															{c.campaign.status}
														</Badge>
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.counts.pending}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.counts.attested}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{c.counts.waived}
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>

					{selectedCampaignId ? (
						<Card>
							<CardHeader>
								<CardTitle>Assignments</CardTitle>
								<CardDescription>
									Generate (or regenerate) assignments from the campaign pack
									results.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="grid gap-3 md:grid-cols-3">
									<div className="space-y-2">
										<div className="text-sm font-medium">Default assignee</div>
										<Input
											value={campaignAssignee}
											onChange={(e) => setCampaignAssignee(e.target.value)}
											placeholder="optional (username)"
										/>
									</div>
									<div className="space-y-2 md:col-span-2">
										<div className="text-sm font-medium">Actions</div>
										<div className="flex flex-wrap items-center gap-2">
											<Button
												onClick={() => generateAssignments.mutate()}
												disabled={generateAssignments.isPending}
											>
												<Play className="mr-2 h-4 w-4" />
												Generate assignments
											</Button>
											<Button
												variant="outline"
												onClick={() => assignments.refetch()}
												disabled={assignments.isFetching}
											>
												<RefreshCw className="mr-2 h-4 w-4" />
												Refresh
											</Button>
										</div>
										<p className="text-xs text-muted-foreground">
											Generation replaces existing assignments for the campaign.
										</p>
									</div>
								</div>

								{assignments.isError ? (
									<p className="text-xs text-destructive">
										Failed to load assignments:{" "}
										{(assignments.error as Error).message}
									</p>
								) : null}

								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Asset</TableHead>
												<TableHead>Check</TableHead>
												<TableHead>Status</TableHead>
												<TableHead className="text-right">Risk</TableHead>
												<TableHead className="text-right">Details</TableHead>
												<TableHead className="text-right">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(assignments.data?.assignments ?? []).length === 0 ? (
												<TableRow>
													<TableCell
														colSpan={6}
														className="text-sm text-muted-foreground"
													>
														No assignments yet.
													</TableCell>
												</TableRow>
											) : (
												(assignments.data?.assignments ?? []).map((a) => (
													<TableRow key={a.id}>
														<TableCell className="font-mono text-xs">
															{a.findingAssetKey || "—"}
														</TableCell>
														<TableCell className="max-w-[420px] truncate">
															<div className="text-sm font-medium">
																{a.checkTitle || a.checkId}
															</div>
															<div className="text-xs text-muted-foreground font-mono">
																{a.checkId}
															</div>
														</TableCell>
														<TableCell>
															<Badge variant="secondary">{a.status}</Badge>
														</TableCell>
														<TableCell className="text-right tabular-nums">
															{typeof a.findingRiskScore === "number"
																? a.findingRiskScore
																: "—"}
														</TableCell>
														<TableCell className="text-right">
															<Button
																variant="outline"
																size="sm"
																onClick={() => {
																	setGenericEvidence(
																		jsonPretty({
																			findingId: a.findingId,
																			checkId: a.checkId,
																			finding: a.finding,
																		}),
																	);
																	setGenericEvidenceOpen(true);
																}}
															>
																View
															</Button>
														</TableCell>
														<TableCell className="text-right">
															<div className="flex justify-end gap-2">
																<Button
																	size="sm"
																	onClick={() => {
																		setAssignmentDecisionMode("ATTEST");
																		setAssignmentDecisionId(a.id);
																		setAssignmentDecisionJustification("");
																		setAssignmentDecisionOpen(true);
																	}}
																	disabled={attestAssignment.isPending}
																>
																	Attest
																</Button>
																<Button
																	size="sm"
																	variant="outline"
																	onClick={() => {
																		setAssignmentDecisionMode("WAIVE");
																		setAssignmentDecisionId(a.id);
																		setAssignmentDecisionJustification("");
																		setAssignmentDecisionOpen(true);
																	}}
																	disabled={waiveAssignment.isPending}
																>
																	Waive
																</Button>
															</div>
														</TableCell>
													</TableRow>
												))
											)}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					) : null}

					<Card>
						<CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
							<div>
								<CardTitle>Exceptions</CardTitle>
								<CardDescription>
									Propose exceptions for specific findings (with expiry and
									audit trail).
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									onClick={() => exceptions.refetch()}
									disabled={exceptions.isFetching}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Refresh
								</Button>
								<Button onClick={() => setExceptionCreateOpen(true)}>
									New exception
								</Button>
							</div>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Status</TableHead>
											<TableHead>Check</TableHead>
											<TableHead>Finding</TableHead>
											<TableHead>Justification</TableHead>
											<TableHead>Ticket</TableHead>
											<TableHead>Created</TableHead>
											<TableHead className="text-right">Expires</TableHead>
											<TableHead className="text-right">Actions</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{(exceptions.data?.exceptions ?? []).length === 0 ? (
											<TableRow>
												<TableCell
													colSpan={8}
													className="text-sm text-muted-foreground"
												>
													No exceptions yet.
												</TableCell>
											</TableRow>
										) : (
											(exceptions.data?.exceptions ?? []).map((e) => (
												<TableRow key={e.id}>
													<TableCell>
														<Badge variant="secondary">{e.status}</Badge>
													</TableCell>
													<TableCell className="font-mono text-xs">
														{e.checkId}
													</TableCell>
													<TableCell className="font-mono text-xs max-w-[520px] truncate">
														{e.findingId}
													</TableCell>
													<TableCell className="max-w-[420px] truncate text-xs">
														{e.justification}
													</TableCell>
													<TableCell className="max-w-[240px] truncate text-xs">
														{e.ticketUrl ? (
															<a
																href={e.ticketUrl}
																target="_blank"
																rel="noreferrer"
																className="underline"
															>
																{e.ticketUrl}
															</a>
														) : (
															"—"
														)}
													</TableCell>
													<TableCell className="text-xs">
														<div className="font-mono">{e.createdBy}</div>
														{e.approvedBy ? (
															<div className="text-muted-foreground font-mono">
																approved {e.approvedBy}
															</div>
														) : null}
													</TableCell>
													<TableCell className="text-right text-xs font-mono">
														{e.expiresAt
															? String(e.expiresAt).slice(0, 10)
															: "—"}
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																size="sm"
																variant="outline"
																onClick={() => {
																	setGenericEvidence(jsonPretty(e));
																	setGenericEvidenceOpen(true);
																}}
															>
																View
															</Button>
															<Button
																size="sm"
																onClick={() => approveException.mutate(e.id)}
																disabled={
																	approveException.isPending ||
																	String(e.status ?? "").toUpperCase() !==
																		"PROPOSED"
																}
															>
																Approve
															</Button>
															<Button
																size="sm"
																variant="outline"
																onClick={() => rejectException.mutate(e.id)}
																disabled={
																	rejectException.isPending ||
																	String(e.status ?? "").toUpperCase() !==
																		"PROPOSED"
																}
															>
																Reject
															</Button>
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="change" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Change Planning (Simulation)</CardTitle>
							<CardDescription>
								Demo-grade what-if: simulate an ADD/MODIFY/REMOVE against
								first-match decisions for a list of flows (no config push).
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Device (optional)</div>
								<Input
									value={cpDeviceName}
									onChange={(e) => setCpDeviceName(e.target.value)}
									placeholder="Exact device name (optional)"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Operation</div>
								<Select value={cpOp} onValueChange={setCpOp}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ADD">ADD</SelectItem>
										<SelectItem value="MODIFY">MODIFY</SelectItem>
										<SelectItem value="REMOVE">REMOVE</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Rule index</div>
								<Input
									value={cpRuleIndex}
									onChange={(e) => setCpRuleIndex(e.target.value)}
									placeholder="0"
									inputMode="numeric"
									className="font-mono text-xs"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Action</div>
								<Select value={cpRuleAction} onValueChange={setCpRuleAction}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="PERMIT">PERMIT</SelectItem>
										<SelectItem value="DENY">DENY</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
						<CardContent className="space-y-4 pt-0">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="text-sm font-medium">
										ipv4Src (CIDRs, comma/newline; empty = any)
									</div>
									<Textarea
										value={cpIpv4Src}
										onChange={(e) => setCpIpv4Src(e.target.value)}
										rows={3}
										className="font-mono text-xs"
										placeholder="10.0.0.0/8"
									/>
								</div>
								<div className="space-y-2">
									<div className="text-sm font-medium">
										ipv4Dst (CIDRs, comma/newline; empty = any)
									</div>
									<Textarea
										value={cpIpv4Dst}
										onChange={(e) => setCpIpv4Dst(e.target.value)}
										rows={3}
										className="font-mono text-xs"
										placeholder="10.1.0.0/16"
									/>
								</div>
							</div>
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="text-sm font-medium">
										ipProto (comma/newline ints; empty = any)
									</div>
									<Input
										value={cpIpProto}
										onChange={(e) => setCpIpProto(e.target.value)}
										placeholder="6,17"
										className="font-mono text-xs"
									/>
								</div>
								<div className="space-y-2">
									<div className="text-sm font-medium">
										tpDst (e.g. 443, 80-81; empty = any)
									</div>
									<Input
										value={cpTpDst}
										onChange={(e) => setCpTpDst(e.target.value)}
										placeholder="443, 8443"
										className="font-mono text-xs"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">
									Flows (one per line: srcIp dstIp [ipProto] [dstPort])
								</div>
								<Textarea
									value={cpFlowsText}
									onChange={(e) => setCpFlowsText(e.target.value)}
									rows={6}
									className="font-mono text-xs"
									placeholder="10.0.0.1 10.0.0.2 6 443"
								/>
							</div>
							<div className="flex items-center gap-2">
								<Button
									onClick={() => runChangePlanning.mutate()}
									disabled={runChangePlanning.isPending}
								>
									<Play className="mr-2 h-4 w-4" />
									Simulate
								</Button>
								<Button
									variant="outline"
									onClick={() => setCpResult(null)}
									disabled={!cpResult}
								>
									Clear
								</Button>
							</div>
						</CardContent>
					</Card>

					{cpResult ? (
						<Card>
							<CardHeader>
								<CardTitle>Impact</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex flex-wrap items-center gap-2 text-sm">
									<Badge variant="secondary">
										Flows: {cpResult.totalFlows}
									</Badge>
									<Badge variant="secondary">
										Devices: {cpResult.totalDevices}
									</Badge>
									<Badge variant="secondary">
										Changed: {cpResult.changedCount}
									</Badge>
								</div>
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Device</TableHead>
												<TableHead>Flow</TableHead>
												<TableHead>Before</TableHead>
												<TableHead>After</TableHead>
												<TableHead>Reason</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{(cpResult.impacts ?? [])
												.filter((x: any) => x?.changed)
												.slice(0, 200)
												.map((x: any, i: number) => (
													<TableRow key={`${x.device}:${i}`}>
														<TableCell className="font-mono text-xs">
															{x.device}
														</TableCell>
														<TableCell className="font-mono text-xs">
															{x.flow?.srcIp} → {x.flow?.dstIp}{" "}
															{x.flow?.ipProto ?? ""} {x.flow?.dstPort ?? ""}
														</TableCell>
														<TableCell className="font-mono text-xs">
															{x.beforeDecision}{" "}
															{x.beforeRule ? `(${x.beforeRule})` : ""}
														</TableCell>
														<TableCell className="font-mono text-xs">
															{x.afterDecision}{" "}
															{x.afterRule ? `(${x.afterRule})` : ""}
														</TableCell>
														<TableCell className="text-xs text-muted-foreground">
															{x.reason || ""}
														</TableCell>
													</TableRow>
												))}
										</TableBody>
									</Table>
								</div>
								<details>
									<summary className="cursor-pointer text-xs text-muted-foreground">
										Show raw JSON
									</summary>
									<div className="pt-2">
										<Textarea
											readOnly
											className="font-mono text-xs"
											rows={14}
											value={jsonPretty(cpResult)}
										/>
									</div>
								</details>
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

			<Dialog open={flowEvidenceOpen} onOpenChange={setFlowEvidenceOpen}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>First Match Evidence</DialogTitle>
						<DialogDescription>sourceConfigText(...) output</DialogDescription>
					</DialogHeader>
					<Textarea
						readOnly
						className="font-mono text-xs"
						rows={18}
						value={flowEvidence}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				open={flowRuleEvidenceOpen}
				onOpenChange={setFlowRuleEvidenceOpen}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Rule Evidence</DialogTitle>
						<DialogDescription>sourceConfigText(...) output</DialogDescription>
					</DialogHeader>
					<Textarea
						readOnly
						className="font-mono text-xs"
						rows={18}
						value={flowRuleEvidence}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={genericEvidenceOpen} onOpenChange={setGenericEvidenceOpen}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Evidence</DialogTitle>
						<DialogDescription>sourceConfigText(...) output</DialogDescription>
					</DialogHeader>
					<Textarea
						readOnly
						className="font-mono text-xs"
						rows={18}
						value={genericEvidence}
					/>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deltaCheckDialogOpen}
				onOpenChange={setDeltaCheckDialogOpen}
			>
				<DialogContent className="max-w-6xl">
					<DialogHeader>
						<DialogTitle>Delta Check Details</DialogTitle>
						<DialogDescription>{deltaCheckDialogCheckId}</DialogDescription>
					</DialogHeader>
					{(() => {
						const c = (lastDeltaRun?.checks ?? []).find(
							(x) => x.checkId === deltaCheckDialogCheckId,
						);
						if (!c) {
							return (
								<div className="text-sm text-muted-foreground">
									No data for this check.
								</div>
							);
						}

						const newItems = asArray(c.newSamples);
						const oldItems = asArray(c.oldSamples);
						const changedItems = asArray(c.changedSamples);

						const renderSamples = (items: any[]) => {
							const cols = pickColumns(items);
							return (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												{cols.map((k) => (
													<TableHead key={k}>{k}</TableHead>
												))}
												<TableHead className="text-right">Evidence</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{items.slice(0, 50).map((it: any, idx: number) => {
												const ev = evidenceFields(it);
												return (
													<TableRow key={idx}>
														{cols.map((k) => (
															<TableCell
																key={k}
																className="max-w-[360px] truncate font-mono text-xs"
															>
																{typeof it?.[k] === "string" ||
																typeof it?.[k] === "number"
																	? String(it?.[k])
																	: it?.[k] == null
																		? ""
																		: JSON.stringify(it?.[k])}
															</TableCell>
														))}
														<TableCell className="text-right">
															<Button
																variant="outline"
																size="sm"
																disabled={ev.length === 0}
																onClick={() => {
																	setGenericEvidence(ev[0]?.value ?? "");
																	setGenericEvidenceOpen(true);
																}}
															>
																View
															</Button>
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							);
						};

						return (
							<div className="space-y-4">
								<div className="grid gap-3 md:grid-cols-3">
									<div className="text-sm">
										<div className="text-muted-foreground">New</div>
										<div className="font-medium">{c.newCount}</div>
									</div>
									<div className="text-sm">
										<div className="text-muted-foreground">Resolved</div>
										<div className="font-medium">{c.resolvedCount}</div>
									</div>
									<div className="text-sm">
										<div className="text-muted-foreground">Changed</div>
										<div className="font-medium">{c.changedCount ?? 0}</div>
									</div>
								</div>

								{newItems.length ? (
									<div className="space-y-2">
										<div className="text-sm font-medium">New samples</div>
										{renderSamples(newItems)}
									</div>
								) : null}

								{oldItems.length ? (
									<div className="space-y-2">
										<div className="text-sm font-medium">Resolved samples</div>
										{renderSamples(oldItems)}
									</div>
								) : null}

								{changedItems.length ? (
									<div className="space-y-2">
										<div className="text-sm font-medium">Changed samples</div>
										<div className="rounded-md border">
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>findingId</TableHead>
														<TableHead className="text-right">
															Baseline/Compare
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{changedItems
														.slice(0, 50)
														.map((it: any, idx: number) => (
															<TableRow key={idx}>
																<TableCell className="font-mono text-xs">
																	{String(it?.findingId ?? "")}
																</TableCell>
																<TableCell className="text-right">
																	<Button
																		variant="outline"
																		size="sm"
																		onClick={() => {
																			setDeltaChangedDialogPayload({
																				findingId: String(it?.findingId ?? ""),
																				baseline: it?.baseline,
																				compare: it?.compare,
																			});
																			setDeltaChangedDialogOpen(true);
																		}}
																	>
																		View
																	</Button>
																</TableCell>
															</TableRow>
														))}
												</TableBody>
											</Table>
										</div>
									</div>
								) : null}
							</div>
						);
					})()}
				</DialogContent>
			</Dialog>

			<Dialog
				open={deltaChangedDialogOpen}
				onOpenChange={setDeltaChangedDialogOpen}
			>
				<DialogContent className="max-w-6xl">
					<DialogHeader>
						<DialogTitle>Changed Finding</DialogTitle>
						<DialogDescription>
							{deltaChangedDialogPayload?.findingId ?? ""}
						</DialogDescription>
					</DialogHeader>
					{(() => {
						const diffs = diffTopLevel(
							deltaChangedDialogPayload?.baseline,
							deltaChangedDialogPayload?.compare,
						);
						return diffs.length ? (
							<div className="space-y-2">
								<div className="text-sm font-medium">Top-level differences</div>
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Field</TableHead>
												<TableHead>Baseline</TableHead>
												<TableHead>Compare</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{diffs.slice(0, 30).map((d) => (
												<TableRow key={d.key}>
													<TableCell className="font-mono text-xs">
														{d.key}
													</TableCell>
													<TableCell className="max-w-[360px] truncate font-mono text-xs">
														{d.baseline}
													</TableCell>
													<TableCell className="max-w-[360px] truncate font-mono text-xs">
														{d.compare}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
								{diffs.length > 30 ? (
									<div className="text-xs text-muted-foreground">
										Showing 30 of {diffs.length} differing fields.
									</div>
								) : null}
							</div>
						) : (
							<div className="text-xs text-muted-foreground">
								No top-level differences detected (the change may be nested).
							</div>
						);
					})()}
					<div className="grid gap-3 md:grid-cols-2">
						<div className="space-y-2">
							<div className="text-sm font-medium">Baseline</div>
							<Textarea
								readOnly
								className="font-mono text-xs"
								rows={16}
								value={jsonPretty(deltaChangedDialogPayload?.baseline)}
							/>
						</div>
						<div className="space-y-2">
							<div className="text-sm font-medium">Compare</div>
							<Textarea
								readOnly
								className="font-mono text-xs"
								rows={16}
								value={jsonPretty(deltaChangedDialogPayload?.compare)}
							/>
						</div>
					</div>
					<div className="flex items-center gap-2 pt-2">
						<Button
							variant="outline"
							onClick={() => {
								const baseEv = evidenceFields(
									deltaChangedDialogPayload?.baseline,
								);
								const compEv = evidenceFields(
									deltaChangedDialogPayload?.compare,
								);
								const ev = baseEv[0]?.value ?? compEv[0]?.value ?? "";
								setGenericEvidence(ev);
								setGenericEvidenceOpen(true);
							}}
							disabled={
								evidenceFields(deltaChangedDialogPayload?.baseline).length ===
									0 &&
								evidenceFields(deltaChangedDialogPayload?.compare).length === 0
							}
						>
							View evidence
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								const baseEv = evidenceFields(
									deltaChangedDialogPayload?.baseline,
								);
								const ev = baseEv[0]?.value ?? "";
								setGenericEvidence(ev);
								setGenericEvidenceOpen(true);
							}}
							disabled={
								evidenceFields(deltaChangedDialogPayload?.baseline).length === 0
							}
						>
							Baseline evidence
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								const compEv = evidenceFields(
									deltaChangedDialogPayload?.compare,
								);
								const ev = compEv[0]?.value ?? "";
								setGenericEvidence(ev);
								setGenericEvidenceOpen(true);
							}}
							disabled={
								evidenceFields(deltaChangedDialogPayload?.compare).length === 0
							}
						>
							Compare evidence
						</Button>
					</div>
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

			<Dialog open={addNetworkOpen} onOpenChange={setAddNetworkOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Forward Network</DialogTitle>
						<DialogDescription>
							Save one or more Forward Network IDs so Policy Reports is
							organized per network.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Forward Network ID</div>
								<Input
									value={addNetworkForwardId}
									onChange={(e) => setAddNetworkForwardId(e.target.value)}
									placeholder="e.g. 235216"
									className="font-mono text-xs"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Name</div>
								<Input
									value={addNetworkName}
									onChange={(e) => setAddNetworkName(e.target.value)}
									placeholder="Prod Branch WAN"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-sm font-medium">Description (optional)</div>
							<Textarea
								value={addNetworkDesc}
								onChange={(e) => setAddNetworkDesc(e.target.value)}
								rows={3}
								placeholder="Optional notes"
							/>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setAddNetworkOpen(false)}
								disabled={createForwardNetwork.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => createForwardNetwork.mutate()}
								disabled={createForwardNetwork.isPending}
							>
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={zoneCreateOpen} onOpenChange={setZoneCreateOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add Zone</DialogTitle>
						<DialogDescription>
							A zone is a named set of CIDRs used for segmentation-style checks.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Name</div>
								<Input
									value={zoneName}
									onChange={(e) => setZoneName(e.target.value)}
									placeholder="mgmt, prod, dmz, pci…"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">
									Description (optional)
								</div>
								<Input
									value={zoneDesc}
									onChange={(e) => setZoneDesc(e.target.value)}
									placeholder="Optional notes"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-sm font-medium">Subnets (CIDRs)</div>
							<Textarea
								value={zoneSubnetsText}
								onChange={(e) => setZoneSubnetsText(e.target.value)}
								rows={6}
								placeholder={"10.0.0.0/8\n192.168.10.0/24"}
								className="font-mono text-xs"
							/>
							<p className="text-xs text-muted-foreground">
								One per line or comma-separated.
							</p>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setZoneCreateOpen(false)}
								disabled={createZone.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => createZone.mutate()}
								disabled={createZone.isPending}
							>
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={credsOpen} onOpenChange={setCredsOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Forward Credentials (Per User)</DialogTitle>
						<DialogDescription>
							Stored encrypted. Leave password empty to keep the existing stored
							password.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Forward URL</div>
								<Input
									value={credsBaseUrl}
									onChange={(e) => setCredsBaseUrl(e.target.value)}
									placeholder="https://fwd.app"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Skip TLS Verify</div>
								<Select
									value={credsSkipTLSVerify ? "true" : "false"}
									onValueChange={(v) => setCredsSkipTLSVerify(v === "true")}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="false">false</SelectItem>
										<SelectItem value="true">true</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Username</div>
								<Input
									value={credsUsername}
									onChange={(e) => setCredsUsername(e.target.value)}
									placeholder="Forward username"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Password</div>
								<Input
									type="password"
									value={credsPassword}
									onChange={(e) => setCredsPassword(e.target.value)}
									placeholder={
										forwardCredsStatus?.hasPassword ? "(stored)" : "••••••••"
									}
								/>
								<p className="text-xs text-muted-foreground">
									Password is never shown again once stored.
								</p>
							</div>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setCredsOpen(false)}
								disabled={putForwardCreds.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => putForwardCreds.mutate()}
								disabled={putForwardCreds.isPending}
							>
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={createCampaignOpen} onOpenChange={setCreateCampaignOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>New Recert Campaign</DialogTitle>
						<DialogDescription>
							Uses the current Network ID and Snapshot selection at the top of
							the page.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Name</div>
								<Input
									value={campaignName}
									onChange={(e) => setCampaignName(e.target.value)}
									placeholder="Q1 Policy Recert"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Pack</div>
								<Select
									value={campaignPackId}
									onValueChange={setCampaignPackId}
								>
									<SelectTrigger>
										<SelectValue placeholder="Pick a pack" />
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
						</div>
						<div className="space-y-2">
							<div className="text-sm font-medium">Description</div>
							<Textarea
								value={campaignDesc}
								onChange={(e) => setCampaignDesc(e.target.value)}
								rows={3}
								placeholder="optional"
							/>
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">
									Due At (RFC3339, optional)
								</div>
								<Input
									value={campaignDueAt}
									onChange={(e) => setCampaignDueAt(e.target.value)}
									placeholder="2026-03-31T23:59:59Z"
									className="font-mono text-xs"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">
									Default assignee (optional)
								</div>
								<Input
									value={campaignAssignee}
									onChange={(e) => setCampaignAssignee(e.target.value)}
									placeholder="username"
								/>
							</div>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setCreateCampaignOpen(false)}
								disabled={createCampaign.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => createCampaign.mutate()}
								disabled={createCampaign.isPending}
							>
								Create
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={exceptionCreateOpen} onOpenChange={setExceptionCreateOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>New Exception</DialogTitle>
						<DialogDescription>
							Attach to a specific findingId + checkId (copy from report JSON).
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Check ID</div>
								<Input
									value={exceptionCheckId}
									onChange={(e) => setExceptionCheckId(e.target.value)}
									placeholder="acl-any-any-permit.nqe"
									className="font-mono text-xs"
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">Finding ID</div>
								<Input
									value={exceptionFindingId}
									onChange={(e) => setExceptionFindingId(e.target.value)}
									placeholder="sha256..."
									className="font-mono text-xs"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-sm font-medium">Justification</div>
							<Textarea
								value={exceptionJustification}
								onChange={(e) => setExceptionJustification(e.target.value)}
								rows={4}
								placeholder="Explain compensating controls and why this is acceptable."
							/>
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Ticket URL (optional)</div>
								<Input
									value={exceptionTicketUrl}
									onChange={(e) => setExceptionTicketUrl(e.target.value)}
									placeholder="https://jira/... or https://servicenow/..."
								/>
							</div>
							<div className="space-y-2">
								<div className="text-sm font-medium">
									Expires At (RFC3339, optional)
								</div>
								<Input
									value={exceptionExpiresAt}
									onChange={(e) => setExceptionExpiresAt(e.target.value)}
									placeholder="2026-06-30T23:59:59Z"
									className="font-mono text-xs"
								/>
							</div>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setExceptionCreateOpen(false)}
								disabled={createException.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => createException.mutate()}
								disabled={createException.isPending}
							>
								Propose
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog
				open={assignmentDecisionOpen}
				onOpenChange={setAssignmentDecisionOpen}
			>
				<DialogContent className="max-w-xl">
					<DialogHeader>
						<DialogTitle>
							{assignmentDecisionMode === "ATTEST"
								? "Attest Assignment"
								: "Waive Assignment"}
						</DialogTitle>
						<DialogDescription>
							Record an audit-friendly justification (no config push).
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-2">
							<div className="text-sm font-medium">Justification</div>
							<Textarea
								value={assignmentDecisionJustification}
								onChange={(e) =>
									setAssignmentDecisionJustification(e.target.value)
								}
								rows={4}
								placeholder="Why is this acceptable? Reference tickets / compensating controls."
							/>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setAssignmentDecisionOpen(false)}
								disabled={
									attestAssignment.isPending || waiveAssignment.isPending
								}
							>
								Cancel
							</Button>
							<Button
								onClick={() => {
									const id = assignmentDecisionId;
									if (!id) {
										toast.error("Missing assignment id");
										return;
									}
									const justification = assignmentDecisionJustification.trim();
									if (!justification) {
										toast.error("Justification is required");
										return;
									}
									if (assignmentDecisionMode === "ATTEST") {
										attestAssignment.mutate({
											assignmentId: id,
											justification,
										});
									} else {
										waiveAssignment.mutate({ assignmentId: id, justification });
									}
								}}
								disabled={
									attestAssignment.isPending || waiveAssignment.isPending
								}
							>
								{assignmentDecisionMode === "ATTEST" ? "Attest" : "Waive"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
