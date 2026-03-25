import { jsonPretty } from "@/components/capacity/forward-network-capacity-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityRawTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Raw Performance Rollups</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{page.summary.isLoading ? (
						<Skeleton className="h-32 w-full" />
					) : page.summary.isError ? (
						<div className="text-destructive text-sm">
							{page.summary.error instanceof Error
								? page.summary.error.message
								: String(page.summary.error)}
						</div>
					) : (
						<pre className="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
							{jsonPretty(page.summary.data?.rollups ?? [])}
						</pre>
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">Raw Inventory</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{page.inventory.isLoading ? (
						<Skeleton className="h-32 w-full" />
					) : page.inventory.isError ? (
						<div className="text-destructive text-sm">
							{page.inventory.error instanceof Error
								? page.inventory.error.message
								: String(page.inventory.error)}
						</div>
					) : (
						<pre className="max-h-[65vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
							{jsonPretty(page.inventory.data ?? {})}
						</pre>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
