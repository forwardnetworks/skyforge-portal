import type { AdminTasksTabProps } from "./admin-settings-tab-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { TabsContent } from "./ui/tabs";
export function AdminTasksTab(props: AdminTasksTabProps) {
	return (
		<TabsContent value="tasks" className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Task reconciliation</CardTitle>
					<CardDescription>
						Manual guardrails for stuck queued/running jobs.
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
								Mark long-running/no-log tasks failed.
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
								Force-clean kne topology pods/resources when deployment
								deletion leaves stragglers.
							</div>
						</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Select
								value={props.cleanupScopeMode}
								onValueChange={(v) =>
									props.onCleanupScopeModeChange(
										v === "scope" ? "scope" : "all",
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
						they build up enough control-plane churn to hurt embedded etcd.
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
							finalize{" "}
							{props.adminEphemeralRuntimeSummary.eligibleForForceFinalize}
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
							vmis{" "}
							{
								props.adminEphemeralRuntimeSummary.resourceTotals
									.virtualMachineInstances
							}
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
								? "Running…"
								: "Delete all eligible"}
							</Button>
							<Button
								variant="outline"
								disabled={
									props.forceFinalizeEphemeralRuntimesPending ||
									props.adminEphemeralRuntimeSummary.eligibleForForceFinalize === 0
								}
								onClick={props.onForceFinalizeEligibleEphemeralRuntimes}
							>
								{props.forceFinalizeEphemeralRuntimesPending
									? "Running…"
									: "Force finalize stuck"}
							</Button>
						</div>

						{props.cleanupEphemeralRuntimesResult ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							<div>
								selected=
								{props.cleanupEphemeralRuntimesResult.namespacesSelected} cleaned=
								{props.cleanupEphemeralRuntimesResult.namespacesCleaned} skipped
								active=
								{props.cleanupEphemeralRuntimesResult.skippedActive} skipped
								ineligible=
								{props.cleanupEphemeralRuntimesResult.skippedIneligible}
							</div>
							{props.cleanupEphemeralRuntimesResult.errors?.length ? (
								<div className="mt-2 text-amber-600">
									{props.cleanupEphemeralRuntimesResult.errors.join(" | ")}
								</div>
						) : null}
						{props.forceFinalizeEphemeralRuntimesResult ? (
							<div className="rounded-md border bg-muted/40 p-3 text-xs">
								<div>
									selected=
									{
										props.forceFinalizeEphemeralRuntimesResult
											.namespacesSelected
									} finalized=
									{
										props.forceFinalizeEphemeralRuntimesResult
											.namespacesFinalized
									} skipped ineligible=
									{
										props.forceFinalizeEphemeralRuntimesResult
											.skippedIneligible
									}
								</div>
								{props.forceFinalizeEphemeralRuntimesResult.errors?.length ? (
									<div className="mt-2 text-amber-600">
										{props.forceFinalizeEphemeralRuntimesResult.errors.join(
											" | ",
										)}
									</div>
								) : null}
							</div>
						) : null}
						</div>
					) : null}

					<div className="space-y-3">
						{props.adminEphemeralRuntimes.length === 0 ? (
							<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
								No ephemeral runtime namespaces are currently visible.
							</div>
						) : (
							props.adminEphemeralRuntimes.map((item) => {
								const summaryBits = [
									`pods ${item.resourceCounts.pods}`,
									`svc ${item.resourceCounts.services}`,
									`jobs ${item.resourceCounts.jobs}`,
									`topologies ${item.resourceCounts.topologies}`,
									`vms ${item.resourceCounts.virtualMachines}`,
									`vmis ${item.resourceCounts.virtualMachineInstances}`,
								];
								return (
									<div
										key={item.namespace}
										className="rounded-md border p-3 text-sm"
									>
										<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
											<div className="space-y-2">
												<div className="font-medium">{item.namespace}</div>
												<div className="flex flex-wrap gap-2">
													<Badge variant="secondary">{item.purpose}</Badge>
													<Badge
														variant={item.active ? "secondary" : "outline"}
													>
														{item.active ? "active" : "inactive"}
													</Badge>
														{item.eligibleForCleanup ? (
															<Badge variant="destructive">eligible</Badge>
														) : null}
														{item.eligibleForForceFinalize ? (
															<Badge variant="outline">force-finalize</Badge>
														) : null}
														{item.expired ? (
														<Badge variant="outline">expired</Badge>
													) : null}
													{item.deletionTimestamp ? (
														<Badge variant="outline">terminating</Badge>
													) : null}
												</div>
												<div className="text-xs text-muted-foreground">
													phase={item.phase}
													{item.createdAt ? ` created=${item.createdAt}` : ""}
													{item.expiresAt ? ` expires=${item.expiresAt}` : ""}
													{item.owner ? ` owner=${item.owner}` : ""}
													{item.deploymentId
														? ` deployment=${item.deploymentId}`
														: ""}
													{item.topologyName
														? ` topology=${item.topologyName}`
														: ""}
												</div>
												<div className="text-xs text-muted-foreground">
													{summaryBits.join(" · ")}
												</div>
												{item.finalizers?.length ? (
													<div className="text-xs text-amber-600">
														finalizers: {item.finalizers.join(", ")}
													</div>
												) : null}
												{item.errors?.length ? (
													<div className="text-xs text-amber-600">
														{item.errors.join(" | ")}
													</div>
												) : null}
											</div>
												<div className="flex flex-col gap-2">
													<Button
														variant="destructive"
														size="sm"
														disabled={
															props.cleanupEphemeralRuntimesPending ||
															!item.eligibleForCleanup
														}
														onClick={() =>
															props.onCleanupEphemeralRuntimeNamespace(
																item.namespace,
															)
														}
													>
														Delete
													</Button>
													<Button
														variant="outline"
														size="sm"
														disabled={
															props.forceFinalizeEphemeralRuntimesPending ||
															!item.eligibleForForceFinalize
														}
														onClick={() =>
															props.onForceFinalizeEphemeralRuntimeNamespace(
																item.namespace,
															)
														}
													>
														Force finalize
													</Button>
												</div>
											</div>
										</div>
								);
							})
						)}
					</div>
				</CardContent>
			</Card>
		</TabsContent>
	);
}
