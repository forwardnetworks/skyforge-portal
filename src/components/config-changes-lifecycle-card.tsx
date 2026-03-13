import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import {
	autoRollbackBadgeVariant,
	latestAutoRollbackOutcome,
} from "./config-changes-auto-rollback";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { statusVariant } from "./config-changes-shared";

type LifecyclePhase = {
	label: string;
	eventType: string;
};

const lifecyclePhases: LifecyclePhase[] = [
	{ label: "Requested", eventType: "config-change.requested" },
	{ label: "Rendered", eventType: "config-change.rendered" },
	{ label: "Approved", eventType: "config-change.approved" },
	{ label: "Queued", eventType: "config-change.queued" },
	{ label: "Applying", eventType: "config-change.applying" },
	{ label: "Verifying", eventType: "config-change.verifying" },
	{ label: "Succeeded", eventType: "config-change.succeeded" },
	{ label: "Rolled Back", eventType: "config-change.rolled-back" },
	{ label: "Failed", eventType: "config-change.failed" },
];

export function ConfigChangesLifecycleCard({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const events = page.lifecycleQ.data?.events ?? [];
	const phaseMap = new Map(events.map((event) => [event.eventType, event]));
	const autoRollback = latestAutoRollbackOutcome(
		page.selectedRun?.executionSummary?.artifactRefs ?? [],
	);
	const autoRollbackEvent = autoRollback
		? findLatestAutoRollbackEvent(events, autoRollback.outcome)
		: null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Lifecycle</CardTitle>
				<CardDescription>
					Auditable event history for the selected run, including the operator
					phase timeline.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{page.lifecycleQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading lifecycle…</div>
				) : events.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No lifecycle events yet.
					</div>
				) : (
					<>
						{autoRollback ? (
							<div className="rounded-md border p-3 text-sm space-y-2">
								<div className="font-medium">Auto-rollback summary</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={autoRollbackBadgeVariant(autoRollback.outcome)}>
										{`auto-rollback: ${autoRollback.outcome}`}
									</Badge>
									{autoRollback.reason ? (
										<span className="text-xs text-muted-foreground">
											Reason: {autoRollback.reason}
										</span>
									) : null}
								</div>
								{autoRollbackEvent ? (
									<div className="text-xs text-muted-foreground">
										{`Lifecycle event: ${autoRollbackEvent.eventType} at ${new Date(
											autoRollbackEvent.createdAt,
										).toLocaleString()}`}
									</div>
								) : (
									<div className="text-xs text-muted-foreground">
										No lifecycle event correlation yet.
									</div>
								)}
							</div>
						) : null}
						<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
							{lifecyclePhases.map((phase) => {
								const event = phaseMap.get(phase.eventType);
								return (
									<div
										key={phase.eventType}
										className="rounded-md border p-3 text-sm space-y-1"
									>
										<div className="flex items-center justify-between gap-2">
											<div className="font-medium">{phase.label}</div>
											<Badge variant={event ? "default" : "outline"}>
												{event ? "seen" : "pending"}
											</Badge>
										</div>
										<div className="text-xs text-muted-foreground">
											{event
												? new Date(event.createdAt).toLocaleString()
												: "Not reached yet"}
										</div>
									</div>
								);
							})}
						</div>
						<div className="space-y-3">
							{events.map((event) => (
								<div key={event.id} className="rounded-md border p-3 text-sm">
									<div className="flex items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											<div className="font-medium">{event.eventType}</div>
											{event.status ? (
												<Badge variant={statusVariant(event.status)}>
													{event.status}
												</Badge>
											) : null}
										</div>
										<div className="text-xs text-muted-foreground">
											{new Date(event.createdAt).toLocaleString()}
										</div>
									</div>
									{event.message ? (
										<div className="mt-1 text-muted-foreground">
											{event.message}
										</div>
									) : null}
									{event.details && Object.keys(event.details).length > 0 ? (
										<pre className="mt-2 rounded bg-muted p-2 text-xs whitespace-pre-wrap">
											{JSON.stringify(event.details, null, 2)}
										</pre>
									) : null}
								</div>
							))}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}

function findLatestAutoRollbackEvent(
	events: Array<{
		eventType: string;
		message?: string;
		details?: Record<string, string>;
		createdAt: string;
	}>,
	outcome: string,
) {
	const normalized = String(outcome).trim().toLowerCase();
	if (!normalized) return null;
	for (let i = events.length - 1; i >= 0; i -= 1) {
		const event = events[i];
		if (!event) continue;
		const detailsOutcome = String(event.details?.autoRollback || "")
			.trim()
			.toLowerCase();
		if (detailsOutcome && detailsOutcome === normalized) {
			return event;
		}
	}
	return null;
}
