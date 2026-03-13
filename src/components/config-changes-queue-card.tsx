import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import { useMemo, useState } from "react";
import { reviewArtifactRefsFromJSON } from "../lib/config-change-review";
import {
	autoRollbackBadgeVariant,
	latestAutoRollbackRequest,
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

export function ConfigChangesQueueCard({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const { isAdmin, listQ, runs, selectedRunId, setSelectedRunId } = page;
	const [autoRollbackFilter, setAutoRollbackFilter] = useState<
		| "all"
		| "requested"
		| "requested-eligible"
		| "requested-unsupported"
		| "applied"
		| "unsupported"
		| "failed"
		| "none"
	>("all");
	const filteredRuns = useMemo(
		() =>
			runs.filter((run) => {
				if (autoRollbackFilter === "all") return true;
				const state = autoRollbackState(run);
				if (autoRollbackFilter === "requested") {
					return state === "requested-eligible" || state === "requested-unsupported";
				}
				return state === autoRollbackFilter;
			}),
		[runs, autoRollbackFilter],
	);

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
				<div className="flex flex-wrap gap-2">
					{([
						"all",
						"requested",
						"requested-eligible",
						"requested-unsupported",
						"applied",
						"unsupported",
						"failed",
						"none",
					] as const).map(
						(filter) => (
							<button
								key={filter}
								type="button"
								onClick={() => setAutoRollbackFilter(filter)}
								aria-label={`filter auto-rollback: ${filter}`}
								className={`rounded-md border px-2 py-1 text-xs ${
									autoRollbackFilter === filter
										? "border-primary bg-primary/10 text-primary"
										: "border-border text-muted-foreground hover:bg-muted/50"
								}`}
							>
								{`auto-rollback: ${filter}`}
							</button>
						),
					)}
				</div>
				{listQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading change runs…</div>
				) : filteredRuns.length === 0 ? (
					<div className="text-sm text-muted-foreground">No change runs yet.</div>
				) : (
					filteredRuns.map((run) => {
						const selected = run.id === selectedRunId;
						const autoRollback = latestAutoRollbackOutcome(
							run.executionSummary?.artifactRefs ?? [],
						);
						const autoRollbackRequest = latestAutoRollbackRequest(
							reviewArtifactRefsFromJSON(run.reviewJson),
						);
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
								{autoRollback ? (
									<Badge
										variant={autoRollbackBadgeVariant(autoRollback.outcome)}
									>
										{`auto-rollback: ${autoRollback.outcome}`}
									</Badge>
								) : autoRollbackRequest ? (
									<>
										<Badge
											variant={
												autoRollbackRequest.eligibility === "eligible"
													? "default"
													: "outline"
											}
										>
											{`auto-rollback: requested${
												autoRollbackRequest.eligibility
													? ` (${autoRollbackRequest.eligibility})`
													: ""
											}`}
										</Badge>
										{autoRollbackRequest.eligibility === "unsupported" &&
										autoRollbackRequest.backend ? (
											<Badge variant="outline">
												{`backend: ${autoRollbackRequest.backend}`}
											</Badge>
										) : null}
									</>
								) : null}
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

function autoRollbackState(
	run: {
		executionSummary?: {
			artifactRefs?: Array<{ kind?: string; name?: string; key?: string }>;
		};
		reviewJson?: string;
	},
):
	| "requested-eligible"
	| "requested-unsupported"
	| "applied"
	| "unsupported"
	| "failed"
	| "none" {
	const outcome = latestAutoRollbackOutcome(run.executionSummary?.artifactRefs ?? []);
	if (outcome) {
		const value = String(outcome.outcome || "").trim().toLowerCase();
		switch (value) {
			case "applied":
			case "unsupported":
			case "failed":
				return value;
			default:
				return "none";
		}
	}
	const request = latestAutoRollbackRequest(
		reviewArtifactRefsFromJSON(run.reviewJson),
	);
	if (!request) return "none";
	if (request.eligibility === "eligible") return "requested-eligible";
	return "requested-unsupported";
}
