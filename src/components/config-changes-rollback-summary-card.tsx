import type { ConfigChangeRunRecord } from "../lib/api-client-config-changes";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function ConfigChangesRollbackSummaryCard({
	run,
}: {
	run: ConfigChangeRunRecord;
}) {
	const summary = run.rollbackSummary;
	if (!summary) return null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Rollback Evidence</CardTitle>
				<CardDescription>
					Pre-apply baseline captured before the change run executed.
				</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2">
				<RollbackField
					label="Previous topology artifact"
					value={summary.previousTopologyArtifactKey || "n/a"}
					mono
				/>
				<RollbackField
					label="Previous node-status count"
					value={String(summary.previousNodeStatusCount ?? 0)}
				/>
				<RollbackField
					label="Previous node-status updated"
					value={
						summary.previousNodeStatusUpdatedAt
							? new Date(summary.previousNodeStatusUpdatedAt).toLocaleString()
							: "n/a"
					}
				/>
			</CardContent>
		</Card>
	);
}

function RollbackField({
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
