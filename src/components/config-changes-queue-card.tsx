import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { statusVariant } from "./config-changes-shared";

export function ConfigChangesQueueCard({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const { isAdmin, listQ, runs, selectedRunId, setSelectedRunId } = page;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Queue</CardTitle>
				<CardDescription>
					{isAdmin
						? "Operator view across all change runs."
						: "Your current and historical change runs."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{listQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading change runs…</div>
				) : runs.length === 0 ? (
					<div className="text-sm text-muted-foreground">No change runs yet.</div>
				) : (
					runs.map((run) => {
						const selected = run.id === selectedRunId;
						return (
							<button
								key={run.id}
								type="button"
								onClick={() => setSelectedRunId(run.id)}
								className={`w-full rounded-lg border p-3 text-left transition ${
									selected
										? "border-primary bg-primary/5"
										: "border-border hover:bg-muted/50"
								}`}
							>
								<div className="flex items-center justify-between gap-3">
									<div className="min-w-0">
										<div className="font-medium truncate">
											{run.summary || run.targetName || run.targetRef}
										</div>
										<div className="text-xs text-muted-foreground truncate">
											{run.targetType}/{run.targetRef} • {run.sourceKind}
										</div>
									</div>
									<div className="flex flex-col items-end gap-1">
										<Badge variant={statusVariant(run.status)}>
											{run.status}
										</Badge>
										<Badge variant="outline">{run.executionMode}</Badge>
									</div>
								</div>
							</button>
						);
					})
				)}
			</CardContent>
		</Card>
	);
}
