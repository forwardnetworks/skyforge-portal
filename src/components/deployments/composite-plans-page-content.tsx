import type { CompositePlanBinding, CompositePlanOutputRef, CompositePlanStage } from "@/lib/api-client";
import type { CompositePlansPageState } from "@/hooks/use-composite-plans-page";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

function csvFrom(values: string[] | undefined): string {
	return (values ?? []).join(", ");
}

function csvTo(value: string): string[] {
	return value
		.split(",")
		.map((part) => part.trim())
		.filter(Boolean);
}

function mapToLines(input: Record<string, string> | undefined): string {
	if (!input) return "";
	return Object.entries(input)
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");
}

function linesToMap(text: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const rawLine of text.split("\n")) {
		const line = rawLine.trim();
		if (!line) continue;
		const idx = line.indexOf("=");
		if (idx <= 0) continue;
		const key = line.slice(0, idx).trim();
		const value = line.slice(idx + 1).trim();
		if (!key) continue;
		out[key] = value;
	}
	return out;
}

function updateStage(
	page: CompositePlansPageState,
	index: number,
	next: CompositePlanStage,
) {
	page.setDraft((current) => ({
		...current,
		stages: current.stages.map((stage, i) => (i === index ? next : stage)),
	}));
}

function updateBinding(
	page: CompositePlansPageState,
	index: number,
	next: CompositePlanBinding,
) {
	page.setDraft((current) => ({
		...current,
		bindings: current.bindings.map((binding, i) => (i === index ? next : binding)),
	}));
}

function updateOutput(
	page: CompositePlansPageState,
	index: number,
	next: CompositePlanOutputRef,
) {
	page.setDraft((current) => ({
		...current,
		outputs: current.outputs.map((output, i) => (i === index ? next : output)),
	}));
}

export function CompositePlansPageContent({
	page,
}: {
	page: CompositePlansPageState;
}) {
	const busy = page.createMutation.isPending || page.updateMutation.isPending || page.runMutation.isPending;
	const selectedPlan = page.plans.find((plan) => plan.id === page.selectedPlanId) ?? null;
	const selectedRun = page.compositeRuns.find((run) => run.id === page.selectedRunId) ?? null;

	return (
		<div className="space-y-5 p-4 lg:p-5">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
								<CardTitle>Composite Plans</CardTitle>
								<CardDescription>
									Author multi-stage topology plans (terraform to netlab, baremetal to netlab) with explicit bindings.
								</CardDescription>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() =>
									page.navigate({
										to: "/dashboard/deployments",
										search: { userId: page.selectedUserScopeId },
									})
								}
							>
								Back to Deployments
							</Button>
							<Button variant="secondary" onClick={page.newPlan}>
								New Plan
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			<div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Plan Catalog</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>User Scope</Label>
							<Select
								value={page.selectedUserScopeId || "__none"}
								onValueChange={(value) => {
									if (!value || value === "__none") return;
									void page.navigate({
										to: "/dashboard/deployments/composite",
										search: { userId: value },
									});
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select user scope" />
								</SelectTrigger>
								<SelectContent>
									{page.userScopes.map((scope) => (
										<SelectItem key={scope.id} value={scope.id}>
											{scope.name} ({scope.slug})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Saved Plans</Label>
							<Select
								value={page.selectedPlanId || "__none"}
								onValueChange={(value) =>
									page.setSelectedPlanId(value === "__none" ? "" : value)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select saved plan" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__none">Unsaved draft</SelectItem>
									{page.plans.map((plan) => (
										<SelectItem key={plan.id} value={plan.id}>
											{plan.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								{selectedPlan
									? `Saved by ${selectedPlan.createdBy ?? "unknown"}`
									: "Draft mode. Save to persist and run."}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Authoring</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Plan Name</Label>
								<Input
									value={page.draft.name}
									onChange={(event) =>
										page.setDraft((current) => ({
											...current,
											name: event.target.value,
										}))
									}
									placeholder="terraform-netlab-reference"
								/>
							</div>
							<div className="space-y-2">
								<Label>Run Input Overrides (JSON)</Label>
								<Textarea
									rows={5}
									value={page.runInputsJson}
									onChange={(event) => page.setRunInputsJson(event.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Plan Inputs (JSON object)</Label>
							<Textarea
								rows={5}
								value={page.draft.inputsJson}
								onChange={(event) =>
									page.setDraft((current) => ({
										...current,
										inputsJson: event.target.value,
									}))
								}
							/>
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Stages</Label>
								<Button size="sm" variant="secondary" onClick={page.addStage}>
									Add Stage
								</Button>
							</div>
							{page.draft.stages.map((stage, index) => (
								<div key={`${index}-${stage.id}`} className="rounded-md border p-3 space-y-3">
									<div className="grid gap-2 md:grid-cols-3">
										<Input
											placeholder="id"
											value={stage.id}
											onChange={(event) =>
												updateStage(page, index, { ...stage, id: event.target.value })
											}
										/>
										<Select
											value={stage.provider || "terraform"}
											onValueChange={(value) =>
												updateStage(page, index, { ...stage, provider: value })
											}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="terraform">terraform</SelectItem>
												<SelectItem value="netlab">netlab</SelectItem>
												<SelectItem value="containerlab">containerlab</SelectItem>
												<SelectItem value="baremetal">baremetal</SelectItem>
											</SelectContent>
										</Select>
										<Input
											placeholder="action"
											value={stage.action}
											onChange={(event) =>
												updateStage(page, index, { ...stage, action: event.target.value })
											}
										/>
									</div>
									<div className="grid gap-2 md:grid-cols-2">
										<Input
											placeholder="dependsOn (csv)"
											value={csvFrom(stage.dependsOn)}
											onChange={(event) =>
												updateStage(page, index, {
													...stage,
													dependsOn: csvTo(event.target.value),
												})
											}
										/>
										<Input
											placeholder="outputs (csv)"
											value={csvFrom(stage.outputs)}
											onChange={(event) =>
												updateStage(page, index, {
													...stage,
													outputs: csvTo(event.target.value),
												})
											}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-xs">Inputs (`key=value` per line)</Label>
										<Textarea
											rows={4}
											value={mapToLines(stage.inputs)}
											onChange={(event) =>
												updateStage(page, index, {
													...stage,
													inputs: linesToMap(event.target.value),
												})
											}
										/>
									</div>
									<div className="flex justify-end">
										<Button size="sm" variant="ghost" onClick={() => page.removeStage(index)}>
											Remove Stage
										</Button>
									</div>
								</div>
							))}
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Bindings</Label>
								<Button size="sm" variant="secondary" onClick={page.addBinding}>
									Add Binding
								</Button>
							</div>
							{page.draft.bindings.map((binding, index) => (
								<div key={`${index}-${binding.fromStageId}`} className="rounded-md border p-3 space-y-3">
									<div className="grid gap-2 md:grid-cols-2">
										<Input
											placeholder="fromStageId"
											value={binding.fromStageId}
											onChange={(event) =>
												updateBinding(page, index, {
													...binding,
													fromStageId: event.target.value,
												})
											}
										/>
										<Input
											placeholder="fromOutput"
											value={binding.fromOutput}
											onChange={(event) =>
												updateBinding(page, index, {
													...binding,
													fromOutput: event.target.value,
												})
											}
										/>
									</div>
									<div className="grid gap-2 md:grid-cols-3">
										<Input
											placeholder="toStageId"
											value={binding.toStageId}
											onChange={(event) =>
												updateBinding(page, index, {
													...binding,
													toStageId: event.target.value,
												})
											}
										/>
										<Input
											placeholder="toInput"
											value={binding.toInput}
											onChange={(event) =>
												updateBinding(page, index, {
													...binding,
													toInput: event.target.value,
												})
											}
										/>
										<Input
											placeholder="as (optional)"
											value={binding.as ?? ""}
											onChange={(event) =>
												updateBinding(page, index, {
													...binding,
													as: event.target.value,
												})
											}
										/>
									</div>
									<div className="flex items-center gap-2">
										<Switch
											checked={Boolean(binding.sensitive)}
											onCheckedChange={(checked) =>
												updateBinding(page, index, {
													...binding,
													sensitive: checked,
												})
											}
										/>
										<Label>Sensitive</Label>
									</div>
									<div className="flex justify-end">
										<Button size="sm" variant="ghost" onClick={() => page.removeBinding(index)}>
											Remove Binding
										</Button>
									</div>
								</div>
							))}
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<Label>Promoted Outputs</Label>
								<Button size="sm" variant="secondary" onClick={page.addOutput}>
									Add Output
								</Button>
							</div>
							{page.draft.outputs.map((output, index) => (
								<div key={`${index}-${output.stageId}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
									<Input
										placeholder="stageId"
										value={output.stageId}
										onChange={(event) =>
											updateOutput(page, index, {
												...output,
												stageId: event.target.value,
											})
										}
									/>
									<Input
										placeholder="output"
										value={output.output}
										onChange={(event) =>
											updateOutput(page, index, {
												...output,
												output: event.target.value,
											})
										}
									/>
									<Button size="sm" variant="ghost" onClick={() => page.removeOutput(index)}>
										Remove
									</Button>
								</div>
							))}
						</div>

						{page.previewErrors.length > 0 ? (
							<div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
								{page.previewErrors.join("; ")}
							</div>
						) : null}
						{page.previewWarnings.length > 0 ? (
							<div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-700">
								{page.previewWarnings.join("; ")}
							</div>
						) : null}

						<div className="flex flex-wrap gap-2">
							<Button variant="outline" onClick={page.preview} disabled={busy}>
								{page.previewMutation.isPending ? "Previewing…" : "Preview"}
							</Button>
							<Button variant="secondary" onClick={page.saveAsNew} disabled={busy}>
								{page.createMutation.isPending ? "Saving…" : "Save As New"}
							</Button>
							<Button onClick={page.save} disabled={!page.draft.id || busy}>
								{page.updateMutation.isPending ? "Updating…" : "Save"}
							</Button>
							<Button variant="secondary" onClick={page.run} disabled={!page.draft.id || busy}>
								{page.runMutation.isPending ? "Queuing…" : "Run"}
							</Button>
							<Button variant="destructive" onClick={page.deletePlan} disabled={!page.draft.id || busy}>
								Delete
							</Button>
						</div>

						<div className="grid gap-5 lg:grid-cols-2">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>Composite Run History</Label>
									<div className="text-xs text-muted-foreground">
										{page.compositeRuns.length} run(s)
									</div>
								</div>
								<div className="rounded-md border">
									{page.runsQ.isLoading ? (
										<div className="p-3 text-sm text-muted-foreground">Loading runs...</div>
									) : page.compositeRuns.length === 0 ? (
										<div className="p-3 text-sm text-muted-foreground">No composite runs yet.</div>
									) : (
										<div className="max-h-64 overflow-auto" data-testid="composite-run-history">
											{page.compositeRuns.map((run) => {
												const selected = run.id === page.selectedRunId;
												return (
													<button
														type="button"
														key={run.id}
														className={`w-full border-b px-3 py-2 text-left last:border-b-0 ${
															selected ? "bg-muted/60" : "hover:bg-muted/30"
														}`}
														onClick={() => page.setSelectedRunId(run.id)}
														data-testid={`composite-run-${run.id}`}
													>
														<div className="flex items-center justify-between gap-2">
															<div className="min-w-0 truncate text-sm font-medium">
																Run {run.id}
															</div>
															<Badge variant={runStatusBadgeVariant(run.status)}>
																{run.status || "unknown"}
															</Badge>
														</div>
														<div className="truncate text-xs text-muted-foreground">
															{run.type || "task"} {run.message ? `• ${run.message}` : ""}
														</div>
													</button>
												);
											})}
										</div>
									)}
								</div>
							</div>

							<div className="space-y-3">
								<Label>Stage Evidence</Label>
								<div className="rounded-md border" data-testid="composite-stage-evidence">
									{!selectedRun ? (
										<div className="p-3 text-sm text-muted-foreground">
											Select a composite run to view stage evidence.
										</div>
									) : page.runLifecycleQ.isLoading && page.stageEvidence.length === 0 ? (
										<div className="p-3 text-sm text-muted-foreground">
											Loading lifecycle events for run {selectedRun.id}...
										</div>
									) : page.stageEvidence.length === 0 ? (
										<div className="p-3 text-sm text-muted-foreground">
											No composite stage events recorded for run {selectedRun.id}.
										</div>
									) : (
										<div className="max-h-64 overflow-auto">
											{page.stageEvidence.map((event, index) => (
												<div
													key={`${event.stageId}-${event.time}-${index}`}
													className="space-y-1 border-b px-3 py-2 last:border-b-0"
												>
													<div className="flex items-center justify-between gap-2">
														<div className="text-sm font-medium">
															{event.stageId || "(stage)"} • {event.provider}/{event.action}
														</div>
														<Badge variant={stageEventBadgeVariant(event.status)}>
															{event.status}
														</Badge>
													</div>
													<div className="text-xs text-muted-foreground">
														{event.time || "no timestamp"} • outputs={event.outputsCount}
														{event.error ? ` • ${event.error}` : ""}
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function runStatusBadgeVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	const normalized = String(status ?? "").toLowerCase();
	if (["success", "succeeded", "complete", "completed"].includes(normalized)) return "default";
	if (["failed", "error", "cancelled", "canceled"].includes(normalized)) return "destructive";
	if (["running"].includes(normalized)) return "outline";
	return "secondary";
}

function stageEventBadgeVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	const normalized = String(status ?? "").toLowerCase();
	if (normalized === "success") return "default";
	if (normalized === "failed") return "destructive";
	if (normalized === "running") return "outline";
	return "secondary";
}
