import { useRef, useState } from "react";
import type {
	AdminAuditSectionProps,
	AdminMaintenanceSectionProps,
	AdminTasksSectionProps,
	AdminUsersSectionProps,
	SettingsAdminSectionProps,
} from "./settings-section-types";
import { AdminOverviewAuthCard } from "./admin-overview-auth-card";
import { AdminOverviewConfigCard } from "./admin-overview-config-card";
import { AdminOverviewForwardDemoSeedsCard } from "./admin-overview-forward-demo-seeds-card";
import { AdminOverviewForwardSupportCard } from "./admin-overview-forward-support-card";
import { AdminOverviewHetznerBurstCard } from "./admin-overview-hetzner-burst-card";
import { AdminOverviewImpersonationCard } from "./admin-overview-impersonation-card";
import { AdminOverviewOIDCCard } from "./admin-overview-oidc-card";
import { AdminOverviewPublicAccessCard } from "./admin-overview-public-access-card";
import { AdminOverviewQuickDeployCard } from "./admin-overview-quick-deploy-card";
import { AdminOverviewRuntimePressureCard } from "./admin-overview-runtime-pressure-card";
import { AdminOverviewServiceNowCard } from "./admin-overview-servicenow-card";
import { AdminOverviewTeamsCard } from "./admin-overview-teams-card";
import { AdminUsersApiPermissionsCard } from "./admin-users-api-permissions-card";
import { AdminUsersForwardResetCard } from "./admin-users-forward-reset-card";
import { AdminUsersManagementCard } from "./admin-users-management-card";
import { AdminUsersPlatformPolicyCard } from "./admin-users-platform-policy-card";
import { AdminUsersPurgeCard } from "./admin-users-purge-card";
import { AdminUsersRbacCard } from "./admin-users-rbac-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { DataTable } from "./ui/data-table";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "./ui/sheet";
import type { SettingsSectionId } from "../lib/settings-sections";

export function renderAdminSettingsSection(
	section: Exclude<SettingsSectionId, "profile">,
	adminProps: SettingsAdminSectionProps,
) {
	switch (section) {
		case "identity":
			return <IdentitySettingsSection {...adminProps.identity} />;
		case "integrations":
			return <IntegrationsSettingsSection {...adminProps.integrations} />;
		case "forward":
			return <ForwardSettingsSection {...adminProps.forward} />;
		case "runtime":
			return <RuntimeSettingsSection {...adminProps.runtime} />;
		case "users":
			return <UsersSettingsSection {...adminProps.users} />;
		case "maintenance":
			return <MaintenanceSettingsSection {...adminProps.maintenance} />;
	}
}

function IdentitySettingsSection(props: SettingsAdminSectionProps["identity"]) {
	return (
		<>
			<AdminOverviewAuthCard {...props} />
			<AdminOverviewOIDCCard {...props} />
			<AdminOverviewImpersonationCard {...props} />
		</>
	);
}

function IntegrationsSettingsSection(
	props: SettingsAdminSectionProps["integrations"],
) {
	return (
		<>
			<AdminOverviewTeamsCard {...props} />
			<AdminOverviewServiceNowCard {...props} />
		</>
	);
}

function ForwardSettingsSection(props: SettingsAdminSectionProps["forward"]) {
	return (
		<>
			<AdminOverviewForwardSupportCard {...props} />
			<AdminOverviewForwardDemoSeedsCard {...props} />
			<AdminOverviewQuickDeployCard {...props} />
		</>
	);
}

function RuntimeSettingsSection(props: SettingsAdminSectionProps["runtime"]) {
	return (
		<>
			<AdminOverviewHetznerBurstCard {...props} />
			<AdminOverviewRuntimePressureCard {...props} />
			<AdminOverviewPublicAccessCard {...props} />
		</>
	);
}

function UsersSettingsSection(props: AdminUsersSectionProps) {
	return (
		<>
			<AdminUsersManagementCard {...props} />
			<AdminUsersRbacCard {...props} />
			<AdminUsersPlatformPolicyCard {...props} />
			<AdminUsersForwardResetCard {...props} />
			<AdminUsersApiPermissionsCard {...props} />
			<AdminUsersPurgeCard {...props} />
		</>
	);
}

function MaintenanceSettingsSection(props: AdminMaintenanceSectionProps) {
	return (
		<>
			<AdminOverviewConfigCard {...props.config} />
			<AdminAuditSectionCard {...props.audit} />
			<AdminMaintenanceTasksSection {...props.tasks} />
		</>
	);
}

function AdminAuditSectionCard(props: AdminAuditSectionProps) {
	const verifyFileInputRef = useRef<HTMLInputElement | null>(null);
	const [verifySignatureID, setVerifySignatureID] = useState<string>("");
	const [copyStatus, setCopyStatus] = useState<string>("");

	function onRequestVerify(signatureID: string) {
		setVerifySignatureID(signatureID);
		verifyFileInputRef.current?.click();
	}

	function onVerifyFileSelected(file: File | null) {
		if (!verifySignatureID) {
			return;
		}
		props.onAuditVerifySignature(verifySignatureID, file);
		setVerifySignatureID("");
	}

	async function onCopySignatureMetadata(signatureID: string) {
		const signature = props.auditExportSignatures.find((item) => item.id === signatureID);
		if (!signature || typeof navigator === "undefined" || !navigator.clipboard) {
			return;
		}
		try {
			const payload = JSON.stringify(signature, null, 2);
			await navigator.clipboard.writeText(payload);
			setCopyStatus(`Copied ${signatureID}`);
		} catch {
			setCopyStatus(`Copy failed for ${signatureID}`);
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Audit log</CardTitle>
				<CardDescription>
					Typed investigation console for auth, admin, platform, and runtime
					events.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
					<div className="rounded-md border bg-muted/30 p-3">
						<div className="text-xs uppercase tracking-wide text-muted-foreground">
							Total
						</div>
						<div className="mt-1 text-2xl font-semibold">
							{props.auditSummary?.total ?? 0}
						</div>
					</div>
					<div className="rounded-md border bg-muted/30 p-3 md:col-span-3">
						<div className="text-xs uppercase tracking-wide text-muted-foreground">
							Top event types
						</div>
						<div className="mt-2 flex flex-wrap gap-2">
							{props.auditSummary?.topEventTypes?.length ? (
								props.auditSummary.topEventTypes.map((facet) => (
									<Badge key={facet.value} variant="outline">
										{facet.value} · {facet.count}
									</Badge>
								))
							) : (
								<span className="text-sm text-muted-foreground">No events</span>
							)}
						</div>
					</div>
					<div className="rounded-md border bg-muted/30 p-3 md:col-span-2">
						<div className="text-xs uppercase tracking-wide text-muted-foreground">
							Top actors
						</div>
						<div className="mt-2 flex flex-wrap gap-2">
							{props.auditSummary?.topActors?.length ? (
								props.auditSummary.topActors.map((facet) => (
									<Badge key={facet.value} variant="outline">
										{facet.value} · {facet.count}
									</Badge>
								))
							) : (
								<span className="text-sm text-muted-foreground">No actors</span>
							)}
						</div>
					</div>
					<div className="rounded-md border bg-muted/30 p-3 md:col-span-2">
						<div className="text-xs uppercase tracking-wide text-muted-foreground">
							Outcomes
						</div>
						<div className="mt-2 flex flex-wrap gap-2">
							{props.auditSummary?.outcomeCounts?.length ? (
								props.auditSummary.outcomeCounts.map((facet) => (
									<Badge key={facet.value} variant="outline">
										{facet.value} · {facet.count}
									</Badge>
								))
							) : (
								<span className="text-sm text-muted-foreground">No outcomes</span>
							)}
						</div>
					</div>
					<div className="rounded-md border bg-muted/30 p-3 md:col-span-2">
						<div className="text-xs uppercase tracking-wide text-muted-foreground">
							Integrity
						</div>
						{props.auditIntegrityLoading ? (
							<div className="mt-2 text-sm text-muted-foreground">Loading…</div>
						) : props.auditIntegrityStatus ? (
							<div className="mt-2 space-y-1 text-sm">
								<div className="flex items-center gap-2">
									<Badge
										variant={
											props.auditIntegrityStatus.verified ? "secondary" : "destructive"
										}
									>
										{props.auditIntegrityStatus.verified ? "verified" : "broken"}
									</Badge>
									<span className="text-muted-foreground">
										v{props.auditIntegrityStatus.chainVersion}
									</span>
								</div>
								<div className="text-muted-foreground">
									checked {props.auditIntegrityStatus.totalChecked} events
								</div>
								{props.auditIntegrityStatus.firstBrokenId ? (
									<div className="text-destructive text-xs">
										first broken id {props.auditIntegrityStatus.firstBrokenId}:{" "}
										{props.auditIntegrityStatus.firstBrokenError || "verification error"}
									</div>
								) : null}
							</div>
						) : (
							<div className="mt-2 text-sm text-muted-foreground">No data</div>
						)}
					</div>
				</div>

				<div className="grid gap-2 lg:grid-cols-6">
					<div className="flex items-center gap-2">
						<span className="text-sm text-muted-foreground">Limit</span>
						<Input
							className="w-28"
							value={props.auditLimit}
							onChange={(e) => props.onAuditLimitChange(e.target.value)}
						/>
					</div>
					<Input
						placeholder="Actor username"
						value={props.auditActor}
						onChange={(e) => props.onAuditActorChange(e.target.value)}
					/>
					<Input
						placeholder="Actor type"
						value={props.auditActorType}
						onChange={(e) => props.onAuditActorTypeChange(e.target.value)}
					/>
					<Input
						placeholder="Impersonated username"
						value={props.auditImpersonated}
						onChange={(e) => props.onAuditImpersonatedChange(e.target.value)}
					/>
					<Input
						placeholder="Event type"
						value={props.auditEventType}
						onChange={(e) => props.onAuditEventTypeChange(e.target.value)}
					/>
					<Input
						placeholder="Category"
						value={props.auditCategory}
						onChange={(e) => props.onAuditCategoryChange(e.target.value)}
					/>
				</div>

				<div className="grid gap-2 lg:grid-cols-6">
					<Input
						placeholder="Outcome"
						value={props.auditOutcome}
						onChange={(e) => props.onAuditOutcomeChange(e.target.value)}
					/>
					<Input
						placeholder="Severity"
						value={props.auditSeverity}
						onChange={(e) => props.onAuditSeverityChange(e.target.value)}
					/>
					<Input
						placeholder="Target type"
						value={props.auditTargetType}
						onChange={(e) => props.onAuditTargetTypeChange(e.target.value)}
					/>
					<Input
						placeholder="Target id or label"
						value={props.auditTarget}
						onChange={(e) => props.onAuditTargetChange(e.target.value)}
					/>
					<Input
						placeholder="Auth method"
						value={props.auditAuthMethod}
						onChange={(e) => props.onAuditAuthMethodChange(e.target.value)}
					/>
					<Input
						placeholder="Source IP"
						value={props.auditSourceIP}
						onChange={(e) => props.onAuditSourceIPChange(e.target.value)}
					/>
				</div>

				<div className="grid gap-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
					<Input
						placeholder="Search message, target, JSON details"
						value={props.auditQuery}
						onChange={(e) => props.onAuditQueryChange(e.target.value)}
					/>
					<Input
						placeholder="Since (RFC3339)"
						value={props.auditSince}
						onChange={(e) => props.onAuditSinceChange(e.target.value)}
					/>
					<Input
						placeholder="Until (RFC3339)"
						value={props.auditUntil}
						onChange={(e) => props.onAuditUntilChange(e.target.value)}
					/>
					<div className="flex items-center justify-end">
						<Badge variant="outline">{props.auditTimestamp ?? "—"}</Badge>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					{["15m", "1h", "24h", "7d", "30d"].map((range) => (
						<Button
							key={range}
							variant="outline"
							size="sm"
							onClick={() => props.onAuditQuickRangeChange(range)}
						>
							{range}
						</Button>
					))}
					<Button variant="outline" size="sm" onClick={props.onAuditClearFilters}>
						Clear
					</Button>
					<Button variant="outline" size="sm" onClick={() => props.onAuditExport("csv")}>
						Export CSV
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => props.onAuditExport("jsonl")}
					>
						Export JSONL
					</Button>
				</div>

				<div className="grid gap-2 lg:grid-cols-[1fr_auto]">
					<Input
						placeholder="Save current filters as a named view"
						value={props.auditSavedViewName}
						onChange={(e) => props.onAuditSavedViewNameChange(e.target.value)}
					/>
					<Button variant="outline" onClick={props.onAuditSaveView}>
						Save view
					</Button>
				</div>

				{props.auditSavedViews.length ? (
					<div className="flex flex-wrap gap-2">
						{props.auditSavedViews.map((view) => (
							<div
								key={view.id}
								className="flex items-center gap-1 rounded-md border bg-muted/20 px-2 py-1"
							>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2"
									onClick={() => props.onAuditLoadView(view.id)}
								>
									{view.name}
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-7 px-2 text-muted-foreground"
									onClick={() => props.onAuditDeleteView(view.id)}
								>
									Delete
								</Button>
							</div>
						))}
					</div>
				) : null}

				<div className="rounded-md border p-3">
					<div className="text-xs uppercase tracking-wide text-muted-foreground">
						Recent export signatures
					</div>
					<input
						ref={verifyFileInputRef}
						type="file"
						className="hidden"
						onChange={(event) => {
							const file = event.target.files?.[0] ?? null;
							onVerifyFileSelected(file);
							event.target.value = "";
						}}
					/>
					{props.auditVerifyError ? (
						<div className="mt-2 text-sm text-destructive">{props.auditVerifyError}</div>
					) : null}
					{props.auditVerifyResult ? (
						<div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
							<Badge variant={props.auditVerifyResult.verified ? "secondary" : "destructive"}>
								{props.auditVerifyResult.verified ? "Signature verified" : "Verification failed"}
							</Badge>
							<span className="font-mono text-xs text-muted-foreground">
								{props.auditVerifyResult.signatureId}
							</span>
							{props.auditVerifyResult.reason ? (
								<span className="text-muted-foreground">{props.auditVerifyResult.reason}</span>
							) : null}
						</div>
					) : null}
					{copyStatus ? (
						<div className="mt-2 text-xs text-muted-foreground">{copyStatus}</div>
					) : null}
					{props.auditExportSignaturesLoading ? (
						<div className="mt-2 text-sm text-muted-foreground">Loading…</div>
					) : props.auditExportSignatures.length === 0 ? (
						<div className="mt-2 text-sm text-muted-foreground">
							No signed exports recorded.
						</div>
					) : (
						<div className="mt-2 overflow-auto">
							<table className="min-w-full text-sm">
								<thead>
									<tr className="text-left text-xs text-muted-foreground">
										<th className="px-2 py-1">Time</th>
										<th className="px-2 py-1">Actor</th>
										<th className="px-2 py-1">Format</th>
										<th className="px-2 py-1">Events</th>
										<th className="px-2 py-1">Key ID</th>
										<th className="px-2 py-1">SHA-256</th>
										<th className="px-2 py-1">Signature ID</th>
										<th className="px-2 py-1">Verify</th>
										<th className="px-2 py-1">Metadata</th>
									</tr>
								</thead>
								<tbody>
									{props.auditExportSignatures.slice(0, 20).map((sig) => (
										<tr key={sig.id} className="border-t">
											<td className="px-2 py-1 font-mono text-xs">{sig.createdAt}</td>
											<td className="px-2 py-1">{sig.actorUsername}</td>
											<td className="px-2 py-1">{sig.exportFormat}</td>
											<td className="px-2 py-1">{sig.eventCount}</td>
											<td className="px-2 py-1 font-mono text-xs">{sig.keyId}</td>
											<td className="px-2 py-1 font-mono text-xs">{sig.bodySha256}</td>
											<td className="px-2 py-1 font-mono text-xs">{sig.id}</td>
											<td className="px-2 py-1">
												<Button
													variant="outline"
													size="sm"
													disabled={props.auditVerifyPending}
													onClick={() => onRequestVerify(sig.id)}
												>
													{props.auditVerifyPending &&
													props.auditVerifyTargetID === sig.id
														? "Verifying…"
														: "Upload & verify"}
												</Button>
											</td>
											<td className="px-2 py-1">
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														void onCopySignatureMetadata(sig.id);
													}}
												>
													Copy JSON
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
				<DataTable
					rows={props.auditEvents ?? []}
					columns={props.auditColumns}
					getRowId={(row) => String(row.id)}
					onRowClick={(row) => props.onSelectAuditEvent(row.id)}
					getRowAriaSelected={(row) => row.id === props.selectedAuditEventID}
					isLoading={props.auditLoading}
					emptyText="No audit events."
					minWidthClassName="min-w-[1400px]"
				/>
				<Sheet
					open={props.selectedAuditEventID !== null}
					onOpenChange={(open) => {
						if (!open) {
							props.onSelectAuditEvent(null);
						}
					}}
				>
					<SheetContent side="right" className="w-full sm:max-w-2xl">
						<SheetHeader>
							<SheetTitle>
								{props.selectedAuditEvent?.message ||
									props.selectedAuditEvent?.eventType ||
									"Audit event"}
							</SheetTitle>
							<SheetDescription>
								{props.selectedAuditEvent?.createdAt ?? "Loading…"}
							</SheetDescription>
						</SheetHeader>
						<div className="mt-6 space-y-4 overflow-auto">
							<div className="grid gap-3 md:grid-cols-2">
								<div className="rounded-md border p-3">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Actor
									</div>
									<div className="mt-1 font-medium">
										{props.selectedAuditEvent?.actorUsername ?? "—"}
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										{props.selectedAuditEvent?.actorType ?? "—"}
									</div>
								</div>
								<div className="rounded-md border p-3">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Outcome
									</div>
									<div className="mt-1 flex flex-wrap gap-2">
										<Badge variant="outline">
											{props.selectedAuditEvent?.outcome ?? "—"}
										</Badge>
										<Badge variant="outline">
											{props.selectedAuditEvent?.severity ?? "—"}
										</Badge>
										<Badge variant="outline">
											{props.selectedAuditEvent?.eventCategory ?? "—"}
										</Badge>
									</div>
								</div>
								<div className="rounded-md border p-3">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Target
									</div>
									<div className="mt-1 font-medium">
										{props.selectedAuditEvent?.targetDisplay ||
											props.selectedAuditEvent?.targetId ||
											"—"}
									</div>
									<div className="mt-1 text-sm text-muted-foreground">
										{props.selectedAuditEvent?.targetType ?? "—"}
									</div>
								</div>
								<div className="rounded-md border p-3">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Request
									</div>
									<div className="mt-1 text-sm">
										IP {props.selectedAuditEvent?.sourceIp || "—"}
									</div>
									<div className="text-sm text-muted-foreground">
										Auth {props.selectedAuditEvent?.authMethod || "—"}
									</div>
									<div className="text-sm text-muted-foreground">
										Correlation {props.selectedAuditEvent?.correlationId || "—"}
									</div>
								</div>
							</div>

							<div className="rounded-md border p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Event type
								</div>
								<div className="mt-1 font-mono text-sm">
									{props.selectedAuditEvent?.eventType ?? "—"}
								</div>
							</div>

							<div className="rounded-md border p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Integrity chain
								</div>
								<div className="mt-1 grid gap-1 text-sm">
									<div>
										Version {props.selectedAuditEvent?.chainVersion ?? 0}
									</div>
									<div className="break-all font-mono text-xs text-muted-foreground">
										prev {props.selectedAuditEvent?.prevChainHash || "—"}
									</div>
									<div className="break-all font-mono text-xs text-muted-foreground">
										hash {props.selectedAuditEvent?.chainHash || "—"}
									</div>
								</div>
							</div>

							<div className="rounded-md border p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									User agent
								</div>
								<div className="mt-1 break-all text-sm text-muted-foreground">
									{props.selectedAuditEvent?.userAgent ?? "—"}
								</div>
							</div>

							<div className="rounded-md border p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Structured details
								</div>
								<pre className="mt-2 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
									{props.selectedAuditEventLoading
										? "Loading…"
										: props.selectedAuditEventJSON}
								</pre>
							</div>
						</div>
					</SheetContent>
				</Sheet>
			</CardContent>
		</Card>
	);
}

function AdminMaintenanceTasksSection(props: AdminTasksSectionProps) {
	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Task reconciliation</CardTitle>
					<CardDescription>
						Manual guardrails for stuck queued and running jobs.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="font-medium">Queued tasks</div>
							<div className="text-sm text-muted-foreground">
								Republish missing queue events.
							</div>
						</div>
						<Button
							variant="outline"
							disabled={props.reconcileQueuedPending}
							onClick={props.onReconcileQueued}
						>
							{props.reconcileQueuedPending ? "Running…" : "Reconcile queued"}
						</Button>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<div className="font-medium">Running tasks</div>
							<div className="text-sm text-muted-foreground">
								Mark long-running or no-log tasks failed.
							</div>
						</div>
						<Button
							variant="outline"
							disabled={props.reconcileRunningPending}
							onClick={props.onReconcileRunning}
						>
							{props.reconcileRunningPending ? "Running…" : "Reconcile running"}
						</Button>
					</div>

					<div className="space-y-3 rounded-md border p-3">
						<div>
							<div className="font-medium">Tenant pod cleanup</div>
							<div className="text-sm text-muted-foreground">
								Force-clean lingering topology pods and resources after failed
								deletions.
							</div>
						</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Select
								value={props.cleanupScopeMode}
								onValueChange={(value) =>
									props.onCleanupScopeModeChange(
										value === "scope" ? "scope" : "all",
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Scope mode" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All user scopes</SelectItem>
									<SelectItem value="scope">Single user scope</SelectItem>
								</SelectContent>
							</Select>
							{props.cleanupScopeMode === "scope" ? (
								<Select
									value={props.cleanupScopeID}
									onValueChange={props.onCleanupScopeIDChange}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select user scope…" />
									</SelectTrigger>
									<SelectContent>
										{props.allUserScopes.map((scope) => (
											<SelectItem key={scope.id} value={scope.id}>
												{scope.slug} ({scope.createdBy})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							) : (
								<Input
									placeholder="Optional namespace override"
									value={props.cleanupNamespace}
									onChange={(e) =>
										props.onCleanupNamespaceChange(e.target.value)
									}
								/>
							)}
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								disabled={
									props.cleanupTenantPodsPending ||
									(props.cleanupScopeMode === "scope" &&
										!props.cleanupScopeID.trim())
								}
								onClick={props.onPreviewCleanup}
							>
								Preview cleanup
							</Button>
							<Button
								variant="destructive"
								disabled={
									props.cleanupTenantPodsPending ||
									(props.cleanupScopeMode === "scope" &&
										!props.cleanupScopeID.trim())
								}
								onClick={props.onRunCleanup}
							>
								{props.cleanupTenantPodsPending ? "Running…" : "Run cleanup"}
							</Button>
						</div>
						{props.cleanupResult ? (
							<div className="rounded-md border bg-muted/40 p-3 text-xs">
								<div>
									namespaces={props.cleanupResult.namespacesConsidered} owners=
									{props.cleanupResult.topologyOwnersFound} topologies=
									{props.cleanupResult.topologiesFound} deleted=
									{props.cleanupResult.topologiesDeleted}
								</div>
								{props.cleanupResult.errors?.length ? (
									<div className="mt-2 text-amber-600">
										{props.cleanupResult.errors.join(" | ")}
									</div>
								) : null}
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Ephemeral runtime cleanup</CardTitle>
					<CardDescription>
						Inspect and delete stale KNE smoke and runtime namespaces before
						they build enough control-plane churn to hurt embedded etcd.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<Badge variant="secondary">
							total {props.adminEphemeralRuntimeSummary.total}
						</Badge>
						<Badge variant="outline">
							active {props.adminEphemeralRuntimeSummary.active}
						</Badge>
						<Badge variant="outline">
							inactive {props.adminEphemeralRuntimeSummary.inactive}
						</Badge>
						<Badge variant="outline">
							expired {props.adminEphemeralRuntimeSummary.expired}
						</Badge>
						<Badge variant="outline">
							eligible {props.adminEphemeralRuntimeSummary.eligibleForCleanup}
						</Badge>
						<Badge variant="outline">
							finalize {props.adminEphemeralRuntimeSummary.eligibleForForceFinalize}
						</Badge>
						<Badge variant="outline">
							terminating {props.adminEphemeralRuntimeSummary.terminating}
						</Badge>
						<Badge variant="outline">
							pods {props.adminEphemeralRuntimeSummary.resourceTotals.pods}
						</Badge>
						<Badge variant="outline">
							vms {props.adminEphemeralRuntimeSummary.resourceTotals.virtualMachines}
						</Badge>
						<Badge variant="outline">
							vmis {props.adminEphemeralRuntimeSummary.resourceTotals.virtualMachineInstances}
						</Badge>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							disabled={props.adminEphemeralRuntimesLoading}
							onClick={props.onRefreshEphemeralRuntimes}
						>
							Refresh inventory
						</Button>
						<Button
							variant="destructive"
							disabled={
								props.cleanupEphemeralRuntimesPending ||
								props.adminEphemeralRuntimeSummary.eligibleForCleanup === 0
							}
							onClick={props.onCleanupEligibleEphemeralRuntimes}
						>
							{props.cleanupEphemeralRuntimesPending
								? "Cleaning…"
								: "Cleanup eligible namespaces"}
						</Button>
						<Button
							variant="destructive"
							disabled={
								props.forceFinalizeEphemeralRuntimesPending ||
								props.adminEphemeralRuntimeSummary.eligibleForForceFinalize === 0
							}
							onClick={props.onForceFinalizeEligibleEphemeralRuntimes}
						>
							{props.forceFinalizeEphemeralRuntimesPending
								? "Finalizing…"
								: "Force finalize eligible namespaces"}
						</Button>
					</div>
					{props.cleanupEphemeralRuntimesResult ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							cleaned={props.cleanupEphemeralRuntimesResult.namespacesCleaned} errors=
							{props.cleanupEphemeralRuntimesResult.errors?.length ?? 0}
						</div>
					) : null}
					{props.forceFinalizeEphemeralRuntimesResult ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							finalized={props.forceFinalizeEphemeralRuntimesResult.namespacesFinalized} errors=
							{props.forceFinalizeEphemeralRuntimesResult.errors?.length ?? 0}
						</div>
					) : null}
					<div className="space-y-2">
						{props.adminEphemeralRuntimes.map((runtime) => (
							<div
								key={runtime.namespace}
								className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between"
							>
								<div className="space-y-1 text-sm">
									<div className="font-medium">{runtime.namespace}</div>
									<div className="text-muted-foreground">
										phase={runtime.phase} scope={runtime.userScopeId ?? "—"} owner=
										{runtime.owner}
									</div>
								</div>
								<div className="flex flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() =>
											props.onCleanupEphemeralRuntimeNamespace(runtime.namespace)
										}
									>
										Cleanup namespace
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() =>
											props.onForceFinalizeEphemeralRuntimeNamespace(runtime.namespace)
										}
									>
										Force finalize
									</Button>
								</div>
							</div>
						))}
						{props.adminEphemeralRuntimes.length === 0 ? (
							<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
								No ephemeral runtimes found.
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
