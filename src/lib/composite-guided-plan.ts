import type {
	CompositePlanBinding,
	CompositePlanOutputRef,
	CompositePlanRecord,
	CompositePlanStage,
	CompositePlanUpsertRequest,
} from "./api-client-composite-plans";

export type CompositeEditorMode = "guided" | "advanced";

export type KeyValueEntry = {
	key: string;
	value: string;
};

export type GuidedWorkflowInputBinding = {
	sourceInput: string;
	targetKind: "terraformVar" | "terraformEnv" | "netlabField" | "netlabEnv";
	targetKey: string;
	sensitive: boolean;
};

export type GuidedTerraformOutputBinding = {
	terraformOutput: string;
	targetKind: "netlabField" | "netlabEnv";
	targetKey: string;
	sensitive: boolean;
};

export type GuidedCompositeDraft = {
	id?: string;
	name: string;
	workflowInputs: KeyValueEntry[];
	terraformStageId: string;
	terraformAction: string;
	terraformTarget: string;
	terraformTemplateSource: string;
	terraformTemplateRepo: string;
	terraformTemplatesDir: string;
	terraformTemplate: string;
	terraformVars: KeyValueEntry[];
	terraformEnv: KeyValueEntry[];
	terraformOutputs: string[];
	netlabStageId: string;
	netlabAction: string;
	netlabServer: string;
	netlabDeployment: string;
	netlabTopologyPath: string;
	netlabCleanup: boolean;
	netlabUserScopeRoot: string;
	netlabUserScopeDir: string;
	netlabEnv: KeyValueEntry[];
	workflowInputBindings: GuidedWorkflowInputBinding[];
	terraformOutputBindings: GuidedTerraformOutputBinding[];
	promotedOutputs: string[];
};

export type GuidedCompatibility = {
	guided: GuidedCompositeDraft | null;
	reason: string;
};

const INPUTS_STAGE_IDS = new Set(["input", "inputs"]);
const NETLAB_FIELD_KEYS = new Set([
	"server",
	"deployment",
	"topologyPath",
	"cleanup",
	"userScopeRoot",
	"userScopeDir",
]);

export function emptyGuidedCompositeDraft(): GuidedCompositeDraft {
	return {
		name: "",
		workflowInputs: [],
		terraformStageId: "tf-apply",
		terraformAction: "apply",
		terraformTarget: "aws",
		terraformTemplateSource: "user",
		terraformTemplateRepo: "",
		terraformTemplatesDir: "",
		terraformTemplate: "",
		terraformVars: [],
		terraformEnv: [],
		terraformOutputs: [],
		netlabStageId: "netlab-up",
		netlabAction: "up",
		netlabServer: "",
		netlabDeployment: "",
		netlabTopologyPath: "",
		netlabCleanup: false,
		netlabUserScopeRoot: "",
		netlabUserScopeDir: "",
		netlabEnv: [],
		workflowInputBindings: [],
		terraformOutputBindings: [],
		promotedOutputs: [],
	};
}

export function normalizeKeyValueEntries(entries: KeyValueEntry[]): KeyValueEntry[] {
	return entries
		.map((entry) => ({
			key: String(entry.key ?? "").trim(),
			value: String(entry.value ?? "").trim(),
		}))
		.filter((entry) => entry.key);
}

export function keyValueEntriesFromRecord(
	input: Record<string, string> | undefined,
): KeyValueEntry[] {
	if (!input) return [];
	return Object.entries(input)
		.map(([key, value]) => ({
			key: String(key ?? "").trim(),
			value: String(value ?? "").trim(),
		}))
		.filter((entry) => entry.key)
		.sort((a, b) => a.key.localeCompare(b.key));
}

export function keyValueRecordFromEntries(
	entries: KeyValueEntry[],
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const entry of normalizeKeyValueEntries(entries)) {
		out[entry.key] = entry.value;
	}
	return out;
}

export function compositePlanToGuidedDraft(
	plan: Pick<
		CompositePlanRecord,
		"id" | "name" | "inputs" | "stages" | "bindings" | "outputs"
	>,
): GuidedCompatibility {
	const stages = Array.isArray(plan.stages) ? plan.stages : [];
	if (stages.length !== 2) {
		return { guided: null, reason: "guided mode supports exactly two stages" };
	}

	const terraformStage = stages[0];
	const netlabStage = stages[1];
	if (terraformStage.provider !== "terraform" || netlabStage.provider !== "netlab") {
		return {
			guided: null,
			reason: "guided mode supports terraform followed by netlab",
		};
	}
	const netlabDeps = normalizeStringList(netlabStage.dependsOn);
	if (
		netlabDeps.length > 1 ||
		(netlabDeps.length === 1 && netlabDeps[0] !== terraformStage.id)
	) {
		return {
			guided: null,
			reason: "guided mode only supports a direct terraform to netlab dependency",
		};
	}

	const terraformParsed = parseTerraformStage(terraformStage);
	if (!terraformParsed.ok) return { guided: null, reason: terraformParsed.reason };
	const netlabParsed = parseNetlabStage(netlabStage);
	if (!netlabParsed.ok) return { guided: null, reason: netlabParsed.reason };

	const workflowInputBindings: GuidedWorkflowInputBinding[] = [];
	const terraformOutputBindings: GuidedTerraformOutputBinding[] = [];
	for (const rawBinding of plan.bindings ?? []) {
		const binding = normalizeBinding(rawBinding);
		if (
			!binding.fromStageId ||
			!binding.fromOutput ||
			!binding.toStageId ||
			!binding.toInput
		) {
			return { guided: null, reason: "guided mode requires complete bindings" };
		}
		if (INPUTS_STAGE_IDS.has(binding.fromStageId)) {
			const mapped = mapWorkflowInputBinding(
				binding,
				terraformStage.id,
				netlabStage.id,
			);
			if (!mapped) {
				return {
					guided: null,
					reason: "guided mode found an unsupported workflow input binding",
				};
			}
			workflowInputBindings.push(mapped);
			continue;
		}
		if (binding.fromStageId === terraformStage.id) {
			const mapped = mapTerraformOutputBinding(binding, netlabStage.id);
			if (!mapped) {
				return {
					guided: null,
					reason: "guided mode found an unsupported terraform output binding",
				};
			}
			terraformOutputBindings.push(mapped);
			continue;
		}
		return {
			guided: null,
			reason:
				"guided mode only supports workflow inputs and terraform outputs as binding sources",
		};
	}

	for (const output of plan.outputs ?? []) {
		const stageID = String(output.stageId ?? "").trim();
		if (stageID && stageID !== terraformStage.id) {
			return {
				guided: null,
				reason: "guided mode only promotes terraform outputs",
			};
		}
	}

	const draft = emptyGuidedCompositeDraft();
	draft.id = String(plan.id ?? "").trim() || undefined;
	draft.name = String(plan.name ?? "").trim();
	draft.workflowInputs = keyValueEntriesFromRecord(plan.inputs);
	draft.terraformStageId = terraformStage.id;
	draft.terraformAction = terraformStage.action;
	draft.terraformTarget = terraformParsed.target;
	draft.terraformTemplateSource = terraformParsed.templateSource;
	draft.terraformTemplateRepo = terraformParsed.templateRepo;
	draft.terraformTemplatesDir = terraformParsed.templatesDir;
	draft.terraformTemplate = terraformParsed.template;
	draft.terraformVars = terraformParsed.terraformVars;
	draft.terraformEnv = terraformParsed.terraformEnv;
	draft.terraformOutputs = normalizeStringList(terraformStage.outputs);
	draft.netlabStageId = netlabStage.id;
	draft.netlabAction = netlabStage.action;
	draft.netlabServer = netlabParsed.server;
	draft.netlabDeployment = netlabParsed.deployment;
	draft.netlabTopologyPath = netlabParsed.topologyPath;
	draft.netlabCleanup = netlabParsed.cleanup;
	draft.netlabUserScopeRoot = netlabParsed.userScopeRoot;
	draft.netlabUserScopeDir = netlabParsed.userScopeDir;
	draft.netlabEnv = netlabParsed.netlabEnv;
	draft.workflowInputBindings = workflowInputBindings;
	draft.terraformOutputBindings = terraformOutputBindings;
	draft.promotedOutputs = (plan.outputs ?? [])
		.map((output) => String(output.output ?? "").trim())
		.filter(Boolean);
	return { guided: draft, reason: "" };
}

export function guidedDraftToCompositeRequest(
	draft: GuidedCompositeDraft,
): CompositePlanUpsertRequest {
	const terraformStageID = String(draft.terraformStageId ?? "").trim() || "tf-apply";
	const netlabStageID = String(draft.netlabStageId ?? "").trim() || "netlab-up";

	const terraformInputs: Record<string, string> = {};
	if (draft.terraformTarget.trim()) {
		terraformInputs.target = draft.terraformTarget.trim();
	}
	if (draft.terraformTemplateSource.trim()) {
		terraformInputs.templateSource = draft.terraformTemplateSource.trim();
	}
	if (draft.terraformTemplateRepo.trim()) {
		terraformInputs.templateRepo = draft.terraformTemplateRepo.trim();
	}
	if (draft.terraformTemplatesDir.trim()) {
		terraformInputs.templatesDir = draft.terraformTemplatesDir.trim();
	}
	if (draft.terraformTemplate.trim()) {
		terraformInputs.template = draft.terraformTemplate.trim();
	}
	for (const entry of normalizeKeyValueEntries(draft.terraformVars)) {
		terraformInputs[`env.TF_VAR_${entry.key}`] = entry.value;
	}
	for (const entry of normalizeKeyValueEntries(draft.terraformEnv)) {
		terraformInputs[`env.${entry.key}`] = entry.value;
	}

	const netlabInputs: Record<string, string> = {};
	if (draft.netlabServer.trim()) {
		netlabInputs.server = draft.netlabServer.trim();
	}
	if (draft.netlabDeployment.trim()) {
		netlabInputs.deployment = draft.netlabDeployment.trim();
	}
	if (draft.netlabTopologyPath.trim()) {
		netlabInputs.topologyPath = draft.netlabTopologyPath.trim();
	}
	if (draft.netlabCleanup) {
		netlabInputs.cleanup = "true";
	}
	if (draft.netlabUserScopeRoot.trim()) {
		netlabInputs.userScopeRoot = draft.netlabUserScopeRoot.trim();
	}
	if (draft.netlabUserScopeDir.trim()) {
		netlabInputs.userScopeDir = draft.netlabUserScopeDir.trim();
	}
	for (const entry of normalizeKeyValueEntries(draft.netlabEnv)) {
		netlabInputs[`env.${entry.key}`] = entry.value;
	}

	const bindings: CompositePlanBinding[] = [];
	for (const binding of draft.workflowInputBindings) {
		const sourceInput = String(binding.sourceInput ?? "").trim();
		const targetKey = String(binding.targetKey ?? "").trim();
		if (!sourceInput || !targetKey) continue;
		bindings.push({
			fromStageId: "inputs",
			fromOutput: sourceInput,
			toStageId: binding.targetKind.startsWith("terraform")
				? terraformStageID
				: netlabStageID,
			toInput: workflowBindingTargetToCompositeInput(
				binding.targetKind,
				targetKey,
			),
			sensitive: Boolean(binding.sensitive),
		});
	}
	for (const binding of draft.terraformOutputBindings) {
		const sourceOutput = String(binding.terraformOutput ?? "").trim();
		const targetKey = String(binding.targetKey ?? "").trim();
		if (!sourceOutput || !targetKey) continue;
		bindings.push({
			fromStageId: terraformStageID,
			fromOutput: sourceOutput,
			toStageId: netlabStageID,
			toInput: terraformOutputTargetToCompositeInput(
				binding.targetKind,
				targetKey,
			),
			sensitive: Boolean(binding.sensitive),
		});
	}

	const outputs: CompositePlanOutputRef[] = normalizeStringList(
		draft.promotedOutputs,
	).map((output) => ({
		stageId: terraformStageID,
		output,
	}));

	return {
		name: String(draft.name ?? "").trim(),
		inputs: keyValueRecordFromEntries(draft.workflowInputs),
		stages: [
			{
				id: terraformStageID,
				provider: "terraform",
				action: String(draft.terraformAction ?? "apply").trim().toLowerCase(),
				inputs: terraformInputs,
				outputs: normalizeStringList(draft.terraformOutputs),
			},
			{
				id: netlabStageID,
				provider: "netlab",
				action: String(draft.netlabAction ?? "up").trim().toLowerCase(),
				dependsOn: [terraformStageID],
				inputs: netlabInputs,
			},
		],
		bindings,
		outputs,
	};
}

export function workflowSummaryLines(draft: GuidedCompositeDraft): string[] {
	const lines: string[] = [];
	for (const binding of draft.workflowInputBindings) {
		const sourceInput = String(binding.sourceInput ?? "").trim();
		const targetKey = String(binding.targetKey ?? "").trim();
		if (!sourceInput || !targetKey) continue;
		lines.push(`workflow.${sourceInput} -> ${humanTarget(binding.targetKind, targetKey)}`);
	}
	for (const binding of draft.terraformOutputBindings) {
		const sourceOutput = String(binding.terraformOutput ?? "").trim();
		const targetKey = String(binding.targetKey ?? "").trim();
		if (!sourceOutput || !targetKey) continue;
		lines.push(`terraform.${sourceOutput} -> ${humanTarget(binding.targetKind, targetKey)}`);
	}
	return lines;
}

function parseTerraformStage(stage: CompositePlanStage):
	| {
			ok: true;
			target: string;
			templateSource: string;
			templateRepo: string;
			templatesDir: string;
			template: string;
			terraformVars: KeyValueEntry[];
			terraformEnv: KeyValueEntry[];
	  }
	| { ok: false; reason: string } {
	const terraformVars: KeyValueEntry[] = [];
	const terraformEnv: KeyValueEntry[] = [];
	let target = "";
	let templateSource = "";
	let templateRepo = "";
	let templatesDir = "";
	let template = "";

	for (const [rawKey, rawValue] of Object.entries(stage.inputs ?? {})) {
		const key = String(rawKey ?? "").trim();
		const value = String(rawValue ?? "").trim();
		if (!key) continue;
		switch (key) {
			case "target":
			case "cloud":
				target = value;
				continue;
			case "templateSource":
				templateSource = value;
				continue;
			case "templateRepo":
				templateRepo = value;
				continue;
			case "templatesDir":
				templatesDir = value;
				continue;
			case "template":
				template = value;
				continue;
		}
		if (key.startsWith("env.TF_VAR_")) {
			terraformVars.push({ key: key.slice("env.TF_VAR_".length), value });
			continue;
		}
		if (key.startsWith("env.")) {
			terraformEnv.push({ key: key.slice("env.".length), value });
			continue;
		}
		return { ok: false, reason: `unsupported terraform input key: ${key}` };
	}

	return {
		ok: true,
		target,
		templateSource,
		templateRepo,
		templatesDir,
		template,
		terraformVars,
		terraformEnv,
	};
}

function parseNetlabStage(stage: CompositePlanStage):
	| {
			ok: true;
			server: string;
			deployment: string;
			topologyPath: string;
			cleanup: boolean;
			userScopeRoot: string;
			userScopeDir: string;
			netlabEnv: KeyValueEntry[];
	  }
	| { ok: false; reason: string } {
	const netlabEnv: KeyValueEntry[] = [];
	let server = "";
	let deployment = "";
	let topologyPath = "";
	let cleanup = false;
	let userScopeRoot = "";
	let userScopeDir = "";

	for (const [rawKey, rawValue] of Object.entries(stage.inputs ?? {})) {
		const key = String(rawKey ?? "").trim();
		const value = String(rawValue ?? "").trim();
		if (!key) continue;
		switch (key) {
			case "server":
				server = value;
				continue;
			case "deployment":
				deployment = value;
				continue;
			case "topologyPath":
				topologyPath = value;
				continue;
			case "cleanup":
				cleanup = ["1", "true", "yes", "on"].includes(value.toLowerCase());
				continue;
			case "userScopeRoot":
				userScopeRoot = value;
				continue;
			case "userScopeDir":
				userScopeDir = value;
				continue;
		}
		if (key.startsWith("env.")) {
			netlabEnv.push({ key: key.slice("env.".length), value });
			continue;
		}
		return { ok: false, reason: `unsupported netlab input key: ${key}` };
	}

	return {
		ok: true,
		server,
		deployment,
		topologyPath,
		cleanup,
		userScopeRoot,
		userScopeDir,
		netlabEnv,
	};
}

function mapWorkflowInputBinding(
	binding: CompositePlanBinding,
	terraformStageID: string,
	netlabStageID: string,
): GuidedWorkflowInputBinding | null {
	if (binding.toStageId === terraformStageID) {
		if (binding.toInput.startsWith("env.TF_VAR_")) {
			return {
				sourceInput: binding.fromOutput,
				targetKind: "terraformVar",
				targetKey: binding.toInput.slice("env.TF_VAR_".length),
				sensitive: Boolean(binding.sensitive),
			};
		}
		if (binding.toInput.startsWith("env.")) {
			return {
				sourceInput: binding.fromOutput,
				targetKind: "terraformEnv",
				targetKey: binding.toInput.slice("env.".length),
				sensitive: Boolean(binding.sensitive),
			};
		}
		return null;
	}
	if (binding.toStageId === netlabStageID) {
		if (binding.toInput.startsWith("env.")) {
			return {
				sourceInput: binding.fromOutput,
				targetKind: "netlabEnv",
				targetKey: binding.toInput.slice("env.".length),
				sensitive: Boolean(binding.sensitive),
			};
		}
		if (NETLAB_FIELD_KEYS.has(binding.toInput)) {
			return {
				sourceInput: binding.fromOutput,
				targetKind: "netlabField",
				targetKey: binding.toInput,
				sensitive: Boolean(binding.sensitive),
			};
		}
	}
	return null;
}

function mapTerraformOutputBinding(
	binding: CompositePlanBinding,
	netlabStageID: string,
): GuidedTerraformOutputBinding | null {
	if (binding.toStageId !== netlabStageID) return null;
	if (binding.toInput.startsWith("env.")) {
		return {
			terraformOutput: binding.fromOutput,
			targetKind: "netlabEnv",
			targetKey: binding.toInput.slice("env.".length),
			sensitive: Boolean(binding.sensitive),
		};
	}
	if (NETLAB_FIELD_KEYS.has(binding.toInput)) {
		return {
			terraformOutput: binding.fromOutput,
			targetKind: "netlabField",
			targetKey: binding.toInput,
			sensitive: Boolean(binding.sensitive),
		};
	}
	return null;
}

function workflowBindingTargetToCompositeInput(
	kind: GuidedWorkflowInputBinding["targetKind"],
	key: string,
): string {
	switch (kind) {
		case "terraformVar":
			return `env.TF_VAR_${key}`;
		case "terraformEnv":
		case "netlabEnv":
			return `env.${key}`;
		case "netlabField":
			return key;
	}
}

function terraformOutputTargetToCompositeInput(
	kind: GuidedTerraformOutputBinding["targetKind"],
	key: string,
): string {
	return kind === "netlabEnv" ? `env.${key}` : key;
}

function humanTarget(
	kind:
		| GuidedWorkflowInputBinding["targetKind"]
		| GuidedTerraformOutputBinding["targetKind"],
	key: string,
): string {
	switch (kind) {
		case "terraformVar":
			return `terraform.var.${key}`;
		case "terraformEnv":
			return `terraform.env.${key}`;
		case "netlabField":
			return `netlab.${key}`;
		case "netlabEnv":
			return `netlab.env.${key}`;
	}
}

function normalizeBinding(binding: CompositePlanBinding): CompositePlanBinding {
	return {
		fromStageId: String(binding.fromStageId ?? "").trim(),
		fromOutput: String(binding.fromOutput ?? "").trim(),
		toStageId: String(binding.toStageId ?? "").trim(),
		toInput: String(binding.toInput ?? "").trim(),
		as: String(binding.as ?? "").trim(),
		sensitive: Boolean(binding.sensitive),
	};
}

function normalizeStringList(values: string[] | undefined): string[] {
	return (values ?? [])
		.map((value) => String(value ?? "").trim())
		.filter(Boolean);
}
