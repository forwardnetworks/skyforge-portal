import { jsonPretty } from "@/components/capacity/deployment-capacity-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityRawTab(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;
	const { summary, inventory } = page;

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Raw Rollups</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{summary.isLoading ? (
						<Skeleton className="h-32 w-full" />
					) : summary.isError ? (
						<div className="text-destructive text-sm">
							{summary.error instanceof Error
								? summary.error.message
								: String(summary.error)}
						</div>
					) : (
						<pre className="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
							{jsonPretty(summary.data?.rollups ?? [])}
						</pre>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Raw Inventory</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{inventory.isLoading ? (
						<Skeleton className="h-32 w-full" />
					) : inventory.isError ? (
						<div className="text-destructive text-sm">
							{inventory.error instanceof Error
								? inventory.error.message
								: String(inventory.error)}
						</div>
					) : (
						<pre className="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
							{jsonPretty(inventory.data ?? {})}
						</pre>
					)}
				</CardContent>
			</Card>
		</>
	);
}
