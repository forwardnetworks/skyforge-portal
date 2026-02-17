import { NodeLogsView } from "@/components/node-logs-view";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Terminal } from "lucide-react";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userContextId: string;
	deploymentId: string;
	nodeId: string;
	nodeKind?: string;
	nodeIp?: string;
};

export function NodeLogsModal({
	open,
	onOpenChange,
	userContextId,
	deploymentId,
	nodeId,
	nodeKind,
	nodeIp,
}: Props) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl h-[70vh] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle className="flex items-center gap-2">
						<Terminal className="h-4 w-4" />
						Node logs
					</DialogTitle>
				</DialogHeader>
				<div className="flex-1 min-h-0">
					{open ? (
						<NodeLogsView
							userContextId={userContextId}
							deploymentId={deploymentId}
							nodeId={nodeId}
							nodeKind={nodeKind}
							nodeIp={nodeIp}
							onClose={() => onOpenChange(false)}
						/>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
