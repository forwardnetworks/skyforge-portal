import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Loader2, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/query-keys";
import {
	type UserAIGenerateRequest,
	autofixUserAITemplate,
	disconnectUserGemini,
	generateUserAITemplate,
	getUserAIHistory,
	getUserGeminiConfig,
	saveUserAITemplate,
	validateUserAITemplate,
} from "@/lib/skyforge-api";
import { SKYFORGE_API } from "@/lib/skyforge-config";

export const Route = createFileRoute("/dashboard/ai")({
	component: AITemplatesPage,
});

function vertexEnableLink(err: string): string | null {
	const m = err.match(
		/(https:\/\/console\.cloud\.google\.com\/apis\/library\/aiplatform\.googleapis\.com\?project=[^)\s]+)/,
	);
	return m?.[1] ?? null;
}

type ActionName = "generate" | "save" | "validate" | "autofix" | "disconnect";
type ActionPhase = "idle" | "running" | "succeeded" | "failed";

type ActionState = {
	phase: ActionPhase;
	startedAt?: number;
	endedAt?: number;
	durationMs?: number;
	summary?: string;
	detail?: string;
	requestMeta?: Record<string, string>;
};

type ActivityEntry = {
	action: ActionName;
	phase: Exclude<ActionPhase, "idle">;
	startedAt: number;
	endedAt: number;
	durationMs: number;
	summary: string;
	detail?: string;
};

const ACTION_LABEL: Record<ActionName, string> = {
	generate: "Generate",
	save: "Save",
	validate: "Validate",
	autofix: "Auto-fix",
	disconnect: "Disconnect",
};

const INITIAL_ACTIONS: Record<ActionName, ActionState> = {
	generate: { phase: "idle" },
	save: { phase: "idle" },
	validate: { phase: "idle" },
	autofix: { phase: "idle" },
	disconnect: { phase: "idle" },
};

function fmtDuration(ms?: number): string {
	if (!ms || ms < 0) return "0s";
	const total = Math.floor(ms / 1000);
	const mins = Math.floor(total / 60);
	const secs = total % 60;
	if (mins === 0) return `${secs}s`;
	return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function firstLine(text: string): string {
	return text.split(/\r?\n/)[0] || text;
}

function normalizeFilenameInput(value: string): string {
	return value.trim().replace(/\s+/g, "-");
}

function AITemplatesPage() {
	const qc = useQueryClient();
	const [kind, setKind] = useState<"netlab" | "containerlab">("netlab");
	const [prompt, setPrompt] = useState("");
	const [seed, setSeed] = useState("");
	const [output, setOutput] = useState("");
	const [rawOutput, setRawOutput] = useState("");
	const generateAbort = useRef<AbortController | null>(null);
	const [saveName, setSaveName] = useState("");
	const [lastError, setLastError] = useState<string>("");
	const [lastValidateRunId, setLastValidateRunId] = useState<string>("");
	const [actionState, setActionState] =
		useState<Record<ActionName, ActionState>>(INITIAL_ACTIONS);
	const [activeAction, setActiveAction] = useState<ActionName | null>(null);
	const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
	const [showErrorDetails, setShowErrorDetails] = useState(false);
	const [timerNow, setTimerNow] = useState(Date.now());
	const [highlightHistoryId, setHighlightHistoryId] = useState("");

	const pushActivity = (entry: ActivityEntry) => {
		setActivityLog((prev) => [entry, ...prev].slice(0, 5));
	};

	const beginAction = (
		action: ActionName,
		summary: string,
		requestMeta?: Record<string, string>,
	) => {
		const startedAt = Date.now();
		setTimerNow(startedAt);
		setActiveAction(action);
		setShowErrorDetails(false);
		setActionState((prev) => ({
			...prev,
			[action]: {
				phase: "running",
				startedAt,
				summary,
				requestMeta,
			},
		}));
	};

	const finishAction = (
		action: ActionName,
		phase: "succeeded" | "failed",
		summary: string,
		detail?: string,
	) => {
		let entry: ActivityEntry | null = null;
		setActionState((prev) => {
			const prevAction = prev[action];
			const endedAt = Date.now();
			const startedAt = prevAction.startedAt ?? endedAt;
			const durationMs = Math.max(0, endedAt - startedAt);
			entry = {
				action,
				phase,
				startedAt,
				endedAt,
				durationMs,
				summary,
				detail,
			};
			return {
				...prev,
				[action]: {
					...prevAction,
					phase,
					endedAt,
					durationMs,
					summary,
					detail,
				},
			};
		});
		if (entry) pushActivity(entry);
		setActiveAction((current) => (current === action ? null : current));
	};

	useEffect(() => {
		if (!activeAction) return;
		const int = window.setInterval(() => setTimerNow(Date.now()), 1000);
		return () => window.clearInterval(int);
	}, [activeAction]);

	const geminiCfg = useQuery({
		queryKey: queryKeys.userGeminiConfig(),
		queryFn: getUserGeminiConfig,
		refetchInterval: 10_000,
	});

	const history = useQuery({
		queryKey: queryKeys.userAIHistory(),
		queryFn: getUserAIHistory,
		refetchInterval: 15_000,
	});

	const canGenerate =
		(geminiCfg.data?.enabled ?? false) &&
		(geminiCfg.data?.aiEnabled ?? false) &&
		(geminiCfg.data?.oauthConfigured ?? false) &&
		(geminiCfg.data?.vertexConfigured ?? false) &&
		(geminiCfg.data?.configured ?? false);

	const disconnect = useMutation({
		mutationFn: async () => disconnectUserGemini(),
		onMutate: () => {
			beginAction("disconnect", "Disconnecting Gemini integration…");
		},
		onSuccess: async () => {
			finishAction("disconnect", "succeeded", "Gemini disconnected");
			toast.success("Disconnected Gemini");
			await qc.invalidateQueries({ queryKey: queryKeys.userGeminiConfig() });
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			finishAction(
				"disconnect",
				"failed",
				`Disconnect failed: ${firstLine(msg)}`,
				msg,
			);
			toast.error("Failed to disconnect Gemini", { description: msg });
		},
	});

	const generate = useMutation({
		mutationFn: async () => {
			const payload: UserAIGenerateRequest = {
				provider: "gemini",
				kind,
				prompt,
				seedTemplate: seed || undefined,
				constraints: [
					"single-file",
					kind === "netlab" ? "provider=clab" : "",
					"no external files",
				].filter(Boolean),
			};
			const controller = new AbortController();
			generateAbort.current = controller;
			return generateUserAITemplate(payload, { signal: controller.signal });
		},
		onMutate: () => {
			beginAction("generate", `Generating ${kind} template with Gemini…`, {
				kind,
				provider: "gemini",
			});
			setOutput("");
			setRawOutput("");
			setLastError("");
		},
		onSuccess: (res) => {
			setOutput(res.content ?? "");
			setRawOutput("");
			setLastError("");
			setHighlightHistoryId(res.id);
			finishAction(
				"generate",
				"succeeded",
				`Template generated: ${res.filename}`,
				(res.warnings ?? []).join("\n") || undefined,
			);
			void qc.invalidateQueries({ queryKey: queryKeys.userAIHistory() });
			toast.success("Template generated", { description: res.filename });
			generateAbort.current = null;
		},
		onError: (e) => {
			generateAbort.current = null;
			const isAbort =
				(e instanceof DOMException && e.name === "AbortError") ||
				(e instanceof Error && e.name === "AbortError");
			const msg = e instanceof Error ? e.message : String(e);
			if (isAbort) {
				setLastError("");
				setRawOutput("");
				finishAction("generate", "failed", "Generation canceled");
				return;
			}
			setLastError(msg);
			setRawOutput("");
			if (e instanceof Error && "bodyText" in e) {
				const bodyText = (e as { bodyText?: string }).bodyText;
				if (typeof bodyText === "string" && bodyText.trim()) {
					try {
						const parsed = JSON.parse(bodyText) as {
							details?: { meta?: Record<string, unknown> };
						};
						const meta = parsed?.details?.meta ?? {};
						const raw = meta.rawOutput;
						if (typeof raw === "string" && raw.trim()) {
							setRawOutput(raw);
						}
					} catch {
						// ignore parse failures
					}
				}
			}
			finishAction(
				"generate",
				"failed",
				`Generation failed: ${firstLine(msg)}`,
				msg,
			);
			toast.error("Failed to generate template", {
				description: msg,
			});
		},
		onSettled: () => {
			generateAbort.current = null;
		},
	});

	const save = useMutation({
		mutationFn: async () => {
			if (!output.trim()) throw new Error("No output to save");
			return saveUserAITemplate({
				kind,
				content: output,
				pathHint: "ai/generated",
				filename: saveName.trim() ? saveName.trim() : undefined,
			});
		},
		onMutate: () => {
			beginAction("save", "Saving template to repository…", {
				kind,
				pathHint: "ai/generated",
			});
		},
		onSuccess: async (res) => {
			setLastError("");
			setRawOutput("");
			finishAction(
				"save",
				"succeeded",
				`Saved to repo: ${res.path}`,
				`${res.repo}:${res.path}@${res.branch}`,
			);
			toast.success("Saved to repo", {
				description: `${res.repo}:${res.path}@${res.branch}`,
			});
			// Ensure create-deployment dropdowns pick up the new file immediately.
			await qc.invalidateQueries({ queryKey: ["workspaceTemplates"] });
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
			finishAction("save", "failed", `Save failed: ${firstLine(msg)}`, msg);
			toast.error("Failed to save template", { description: msg });
		},
	});

	const validate = useMutation({
		mutationFn: async () => {
			if (!output.trim()) throw new Error("No output to validate");
			return validateUserAITemplate({
				kind,
				content: output,
			});
		},
		onMutate: () => {
			beginAction(
				"validate",
				kind === "netlab"
					? "Starting netlab validation run…"
					: "Validating containerlab template…",
				{ kind },
			);
		},
		onSuccess: (res) => {
			setLastError("");
			setRawOutput("");
			if (kind === "netlab") {
				const runId = res.task?.id != null ? String(res.task.id) : "";
				setLastValidateRunId(runId);
				finishAction(
					"validate",
					"succeeded",
					runId ? `Validation run started: ${runId}` : "Validation run started",
					undefined,
				);
				toast.success("Validation started", {
					description: runId ? `Run: ${runId}` : "Run created",
				});
				return;
			}

			const ok = res.task?.ok === true;
			const errs =
				Array.isArray(res.task?.errors) && res.task.errors.length > 0
					? (res.task.errors as unknown[])
							.map((e) => (typeof e === "string" ? e : JSON.stringify(e)))
							.join("\n")
					: "";

			if (ok) {
				finishAction("validate", "succeeded", "Containerlab template is valid");
				toast.success("Containerlab template is valid");
				setLastValidateRunId("");
				return;
			}

			setLastError(errs || "Containerlab template is invalid");
			setRawOutput("");
			finishAction(
				"validate",
				"failed",
				`Containerlab validation failed: ${firstLine(errs || "schema error")}`,
				errs || "Containerlab template is invalid",
			);
			toast.error("Containerlab template is invalid", {
				description: errs ? errs.split("\n")[0] : "Schema validation failed",
			});
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
			setRawOutput("");
			finishAction(
				"validate",
				"failed",
				`Validate failed: ${firstLine(msg)}`,
				msg,
			);
			toast.error("Failed to validate template", { description: msg });
		},
	});

	const autofix = useMutation({
		mutationFn: async () => {
			if (kind !== "containerlab") {
				throw new Error("Autofix is only supported for containerlab templates");
			}
			if (!output.trim()) throw new Error("No output to autofix");
			return autofixUserAITemplate({
				kind: "containerlab",
				content: output,
				maxIterations: 3,
			});
		},
		onMutate: () => {
			beginAction("autofix", "Autofix iteration loop started (max 3)…", {
				kind: "containerlab",
			});
		},
		onSuccess: (res) => {
			setOutput(res.content ?? "");
			if (res.ok) {
				setLastError("");
				setRawOutput("");
				finishAction(
					"autofix",
					"succeeded",
					`Autofix succeeded in ${res.iterations} iteration(s)`,
				);
				toast.success("Autofix succeeded", {
					description: `Iterations: ${res.iterations}`,
				});
				return;
			}
			const errs = (res.errors ?? []).slice(0, 10).join("\n");
			setLastError(errs || "Autofix failed");
			setRawOutput("");
			finishAction(
				"autofix",
				"failed",
				`Autofix failed: ${firstLine(errs || "did not converge")}`,
				errs || "Autofix failed",
			);
			toast.error("Autofix did not converge", {
				description: errs ? errs.split("\n")[0] : "Schema validation failed",
			});
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
			setRawOutput("");
			finishAction(
				"autofix",
				"failed",
				`Autofix failed: ${firstLine(msg)}`,
				msg,
			);
			toast.error("Failed to autofix template", { description: msg });
		},
	});

	const historyItems = useMemo(
		() => history.data?.items ?? [],
		[history.data?.items],
	);
	const isBusy =
		generate.isPending ||
		save.isPending ||
		validate.isPending ||
		autofix.isPending ||
		disconnect.isPending;
	const activeState = activeAction ? actionState[activeAction] : null;
	const activeElapsed = activeState?.startedAt
		? timerNow - activeState.startedAt
		: 0;
	const outputStatus = generate.isPending
		? "Generating template…"
		: output.trim()
			? "Generated template output"
			: "No output yet";
	const outputPlaceholder = generate.isPending
		? "Generating template..."
		: "No output yet. Enter a prompt and click Generate.";

	const generatedExt = kind === "containerlab" ? ".clab.yml" : ".yml";
	const saveNameHint = saveName.trim()
		? `${normalizeFilenameInput(saveName)}${saveName.trim().endsWith(generatedExt) ? "" : generatedExt}`
		: `generated-${kind}${generatedExt}`;
	const activityProgressValue =
		activeAction && activeState?.phase === "running"
			? Math.min(95, Math.max(5, Math.floor((activeElapsed / 90_000) * 100)))
			: 0;

	return (
		<div className="mx-auto w-full max-w-5xl space-y-4 p-4">
			<div>
				<h1 className="text-2xl font-bold">AI</h1>
				<p className="text-sm text-muted-foreground">
					Connect Gemini and generate Netlab or Containerlab templates.
				</p>
			</div>

			{activeAction && activeState?.phase === "running" ? (
				<Card>
					<CardContent className="flex flex-col gap-2 pt-6">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
								<div className="text-sm">
									<span className="font-medium">
										{ACTION_LABEL[activeAction]}
									</span>{" "}
									<span className="text-muted-foreground">
										{activeState.summary}
									</span>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="secondary">{fmtDuration(activeElapsed)}</Badge>
								{activeAction === "generate" ? (
									<Button
										size="sm"
										variant="outline"
										disabled={!generateAbort.current || !generate.isPending}
										onClick={() => {
											const ctl = generateAbort.current;
											if (ctl) {
												ctl.abort();
												generateAbort.current = null;
												toast.message("Generation canceled");
											}
										}}
									>
										<Square className="mr-2 h-4 w-4" />
										Cancel
									</Button>
								) : null}
							</div>
						</div>
						<Progress value={activityProgressValue} />
						{activeState.requestMeta ? (
							<div className="text-xs text-muted-foreground">
								{Object.entries(activeState.requestMeta)
									.map(([k, v]) => `${k}=${v}`)
									.join(" · ")}
							</div>
						) : null}
					</CardContent>
				</Card>
			) : null}

			<Card>
				<CardHeader>
					<CardTitle>Gemini Connection</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{geminiCfg.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : geminiCfg.isError ? (
						<div className="space-y-2">
							<div className="text-sm text-destructive">
								Failed to load Gemini configuration:{" "}
								{geminiCfg.error instanceof Error
									? geminiCfg.error.message
									: String(geminiCfg.error)}
							</div>
							<div className="flex items-center gap-2">
								<Button variant="secondary" onClick={() => geminiCfg.refetch()}>
									Retry
								</Button>
							</div>
						</div>
					) : !geminiCfg.data?.enabled ? (
						<div className="text-sm text-muted-foreground">
							Gemini integration is disabled on this Skyforge instance. Ask an
							admin to enable `skyforge.gemini.enabled` in the Helm values.
						</div>
					) : !geminiCfg.data?.aiEnabled ? (
						<div className="text-sm text-muted-foreground">
							AI template generation is disabled on this Skyforge instance. Ask
							an admin to enable `skyforge.ai.enabled` in the Helm values.
						</div>
					) : !geminiCfg.data?.oauthConfigured ? (
						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">
								Gemini OAuth is not configured (missing OAuth client ID/secret
								and/or redirect URL). Ask an admin to set
								`skyforge.gemini.clientID` and ensure the secret referenced by
								`skyforge.gemini.clientSecretSecretName` is populated.
							</div>
							<dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2">
								<dt className="text-muted-foreground">Model</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.model ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Fallback</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.fallbackModel ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Location</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.location ?? "—"}
								</dd>
							</dl>
						</div>
					) : !geminiCfg.data?.vertexConfigured ? (
						<div className="space-y-2">
							<div className="text-sm text-muted-foreground">
								Vertex AI is not configured (missing
								`skyforge.gemini.projectId`). You can connect Gemini, but
								generation will fail until the project is set.
							</div>
							<dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2">
								<dt className="text-muted-foreground">Model</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.model ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Fallback</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.fallbackModel ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Location</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.location ?? "—"}
								</dd>
							</dl>
							<div className="flex items-center gap-2 pt-1">
								<Button
									disabled={
										!geminiCfg.data?.enabled || !geminiCfg.data?.oauthConfigured
									}
									onClick={() => {
										window.location.assign(
											`${SKYFORGE_API}/user/integrations/gemini/connect`,
										);
									}}
								>
									{geminiCfg.data?.configured ? "Reconnect" : "Connect"}
								</Button>
								<Button
									variant="secondary"
									disabled={!geminiCfg.data?.configured || disconnect.isPending}
									onClick={() => disconnect.mutate()}
								>
									Disconnect
								</Button>
							</div>
						</div>
					) : (
						<>
							<dl className="grid grid-cols-[96px_1fr] gap-x-3 gap-y-2">
								<dt className="text-muted-foreground">Status</dt>
								<dd className="text-right">
									{geminiCfg.data?.configured ? "Connected" : "Not connected"}
								</dd>

								<dt className="text-muted-foreground">Email</dt>
								<dd className="text-right break-all">
									{geminiCfg.data?.email ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Scopes</dt>
								<dd className="text-right break-words">
									{geminiCfg.data?.scopes ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Model</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.model ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Fallback</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.fallbackModel ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Location</dt>
								<dd className="text-right break-all font-mono text-xs">
									{geminiCfg.data?.location ?? "—"}
								</dd>

								<dt className="text-muted-foreground">Updated</dt>
								<dd className="text-right">
									{geminiCfg.data?.updatedAt ?? "—"}
								</dd>
							</dl>

							<div className="flex items-center gap-2 pt-1">
								<Button
									disabled={
										!geminiCfg.data?.enabled || !geminiCfg.data?.oauthConfigured
									}
									onClick={() => {
										window.location.assign(
											`${SKYFORGE_API}/user/integrations/gemini/connect`,
										);
									}}
								>
									{geminiCfg.data?.configured ? "Reconnect" : "Connect"}
								</Button>
								<Button
									variant="secondary"
									disabled={!geminiCfg.data?.configured || disconnect.isPending}
									onClick={() => disconnect.mutate()}
								>
									Disconnect
								</Button>
							</div>

							<div className="text-xs text-muted-foreground">
								Redirect URL:{" "}
								<span className="font-mono break-all">
									{geminiCfg.data?.redirectUrl ?? "—"}
								</span>
							</div>
						</>
					)}
					{lastError ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							<div className="font-medium">Last error</div>
							<div className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">
								{lastError}
							</div>
							{vertexEnableLink(lastError) ? (
								<div className="mt-2">
									<a
										className="underline"
										href={vertexEnableLink(lastError) ?? "#"}
										target="_blank"
										rel="noreferrer noopener"
									>
										Enable Vertex AI API
									</a>
								</div>
							) : null}
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Activity</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex flex-wrap items-center gap-2">
						{activeAction && activeState?.phase === "running" ? (
							<>
								<Badge>{ACTION_LABEL[activeAction]} running</Badge>
								<div className="text-sm text-muted-foreground">
									Elapsed: {fmtDuration(activeElapsed)}
								</div>
							</>
						) : (
							<Badge variant="secondary">Idle</Badge>
						)}
					</div>
					{activeAction && activeState?.phase === "running" ? (
						<Progress value={activityProgressValue} />
					) : null}
					{activeAction && activeState?.phase === "running" ? (
						<div className="text-sm text-muted-foreground">
							{activeState.summary}
						</div>
					) : null}
					{activityLog.length > 0 ? (
						<div className="space-y-2">
							{activityLog.map((entry, index) => (
								<div
									key={`${entry.action}-${entry.endedAt}-${index}`}
									className="rounded-md border p-2"
								>
									<div className="flex items-center justify-between gap-2 text-sm">
										<div className="font-medium">
											{ACTION_LABEL[entry.action]} · {entry.phase}
										</div>
										<div className="text-xs text-muted-foreground">
											{fmtDuration(entry.durationMs)}
										</div>
									</div>
									<div className="mt-1 text-xs text-muted-foreground">
										{entry.summary}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="text-sm text-muted-foreground">
							No activity yet.
						</div>
					)}
					{lastError ? (
						<div className="rounded-md border bg-muted/40 p-3 text-xs">
							<div className="font-medium">Latest error</div>
							<div className="mt-1 text-muted-foreground">
								{firstLine(lastError)}
							</div>
							<div className="mt-2 flex flex-wrap gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={() => setShowErrorDetails((v) => !v)}
								>
									{showErrorDetails ? "Hide details" : "View details"}
								</Button>
								{vertexEnableLink(lastError) ? (
									<Button size="sm" variant="outline" asChild>
										<a
											href={vertexEnableLink(lastError) ?? "#"}
											target="_blank"
											rel="noreferrer noopener"
										>
											Enable Vertex AI API
										</a>
									</Button>
								) : null}
							</div>
							{showErrorDetails ? (
								<div className="mt-2 space-y-2">
									<div className="whitespace-pre-wrap break-words text-muted-foreground">
										{lastError}
									</div>
									{rawOutput ? (
										<div>
											<div className="mb-1 font-medium">Raw AI output</div>
											<div className="max-h-48 overflow-auto whitespace-pre-wrap break-words text-muted-foreground">
												{rawOutput}
											</div>
										</div>
									) : null}
								</div>
							) : null}
						</div>
					) : null}
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>Generate</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="space-y-2">
							<Label htmlFor="ai-kind">Template kind</Label>
							<Select
								value={kind}
								onValueChange={(v) => setKind(v as "netlab" | "containerlab")}
							>
								<SelectTrigger id="ai-kind" aria-label="Template kind">
									<SelectValue placeholder="Select kind" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="netlab">Netlab</SelectItem>
									<SelectItem value="containerlab">Containerlab</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ai-prompt">Prompt</Label>
							<Textarea
								id="ai-prompt"
								name="ai-prompt"
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe the topology you want (nodes, links, protocols, constraints)…"
								className="min-h-[120px]"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ai-seed">Seed template (optional)</Label>
							<Textarea
								id="ai-seed"
								name="ai-seed"
								value={seed}
								onChange={(e) => setSeed(e.target.value)}
								placeholder="Paste a starting YAML file here to modify…"
								className="min-h-[120px] font-mono text-xs"
							/>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								disabled={
									!canGenerate ||
									generate.isPending ||
									isBusy ||
									prompt.trim().length === 0
								}
								onClick={() => generate.mutate()}
							>
								{generate.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Generating…
									</>
								) : (
									"Generate"
								)}
							</Button>
							<Button
								variant="outline"
								disabled={!output.trim() || validate.isPending || isBusy}
								onClick={() => validate.mutate()}
							>
								{validate.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Validating…
									</>
								) : (
									"Validate"
								)}
							</Button>
							<Button
								variant="outline"
								disabled={
									kind !== "containerlab" ||
									!output.trim() ||
									autofix.isPending ||
									isBusy
								}
								onClick={() => autofix.mutate()}
							>
								{autofix.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Auto-fixing…
									</>
								) : (
									"Auto-fix"
								)}
							</Button>
							{lastValidateRunId ? (
								<Button variant="outline" asChild>
									<Link
										to="/dashboard/runs/$runId"
										params={{ runId: lastValidateRunId }}
									>
										Open run
									</Link>
								</Button>
							) : null}
							<Button
								variant="secondary"
								disabled={output.trim().length === 0}
								onClick={() => {
									void navigator.clipboard.writeText(output);
									toast.success("Copied to clipboard");
								}}
							>
								Copy
							</Button>
						</div>
						<div className="space-y-2">
							<Label htmlFor="ai-save-name">Save name (optional)</Label>
							<Input
								id="ai-save-name"
								value={saveName}
								onChange={(e) =>
									setSaveName(normalizeFilenameInput(e.target.value))
								}
								placeholder={`e.g. bgp-5node${generatedExt}`}
								disabled={isBusy}
							/>
							<div className="text-xs text-muted-foreground">
								Saves to{" "}
								<span className="font-mono">
									blueprints/{kind}/ai/generated/
								</span>{" "}
								as <span className="font-mono">{saveNameHint}</span>.
							</div>
							<Button
								variant="outline"
								disabled={!output.trim() || save.isPending || isBusy}
								onClick={() => save.mutate()}
							>
								{save.isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving…
									</>
								) : (
									"Save to Repo"
								)}
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Output</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Tabs defaultValue="template">
							<TabsList>
								<TabsTrigger value="template">Template</TabsTrigger>
								<TabsTrigger value="request">Request</TabsTrigger>
							</TabsList>
							<TabsContent value="template" className="space-y-2">
								<div className="text-xs text-muted-foreground">
									{outputStatus}
								</div>
								<Label className="sr-only" htmlFor="ai-output">
									Generated template output
								</Label>
								<Textarea
									id="ai-output"
									name="ai-output"
									value={output}
									readOnly
									placeholder={outputPlaceholder}
									className="min-h-[420px] font-mono text-xs"
								/>
							</TabsContent>
							<TabsContent value="request" className="space-y-3">
								<div className="rounded-md border p-3 text-xs">
									<div className="font-medium">Current request</div>
									<dl className="mt-2 grid grid-cols-[96px_1fr] gap-x-3 gap-y-2">
										<dt className="text-muted-foreground">Kind</dt>
										<dd className="text-right font-mono">{kind}</dd>
										<dt className="text-muted-foreground">Provider</dt>
										<dd className="text-right font-mono">gemini</dd>
										<dt className="text-muted-foreground">Model</dt>
										<dd className="text-right break-all font-mono">
											{geminiCfg.data?.model ?? "—"}
										</dd>
										<dt className="text-muted-foreground">Fallback</dt>
										<dd className="text-right break-all font-mono">
											{geminiCfg.data?.fallbackModel ?? "—"}
										</dd>
									</dl>
								</div>
								<div className="space-y-2">
									<Label>Prompt</Label>
									<Textarea
										readOnly
										value={prompt}
										placeholder="Prompt will appear here…"
										className="min-h-[140px]"
									/>
								</div>
								<div className="space-y-2">
									<Label>Seed (optional)</Label>
									<Textarea
										readOnly
										value={seed}
										placeholder="Seed template will appear here…"
										className="min-h-[140px] font-mono text-xs"
									/>
								</div>
							</TabsContent>
						</Tabs>
						<div className="text-xs text-muted-foreground">
							Validate runs an in-cluster netlab validation job (netlab
							templates) or containerlab schema validation (containerlab
							templates).
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>History</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<div className="text-xs text-muted-foreground">
						History updates every 15s and may lag active operations.
					</div>
					{history.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : historyItems.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No generations yet.
						</div>
					) : (
						<div className="space-y-1">
							{historyItems.slice(0, 10).map((it) => (
								<div
									key={it.id}
									className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 ${it.id === highlightHistoryId ? "border-primary/60 bg-primary/5" : ""}`}
								>
									<div className="min-w-0">
										<div className="font-medium">
											{it.kind} · {it.provider}
										</div>
										<div className="truncate font-mono text-xs text-muted-foreground">
											{it.id}
										</div>
									</div>
									<div className="shrink-0 text-xs text-muted-foreground">
										{it.createdAt}
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
