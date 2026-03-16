import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type {
	CompositePlanBinding,
	CompositePlanOutputRef,
	CompositePlanRecord,
	CompositePlanStage,
	SkyforgeUserScope,
} from "../lib/api-client";
import {
	createUserScopeCompositePlan,
	deleteUserScopeCompositePlan,
	getSession,
	listUserScopeRuns,
	listUserScopeCompositePlans,
	listUserScopes,
	previewUserScopeCompositePlan,
	runUserScopeCompositePlan,
	updateUserScopeCompositePlan,
} from "../lib/api-client";
import type { TaskLifecycleEntry } from "../lib/run-lifecycle-events";
import { useRunLifecycleEvents } from "../lib/run-lifecycle-events";
import { queryKeys } from "../lib/query-keys";
import { selectVisibleUserScopes } from "./deployments-page-utils";

const LAST_SCOPE_KEY = "skyforge.lastUserScopeId.composite";

type DraftPlan = {
	id?: string;
	name: string;
	inputsJson: string;
	stages: CompositePlanStage[];
	bindings: CompositePlanBinding[];
	outputs: CompositePlanOutputRef[];
};

type CompositeRun = {
	id: string;
	status: string;
	type: string;
	message: string;
	created: string;
	start: string;
	end: string;
	raw: Record<string, unknown>;
};

type CompositeStageEvidence = {
	stageId: string;
	status: "running" | "success" | "failed";
	provider: string;
	action: string;
	error: string;
	outputsCount: number;
	time: string;
	type: string;
};

function emptyStage(): CompositePlanStage {
	return {
		id: "",
		provider: "terraform",
		action: "apply",
		dependsOn: [],
		inputs: {},
		outputs: [],
	};
}

function emptyBinding(): CompositePlanBinding {
	return {
		fromStageId: "",
		fromOutput: "",
		toStageId: "",
		toInput: "",
		as: "",
		sensitive: false,
	};
}

function emptyOutputRef(): CompositePlanOutputRef {
	return {
		stageId: "",
		output: "",
	};
}

function emptyDraft(): DraftPlan {
	return {
		name: "",
		inputsJson: "{}",
		stages: [emptyStage()],
		bindings: [],
		outputs: [],
	};
}

export function useCompositePlansPage(userId?: string) {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const [selectedPlanId, setSelectedPlanId] = useState("");
	const [draft, setDraft] = useState<DraftPlan>(emptyDraft());
	const [previewWarnings, setPreviewWarnings] = useState<string[]>([]);
	const [previewErrors, setPreviewErrors] = useState<string[]>([]);
	const [runInputsJson, setRunInputsJson] = useState("{}");
	const [selectedRunId, setSelectedRunId] = useState("");

	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		retry: false,
		staleTime: 30_000,
	});
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		retry: false,
		staleTime: 30_000,
	});

	const allUserScopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();
	const userScopes = useMemo(
		() => selectVisibleUserScopes(allUserScopes, effectiveUsername),
		[allUserScopes, effectiveUsername],
	);

	const selectedUserScopeId = useMemo(() => {
		if (userId && userScopes.some((scope) => scope.id === userId)) return userId;
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(LAST_SCOPE_KEY) ?? "").trim()
				: "";
		if (stored && userScopes.some((scope) => scope.id === stored)) return stored;
		return userScopes[0]?.id ?? "";
	}, [userId, userScopes]);

	useEffect(() => {
		if (!selectedUserScopeId) return;
		if (typeof window !== "undefined") {
			window.localStorage.setItem(LAST_SCOPE_KEY, selectedUserScopeId);
		}
		if (userId !== selectedUserScopeId) {
			void navigate({
				search: { userId: selectedUserScopeId } as never,
				replace: true,
			});
		}
	}, [navigate, selectedUserScopeId, userId]);

	const plansQ = useQuery({
		queryKey: queryKeys.compositePlans(selectedUserScopeId),
		queryFn: () => listUserScopeCompositePlans(selectedUserScopeId),
		enabled: Boolean(selectedUserScopeId),
		retry: false,
	});
	const plans = plansQ.data?.plans ?? [];
	const runsQ = useQuery({
		queryKey: queryKeys.compositeRuns(selectedUserScopeId),
		queryFn: async () => {
			const owner = String(sessionQ.data?.username ?? "").trim();
			return listUserScopeRuns(selectedUserScopeId, {
				limit: 50,
				owner: owner || undefined,
			});
		},
		enabled: Boolean(selectedUserScopeId),
		retry: false,
	});
	const compositeRuns = useMemo(() => {
		const tasks = runsQ.data?.tasks ?? [];
		return tasks
			.map((raw) => toCompositeRun(raw))
			.filter((run): run is CompositeRun => Boolean(run))
			.filter((run) => isCompositeRun(run));
	}, [runsQ.data?.tasks]);

	useEffect(() => {
		if (selectedRunId && compositeRuns.some((run) => run.id === selectedRunId)) return;
		setSelectedRunId(compositeRuns[0]?.id ?? "");
	}, [compositeRuns, selectedRunId]);

	useRunLifecycleEvents(selectedRunId, Boolean(selectedRunId));
	const runLifecycleQ = useQuery({
		queryKey: queryKeys.runLifecycle(selectedRunId),
		queryFn: async () => ({ cursor: 0, entries: [] as TaskLifecycleEntry[] }),
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
		enabled: Boolean(selectedRunId),
	});
	const stageEvidence = useMemo(
		() => mapCompositeStageEvidence(runLifecycleQ.data?.entries ?? []),
		[runLifecycleQ.data?.entries],
	);

	useEffect(() => {
		if (selectedPlanId && plans.some((plan) => plan.id === selectedPlanId)) return;
		setSelectedPlanId(plans[0]?.id ?? "");
	}, [plans, selectedPlanId]);

	useEffect(() => {
		if (!selectedPlanId) return;
		const selected = plans.find((plan) => plan.id === selectedPlanId);
		if (!selected) return;
		setDraft(toDraft(selected));
		setPreviewWarnings([]);
		setPreviewErrors([]);
	}, [plans, selectedPlanId]);

	const selectedScope = useMemo(
		() => userScopes.find((scope) => scope.id === selectedUserScopeId) ?? null,
		[selectedUserScopeId, userScopes],
	);

	const previewMutation = useMutation({
		mutationFn: async () => {
			const request = draftToRequest(draft);
			return previewUserScopeCompositePlan(selectedUserScopeId, request);
		},
		onSuccess: (preview) => {
			setPreviewWarnings(preview.warnings ?? []);
			setPreviewErrors([]);
			toast.success("Composite plan preview is valid");
		},
		onError: (error) => {
			setPreviewWarnings([]);
			setPreviewErrors([(error as Error).message]);
		},
	});

	const createMutation = useMutation({
		mutationFn: async () => {
			const request = draftToRequest(draft);
			return createUserScopeCompositePlan(selectedUserScopeId, request);
		},
		onSuccess: async (plan) => {
			setSelectedPlanId(plan.id);
			await qc.invalidateQueries({
				queryKey: queryKeys.compositePlans(selectedUserScopeId),
			});
			toast.success("Composite plan created");
		},
		onError: (error) => {
			toast.error("Failed to create composite plan", {
				description: (error as Error).message,
			});
		},
	});

	const updateMutation = useMutation({
		mutationFn: async () => {
			const request = draftToRequest(draft);
			if (!draft.id) throw new Error("select a saved plan before updating");
			return updateUserScopeCompositePlan(selectedUserScopeId, draft.id, request);
		},
		onSuccess: async () => {
			await qc.invalidateQueries({
				queryKey: queryKeys.compositePlans(selectedUserScopeId),
			});
			toast.success("Composite plan updated");
		},
		onError: (error) => {
			toast.error("Failed to update composite plan", {
				description: (error as Error).message,
			});
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!draft.id) throw new Error("select a saved plan before deleting");
			return deleteUserScopeCompositePlan(selectedUserScopeId, draft.id);
		},
		onSuccess: async () => {
			setSelectedPlanId("");
			setDraft(emptyDraft());
			await qc.invalidateQueries({
				queryKey: queryKeys.compositePlans(selectedUserScopeId),
			});
			toast.success("Composite plan deleted");
		},
		onError: (error) => {
			toast.error("Failed to delete composite plan", {
				description: (error as Error).message,
			});
		},
	});

	const runMutation = useMutation({
		mutationFn: async () => {
			const planId = draft.id?.trim();
			if (!planId) throw new Error("save the plan before running");
			const runInputs = parseJsonMap(runInputsJson);
			return runUserScopeCompositePlan(selectedUserScopeId, planId, {
				inputs: runInputs,
			});
		},
		onSuccess: (response) => {
			const taskId = String(response.task?.id ?? response.task?.taskId ?? "").trim();
			void qc.invalidateQueries({
				queryKey: queryKeys.compositeRuns(selectedUserScopeId),
			});
			if (taskId) setSelectedRunId(taskId);
			toast.success(
				taskId
					? `Composite run queued (task ${taskId})`
					: "Composite run queued",
			);
		},
		onError: (error) => {
			toast.error("Failed to run composite plan", {
				description: (error as Error).message,
			});
		},
	});

	return {
		navigate,
		sessionQ,
		userScopesQ,
		userScopes,
		selectedScope,
		selectedUserScopeId,
		plansQ,
		plans,
		runsQ,
		compositeRuns,
		selectedRunId,
		setSelectedRunId,
		runLifecycleQ,
		stageEvidence,
		selectedPlanId,
		setSelectedPlanId,
		draft,
		setDraft,
		runInputsJson,
		setRunInputsJson,
		previewWarnings,
		previewErrors,
		previewMutation,
		createMutation,
		updateMutation,
		deleteMutation,
		runMutation,
		newPlan: () => {
			setSelectedPlanId("");
			setDraft(emptyDraft());
			setPreviewWarnings([]);
			setPreviewErrors([]);
		},
		addStage: () =>
			setDraft((current) => ({
				...current,
				stages: [...current.stages, emptyStage()],
			})),
		removeStage: (index: number) =>
			setDraft((current) => ({
				...current,
				stages: current.stages.filter((_, i) => i !== index),
			})),
		addBinding: () =>
			setDraft((current) => ({
				...current,
				bindings: [...current.bindings, emptyBinding()],
			})),
		removeBinding: (index: number) =>
			setDraft((current) => ({
				...current,
				bindings: current.bindings.filter((_, i) => i !== index),
			})),
		addOutput: () =>
			setDraft((current) => ({
				...current,
				outputs: [...current.outputs, emptyOutputRef()],
			})),
		removeOutput: (index: number) =>
			setDraft((current) => ({
				...current,
				outputs: current.outputs.filter((_, i) => i !== index),
			})),
		saveAsNew: () => createMutation.mutate(),
		save: () => updateMutation.mutate(),
		deletePlan: () => deleteMutation.mutate(),
		preview: () => previewMutation.mutate(),
		run: () => runMutation.mutate(),
	};
}

function toDraft(plan: CompositePlanRecord): DraftPlan {
	return {
		id: String(plan.id ?? "").trim(),
		name: String(plan.name ?? "").trim(),
		inputsJson: JSON.stringify(plan.inputs ?? {}, null, 2),
		stages: cloneStages(plan.stages ?? []),
		bindings: cloneBindings(plan.bindings ?? []),
		outputs: cloneOutputs(plan.outputs ?? []),
	};
}

function draftToRequest(draft: DraftPlan) {
	const name = draft.name.trim();
	if (!name) throw new Error("plan name is required");
	return {
		name,
		inputs: parseJsonMap(draft.inputsJson),
		stages: draft.stages.map(normalizeStage),
		bindings: draft.bindings.map(normalizeBinding),
		outputs: draft.outputs
			.map((output) => ({
				stageId: String(output.stageId ?? "").trim(),
				output: String(output.output ?? "").trim(),
			}))
			.filter((output) => output.stageId && output.output),
	};
}

function parseJsonMap(raw: string): Record<string, string> {
	const text = String(raw ?? "").trim();
	if (!text) return {};
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error("invalid JSON object");
	}
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		throw new Error("inputs must be a JSON object");
	}
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
		const nextKey = String(key ?? "").trim();
		if (!nextKey) continue;
		out[nextKey] = String(value ?? "").trim();
	}
	return out;
}

function normalizeStage(stage: CompositePlanStage): CompositePlanStage {
	return {
		id: String(stage.id ?? "").trim(),
		provider: String(stage.provider ?? "")
			.trim()
			.toLowerCase(),
		action: String(stage.action ?? "")
			.trim()
			.toLowerCase(),
		dependsOn: splitCsv(stage.dependsOn ?? []),
		inputs: normalizeRecord(stage.inputs ?? {}),
		outputs: splitCsv(stage.outputs ?? []),
	};
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

function normalizeRecord(incoming: Record<string, string>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [key, value] of Object.entries(incoming)) {
		const nextKey = String(key ?? "").trim();
		if (!nextKey) continue;
		out[nextKey] = String(value ?? "").trim();
	}
	return out;
}

function splitCsv(values: string[] | string): string[] {
	if (Array.isArray(values)) {
		return values
			.map((value) => String(value ?? "").trim())
			.filter(Boolean);
	}
	return String(values ?? "")
		.split(",")
		.map((value) => value.trim())
		.filter(Boolean);
}

function cloneStages(stages: CompositePlanStage[]): CompositePlanStage[] {
	return stages.map((stage) => ({
		id: String(stage.id ?? ""),
		provider: String(stage.provider ?? ""),
		action: String(stage.action ?? ""),
		dependsOn: [...(stage.dependsOn ?? [])],
		inputs: { ...(stage.inputs ?? {}) },
		outputs: [...(stage.outputs ?? [])],
	}));
}

function cloneBindings(bindings: CompositePlanBinding[]): CompositePlanBinding[] {
	return bindings.map((binding) => ({
		fromStageId: String(binding.fromStageId ?? ""),
		fromOutput: String(binding.fromOutput ?? ""),
		toStageId: String(binding.toStageId ?? ""),
		toInput: String(binding.toInput ?? ""),
		as: String(binding.as ?? ""),
		sensitive: Boolean(binding.sensitive),
	}));
}

function cloneOutputs(outputs: CompositePlanOutputRef[]): CompositePlanOutputRef[] {
	return outputs.map((output) => ({
		stageId: String(output.stageId ?? ""),
		output: String(output.output ?? ""),
	}));
}

export type CompositePlansPageState = ReturnType<typeof useCompositePlansPage>;

function toCompositeRun(raw: Record<string, unknown>): CompositeRun | null {
	const id = String(raw.id ?? "").trim();
	if (!id) return null;
	return {
		id,
		status: String(raw.status ?? "").trim(),
		type: String(raw.type ?? raw.tpl_alias ?? "").trim(),
		message: String(raw.message ?? "").trim(),
		created: String(raw.created ?? "").trim(),
		start: String(raw.start ?? "").trim(),
		end: String(raw.end ?? "").trim(),
		raw,
	};
}

function isCompositeRun(run: CompositeRun): boolean {
	const candidates = [
		run.type,
		run.message,
		String(run.raw.kind ?? ""),
		String(run.raw.taskType ?? ""),
		String(run.raw.tpl_alias ?? ""),
	]
		.map((value) => value.toLowerCase())
		.join(" ");
	return candidates.includes("composite");
}

function mapCompositeStageEvidence(
	entries: TaskLifecycleEntry[],
): CompositeStageEvidence[] {
	const out: CompositeStageEvidence[] = [];
	for (const entry of entries) {
		const typ = String(entry.type ?? "").trim().toLowerCase();
		if (!typ.startsWith("composite.stage.")) continue;
		const payload = entry.payload ?? {};
		const status = stageStatusFromType(typ);
		const outputs = payload.outputs;
		const outputsCount =
			outputs && typeof outputs === "object" && !Array.isArray(outputs)
				? Object.keys(outputs as Record<string, unknown>).length
				: 0;
		out.push({
			stageId: String(payload.stageId ?? "").trim(),
			status,
			provider: String(payload.provider ?? "").trim(),
			action: String(payload.action ?? "").trim(),
			error: String(payload.error ?? "").trim(),
			outputsCount,
			time: String(entry.time ?? "").trim(),
			type: typ,
		});
	}
	return out.slice().reverse();
}

function stageStatusFromType(
	typ: string,
): "running" | "success" | "failed" {
	if (typ.endsWith(".failed")) return "failed";
	if (typ.endsWith(".success")) return "success";
	return "running";
}
