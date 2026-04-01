import type { AdminConfigSectionProps } from "./settings-section-types";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Skeleton } from "./ui/skeleton";

export function AdminOverviewConfigCard(props: AdminConfigSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Effective config</CardTitle>
				<CardDescription>
					Read-only view of the running server's non-secret Encore config.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{props.configLoading ? (
					<Skeleton className="h-40 w-full" />
				) : props.config ? (
					<div className="space-y-3">
						{props.config.missing?.length ? (
							<div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
								<div className="font-medium">Missing config</div>
								<ul className="list-disc pl-5 text-muted-foreground">
									{props.config.missing.map((missing) => (
										<li key={missing}>{missing}</li>
									))}
								</ul>
							</div>
						) : null}
						<pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
							{JSON.stringify(props.config, null, 2)}
						</pre>
					</div>
				) : (
					<EmptyState
						title="No config"
						description="Could not load effective config."
					/>
				)}
			</CardContent>
		</Card>
	);
}
