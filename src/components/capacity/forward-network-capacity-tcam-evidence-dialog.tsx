import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityTcamEvidenceDialog({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Dialog
			open={page.tcamDialogOpen}
			onOpenChange={(v) => !v && page.setTcamDialogOpen(false)}
		>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle className="text-base">TCAM Evidence</DialogTitle>
				</DialogHeader>
				<pre className="max-h-[70vh] overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
					{page.tcamDialogText || "—"}
				</pre>
			</DialogContent>
		</Dialog>
	);
}
