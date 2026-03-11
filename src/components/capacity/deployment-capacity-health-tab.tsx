import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityHealthTab(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;
	const { unhealthyDevices, loadUnhealthyDevices } = page;

	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Health Issues</CardTitle>
				<Button
					variant="outline"
					onClick={() => loadUnhealthyDevices.mutate()}
					disabled={loadUnhealthyDevices.isPending}
				>
					{loadUnhealthyDevices.isPending
						? "Loading…"
						: "Load unhealthy devices"}
				</Button>
			</CardHeader>
			<CardContent className="space-y-2">
				{unhealthyDevices ? (
					<pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
						{JSON.stringify(unhealthyDevices, null, 2)}
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
