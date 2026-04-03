import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import type { DataTableColumn } from "../components/ui/data-table";
import {
	buildAdminAuditExportURL,
	deleteAdminAuditSavedView,
	getAdminAudit,
	getAdminAuditExportSignatures,
	getAdminAuditEvent,
	getAdminAuditIntegrity,
	getAdminAuditSavedViews,
	upsertAdminAuditSavedView,
	verifyAdminAuditExportSignature,
	type AdminAuditEvent,
	type AdminAuditQuery,
	type AdminAuditResponse,
	type VerifyAdminAuditExportSignatureResponse,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

function trimOrUndefined(value: string) {
	const trimmed = value.trim();
	return trimmed || undefined;
}

function quickRangeSince(windowKey: string) {
	const now = Date.now();
	const durations: Record<string, number> = {
		"15m": 15 * 60 * 1000,
		"1h": 60 * 60 * 1000,
		"24h": 24 * 60 * 60 * 1000,
		"7d": 7 * 24 * 60 * 60 * 1000,
		"30d": 30 * 24 * 60 * 60 * 1000,
	};
	const duration = durations[windowKey];
	if (!duration) {
		return "";
	}
	return new Date(now - duration).toISOString();
}

function bytesToBase64(bytes: Uint8Array) {
	let binary = "";
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i+chunkSize));
	}
	return btoa(binary);
}

export function useAdminSettingsAudit() {
	const queryClient = useQueryClient();
	const [auditLimit, setAuditLimit] = useState("200");
	const [auditActor, setAuditActor] = useState("");
	const [auditActorType, setAuditActorType] = useState("");
	const [auditImpersonated, setAuditImpersonated] = useState("");
	const [auditEventType, setAuditEventType] = useState("");
	const [auditCategory, setAuditCategory] = useState("");
	const [auditOutcome, setAuditOutcome] = useState("");
	const [auditSeverity, setAuditSeverity] = useState("");
	const [auditTargetType, setAuditTargetType] = useState("");
	const [auditTarget, setAuditTarget] = useState("");
	const [auditAuthMethod, setAuditAuthMethod] = useState("");
	const [auditSourceIP, setAuditSourceIP] = useState("");
	const [auditQuery, setAuditQuery] = useState("");
	const [auditSince, setAuditSince] = useState("");
	const [auditUntil, setAuditUntil] = useState("");
	const [auditCursor, setAuditCursor] = useState("");
	const [selectedAuditEventID, setSelectedAuditEventID] = useState<number | null>(
		null,
	);
	const [auditSavedViewName, setAuditSavedViewName] = useState("");
	const [auditVerifyResult, setAuditVerifyResult] =
		useState<VerifyAdminAuditExportSignatureResponse | null>(null);
	const [auditVerifyTargetID, setAuditVerifyTargetID] = useState<string | null>(
		null,
	);

	const auditParams = useMemo<AdminAuditQuery>(
		() => ({
			limit: trimOrUndefined(auditLimit),
			cursor: trimOrUndefined(auditCursor),
			actor: trimOrUndefined(auditActor),
			actorType: trimOrUndefined(auditActorType),
			impersonated: trimOrUndefined(auditImpersonated),
			eventType: trimOrUndefined(auditEventType),
			category: trimOrUndefined(auditCategory),
			outcome: trimOrUndefined(auditOutcome),
			severity: trimOrUndefined(auditSeverity),
			targetType: trimOrUndefined(auditTargetType),
			target: trimOrUndefined(auditTarget),
			authMethod: trimOrUndefined(auditAuthMethod),
			sourceIp: trimOrUndefined(auditSourceIP),
			q: trimOrUndefined(auditQuery),
			since: trimOrUndefined(auditSince),
			until: trimOrUndefined(auditUntil),
		}),
		[
			auditActor,
			auditActorType,
			auditAuthMethod,
			auditCategory,
			auditCursor,
			auditEventType,
			auditImpersonated,
			auditLimit,
			auditOutcome,
			auditQuery,
			auditSeverity,
			auditSince,
			auditSourceIP,
			auditTarget,
			auditTargetType,
			auditUntil,
		],
	);

	const auditQ = useQuery({
		queryKey: queryKeys.adminAudit(auditParams),
		queryFn: () => getAdminAudit(auditParams),
		staleTime: 15_000,
		retry: false,
	});

	const selectedAuditEventQ = useQuery({
		queryKey: queryKeys.adminAuditEvent(selectedAuditEventID),
		queryFn: () => getAdminAuditEvent(selectedAuditEventID ?? 0),
		enabled: selectedAuditEventID !== null,
		staleTime: 15_000,
		retry: false,
	});

	const savedAuditViewsQ = useQuery({
		queryKey: queryKeys.adminAuditSavedViews(),
		queryFn: () => getAdminAuditSavedViews(),
		staleTime: 15_000,
		retry: false,
	});

	const auditIntegrityQ = useQuery({
		queryKey: queryKeys.adminAuditIntegrity(),
		queryFn: () => getAdminAuditIntegrity(),
		staleTime: 15_000,
		retry: false,
	});

	const auditExportSignaturesQ = useQuery({
		queryKey: queryKeys.adminAuditExportSignatures(),
		queryFn: () => getAdminAuditExportSignatures(),
		staleTime: 15_000,
		retry: false,
	});

	const saveAuditViewM = useMutation({
		mutationFn: (input: { name: string; filters: AdminAuditQuery }) =>
			upsertAdminAuditSavedView(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminAuditSavedViews(),
			});
		},
	});

	const deleteAuditViewM = useMutation({
		mutationFn: (viewID: string) => deleteAdminAuditSavedView(viewID),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminAuditSavedViews(),
			});
		},
	});

	const verifyAuditExportSignatureM = useMutation({
		mutationFn: async (input: { signatureID: string; file: File }) => {
			const arrayBuffer = await input.file.arrayBuffer();
			const bodyBase64 = bytesToBase64(new Uint8Array(arrayBuffer));
			return verifyAdminAuditExportSignature(input.signatureID, { bodyBase64 });
		},
		onSuccess: (result) => {
			setAuditVerifyResult(result);
		},
		onSettled: () => {
			setAuditVerifyTargetID(null);
		},
	});

	const auditColumns = useMemo<DataTableColumn<AdminAuditEvent>[]>(
		() => [
			{
				id: "createdAt",
				header: "Time",
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.createdAt}
					</span>
				),
				width: 220,
			},
			{
				id: "eventType",
				header: "Event",
				cell: (row) => (
					<div className="space-y-1">
						<div className="font-medium">{row.message || row.eventType}</div>
						<div className="font-mono text-[11px] text-muted-foreground">
							{row.eventType}
						</div>
					</div>
				),
				width: 280,
			},
			{
				id: "outcome",
				header: "Outcome",
				cell: (row) => (
					<div className="flex flex-wrap gap-2">
						<Badge variant={row.outcome === "success" ? "secondary" : "destructive"}>
							{row.outcome}
						</Badge>
						<Badge variant="outline">{row.severity}</Badge>
						<Badge variant="outline">{row.eventCategory}</Badge>
					</div>
				),
				width: 220,
			},
			{
				id: "actor",
				header: "Actor",
				cell: (row) => (
					<div className="space-y-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium">{row.actorUsername}</span>
							<Badge variant="outline">{row.actorType}</Badge>
							{row.actorIsAdmin ? <Badge variant="secondary">admin</Badge> : null}
						</div>
						{row.impersonatedUsername ? (
							<div className="text-xs text-muted-foreground">
								as {row.impersonatedUsername}
							</div>
						) : null}
					</div>
				),
				width: 240,
			},
			{
				id: "target",
				header: "Target",
				cell: (row) => (
					<div className="space-y-1">
						<div>{row.targetDisplay || row.targetId || "—"}</div>
						{row.targetType ? (
							<div className="font-mono text-[11px] text-muted-foreground">
								{row.targetType}
							</div>
						) : null}
					</div>
				),
				width: 220,
			},
			{
				id: "sourceIp",
				header: "Source",
				cell: (row) => (
					<div className="space-y-1">
						<div className="font-mono text-xs text-muted-foreground">
							{row.sourceIp || "—"}
						</div>
						{row.authMethod ? (
							<div className="text-[11px] text-muted-foreground">
								{row.authMethod}
							</div>
						) : null}
					</div>
				),
				width: 180,
			},
		],
		[],
	);

	function onAuditQuickRangeChange(windowKey: string) {
		setAuditSince(quickRangeSince(windowKey));
		setAuditUntil("");
		setAuditCursor("");
	}

	function onAuditClearFilters() {
		setAuditLimit("200");
		setAuditActor("");
		setAuditActorType("");
		setAuditImpersonated("");
		setAuditEventType("");
		setAuditCategory("");
		setAuditOutcome("");
		setAuditSeverity("");
		setAuditTargetType("");
		setAuditTarget("");
		setAuditAuthMethod("");
		setAuditSourceIP("");
		setAuditQuery("");
		setAuditSince("");
		setAuditUntil("");
		setAuditCursor("");
	}

	function onAuditSaveView() {
		const name = auditSavedViewName.trim();
		if (!name || saveAuditViewM.isPending) {
			return;
		}
		saveAuditViewM.mutate({
			name,
			filters: { ...auditParams, cursor: undefined },
		});
		setAuditSavedViewName("");
	}

	function onAuditLoadView(viewID: string) {
		const view = (savedAuditViewsQ.data?.views ?? []).find(
			(item) => item.id === viewID,
		);
		if (!view) {
			return;
		}
		setAuditLimit(view.filters.limit ?? "200");
		setAuditActor(view.filters.actor ?? "");
		setAuditActorType(view.filters.actorType ?? "");
		setAuditImpersonated(view.filters.impersonated ?? "");
		setAuditEventType(view.filters.eventType ?? "");
		setAuditCategory(view.filters.category ?? "");
		setAuditOutcome(view.filters.outcome ?? "");
		setAuditSeverity(view.filters.severity ?? "");
		setAuditTargetType(view.filters.targetType ?? "");
		setAuditTarget(view.filters.target ?? "");
		setAuditAuthMethod(view.filters.authMethod ?? "");
		setAuditSourceIP(view.filters.sourceIp ?? "");
		setAuditQuery(view.filters.q ?? "");
		setAuditSince(view.filters.since ?? "");
		setAuditUntil(view.filters.until ?? "");
		setAuditCursor("");
	}

	function onAuditDeleteView(viewID: string) {
		if (!viewID || deleteAuditViewM.isPending) {
			return;
		}
		deleteAuditViewM.mutate(viewID);
	}

	function onAuditExport(format: "csv" | "jsonl") {
		if (typeof window === "undefined") {
			return;
		}
		window.open(buildAdminAuditExportURL(format, auditParams), "_blank");
	}

	function onAuditVerifySignature(signatureID: string, file: File | null) {
		if (!signatureID || !file || verifyAuditExportSignatureM.isPending) {
			return;
		}
		setAuditVerifyResult(null);
		setAuditVerifyTargetID(signatureID);
		verifyAuditExportSignatureM.mutate({ signatureID, file });
	}

	const selectedAuditEventJSON = useMemo(() => {
		const payload = selectedAuditEventQ.data?.event?.detailsJson;
		return JSON.stringify(payload ?? {}, null, 2);
	}, [selectedAuditEventQ.data?.event?.detailsJson]);

	return {
		auditLimit,
		setAuditLimit,
		auditActor,
		setAuditActor,
		auditActorType,
		setAuditActorType,
		auditImpersonated,
		setAuditImpersonated,
		auditEventType,
		setAuditEventType,
		auditCategory,
		setAuditCategory,
		auditOutcome,
		setAuditOutcome,
		auditSeverity,
		setAuditSeverity,
		auditTargetType,
		setAuditTargetType,
		auditTarget,
		setAuditTarget,
		auditAuthMethod,
		setAuditAuthMethod,
		auditSourceIP,
		setAuditSourceIP,
		auditQuery,
		setAuditQuery,
		auditSince,
		setAuditSince,
		auditUntil,
		setAuditUntil,
		auditCursor,
		setAuditCursor,
		auditQ,
		auditColumns,
		onAuditQuickRangeChange,
		onAuditClearFilters,
		selectedAuditEventID,
		setSelectedAuditEventID,
		selectedAuditEventQ,
		selectedAuditEventJSON,
		auditSavedViewName,
		setAuditSavedViewName,
		savedAuditViews: savedAuditViewsQ.data?.views ?? [],
		auditIntegrityQ,
		auditExportSignaturesQ,
		auditVerifyResult,
		auditVerifyPending: verifyAuditExportSignatureM.isPending,
		auditVerifyTargetID,
		auditVerifyError:
			verifyAuditExportSignatureM.error instanceof Error
				? verifyAuditExportSignatureM.error.message
				: null,
		onAuditSaveView,
		onAuditLoadView,
		onAuditDeleteView,
		onAuditExport,
		onAuditVerifySignature,
	};
}
