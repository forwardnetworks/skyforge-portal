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
};

export function LabDesignerImportDialog(props: Props) {
	return (
		<Dialog open={props.open} onOpenChange={props.onOpenChange}>
			<DialogContent className="border-border/70 bg-card/95 sm:max-w-3xl">
				<DialogHeader>
					<DialogTitle>Import template</DialogTitle>
					<DialogDescription>
						Load an existing containerlab YAML from templates/blueprints into
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
