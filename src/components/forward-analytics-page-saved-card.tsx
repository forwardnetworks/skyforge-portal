import { Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import type { ForwardAnalyticsPageContentProps } from "./forward-analytics-page-shared";

export function ForwardAnalyticsPageSavedCard({
	page,
}: ForwardAnalyticsPageContentProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Saved networks</CardTitle>
				<CardDescription>
					Open Capacity to compute rollups and explore inventory/perf data.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{page.networks.length === 0 ? (
					<div className="text-sm text-muted-foreground">No saved networks yet.</div>
				) : null}
				{page.networks.map((network) => (
					<div
						key={network.id}
						className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
					>
						<div className="min-w-0">
							<div className="truncate font-medium">{network.name}</div>
							<div className="truncate text-sm text-muted-foreground">
								<span className="font-mono">{network.forwardNetwork}</span>
								{network.description ? ` · ${network.description}` : ""}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<Button asChild variant="outline" size="sm">
								<Link
									to="/dashboard/forward-analytics/$networkRef/capacity"
									params={{ networkRef: network.id }}
									search={{ userId: page.selectedUserScopeId } as never}
								>
									Capacity
								</Link>
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => page.deleteM.mutate(network.id)}
								disabled={page.deleteM.isPending}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</Button>
						</div>
					</div>
				))}
			</CardContent>
		</Card>
	);
}
