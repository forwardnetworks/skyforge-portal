import { AlertTriangle, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	LabDesignerInspectorPageState,
	LabDesignerInspectorTabsProps,
} from "@/components/lab-designer-inspector-tab-types";

function LabDesignerYamlModeControls({ page }: { page: LabDesignerInspectorPageState }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<div>
				<div className="text-sm font-semibold text-foreground">
					Normalized topology
				</div>
				<div className="text-xs text-muted-foreground">
					Save and deploy use this same normalized path.
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Button
					size="sm"
					variant={page.yamlMode === "generated" ? "default" : "outline"}
					onClick={() => page.setYamlMode("generated")}
				>
					Generated
				</Button>
				<Button
					size="sm"
					variant={page.yamlMode === "custom" ? "default" : "outline"}
					onClick={() => {
						page.setYamlMode("custom");
						if (!page.customYaml.trim()) {
							page.setCustomYaml(page.effectiveYaml);
						}
					}}
				>
					Custom
				</Button>
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						void navigator.clipboard?.writeText(page.effectiveYaml);
						toast.success("Copied YAML");
					}}
				>
					<Copy className="mr-2 h-4 w-4" />
					Copy
				</Button>
			</div>
		</div>
	);
}

function LabDesignerYamlWarnings({ page }: { page: LabDesignerInspectorPageState }) {
	return (
		<>
			{page.lastValidation?.warnings?.length ? (
				<div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-100">
					<div className="mb-2 flex items-center gap-2 font-medium">
						<AlertTriangle className="h-4 w-4" />
						Validation warnings
					</div>
					<div className="space-y-1">
						{page.lastValidation.warnings.map((warning) => (
							<div key={warning}>{warning}</div>
						))}
					</div>
				</div>
			) : null}
			{page.lastValidation?.errors?.length ? (
				<div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-950 dark:text-red-100">
					<div className="mb-2 flex items-center gap-2 font-medium">
						<AlertTriangle className="h-4 w-4" />
						Blocking errors
					</div>
					<div className="space-y-1">
						{page.lastValidation.errors.map((error) => (
							<div key={error}>{error}</div>
						))}
					</div>
				</div>
			) : null}
			{page.showWarnings && page.missingImageWarnings.length > 0 ? (
				<div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-950 dark:text-amber-100">
					<div className="mb-2 flex items-center gap-2 font-medium">
						<AlertTriangle className="h-4 w-4" />
						Designer warnings
					</div>
					<div className="space-y-1">
						{page.missingImageWarnings.map((warning) => (
							<div key={warning}>{warning}</div>
						))}
						{page.otherWarnings.map((warning) => (
							<div key={warning}>{warning}</div>
						))}
					</div>
				</div>
			) : null}
		</>
	);
}

function LabDesignerYamlTab({ page }: { page: LabDesignerInspectorPageState }) {
	return (
		<div className="space-y-4 pt-3">
			<LabDesignerYamlModeControls page={page} />
			<LabDesignerYamlWarnings page={page} />

			<Textarea
				value={
					page.yamlMode === "custom"
						? page.customYaml
						: page.lastValidation?.normalizedYAML || page.yaml
				}
				onChange={(e) => page.setCustomYaml(e.target.value)}
				readOnly={page.yamlMode !== "custom"}
				className="min-h-[420px] font-mono text-xs"
			/>
		</div>
	);
}

export function LabDesignerYamlTabPanel({ page }: { page: LabDesignerInspectorPageState }) {
	return (
		<TabsContent value="yaml" className="min-h-0 flex-1 overflow-auto">
			<LabDesignerYamlTab page={page} />
		</TabsContent>
	);
}
