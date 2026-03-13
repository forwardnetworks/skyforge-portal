import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";
import {
	Download,
	FolderOpen,
	Rocket,
	Save,
	Sparkles,
	Waypoints,
} from "lucide-react";

type LabDesignerPageState = ReturnType<typeof useLabDesignerPage>;

type LabDesignerValidationTone = {
	label: string;
	className: string;
};

export function LabDesignerCommandBar({
	page,
	validation,
}: {
	page: LabDesignerPageState;
	validation: LabDesignerValidationTone;
}) {
	return (
		<div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
			<div className="space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="outline" className={validation.className}>
						{validation.label}
					</Badge>
					<Badge variant="outline" className="bg-slate-500/5">
						KNE workbench
					</Badge>
					<Badge variant="outline" className="bg-slate-500/5">
						In-cluster runtime
					</Badge>
				</div>
				<div>
					<div className="font-serif text-3xl tracking-tight text-slate-950">
						Lab Designer
					</div>
					<div className="max-w-3xl text-sm text-slate-600">
						Graph-first KNE editing with one validation contract for
						preview, save, and deploy. YAML remains available, but it is no
						longer the primary editing surface.
					</div>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => page.setQuickstartOpen(true)}
				>
					<Waypoints className="mr-2 h-4 w-4" />
					Quickstart
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => page.setImportOpen(true)}
					disabled={!page.userId}
				>
					<FolderOpen className="mr-2 h-4 w-4" />
					Import
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => page.loadDraft(page.storageKey)}
				>
					Load draft
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() =>
						page.saveDraft(
							page.storageKey,
							page.runtime,
							page.containerlabServer,
							page.useSavedConfig,
						)
					}
				>
					Save draft
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => page.validateTopology.mutate()}
					disabled={!page.userId || page.validateTopology.isPending}
				>
					<Sparkles className="mr-2 h-4 w-4" />
					{page.validateTopology.isPending ? "Validating…" : "Validate"}
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => page.saveConfig.mutate()}
					disabled={page.saveConfig.isPending || !page.userId}
				>
					<Save className="mr-2 h-4 w-4" />
					{page.saveConfig.isPending ? "Saving…" : "Save"}
				</Button>
				<Button variant="outline" size="sm" onClick={page.exportYaml}>
					<Download className="mr-2 h-4 w-4" />
					Export YAML
				</Button>
				<Button
					size="sm"
					onClick={() => page.createDeployment.mutate()}
					disabled={page.createDeployment.isPending || !page.userId}
				>
					<Rocket className="mr-2 h-4 w-4" />
					{page.createDeployment.isPending ? "Deploying…" : "Deploy"}
				</Button>
			</div>
		</div>
	);
}
