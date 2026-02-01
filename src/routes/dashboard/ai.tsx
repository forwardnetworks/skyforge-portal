import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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

function AITemplatesPage() {
	const qc = useQueryClient();
	const [kind, setKind] = useState<"netlab" | "containerlab">("netlab");
	const [prompt, setPrompt] = useState("");
	const [seed, setSeed] = useState("");
	const [output, setOutput] = useState("");
	const [rawOutput, setRawOutput] = useState("");
	const [lastError, setLastError] = useState<string>("");
	const [lastValidateRunId, setLastValidateRunId] = useState<string>("");

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
		(geminiCfg.data?.enabled ?? false) && (geminiCfg.data?.configured ?? false);

	const disconnect = useMutation({
		mutationFn: async () => disconnectUserGemini(),
		onSuccess: async () => {
			toast.success("Disconnected Gemini");
			await qc.invalidateQueries({ queryKey: queryKeys.userGeminiConfig() });
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
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
			return generateUserAITemplate(payload);
		},
	onSuccess: (res) => {
		setOutput(res.content ?? "");
		setRawOutput("");
		setLastError("");
		toast.success("Template generated", { description: res.filename });
	},
	onError: (e) => {
		const msg = e instanceof Error ? e.message : String(e);
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
		toast.error("Failed to generate template", {
			description: msg,
		});
	},
});

	const save = useMutation({
		mutationFn: async () => {
			if (!output.trim()) throw new Error("No output to save");
			return saveUserAITemplate({
				kind,
				content: output,
				pathHint: "ai/generated",
			});
		},
	onSuccess: (res) => {
		setLastError("");
		setRawOutput("");
		toast.success("Saved to repo", {
			description: `${res.repo}:${res.path}@${res.branch}`,
		});
	},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
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
	onSuccess: (res) => {
		setLastError("");
		setRawOutput("");
		if (kind === "netlab") {
			const runId = res.task?.id != null ? String(res.task.id) : "";
			setLastValidateRunId(runId);
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
		toast.success("Containerlab template is valid");
		setLastValidateRunId("");
		return;
	}

	setLastError(errs || "Containerlab template is invalid");
	setRawOutput("");
	toast.error("Containerlab template is invalid", {
		description: errs ? errs.split("\n")[0] : "Schema validation failed",
	});
},
onError: (e) => {
	const msg = e instanceof Error ? e.message : String(e);
	setLastError(msg);
	setRawOutput("");
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
	onSuccess: (res) => {
		setOutput(res.content ?? "");
		if (res.ok) {
			setLastError("");
			setRawOutput("");
			toast.success("Autofix succeeded", {
				description: `Iterations: ${res.iterations}`,
			});
			return;
		}
		const errs = (res.errors ?? []).slice(0, 10).join("\n");
		setLastError(errs || "Autofix failed");
		setRawOutput("");
		toast.error("Autofix did not converge", {
			description: errs ? errs.split("\n")[0] : "Schema validation failed",
		});
	},
	onError: (e) => {
		const msg = e instanceof Error ? e.message : String(e);
		setLastError(msg);
		setRawOutput("");
		toast.error("Failed to autofix template", { description: msg });
	},
});

	const historyItems = useMemo(
		() => history.data?.items ?? [],
		[history.data?.items],
	);

	return (
		<div className="mx-auto w-full max-w-5xl space-y-4 p-4">
			<div>
				<h1 className="text-2xl font-bold">AI</h1>
				<p className="text-sm text-muted-foreground">
					Connect Gemini and generate Netlab or Containerlab templates.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Gemini Connection</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{geminiCfg.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : !geminiCfg.data?.enabled ? (
						<div className="text-sm text-muted-foreground">
							Gemini integration is disabled on this Skyforge instance.
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

								<dt className="text-muted-foreground">Updated</dt>
								<dd className="text-right">
									{geminiCfg.data?.updatedAt ?? "—"}
								</dd>
							</dl>

							<div className="flex items-center gap-2 pt-1">
								<Button
									disabled={!geminiCfg.data?.enabled}
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
						<div className="flex items-center gap-2">
							<Button
								disabled={
									!canGenerate ||
									generate.isPending ||
									prompt.trim().length === 0
								}
								onClick={() => generate.mutate()}
							>
								Generate
							</Button>
							<Button
								variant="outline"
								disabled={!output.trim() || save.isPending}
								onClick={() => save.mutate()}
							>
								Save to Repo
							</Button>
							<Button
								variant="outline"
								disabled={!output.trim() || validate.isPending}
								onClick={() => validate.mutate()}
							>
								Validate
							</Button>
							<Button
								variant="outline"
								disabled={
									kind !== "containerlab" || !output.trim() || autofix.isPending
								}
								onClick={() => autofix.mutate()}
							>
								Auto-fix
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Output</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<Label className="sr-only" htmlFor="ai-output">
							Generated template output
						</Label>
						<Textarea
							id="ai-output"
							name="ai-output"
							value={output}
							readOnly
							placeholder="Generated YAML will appear here…"
							className="min-h-[420px] font-mono text-xs"
						/>
						{rawOutput ? (
							<div className="space-y-2">
								<Label htmlFor="ai-raw-output">Raw AI output</Label>
								<Textarea
									id="ai-raw-output"
									name="ai-raw-output"
									value={rawOutput}
									readOnly
									className="min-h-[160px] font-mono text-xs"
								/>
							</div>
						) : null}
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
									className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
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
