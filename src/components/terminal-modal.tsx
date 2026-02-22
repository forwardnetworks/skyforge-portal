import { TerminalView } from "@/components/terminal-view";
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
	userId: string;
	deploymentId: string;
	nodeId: string;
	nodeKind?: string;
};

export function TerminalModal({
	open,
	onOpenChange,
	userId,
	deploymentId,
	nodeId,
	nodeKind,
}: Props) {
	// Reset key when opening to ensure clean terminal state
	const key = `${userId}-${deploymentId}-${nodeId}-${open}`;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-5xl h-[70vh] flex flex-col p-0 gap-0 overflow-hidden">
				<DialogHeader className="px-6 py-4 border-b">
					<DialogTitle className="flex items-center gap-2">
						<Terminal className="h-4 w-4" />
						Terminal
					</DialogTitle>
				</DialogHeader>
				<div className="flex-1 min-h-0">
					{open ? (
						<TerminalView
							key={key}
							userId={userId}
							deploymentId={deploymentId}
							nodeId={nodeId}
							nodeKind={nodeKind}
							onClose={() => onOpenChange(false)}
						/>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
