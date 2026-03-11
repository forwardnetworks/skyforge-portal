import type { ForwardCollectorsPageState } from "@/hooks/use-forward-collectors-page";
import { ForwardCollectorRow } from "./forward-collector-row";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function ForwardCollectorsListCard(props: {
	page: ForwardCollectorsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between gap-4">
					<CardTitle>Configured collectors</CardTitle>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={
								page.checkUpdatesMutation.isPending ||
								page.collectors.length === 0
							}
							onClick={() => page.checkUpdatesMutation.mutate()}
						>
							{page.checkUpdatesMutation.isPending
								? "Checking…"
								: "Check updates"}
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={
								page.upgradeAllMutation.isPending ||
								page.collectors.length === 0
							}
							onClick={() => page.upgradeAllMutation.mutate()}
						>
							{page.upgradeAllMutation.isPending ? "Upgrading…" : "Upgrade all"}
						</Button>
						{page.collectors.length > 0 ? (
							<Button
								variant="destructive"
								size="sm"
								disabled={page.deleteAllMutation.isPending}
								onClick={() => {
									const ids = page.collectors
										.map((collector) => String(collector.id))
										.filter(Boolean);
									if (ids.length === 0) return;
									if (
										!confirm(
											`Delete ${ids.length} collector(s)? This removes in-cluster Deployments and saved credentials.`,
										)
									) {
										return;
									}
									page.deleteAllMutation.mutate(ids);
								}}
							>
								{page.deleteAllMutation.isPending ? "Deleting…" : "Delete all"}
							</Button>
						) : null}
					</div>
				</div>
				<CardDescription>
					Each entry maps to one in-cluster Deployment and one Forward
					collector.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{page.collectorsQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : null}
				{page.collectorsQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load collectors.
					</div>
				) : page.collectors.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No collectors configured yet.
					</div>
				) : null}

				{page.collectors.map((collector) => (
					<ForwardCollectorRow
						key={collector.id}
						page={page}
						collector={collector}
					/>
				))}
			</CardContent>
		</Card>
	);
}
