import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";

function formatList(values?: string[] | null): string {
	if (!values || values.length === 0) return "—";
	return values.join(", ");
}

export function DeploymentDetailPlacementCard({
	page,
}: { page: DeploymentDetailPageState }) {
	const placement = page.deploymentInfoQ.data?.kne?.placementSummary;
	const warnings = page.deploymentInfoQ.data?.kne?.warnings ?? [];
	if (!page.deployment || page.deployment.family !== "kne") {
		return null;
	}
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle>Placement</CardTitle>
				<CardDescription>
					Runtime placement intent versus actual pool selection for this lab workload.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				{placement ? (
					<>
						<div className="flex flex-wrap gap-2">
							<Badge variant={placement.degraded ? "destructive" : "secondary"}>
								{placement.status || "unknown"}
							</Badge>
							{placement.schedulingMode ? (
								<Badge variant="outline">{placement.schedulingMode}</Badge>
							) : null}
							{placement.resourceClass ? (
								<Badge variant="outline">{placement.resourceClass}</Badge>
							) : null}
						</div>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
							<div>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Preferred pools
								</div>
								<div className="mt-1 font-medium">
									{formatList(placement.preferredPoolClasses)}
								</div>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Actual pools
								</div>
								<div className="mt-1 font-medium">
									{formatList(placement.actualPoolClasses)}
								</div>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Available pools
								</div>
								<div className="mt-1 font-medium">
									{formatList(placement.availablePoolClasses)}
								</div>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Candidates / ready pods
								</div>
								<div className="mt-1 font-medium">
									{placement.candidateNodeCount ?? 0} / {placement.readyPodCount ?? 0}
								</div>
							</div>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Actual nodes
								</div>
								<div className="mt-1 font-mono text-xs break-all">
									{formatList(placement.actualNodes)}
								</div>
							</div>
							<div>
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Placement hints
								</div>
								<div className="mt-1 font-medium">
									{formatList(placement.placementHints)}
								</div>
							</div>
						</div>
						{warnings.length > 0 ? (
							<div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Warnings
								</div>
								<ul className="mt-2 space-y-1">
									{warnings.map((warning) => (
										<li key={warning}>{warning}</li>
									))}
								</ul>
							</div>
						) : null}
					</>
				) : (
					<div className="text-muted-foreground">
						Placement summary is not available yet for this deployment.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
