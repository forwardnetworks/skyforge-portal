import type { ConfigChangeRunRecord } from "../lib/api-client-config-changes";
import {
	autoRollbackBadgeVariant,
	extractAutoRollbackOutcomes,
} from "./config-changes-auto-rollback";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function ConfigChangesExecutionSummaryCard({
	run,
}: {
	run: ConfigChangeRunRecord;
}) {
	const summary = run.executionSummary;
	if (!summary) return null;
	const autoRollbackOutcomes = extractAutoRollbackOutcomes(summary.artifactRefs ?? []);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Execution Evidence</CardTitle>
				<CardDescription>
					Post-apply evidence captured from the execution and verification seam.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 md:grid-cols-2">
					<ExecutionField
						label="Task ID"
						value={summary.taskId ? String(summary.taskId) : "n/a"}
						mono
					/>
					<ExecutionField
						label="Execution path"
						value={summary.executionPath || "n/a"}
					/>
					<ExecutionField
						label="Planned task type"
						value={summary.plannedExecutionTaskType || "n/a"}
						mono
					/>
					<ExecutionField
						label="Topology artifact"
						value={summary.topologyArtifactKey || "n/a"}
						mono
					/>
					<ExecutionField
						label="User scope"
						value={summary.userScopeId || "n/a"}
						mono
					/>
					<ExecutionField
						label="Deployment"
						value={summary.deploymentId || "n/a"}
						mono
					/>
					<ExecutionField
						label="Node-status count"
						value={String(summary.nodeStatusCount ?? 0)}
					/>
					<div className="space-y-1">
						<div className="text-xs uppercase tracking-wide text-muted-foreground">
							Verification
						</div>
						<Badge variant={summary.verified ? "default" : "outline"}>
							{summary.verified ? "verified" : "unverified"}
						</Badge>
					</div>
				</div>
				{summary.verifiedAt ? (
					<div className="text-xs text-muted-foreground">
						Verified at {new Date(summary.verifiedAt).toLocaleString()}
					</div>
				) : null}
				{autoRollbackOutcomes.length ? (
					<div className="rounded-md border p-3 text-sm space-y-2">
						<div className="font-medium">Auto-rollback outcomes</div>
						<div className="flex flex-wrap gap-2">
							{autoRollbackOutcomes.map((item) => (
								<Badge
									key={`${item.outcome}-${item.reason || "none"}`}
									variant={autoRollbackBadgeVariant(item.outcome)}
								>
									{`auto-rollback: ${item.outcome}`}
								</Badge>
							))}
						</div>
						{autoRollbackOutcomes.map((item) =>
							item.reason ? (
								<div key={`reason-${item.outcome}-${item.reason}`} className="text-xs text-muted-foreground">
									Reason: {item.reason}
								</div>
							) : null,
						)}
					</div>
				) : null}
				{summary.verificationWarnings?.length ? (
					<div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm space-y-1">
						<div className="font-medium">Verification warnings</div>
						{summary.verificationWarnings.map((warning) => (
							<div key={warning}>{warning}</div>
						))}
					</div>
				) : null}
				{summary.artifactRefs?.length ? (
					<div className="space-y-2">
						<div className="text-sm font-medium">Artifact references</div>
						<div className="space-y-2">
							{summary.artifactRefs.map((artifact, index) => (
								<div
									key={`${artifact.kind ?? "artifact"}-${artifact.key ?? index}`}
									className="rounded-md border p-3 text-sm"
								>
									<div className="font-medium">
										{artifact.kind || "artifact"}
										{artifact.name ? ` • ${artifact.name}` : ""}
									</div>
									<div className="font-mono text-xs text-muted-foreground break-all">
										{artifact.key || "n/a"}
									</div>
								</div>
							))}
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function ExecutionField({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div className="space-y-1">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			<div className={mono ? "font-mono text-sm break-all" : "text-sm"}>
				{value}
			</div>
		</div>
	);
}
