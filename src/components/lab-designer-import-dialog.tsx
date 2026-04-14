import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
	ImportTopologyResponse,
	ImportTopologySource,
} from "@/lib/api-client";
import { useEffect, useMemo, useState, type ChangeEvent } from "react";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: string;
	importSource: "user" | "blueprints";
	onImportSourceChange: (value: "user" | "blueprints") => void;
	importDir: string;
	onImportDirChange: (value: string) => void;
	importFile: string;
	onImportFileChange: (value: string) => void;
	templates: string[];
	templatesLoading: boolean;
	templatesError: boolean;
	templatePreview: string;
	templatePreviewLoading: boolean;
	importPending: boolean;
	onImport: () => void;
	importTopologyPending: boolean;
	lastImportResult: ImportTopologyResponse | null;
	onImportTopology: (args: {
		source?: ImportTopologySource;
		yaml: string;
		filename?: string;
	}) => void;
	onApplyImportedTopology: (yaml: string) => void;
	canvasHasContent: boolean;
};

export function LabDesignerImportDialog(props: Props) {
	const [importYAML, setImportYAML] = useState("");
	const [importFilename, setImportFilename] = useState("");
	const [importTopologySource, setImportTopologySource] = useState<
		"auto" | ImportTopologySource
	>("auto");
	const issues = props.lastImportResult?.issues ?? [];
	const unsupported = props.lastImportResult?.unsupportedFeatures ?? [];
	const followUpHints = deriveImportFollowUpHints(issues);
	const errorCount = issues.filter((issue) => issue.severity === "error").length;
	const warningCount = issues.filter(
		(issue) => issue.severity === "warning",
	).length;
	const infoCount = issues.filter((issue) => issue.severity === "info").length;
	const stats = props.lastImportResult?.stats;
	const effectiveSource = props.lastImportResult?.detectedSource ?? props.lastImportResult?.source;
	const canApply = Boolean(
		props.lastImportResult?.convertedYAML &&
			(props.lastImportResult?.canImport ?? !props.lastImportResult?.blocking),
	);
	const convertButtonLabel = importTopologySource === "auto" ? "Convert" : "Convert with source";
	const applyButtonLabel = props.canvasHasContent ? "Replace canvas" : "Import topology";
	const selectedSourceLabel =
		importTopologySource === "auto"
			? "Auto-detect"
			: importTopologySource === "containerlab"
				? "Containerlab"
				: importTopologySource === "eve-ng"
					? "EVE-NG"
					: "GNS3";
	const uploadSummary = useMemo(() => {
		if (!importFilename && !importYAML.trim()) return "No topology file selected";
		const lines = importYAML ? importYAML.split(/\r?\n/).length : 0;
		return `${importFilename || "Pasted topology"} • ${lines} lines`;
	}, [importFilename, importYAML]);

	useEffect(() => {
		if (!props.open) {
			setImportYAML("");
			setImportFilename("");
			setImportTopologySource("auto");
		}
	}, [props.open]);

	const handleFileChange = async (
		event: ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0];
		if (!file) {
			setImportFilename("");
			setImportYAML("");
			return;
		}
		const text = await readFileText(file);
		setImportFilename(file.name);
		setImportYAML(text);
	};

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent className="border-border/70 bg-card/95 sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Import into designer</DialogTitle>
					<DialogDescription>
						Load an existing saved template or import an external topology and
						review the KNE conversion before applying it to the canvas.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-5">
					<div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
						<div>
							<div className="text-sm font-semibold text-foreground">
								Load saved template
							</div>
							<div className="text-xs text-muted-foreground">
								Import a blueprint or user-scope template directly into the editor.
							</div>
						</div>
						<div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-muted/30 p-3">
							<div className="space-y-1">
								<Label>Source</Label>
								<Select
									value={props.importSource}
									onValueChange={(value) =>
										props.onImportSourceChange(value as "user" | "blueprints")
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="blueprints">Blueprints</SelectItem>
										<SelectItem value="user">User repo</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1">
								<Label>Directory</Label>
								<Input
									value={props.importDir}
									onChange={(e) => props.onImportDirChange(e.target.value)}
								/>
							</div>
						</div>

						<div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-3">
							<Label>Template</Label>
							<Select
								value={props.importFile}
								onValueChange={props.onImportFileChange}
								disabled={!props.userId}
							>
								<SelectTrigger>
									<SelectValue
										placeholder={
											props.templatesLoading ? "Loading…" : "Select template…"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{props.templates.map((template) => (
										<SelectItem key={template} value={template}>
											{template}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{props.templatesError ? (
								<div className="text-xs text-destructive">
									Failed to list templates
								</div>
							) : null}
						</div>

						<div className="space-y-1 rounded-2xl border border-border bg-muted/20 p-3">
							<Label>Preview</Label>
							<Textarea
								value={props.templatePreview}
								readOnly
								placeholder={
									props.importFile
										? props.templatePreviewLoading
											? "Loading preview…"
											: "No preview"
										: "Select a template to preview…"
								}
								className="h-[180px] font-mono text-xs"
							/>
						</div>
					</div>

					<div className="space-y-4 rounded-2xl border border-border bg-muted/20 p-4">
						<div>
							<div className="text-sm font-semibold text-foreground">
								Import external topology
							</div>
							<div className="text-xs text-muted-foreground">
								Upload topology data, convert it to canonical KNE designer YAML, then
								review warnings before replacing the canvas.
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
							<div className="space-y-1">
								<Label>Topology file</Label>
							<Input
								type="file"
								accept=".yaml,.yml,.xml,.json,.txt"
								data-testid="external-topology-file"
								onChange={handleFileChange}
							/>
								<div className="text-xs text-muted-foreground">
									{uploadSummary}
								</div>
							</div>
							<div className="space-y-1">
								<Label>Source</Label>
								<Select
									value={importTopologySource}
									onValueChange={(value) =>
										setImportTopologySource(
											value as "auto" | ImportTopologySource,
										)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="auto">Auto-detect</SelectItem>
										<SelectItem value="containerlab">Containerlab</SelectItem>
										<SelectItem value="eve-ng">EVE-NG</SelectItem>
										<SelectItem value="gns3">GNS3</SelectItem>
									</SelectContent>
								</Select>
								<div className="text-xs text-muted-foreground">
									Selected: {selectedSourceLabel}
								</div>
							</div>
						</div>
						<div className="flex justify-end">
							<Button
								variant="secondary"
								onClick={() =>
									props.onImportTopology({
										source:
											importTopologySource === "auto"
												? undefined
												: importTopologySource,
										yaml: importYAML,
										filename: importFilename || undefined,
									})
								}
								disabled={props.importTopologyPending || !importYAML.trim()}
							>
								{convertButtonLabel}
							</Button>
						</div>

						{props.lastImportResult ? (
							<div className="space-y-3 rounded-2xl border border-border bg-background/60 p-3">
								<div className="flex items-center justify-between gap-3">
									<div>
										<div className="text-sm font-semibold text-foreground">
											Review converted topology
										</div>
										<div className="text-xs text-muted-foreground">
											Detected source: {effectiveSource ?? "unknown"}
										</div>
									</div>
									<div
										className={`text-xs ${
											canApply
												? "text-emerald-600"
												: "text-destructive"
										}`}
									>
										{canApply ? "Ready to import" : "Fix import errors"}
									</div>
								</div>
								<div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-5">
									<div>Nodes: {stats?.nodes ?? 0}</div>
									<div>Links: {stats?.links ?? 0}</div>
									<div>Placeholders: {stats?.placeholderNodes ?? 0}</div>
									<div>Warnings: {stats?.warnings ?? warningCount}</div>
									<div>Errors: {stats?.errors ?? errorCount}</div>
								</div>
								<div className="text-xs text-muted-foreground">
									Image mappings: {props.lastImportResult.imageMappings.length} • Info: {infoCount}
								</div>
								{props.canvasHasContent ? (
									<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
										Importing will replace the current canvas contents.
									</div>
								) : null}
								{unsupported.length > 0 ? (
									<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs">
										Unsupported features: {unsupported.join(", ")}
									</div>
								) : null}
								{followUpHints.length > 0 ? (
									<div className="rounded-md border border-sky-500/30 bg-sky-500/10 p-2 text-xs text-sky-950 dark:text-sky-100">
										<div className="font-semibold">Manual follow-up</div>
										<ul className="mt-1 list-disc pl-4">
											{followUpHints.map((hint) => (
												<li key={hint}>{hint}</li>
											))}
										</ul>
									</div>
								) : null}
								<div className="max-h-[140px] space-y-1 overflow-auto rounded-md border bg-background/60 p-2 text-xs">
									{issues.length === 0 ? (
										<div className="text-muted-foreground">No conversion issues.</div>
									) : (
										issues.slice(0, 16).map((issue, idx) => (
											<div key={`${issue.code}-${idx}`} className="flex gap-2">
												<span className="font-mono uppercase">{issue.severity}</span>
												<span>{issue.message}</span>
											</div>
										))
									)}
								</div>
								<Textarea
									value={props.lastImportResult.convertedYAML}
									readOnly
									className="h-[180px] font-mono text-xs"
								/>
								<div className="flex justify-end">
									<Button
										onClick={() =>
											props.onApplyImportedTopology(
												props.lastImportResult?.convertedYAML ?? "",
											)
										}
										disabled={!canApply}
									>
										{applyButtonLabel}
									</Button>
								</div>
							</div>
						) : null}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => props.onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={props.onImport}
						disabled={props.importPending || !props.importFile}
					>
						Import template
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

async function readFileText(file: File): Promise<string> {
	if (typeof file.text === "function") {
		return file.text();
	}
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsText(file);
	});
}

function deriveImportFollowUpHints(
	issues: Array<{ code: string; severity: string }>,
): string[] {
	const hints = new Set<string>();
	for (const issue of issues) {
		const code = String(issue.code ?? "").trim();
		switch (code) {
			case "multi-access-link-expanded":
				hints.add(
					"Review expanded multi-access links and adjust interface pairings if the original topology used shared segments.",
				);
				break;
			case "link-skipped":
				hints.add(
					"Review skipped links and add missing connections manually in the canvas.",
				);
				break;
			case "missing-image":
				hints.add(
					"Set missing node images before validation or deploy; imported placeholders stay editable in the canvas.",
				);
				break;
			case "validation-warning":
				hints.add(
					"Inspect warnings and verify node/link details before deployment.",
				);
				break;
			case "unsupported-node-preserved":
				hints.add(
					"Review preserved placeholder nodes and map them to supported images or keep them as documentation-only elements.",
				);
				break;
			case "unsupported-interface-type":
				hints.add(
					"Review non-Ethernet interface mappings; adjust interface names or links manually in the canvas.",
				);
				break;
			case "link-endpoints-skipped":
				hints.add(
					"Review links with skipped endpoints and reconnect any external attachments manually in the canvas.",
				);
				break;
			case "management-network-ignored":
				hints.add(
					"Management-only attachments were ignored during import; add equivalent management connectivity manually if required.",
				);
				break;
			default:
				break;
		}
	}
	return Array.from(hints);
}
