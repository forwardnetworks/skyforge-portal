import type { CompositePlanBinding, CompositePlanOutputRef, CompositePlanStage } from "@/lib/api-client";
import type { CompositePlansPageState } from "@/hooks/use-composite-plans-page";
import type {
	GuidedTerraformOutputBinding,
	GuidedWorkflowInputBinding,
	KeyValueEntry,
} from "@/lib/composite-guided-plan";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { workflowSummaryLines } from "@/lib/composite-guided-plan";

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

function updateStage(page: CompositePlansPageState, index: number, next: CompositePlanStage) {
	page.setDraft((current) => ({
		...current,
		stages: current.stages.map((stage, i) => (i === index ? next : stage)),
	}));
}

function updateBinding(page: CompositePlansPageState, index: number, next: CompositePlanBinding) {
	page.setDraft((current) => ({
		...current,
		bindings: current.bindings.map((binding, i) => (i === index ? next : binding)),
	}));
}

function updateOutput(page: CompositePlansPageState, index: number, next: CompositePlanOutputRef) {
	page.setDraft((current) => ({
		...current,
		outputs: current.outputs.map((output, i) => (i === index ? next : output)),
	}));
}

function updateKeyValueEntry(
	entries: KeyValueEntry[],
	index: number,
	next: KeyValueEntry,
): KeyValueEntry[] {
	return entries.map((entry, i) => (i === index ? next : entry));
}

function removeKeyValueEntry(entries: KeyValueEntry[], index: number): KeyValueEntry[] {
	return entries.filter((_, i) => i !== index);
}

function updateWorkflowBinding(
	bindings: GuidedWorkflowInputBinding[],
	index: number,
	next: GuidedWorkflowInputBinding,
): GuidedWorkflowInputBinding[] {
	return bindings.map((binding, i) => (i === index ? next : binding));
}

function updateTerraformOutputBinding(
	bindings: GuidedTerraformOutputBinding[],
	index: number,
	next: GuidedTerraformOutputBinding,
): GuidedTerraformOutputBinding[] {
	return bindings.map((binding, i) => (i === index ? next : binding));
}

export function CompositePlansPageContent({ page }: { page: CompositePlansPageState }) {
	const busy =
		page.createMutation.isPending ||
		page.updateMutation.isPending ||
		page.runMutation.isPending ||
		page.previewMutation.isPending;
	const selectedPlan = page.plans.find((plan) => plan.id === page.selectedPlanId) ?? null;
	const selectedRun = page.compositeRuns.find((run) => run.id === page.selectedRunId) ?? null;
	const summaryLines = workflowSummaryLines(page.guidedDraft);
	const advancedOnly = page.editorMode === "advanced" && page.guidedModeReason;

	return (
		<div className="space-y-5 p-4 lg:p-5">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
						<div>
							<CardTitle>Composite Plans</CardTitle>
							<CardDescription>
								Author Terraform-to-Netlab workflows with explicit inputs, outputs, and handoffs. Advanced mode keeps the generic composite editor for non-standard plans.
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
								onValueChange={(value) => page.setSelectedPlanId(value === "__none" ? "" : value)}
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
						<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
							<div>
								<CardTitle className="text-base">Authoring</CardTitle>
								<CardDescription>
									Guided mode is the default Terraform-plus-Netlab path. Switch to advanced mode for other composite shapes.
								</CardDescription>
							</div>
							<div className="flex gap-2">
								<Button
									variant={page.editorMode === "guided" ? "default" : "outline"}
									onClick={() => page.setEditorMode("guided")}
								>
									Guided
								</Button>
								<Button
									variant={page.editorMode === "advanced" ? "default" : "outline"}
									onClick={() => page.setEditorMode("advanced")}
								>
									Advanced
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						{advancedOnly ? (
							<div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm text-yellow-700">
								This plan opened in advanced mode: {page.guidedModeReason}
							</div>
						) : null}

						<div className="space-y-2">
							<Label>Plan Name</Label>
							<Input
								value={page.editorMode === "guided" ? page.guidedDraft.name : page.draft.name}
								onChange={(event) => {
									const value = event.target.value;
									if (page.editorMode === "guided") {
										page.setGuidedDraft((current) => ({ ...current, name: value }));
										return;
									}
									page.setDraft((current) => ({ ...current, name: value }));
								}}
								placeholder="terraform-netlab-reference"
							/>
						</div>

						<KeyValueEditor
							label="Run Input Overrides"
							description="Optional per-run values merged onto the workflow inputs when you click Run."
							entries={page.runInputs}
							onChange={page.setRunInputs}
							addLabel="Add run override"
							keyPlaceholder="input name"
							valuePlaceholder="override value"
						/>

						{page.editorMode === "guided" ? (
							<div className="space-y-6">
								<KeyValueEditor
									label="Workflow Inputs"
									description="Named inputs available at plan start and overridable at run time."
									entries={page.guidedDraft.workflowInputs}
									onChange={(entries) =>
										page.setGuidedDraft((current) => ({ ...current, workflowInputs: entries }))
									}
									addLabel="Add workflow input"
									keyPlaceholder="input name"
									valuePlaceholder="default value"
								/>

								<GuidedTerraformSection page={page} />
								<GuidedNetlabSection page={page} />
								<GuidedWorkflowInputBindingsSection page={page} />
								<GuidedTerraformOutputBindingsSection page={page} />

								<div className="space-y-3">
									<Label>Promoted Outputs</Label>
									<Input
										placeholder="vpn_peer_ip, remote_cidr"
										value={csvFrom(page.guidedDraft.promotedOutputs)}
										onChange={(event) =>
											page.setGuidedDraft((current) => ({
												...current,
												promotedOutputs: csvTo(event.target.value),
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Terraform outputs to promote onto the saved composite run record.
									</p>
								</div>

								<div className="space-y-3 rounded-md border p-3">
									<div>
										<Label>How Values Flow</Label>
										<p className="text-xs text-muted-foreground">
											These are the effective handoffs the generic composite engine will execute.
										</p>
									</div>
									{summaryLines.length === 0 ? (
										<div className="text-sm text-muted-foreground">
											No variable handoffs defined yet.
										</div>
									) : (
										<div className="space-y-1 text-sm">
											{summaryLines.map((line) => (
												<div key={line} className="font-mono text-xs">
													{line}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						) : (
							<AdvancedCompositeEditor page={page} />
						)}

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
								{page.previewMutation.isPending ? "Previewing..." : "Preview"}
							</Button>
							<Button variant="secondary" onClick={page.saveAsNew} disabled={busy}>
								{page.createMutation.isPending ? "Saving..." : "Save As New"}
							</Button>
							<Button
								onClick={page.save}
								disabled={
									(page.editorMode === "guided" ? !page.guidedDraft.id : !page.draft.id) || busy
								}
							>
								{page.updateMutation.isPending ? "Updating..." : "Save"}
							</Button>
							<Button
								variant="secondary"
								onClick={page.run}
								disabled={
									(page.editorMode === "guided" ? !page.guidedDraft.id : !page.draft.id) || busy
								}
							>
								{page.runMutation.isPending ? "Queuing..." : "Run"}
							</Button>
							<Button
								variant="destructive"
								onClick={page.deletePlan}
								disabled={
									(page.editorMode === "guided" ? !page.guidedDraft.id : !page.draft.id) || busy
								}
							>
								Delete
							</Button>
						</div>

						<div className="grid gap-5 lg:grid-cols-2">
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label>Composite Run History</Label>
									<div className="text-xs text-muted-foreground">{page.compositeRuns.length} run(s)</div>
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
															<div className="min-w-0 truncate text-sm font-medium">Run {run.id}</div>
															<Badge variant={runStatusBadgeVariant(run.status)}>{run.status || "unknown"}</Badge>
														</div>
														<div className="truncate text-xs text-muted-foreground">
															{run.type || "task"} {run.message ? `- ${run.message}` : ""}
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
															{event.stageId || "(stage)"} - {event.provider}/{event.action}
														</div>
														<Badge variant={stageEventBadgeVariant(event.status)}>{event.status}</Badge>
													</div>
													<div className="text-xs text-muted-foreground">
														{event.time || "no timestamp"} - outputs={event.outputsCount}
														{event.error ? ` - ${event.error}` : ""}
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

function GuidedTerraformSection({ page }: { page: CompositePlansPageState }) {
	const draft = page.guidedDraft;
	return (
		<div className="space-y-4 rounded-md border p-4">
			<div>
				<Label>Terraform</Label>
				<p className="text-xs text-muted-foreground">Literal Terraform settings plus variables and extra environment.</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="space-y-2">
					<Label className="text-xs">Stage ID</Label>
					<Input
						value={draft.terraformStageId}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, terraformStageId: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Action</Label>
					<Select
						value={draft.terraformAction}
						onValueChange={(value) => page.setGuidedDraft((current) => ({ ...current, terraformAction: value }))}
					>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="plan">plan</SelectItem>
							<SelectItem value="apply">apply</SelectItem>
							<SelectItem value="destroy">destroy</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Target</Label>
					<Input
						placeholder="aws"
						value={draft.terraformTarget}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, terraformTarget: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Template Source</Label>
					<Select
						value={draft.terraformTemplateSource || "user"}
						onValueChange={(value) => page.setGuidedDraft((current) => ({ ...current, terraformTemplateSource: value }))}
					>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="user">user</SelectItem>
							<SelectItem value="blueprints">blueprints</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Template Repo</Label>
					<Input
						placeholder="catalog"
						value={draft.terraformTemplateRepo}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, terraformTemplateRepo: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Templates Dir</Label>
					<Input
						placeholder="terraform"
						value={draft.terraformTemplatesDir}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, terraformTemplatesDir: event.target.value }))}
					/>
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label className="text-xs">Template</Label>
					<Input
						placeholder="CloudAWS"
						value={draft.terraformTemplate}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, terraformTemplate: event.target.value }))}
					/>
				</div>
			</div>
			<KeyValueEditor
				label="Terraform Variables"
				description="These become TF_VAR_* values under the hood."
				entries={draft.terraformVars}
				onChange={(entries) => page.setGuidedDraft((current) => ({ ...current, terraformVars: entries }))}
				addLabel="Add Terraform variable"
				keyPlaceholder="variable name"
				valuePlaceholder="value"
			/>
			<KeyValueEditor
				label="Terraform Extra Environment"
				description="Additional environment variables for Terraform that are not TF_VAR values."
				entries={draft.terraformEnv}
				onChange={(entries) => page.setGuidedDraft((current) => ({ ...current, terraformEnv: entries }))}
				addLabel="Add Terraform env"
				keyPlaceholder="env var"
				valuePlaceholder="value"
			/>
			<div className="space-y-2">
				<Label className="text-xs">Declared Terraform Outputs</Label>
				<Input
					placeholder="vpn_peer_ip, vpn_psk, remote_cidr"
					value={csvFrom(draft.terraformOutputs)}
					onChange={(event) => page.setGuidedDraft((current) => ({ ...current, terraformOutputs: csvTo(event.target.value) }))}
				/>
			</div>
		</div>
	);
}

function GuidedNetlabSection({ page }: { page: CompositePlansPageState }) {
	const draft = page.guidedDraft;
	return (
		<div className="space-y-4 rounded-md border p-4">
			<div>
				<Label>Netlab</Label>
				<p className="text-xs text-muted-foreground">Literal Netlab settings plus environment variables.</p>
			</div>
			<div className="grid gap-3 md:grid-cols-2">
				<div className="space-y-2">
					<Label className="text-xs">Stage ID</Label>
					<Input
						value={draft.netlabStageId}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, netlabStageId: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Action</Label>
					<Select
						value={draft.netlabAction}
						onValueChange={(value) => page.setGuidedDraft((current) => ({ ...current, netlabAction: value }))}
					>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							<SelectItem value="up">up</SelectItem>
							<SelectItem value="down">down</SelectItem>
							<SelectItem value="validate">validate</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Server</Label>
					<Input
						placeholder="user:server-id"
						value={draft.netlabServer}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, netlabServer: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">Deployment</Label>
					<Input
						placeholder="vpn-lab"
						value={draft.netlabDeployment}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, netlabDeployment: event.target.value }))}
					/>
				</div>
				<div className="space-y-2 md:col-span-2">
					<Label className="text-xs">Topology Path</Label>
					<Input
						placeholder="netlab/BGP/Default-NH/topology.yml"
						value={draft.netlabTopologyPath}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, netlabTopologyPath: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">User Scope Root</Label>
					<Input
						placeholder="/home/user/netlab"
						value={draft.netlabUserScopeRoot}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, netlabUserScopeRoot: event.target.value }))}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-xs">User Scope Dir</Label>
					<Input
						placeholder="/home/user/netlab/scope/vpn-lab"
						value={draft.netlabUserScopeDir}
						onChange={(event) => page.setGuidedDraft((current) => ({ ...current, netlabUserScopeDir: event.target.value }))}
					/>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					checked={draft.netlabCleanup}
					onCheckedChange={(checked) => page.setGuidedDraft((current) => ({ ...current, netlabCleanup: checked }))}
				/>
				<Label>Cleanup on down</Label>
			</div>
			<KeyValueEditor
				label="Netlab Environment"
				description="Environment variables passed to the Netlab stage."
				entries={draft.netlabEnv}
				onChange={(entries) => page.setGuidedDraft((current) => ({ ...current, netlabEnv: entries }))}
				addLabel="Add Netlab env"
				keyPlaceholder="env var"
				valuePlaceholder="value"
			/>
		</div>
	);
}

function GuidedWorkflowInputBindingsSection({ page }: { page: CompositePlansPageState }) {
	const bindings = page.guidedDraft.workflowInputBindings;
	return (
		<div className="space-y-3 rounded-md border p-4">
			<div className="flex items-center justify-between">
				<div>
					<Label>Workflow Input Mappings</Label>
					<p className="text-xs text-muted-foreground">Map named workflow inputs into Terraform variables/env or Netlab fields/env.</p>
				</div>
				<Button
					size="sm"
					variant="secondary"
					onClick={() =>
						page.setGuidedDraft((current) => ({
							...current,
							workflowInputBindings: [
								...current.workflowInputBindings,
								{ sourceInput: "", targetKind: "terraformVar", targetKey: "", sensitive: false },
							],
						}))
					}
				>
					Add mapping
				</Button>
			</div>
			{bindings.length === 0 ? (
				<div className="text-sm text-muted-foreground">No workflow input mappings yet.</div>
			) : (
				bindings.map((binding, index) => (
					<div key={`${index}-${binding.sourceInput}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_180px_1fr_auto_auto] md:items-end">
						<div className="space-y-2">
							<Label className="text-xs">Source Input</Label>
							<Input
								placeholder="input name"
								value={binding.sourceInput}
								onChange={(event) =>
									page.setGuidedDraft((current) => ({
										...current,
										workflowInputBindings: updateWorkflowBinding(current.workflowInputBindings, index, {
											...binding,
											sourceInput: event.target.value,
										}),
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Target Type</Label>
							<Select
								value={binding.targetKind}
								onValueChange={(value: GuidedWorkflowInputBinding["targetKind"]) =>
									page.setGuidedDraft((current) => ({
										...current,
										workflowInputBindings: updateWorkflowBinding(current.workflowInputBindings, index, {
											...binding,
											targetKind: value,
										}),
									}))
								}
							>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="terraformVar">terraform var</SelectItem>
									<SelectItem value="terraformEnv">terraform env</SelectItem>
									<SelectItem value="netlabField">netlab field</SelectItem>
									<SelectItem value="netlabEnv">netlab env</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Target Name</Label>
							<Input
								placeholder={binding.targetKind.includes("Field") ? "server or topologyPath" : "variable/env name"}
								value={binding.targetKey}
								onChange={(event) =>
									page.setGuidedDraft((current) => ({
										...current,
										workflowInputBindings: updateWorkflowBinding(current.workflowInputBindings, index, {
											...binding,
											targetKey: event.target.value,
										}),
									}))
								}
							/>
						</div>
						<div className="flex items-center gap-2 pb-2">
							<Switch
								checked={binding.sensitive}
								onCheckedChange={(checked) =>
									page.setGuidedDraft((current) => ({
										...current,
										workflowInputBindings: updateWorkflowBinding(current.workflowInputBindings, index, {
											...binding,
											sensitive: checked,
										}),
									}))
								}
							/>
							<Label className="text-xs">Sensitive</Label>
						</div>
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								page.setGuidedDraft((current) => ({
									...current,
									workflowInputBindings: current.workflowInputBindings.filter((_, i) => i !== index),
								}))
							}
						>
							Remove
						</Button>
					</div>
				))
			)}
		</div>
	);
}

function GuidedTerraformOutputBindingsSection({ page }: { page: CompositePlansPageState }) {
	const bindings = page.guidedDraft.terraformOutputBindings;
	return (
		<div className="space-y-3 rounded-md border p-4">
			<div className="flex items-center justify-between">
				<div>
					<Label>Terraform Output Hand-offs</Label>
					<p className="text-xs text-muted-foreground">Map Terraform outputs into Netlab fields or Netlab environment variables.</p>
				</div>
				<Button
					size="sm"
					variant="secondary"
					onClick={() =>
						page.setGuidedDraft((current) => ({
							...current,
							terraformOutputBindings: [
								...current.terraformOutputBindings,
								{ terraformOutput: "", targetKind: "netlabEnv", targetKey: "", sensitive: false },
							],
						}))
					}
				>
					Add hand-off
				</Button>
			</div>
			{bindings.length === 0 ? (
				<div className="text-sm text-muted-foreground">No Terraform output hand-offs yet.</div>
			) : (
				bindings.map((binding, index) => (
					<div key={`${index}-${binding.terraformOutput}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_180px_1fr_auto_auto] md:items-end">
						<div className="space-y-2">
							<Label className="text-xs">Terraform Output</Label>
							<Input
								placeholder="vpn_peer_ip"
								value={binding.terraformOutput}
								onChange={(event) =>
									page.setGuidedDraft((current) => ({
										...current,
										terraformOutputBindings: updateTerraformOutputBinding(current.terraformOutputBindings, index, {
											...binding,
											terraformOutput: event.target.value,
										}),
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Target Type</Label>
							<Select
								value={binding.targetKind}
								onValueChange={(value: GuidedTerraformOutputBinding["targetKind"]) =>
									page.setGuidedDraft((current) => ({
										...current,
										terraformOutputBindings: updateTerraformOutputBinding(current.terraformOutputBindings, index, {
											...binding,
											targetKind: value,
										}),
									}))
								}
							>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="netlabField">netlab field</SelectItem>
									<SelectItem value="netlabEnv">netlab env</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Target Name</Label>
							<Input
								placeholder={binding.targetKind === "netlabField" ? "server or topologyPath" : "env var"}
								value={binding.targetKey}
								onChange={(event) =>
									page.setGuidedDraft((current) => ({
										...current,
										terraformOutputBindings: updateTerraformOutputBinding(current.terraformOutputBindings, index, {
											...binding,
											targetKey: event.target.value,
										}),
									}))
								}
							/>
						</div>
						<div className="flex items-center gap-2 pb-2">
							<Switch
								checked={binding.sensitive}
								onCheckedChange={(checked) =>
									page.setGuidedDraft((current) => ({
										...current,
										terraformOutputBindings: updateTerraformOutputBinding(current.terraformOutputBindings, index, {
											...binding,
											sensitive: checked,
										}),
									}))
								}
							/>
							<Label className="text-xs">Sensitive</Label>
						</div>
						<Button
							size="sm"
							variant="ghost"
							onClick={() =>
								page.setGuidedDraft((current) => ({
									...current,
									terraformOutputBindings: current.terraformOutputBindings.filter((_, i) => i !== index),
								}))
							}
						>
							Remove
						</Button>
					</div>
				))
			)}
		</div>
	);
}

function AdvancedCompositeEditor({ page }: { page: CompositePlansPageState }) {
	return (
		<div className="space-y-6">
			<KeyValueEditor
				label="Plan Inputs"
				description="Named inputs available at plan start for generic composite runs."
				entries={page.draft.inputs}
				onChange={(entries) => page.setDraft((current) => ({ ...current, inputs: entries }))}
				addLabel="Add plan input"
				keyPlaceholder="input name"
				valuePlaceholder="default value"
			/>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Stages</Label>
					<Button size="sm" variant="secondary" onClick={page.addStage}>Add Stage</Button>
				</div>
				{page.draft.stages.map((stage, index) => (
					<div key={`${index}-${stage.id}`} className="rounded-md border p-3 space-y-3">
						<div className="grid gap-2 md:grid-cols-3">
							<Input
								placeholder="id"
								value={stage.id}
								onChange={(event) => updateStage(page, index, { ...stage, id: event.target.value })}
							/>
							<Select
								value={stage.provider || "terraform"}
								onValueChange={(value) => updateStage(page, index, { ...stage, provider: value })}
							>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="terraform">terraform</SelectItem>
									<SelectItem value="netlab">netlab</SelectItem>
									<SelectItem value="kne">kne</SelectItem>
									<SelectItem value="baremetal">baremetal</SelectItem>
								</SelectContent>
							</Select>
							<Input
								placeholder="action"
								value={stage.action}
								onChange={(event) => updateStage(page, index, { ...stage, action: event.target.value })}
							/>
						</div>
						<div className="grid gap-2 md:grid-cols-2">
							<Input
								placeholder="dependsOn (csv)"
								value={csvFrom(stage.dependsOn)}
								onChange={(event) => updateStage(page, index, { ...stage, dependsOn: csvTo(event.target.value) })}
							/>
							<Input
								placeholder="outputs (csv)"
								value={csvFrom(stage.outputs)}
								onChange={(event) => updateStage(page, index, { ...stage, outputs: csvTo(event.target.value) })}
							/>
						</div>
						<div className="space-y-2">
							<Label className="text-xs">Inputs (`key=value` per line)</Label>
							<Textarea
								rows={4}
								value={mapToLines(stage.inputs)}
								onChange={(event) => updateStage(page, index, { ...stage, inputs: linesToMap(event.target.value) })}
							/>
						</div>
						<div className="flex justify-end">
							<Button size="sm" variant="ghost" onClick={() => page.removeStage(index)}>Remove Stage</Button>
						</div>
					</div>
				))}
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Bindings</Label>
					<Button size="sm" variant="secondary" onClick={page.addBinding}>Add Binding</Button>
				</div>
				{page.draft.bindings.map((binding, index) => (
					<div key={`${index}-${binding.fromStageId}`} className="rounded-md border p-3 space-y-3">
						<div className="grid gap-2 md:grid-cols-2">
							<Input placeholder="fromStageId" value={binding.fromStageId} onChange={(event) => updateBinding(page, index, { ...binding, fromStageId: event.target.value })} />
							<Input placeholder="fromOutput" value={binding.fromOutput} onChange={(event) => updateBinding(page, index, { ...binding, fromOutput: event.target.value })} />
						</div>
						<div className="grid gap-2 md:grid-cols-3">
							<Input placeholder="toStageId" value={binding.toStageId} onChange={(event) => updateBinding(page, index, { ...binding, toStageId: event.target.value })} />
							<Input placeholder="toInput" value={binding.toInput} onChange={(event) => updateBinding(page, index, { ...binding, toInput: event.target.value })} />
							<Input placeholder="as (optional)" value={binding.as ?? ""} onChange={(event) => updateBinding(page, index, { ...binding, as: event.target.value })} />
						</div>
						<div className="flex items-center gap-2">
							<Switch checked={Boolean(binding.sensitive)} onCheckedChange={(checked) => updateBinding(page, index, { ...binding, sensitive: checked })} />
							<Label>Sensitive</Label>
						</div>
						<div className="flex justify-end">
							<Button size="sm" variant="ghost" onClick={() => page.removeBinding(index)}>Remove Binding</Button>
						</div>
					</div>
				))}
			</div>

			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<Label>Promoted Outputs</Label>
					<Button size="sm" variant="secondary" onClick={page.addOutput}>Add Output</Button>
				</div>
				{page.draft.outputs.map((output, index) => (
					<div key={`${index}-${output.stageId}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-3">
						<Input placeholder="stageId" value={output.stageId} onChange={(event) => updateOutput(page, index, { ...output, stageId: event.target.value })} />
						<Input placeholder="output" value={output.output} onChange={(event) => updateOutput(page, index, { ...output, output: event.target.value })} />
						<Button size="sm" variant="ghost" onClick={() => page.removeOutput(index)}>Remove</Button>
					</div>
				))}
			</div>
		</div>
	);
}

function KeyValueEditor({
	label,
	description,
	entries,
	onChange,
	addLabel,
	keyPlaceholder,
	valuePlaceholder,
}: {
	label: string;
	description?: string;
	entries: KeyValueEntry[];
	onChange: (entries: KeyValueEntry[]) => void;
	addLabel: string;
	keyPlaceholder: string;
	valuePlaceholder: string;
}) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div>
					<Label>{label}</Label>
					{description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
				</div>
				<Button
					size="sm"
					variant="secondary"
					onClick={() => onChange([...entries, { key: "", value: "" }])}
				>
					{addLabel}
				</Button>
			</div>
			{entries.length === 0 ? (
				<div className="text-sm text-muted-foreground">No entries yet.</div>
			) : (
				entries.map((entry, index) => (
					<div key={`${label}-${index}-${entry.key}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]">
						<Input
							placeholder={keyPlaceholder}
							value={entry.key}
							onChange={(event) =>
								onChange(updateKeyValueEntry(entries, index, { ...entry, key: event.target.value }))
							}
						/>
						<Input
							placeholder={valuePlaceholder}
							value={entry.value}
							onChange={(event) =>
								onChange(updateKeyValueEntry(entries, index, { ...entry, value: event.target.value }))
							}
						/>
						<Button size="sm" variant="ghost" onClick={() => onChange(removeKeyValueEntry(entries, index))}>Remove</Button>
					</div>
				))
			)}
		</div>
	);
}

function runStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
	const normalized = String(status ?? "").toLowerCase();
	if (["success", "succeeded", "complete", "completed"].includes(normalized)) return "default";
	if (["failed", "error", "cancelled", "canceled"].includes(normalized)) return "destructive";
	if (["running"].includes(normalized)) return "outline";
	return "secondary";
}

function stageEventBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
	const normalized = String(status ?? "").toLowerCase();
	if (normalized === "success") return "default";
	if (normalized === "failed") return "destructive";
	if (normalized === "running") return "outline";
	return "secondary";
}
