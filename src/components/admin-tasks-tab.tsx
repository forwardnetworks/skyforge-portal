import type { AdminTasksTabProps } from "./admin-settings-tab-types";
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
							<div className="font-medium">Workspace pod cleanup</div>
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
									placeholder="Optional namespace override (ws-...)"
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
									props.cleanupWorkspacePodsPending ||
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
									props.cleanupWorkspacePodsPending ||
									(props.cleanupScopeMode === "scope" &&
										!props.cleanupScopeID.trim())
								}
								onClick={props.onRunCleanup}
							>
								{props.cleanupWorkspacePodsPending ? "Running…" : "Run cleanup"}
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
		</TabsContent>
	);
}
