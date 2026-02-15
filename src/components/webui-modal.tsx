import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { SKYFORGE_PROXY_ROOT } from "@/lib/skyforge-api";
import { ExternalLink, Monitor } from "lucide-react";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	workspaceId: string;
	deploymentId: string;
	nodeId: string;
	port?: number;
};

export function WebUIModal({
	open,
	onOpenChange,
	workspaceId,
	deploymentId,
	nodeId,
	port = 443,
}: Props) {
	const url = `${SKYFORGE_PROXY_ROOT}/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/nodes/${encodeURIComponent(nodeId)}/webui/?port=${encodeURIComponent(String(port))}&embed=1`;

	const key = `${workspaceId}-${deploymentId}-${nodeId}-${port}-${open}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle className="flex items-center justify-between gap-4">
						<span className="flex items-center gap-2">
							<Monitor className="h-4 w-4" />
							Web UI
						</span>
						<Button
							size="sm"
							variant="outline"
							onClick={() => {
								window.open(url, "_blank", "noopener,noreferrer");
							}}
						>
							<ExternalLink className="h-4 w-4 mr-2" />
							Open in new tab
						</Button>
					</DialogTitle>
				</DialogHeader>
				<div className="flex-1 min-h-0 bg-background">
					{open ? (
						<iframe
							key={key}
							title={`webui-${nodeId}`}
							src={url}
							className="w-full h-full"
						/>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
