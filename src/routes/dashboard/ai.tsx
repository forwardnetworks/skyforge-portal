import { useMutation, useQuery } from "@tanstack/react-query";
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
	generateUserAITemplate,
	getUserAIHistory,
	getUserGeminiConfig,
	saveUserAITemplate,
	validateUserAITemplate,
} from "@/lib/skyforge-api";

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
	const [kind, setKind] = useState<"netlab" | "containerlab">("netlab");
	const [prompt, setPrompt] = useState("");
	const [seed, setSeed] = useState("");
	const [output, setOutput] = useState("");
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
			setLastError("");
			toast.success("Template generated", { description: res.filename });
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
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
			toast.error("Containerlab template is invalid", {
				description: errs ? errs.split("\n")[0] : "Schema validation failed",
			});
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
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
				toast.success("Autofix succeeded", {
					description: `Iterations: ${res.iterations}`,
				});
				return;
			}
			const errs = (res.errors ?? []).slice(0, 10).join("\n");
			setLastError(errs || "Autofix failed");
			toast.error("Autofix did not converge", {
				description: errs ? errs.split("\n")[0] : "Schema validation failed",
			});
		},
		onError: (e) => {
			const msg = e instanceof Error ? e.message : String(e);
			setLastError(msg);
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
				<h1 className="text-2xl font-bold">AI Templates</h1>
				<p className="text-sm text-muted-foreground">
					Generate Netlab or Containerlab templates using your connected Gemini
					account.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Provider</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground">Gemini</span>
						<span>
							{geminiCfg.isLoading
								? "Loading…"
								: !geminiCfg.data?.enabled
									? "Disabled"
									: geminiCfg.data?.configured
										? `Connected (${geminiCfg.data?.email ?? "—"})`
										: "Not connected"}
						</span>
					</div>
					{!canGenerate && (geminiCfg.data?.enabled ?? false) ? (
						<div className="text-xs text-muted-foreground">
							Connect Gemini first on{" "}
							<span className="font-mono">AI → Gemini</span>.
						</div>
					) : null}
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
							<Label>Template kind</Label>
							<Select
								value={kind}
								onValueChange={(v) => setKind(v as "netlab" | "containerlab")}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select kind" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="netlab">Netlab</SelectItem>
									<SelectItem value="containerlab">Containerlab</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label>Prompt</Label>
							<Textarea
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe the topology you want (nodes, links, protocols, constraints)…"
								className="min-h-[120px]"
							/>
						</div>
						<div className="space-y-2">
							<Label>Seed template (optional)</Label>
							<Textarea
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
						<Textarea
							value={output}
							readOnly
							placeholder="Generated YAML will appear here…"
							className="min-h-[420px] font-mono text-xs"
						/>
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
