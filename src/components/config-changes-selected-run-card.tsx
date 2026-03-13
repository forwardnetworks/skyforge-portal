import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import {
	reviewArtifactRefsFromJSON,
	reviewExecutionBackendFromJSON,
} from "../lib/config-change-review";
import {
	autoRollbackBadgeVariant,
	latestAutoRollbackRequest,
	latestAutoRollbackOutcome,
} from "./config-changes-auto-rollback";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { ConfigField, statusVariant } from "./config-changes-shared";

export function ConfigChangesSelectedRunCard({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const {
		isAdmin,
		selectedRun,
		renderMutation,
		approveMutation,
		rejectMutation,
		executeMutation,
		rollbackMutation,
		canRenderRun,
		canApproveRun,
		canRejectRun,
		canExecuteRun,
		canRollbackRun,
		rollbackBlockedReason,
	} = page;
	const autoRollback = selectedRun
		? latestAutoRollbackOutcome(selectedRun.executionSummary?.artifactRefs ?? [])
		: null;
	const autoRollbackRequested = selectedRun
		? latestAutoRollbackRequest(reviewArtifactRefsFromJSON(selectedRun.reviewJson))
		: null;
	const executionBackend = selectedRun
		? String(selectedRun.executionSummary?.executionBackend || "").trim().toLowerCase() ||
			reviewExecutionBackendFromJSON(selectedRun.reviewJson)
		: "";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Selected Run</CardTitle>
				<CardDescription>
					Render, review, and lifecycle state for the selected change run.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{selectedRun ? (
					<>
						<div className="grid gap-3 md:grid-cols-2">
							<ConfigField label="Run ID" value={selectedRun.id} mono />
							<ConfigField
								label="Target"
								value={`${selectedRun.targetType}/${selectedRun.targetRef}`}
							/>
							<ConfigField
								label="Status"
								value={selectedRun.status}
								badgeVariant={statusVariant(selectedRun.status)}
							/>
							<ConfigField
								label="Approval"
								value={selectedRun.approvalState}
								badgeVariant="outline"
							/>
							<ConfigField label="Source" value={selectedRun.sourceKind} />
							<ConfigField
								label="Execution backend"
								value={executionBackend || "n/a"}
							/>
							<ConfigField label="Mode" value={selectedRun.executionMode} />
							<ConfigField label="Requested by" value={selectedRun.requestedBy} />
							<ConfigField
								label="Execution task"
								value={
									selectedRun.executionTaskId
										? String(selectedRun.executionTaskId)
										: "n/a"
								}
								mono={Boolean(selectedRun.executionTaskId)}
							/>
							<ConfigField
								label="Rollback readiness"
								value={canRollbackRun ? "ready" : "blocked"}
								badgeVariant={canRollbackRun ? "default" : "destructive"}
							/>
							{autoRollback ? (
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Auto-rollback
									</div>
									<Badge variant={autoRollbackBadgeVariant(autoRollback.outcome)}>
										{autoRollback.outcome}
									</Badge>
									{autoRollback.reason ? (
										<div className="text-xs text-muted-foreground">
											Reason: {autoRollback.reason}
										</div>
									) : null}
								</div>
							) : autoRollbackRequested ? (
								<div className="space-y-1">
									<div className="text-xs uppercase tracking-wide text-muted-foreground">
										Auto-rollback
									</div>
									<Badge
										variant={
											autoRollbackRequested.eligibility === "eligible"
												? "default"
												: "outline"
										}
									>
										{`requested (${autoRollbackRequested.eligibility || "unknown"})`}
									</Badge>
								</div>
							) : null}
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								onClick={() => renderMutation.mutate(selectedRun.id)}
								disabled={!canRenderRun || renderMutation.isPending}
							>
								Render review
							</Button>
							{isAdmin ? (
								<>
									<Button
										variant="secondary"
										onClick={() => approveMutation.mutate(selectedRun.id)}
										disabled={!canApproveRun || approveMutation.isPending}
									>
										Approve
									</Button>
									<Button
										variant="outline"
										onClick={() => rejectMutation.mutate(selectedRun.id)}
										disabled={!canRejectRun || rejectMutation.isPending}
									>
										Reject
									</Button>
									<Button
										variant="default"
										onClick={() => executeMutation.mutate(selectedRun.id)}
										disabled={!canExecuteRun || executeMutation.isPending}
									>
										Execute
									</Button>
									<Button
										variant="destructive"
										onClick={() => rollbackMutation.mutate(selectedRun.id)}
										disabled={!canRollbackRun || rollbackMutation.isPending}
									>
										Rollback
									</Button>
									{!canRollbackRun && rollbackBlockedReason ? (
										<div className="basis-full text-xs text-muted-foreground">
											{rollbackBlockedReason}
										</div>
									) : null}
								</>
							) : null}
							<div className="text-xs text-muted-foreground">
								{isAdmin
									? "Operators can approve, reject, execute, and replay rollback after review. Only deployment-targeted change-plan runs are executable in the new control model."
									: "Only requested or validating runs can be rendered."}
							</div>
						</div>
					</>
				) : (
					<div className="text-sm text-muted-foreground">
						Select a change run to inspect it.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
