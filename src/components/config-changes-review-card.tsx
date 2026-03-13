import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import { latestAutoRollbackRequest } from "./config-changes-auto-rollback";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { ConfigField } from "./config-changes-shared";

export function ConfigChangesReviewCard({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const review = page.reviewQ.data?.review;
	const autoRollback = latestAutoRollbackRequest(review?.artifactRefs ?? []);
	const autoRollbackEligible = autoRollback?.eligibility === "eligible";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Review</CardTitle>
				<CardDescription>
					Normalized review payload from the render phase.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{page.reviewQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading review…</div>
				) : review ? (
					<>
						<div className="grid gap-3 md:grid-cols-2">
							<ConfigField
								label="Execution path"
								value={review.executionPath || "planned"}
							/>
							<ConfigField
								label="Execution backend"
								value={review.executionBackend || "n/a"}
							/>
							<ConfigField
								label="Verification backend"
								value={review.verificationBackend || "n/a"}
							/>
							<ConfigField
								label="Planned task"
								value={review.plannedExecutionTaskType || "n/a"}
								mono
							/>
							<ConfigField
								label="Devices"
								value={String(review.deviceCount ?? 0)}
							/>
							<ConfigField
								label="Changes"
								value={String(review.changeCount ?? 0)}
							/>
						</div>
						{autoRollback ? (
							<div className="rounded-md border p-3 text-sm space-y-2">
								<div className="font-medium">Auto-rollback plan</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant={autoRollbackEligible ? "default" : "outline"}>
										{autoRollbackEligible
											? "eligible and enforced"
											: "requested but unsupported"}
									</Badge>
									{autoRollback.backend ? (
										<span className="text-xs text-muted-foreground">
											Backend: {autoRollback.backend}
										</span>
									) : null}
								</div>
							</div>
						) : null}
						{review.warnings?.length ? (
							<div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm space-y-1">
								{review.warnings.map((warning) => (
									<div key={warning}>{warning}</div>
								))}
							</div>
						) : null}
						{review.devices?.length ? (
							<div className="space-y-2">
								<div className="text-sm font-medium">Device impact</div>
								<div className="grid gap-2 md:grid-cols-2">
									{review.devices.map((device) => (
										<div
											key={device.name}
											className="rounded-md border p-3 text-sm"
										>
											<div className="font-medium">{device.name}</div>
											<div className="text-muted-foreground">
												{device.summary || `${device.changeCount ?? 0} changes`}
											</div>
										</div>
									))}
								</div>
							</div>
						) : null}
						{review.diffs?.length ? (
							<div className="space-y-2">
								<div className="text-sm font-medium">Rendered diffs</div>
								<div className="space-y-2">
									{review.diffs.map((diff, index) => (
										<div
											key={`${diff.device ?? "diff"}-${index}`}
											className="rounded-md border p-3 text-sm space-y-2"
										>
											<div className="flex items-center justify-between gap-3">
												<div className="font-medium">
													{diff.device || "device"} • {diff.title || "change"}
												</div>
												{diff.summary ? (
													<div className="text-xs text-muted-foreground">
														{diff.summary}
													</div>
												) : null}
											</div>
											{diff.before ? (
												<pre className="rounded bg-muted p-2 text-xs whitespace-pre-wrap">
													{diff.before}
												</pre>
											) : null}
											{diff.after ? (
												<pre className="rounded bg-muted p-2 text-xs whitespace-pre-wrap">
													{diff.after}
												</pre>
											) : null}
										</div>
									))}
								</div>
							</div>
						) : null}
					</>
				) : (
					<div className="text-sm text-muted-foreground">
						Render the selected run to generate review details.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
