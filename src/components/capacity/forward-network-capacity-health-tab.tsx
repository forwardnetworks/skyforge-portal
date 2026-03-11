import { jsonPretty } from "@/components/capacity/forward-network-capacity-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityHealthTab({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Health Issues</CardTitle>
				<Button
					variant="outline"
					onClick={() => page.loadUnhealthyDevices.mutate()}
					disabled={page.loadUnhealthyDevices.isPending}
				>
					{page.loadUnhealthyDevices.isPending
						? "Loading…"
						: "Load unhealthy devices"}
				</Button>
			</CardHeader>
			<CardContent className="space-y-2">
				{page.unhealthyDevices ? (
					<pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
						{jsonPretty(page.unhealthyDevices)}
					</pre>
				) : (
					<div className="text-sm text-muted-foreground">
						Loads Forward health signals (including high utilization) around the
						latest processed snapshot.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
