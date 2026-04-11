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
import type { ImportTopologyResponse } from "@/lib/api-client";
import { useState } from "react";

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
		source: "containerlab" | "eve-ng" | "gns3";
		yaml: string;
	}) => void;
};

export function LabDesignerImportDialog(props: Props) {
	const [importYAML, setImportYAML] = useState("");
	const [importTopologySource, setImportTopologySource] = useState<
		"containerlab" | "eve-ng" | "gns3"
	>("containerlab");
	const sourceLabel =
		importTopologySource === "containerlab"
			? "Containerlab"
			: importTopologySource === "eve-ng"
				? "EVE-NG"
				: "GNS3";
	const issues = props.lastImportResult?.issues ?? [];
	const unsupported = props.lastImportResult?.unsupportedFeatures ?? [];
	const errorCount = issues.filter((issue) => issue.severity === "error").length;
	const warningCount = issues.filter(
		(issue) => issue.severity === "warning",
	).length;
	const infoCount = issues.filter((issue) => issue.severity === "info").length;
	const followUpHints = deriveImportFollowUpHints(issues);

	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent className="border-border/70 bg-card/95 sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Import template</DialogTitle>
					<DialogDescription>
						Load an existing kne YAML from templates/blueprints into
						the editor.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
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
							className="font-mono text-xs h-[220px]"
						/>
					</div>

					<div className="space-y-3 rounded-2xl border border-border bg-muted/20 p-3">
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-1">
								<Label>Topology Source</Label>
								<Select
									value={importTopologySource}
									onValueChange={(value) =>
										setImportTopologySource(
											value as "containerlab" | "eve-ng" | "gns3",
										)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="containerlab">Containerlab</SelectItem>
										<SelectItem value="eve-ng">EVE-NG</SelectItem>
										<SelectItem value="gns3">GNS3</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<Label>{sourceLabel} YAML (convert + import)</Label>
						<Textarea
							value={importYAML}
							onChange={(e) => setImportYAML(e.target.value)}
							placeholder="Paste topology YAML here..."
							className="font-mono text-xs h-[200px]"
						/>
						<div className="flex justify-end">
							<Button
								variant="secondary"
								onClick={() =>
									props.onImportTopology({
										source: importTopologySource,
										yaml: importYAML,
									})
								}
								disabled={
									props.importTopologyPending ||
									!importYAML.trim()
								}
							>
								Convert + Import
							</Button>
						</div>
					</div>

					{props.lastImportResult ? (
						<div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-3">
							<div className="flex items-center justify-between">
								<Label>Last import result</Label>
								<div
									className={`text-xs ${
										props.lastImportResult.blocking
											? "text-destructive"
											: "text-emerald-600"
									}`}
								>
									{props.lastImportResult.blocking ? "Blocking" : "Ready"}
								</div>
							</div>
							<div className="text-xs text-muted-foreground">
								Source: {props.lastImportResult.source}
							</div>
							<div className="text-xs text-muted-foreground">
								Issues: {errorCount} errors, {warningCount} warnings, {infoCount} info
							</div>
							<div className="text-xs text-muted-foreground">
								Image mappings: {props.lastImportResult.imageMappings.length}
							</div>
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
									issues.slice(0, 12).map((issue, idx) => (
										<div key={`${issue.code}-${idx}`} className="flex gap-2">
											<span className="font-mono uppercase">{issue.severity}</span>
											<span>{issue.message}</span>
										</div>
									))
								)}
							</div>
						</div>
					) : null}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => props.onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={props.onImport}
						disabled={props.importPending || !props.importFile}
					>
						Import
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
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
					"Set node image values in Node edit before deploy; imports with missing images stay blocking.",
				);
				break;
			case "validation-warning":
				hints.add(
					"Inspect warnings and verify node/link details before deployment.",
				);
				break;
			case "unsupported-node-skipped":
				hints.add(
					"Review skipped infrastructure nodes (cloud/NAT/bridge) and model their connectivity manually if needed.",
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
