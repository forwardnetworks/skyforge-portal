import type { AdminRuntimeSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AdminOverviewRuntimePressureCard(props: AdminRuntimeSectionProps) {
	const summary = props.adminEphemeralRuntimeSummary;
	if (!summary) return null;
	return (
		<Card>
			<CardHeader>
				<CardTitle>Runtime pressure</CardTitle>
				<CardDescription>
					Ephemeral KNE runtime backlog that can push embedded etcd and the API
					server into latency before users notice control-plane failures.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex flex-wrap gap-2 text-sm">
					<Badge variant="secondary">total {summary.total}</Badge>
					<Badge variant="outline">inactive {summary.inactive}</Badge>
					<Badge variant="outline">expired {summary.expired}</Badge>
					<Badge variant="outline">
						delete {summary.eligibleForCleanup}
					</Badge>
					<Badge variant="outline">
						finalize {summary.eligibleForForceFinalize}
					</Badge>
					<Badge variant="outline">terminating {summary.terminating}</Badge>
				</div>
				<div className="grid gap-3 text-sm md:grid-cols-4">
					<div className="rounded-md border p-3">
						<div className="text-muted-foreground">pods</div>
						<div className="text-lg font-semibold">
							{summary.resourceTotals.pods}
						</div>
					</div>
					<div className="rounded-md border p-3">
						<div className="text-muted-foreground">services</div>
						<div className="text-lg font-semibold">
							{summary.resourceTotals.services}
						</div>
					</div>
					<div className="rounded-md border p-3">
						<div className="text-muted-foreground">vms</div>
						<div className="text-lg font-semibold">
							{summary.resourceTotals.virtualMachines}
						</div>
					</div>
					<div className="rounded-md border p-3">
						<div className="text-muted-foreground">vmis</div>
						<div className="text-lg font-semibold">
							{summary.resourceTotals.virtualMachineInstances}
						</div>
					</div>
				</div>
				<div className="text-xs text-muted-foreground">
					Use the Admin Tasks tab for delete and force-finalize actions.
				</div>
			</CardContent>
		</Card>
	);
}
