import type { ConfigChangesPageData } from "../hooks/use-config-changes-page";
import { ConfigChangesExecutionSummaryCard } from "./config-changes-execution-summary-card";
import { ConfigChangesRollbackSummaryCard } from "./config-changes-rollback-summary-card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export function ConfigChangesPageContent({
	page,
}: {
	page: ConfigChangesPageData;
}) {
	const {
		listQ,
		isAdmin,
		runs,
		selectedRunId,
		setSelectedRunId,
		selectedRun,
		reviewQ,
		lifecycleQ,
		targetType,
		setTargetType,
		targetRef,
		setTargetRef,
		targetName,
		setTargetName,
		sourceKind,
		setSourceKind,
		executionMode,
		setExecutionMode,
		summary,
		setSummary,
		ticketRef,
		setTicketRef,
		specJson,
		setSpecJson,
		createMutation,
		renderMutation,
		approveMutation,
		rejectMutation,
		executeMutation,
		canRenderRun,
		canApproveRun,
		canRejectRun,
		canExecuteRun,
	} = page;

	const review = reviewQ.data?.review;
	const events = lifecycleQ.data?.events ?? [];

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Config Changes</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Durable, auditable change runs for protected shared environments. This
					slice covers request, render, review, and lifecycle tracking.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>New Change Run</CardTitle>
					<CardDescription>
						Create a durable change request using the same control-plane model
						that will eventually hand off into the existing netlab apply seam.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						<div className="space-y-2">
							<Label>Target type</Label>
							<Select value={targetType} onValueChange={setTargetType}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="snapshot">Snapshot</SelectItem>
									<SelectItem value="deployment">Deployment</SelectItem>
									<SelectItem value="environment">Environment</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Target ref</Label>
							<Input
								value={targetRef}
								onChange={(e) => setTargetRef(e.target.value)}
								placeholder="standard-marketing-snapshot"
							/>
						</div>
						<div className="space-y-2">
							<Label>Target name</Label>
							<Input
								value={targetName}
								onChange={(e) => setTargetName(e.target.value)}
								placeholder="Standard Marketing Snapshot"
							/>
						</div>
						<div className="space-y-2">
							<Label>Source kind</Label>
							<Select value={sourceKind} onValueChange={setSourceKind}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="config-snippet">Config Snippet</SelectItem>
									<SelectItem value="structured-patch">Structured Patch</SelectItem>
									<SelectItem value="netlab-model">Netlab Model</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Execution mode</Label>
							<Select value={executionMode} onValueChange={setExecutionMode}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="dry-run">Dry Run</SelectItem>
									<SelectItem value="staged">Staged</SelectItem>
									<SelectItem value="apply">Apply</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Ticket reference</Label>
							<Input
								value={ticketRef}
								onChange={(e) => setTicketRef(e.target.value)}
								placeholder="JIRA-1234"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Summary</Label>
						<Input
							value={summary}
							onChange={(e) => setSummary(e.target.value)}
							placeholder="Allow ACL for demo path"
						/>
					</div>
					<div className="space-y-2">
						<Label>Spec JSON</Label>
						<Textarea
							value={specJson}
							onChange={(e) => setSpecJson(e.target.value)}
							rows={10}
							spellCheck={false}
							className="font-mono text-xs"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => createMutation.mutate()}
							disabled={createMutation.isPending}
						>
							Create change run
						</Button>
						<div className="text-xs text-muted-foreground">
							Render/review is live. Approval and apply stay behind the protected
							operator flow.
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
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
							<div className="text-sm text-muted-foreground">
								Loading change runs…
							</div>
						) : runs.length === 0 ? (
							<div className="text-sm text-muted-foreground">
								No change runs yet.
							</div>
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

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Selected Run</CardTitle>
							<CardDescription>
								Render, review, and lifecycle state for the selected change run.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{selectedRun ? (
								<>
									<div className="grid gap-3 md:grid-cols-2">
										<ConfigField label="Run ID" value={selectedRun.id} mono />
										<ConfigField
											label="Target"
											value={`${selectedRun.targetType}/${selectedRun.targetRef}`}
										/>
										<ConfigField
											label="Status"
											value={selectedRun.status}
											badgeVariant={statusVariant(selectedRun.status)}
										/>
										<ConfigField
											label="Approval"
											value={selectedRun.approvalState}
											badgeVariant="outline"
										/>
										<ConfigField
											label="Source"
											value={selectedRun.sourceKind}
										/>
										<ConfigField
											label="Mode"
											value={selectedRun.executionMode}
										/>
										<ConfigField
											label="Requested by"
											value={selectedRun.requestedBy}
										/>
										<ConfigField
											label="Execution task"
											value={selectedRun.executionTaskId ? String(selectedRun.executionTaskId) : "n/a"}
											mono={Boolean(selectedRun.executionTaskId)}
										/>
									</div>
									<div className="flex items-center gap-2">
										<Button
											onClick={() => renderMutation.mutate(selectedRun.id)}
											disabled={!canRenderRun || renderMutation.isPending}
										>
											Render review
										</Button>
										{isAdmin ? (
											<>
												<Button
													variant="secondary"
													onClick={() => approveMutation.mutate(selectedRun.id)}
													disabled={!canApproveRun || approveMutation.isPending}
												>
													Approve
												</Button>
												<Button
													variant="outline"
													onClick={() => rejectMutation.mutate(selectedRun.id)}
													disabled={!canRejectRun || rejectMutation.isPending}
												>
													Reject
												</Button>
												<Button
													variant="default"
													onClick={() => executeMutation.mutate(selectedRun.id)}
													disabled={!canExecuteRun || executeMutation.isPending}
												>
													Execute
												</Button>
											</>
										) : null}
										<div className="text-xs text-muted-foreground">
											{isAdmin
												? "Operators can approve, reject, and queue executable runs after review."
												: "Only requested or validating runs can be rendered."}
										</div>
									</div>
								</>
							) : (
								<div className="text-sm text-muted-foreground">
									Select a change run to inspect it.
								</div>
							)}
						</CardContent>
					</Card>

					{selectedRun ? (
						<>
							<ConfigChangesRollbackSummaryCard run={selectedRun} />
							<ConfigChangesExecutionSummaryCard run={selectedRun} />
						</>
					) : null}

					<Card>
						<CardHeader>
							<CardTitle>Review</CardTitle>
							<CardDescription>
								Normalized review payload from the render phase.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{reviewQ.isLoading ? (
								<div className="text-sm text-muted-foreground">
									Loading review…
								</div>
							) : review ? (
								<>
									<div className="grid gap-3 md:grid-cols-2">
										<ConfigField
											label="Execution path"
											value={review.executionPath || "planned"}
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

					<Card>
						<CardHeader>
							<CardTitle>Lifecycle</CardTitle>
							<CardDescription>
								Auditable event history for the selected run.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{lifecycleQ.isLoading ? (
								<div className="text-sm text-muted-foreground">
									Loading lifecycle…
								</div>
							) : events.length === 0 ? (
								<div className="text-sm text-muted-foreground">
									No lifecycle events yet.
								</div>
							) : (
								events.map((event) => (
									<div key={event.id} className="rounded-md border p-3 text-sm">
										<div className="flex items-center justify-between gap-3">
											<div className="font-medium">{event.eventType}</div>
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
								))
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

function ConfigField({
	label,
	value,
	badgeVariant,
	mono,
}: {
	label: string;
	value: string;
	badgeVariant?: "default" | "secondary" | "destructive" | "outline";
	mono?: boolean;
}) {
	return (
		<div className="space-y-1">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			{badgeVariant ? (
				<Badge variant={badgeVariant}>{value}</Badge>
			) : (
				<div className={mono ? "font-mono text-sm break-all" : "text-sm"}>
					{value}
				</div>
			)}
		</div>
	);
}

function statusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	const normalized = status.trim().toLowerCase();
	if (
		normalized === "failed" ||
		normalized === "cancelled" ||
		normalized === "rolled-back"
	) {
		return "destructive";
	}
	if (
		normalized === "approved" ||
		normalized === "rendered" ||
		normalized === "succeeded"
	) {
		return "default";
	}
	if (normalized === "awaiting-approval" || normalized === "queued") {
		return "outline";
	}
	return "secondary";
}
