import type { TopologyViewerDialogsProps } from "./topology-viewer-dialog-types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Props = Pick<
	TopologyViewerDialogsProps,
	| "impairOpen"
	| "setImpairOpen"
	| "selectedEdgeLabel"
	| "impair"
	| "setImpair"
	| "impairSaving"
	| "onApplyImpairment"
>;

export function TopologyViewerImpairmentDialog(props: Props) {
	return (
		<Dialog open={props.impairOpen} onOpenChange={props.setImpairOpen}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Configure Link Impairment</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{props.selectedEdgeLabel ? (
						<div className="text-xs text-muted-foreground font-mono truncate">
							{props.selectedEdgeLabel}
						</div>
					) : null}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label htmlFor="delayMs">Delay (ms)</Label>
							<Input
								id="delayMs"
								inputMode="numeric"
								placeholder="e.g. 50"
								value={props.impair.delayMs}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										delayMs: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="jitterMs">Jitter (ms)</Label>
							<Input
								id="jitterMs"
								inputMode="numeric"
								placeholder="e.g. 10"
								value={props.impair.jitterMs}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										jitterMs: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="lossPct">Loss (%)</Label>
							<Input
								id="lossPct"
								inputMode="decimal"
								placeholder="e.g. 1.0"
								value={props.impair.lossPct}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										lossPct: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="dupPct">Duplicate (%)</Label>
							<Input
								id="dupPct"
								inputMode="decimal"
								placeholder="e.g. 0.1"
								value={props.impair.dupPct}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										dupPct: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="corruptPct">Corrupt (%)</Label>
							<Input
								id="corruptPct"
								inputMode="decimal"
								placeholder="e.g. 0.05"
								value={props.impair.corruptPct}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										corruptPct: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="reorderPct">Reorder (%)</Label>
							<Input
								id="reorderPct"
								inputMode="decimal"
								placeholder="e.g. 0.2"
								value={props.impair.reorderPct}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										reorderPct: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="rateKbps">Rate (kbit/s)</Label>
							<Input
								id="rateKbps"
								inputMode="numeric"
								placeholder="e.g. 100000"
								value={props.impair.rateKbps}
								onChange={(e) =>
									props.setImpair((prev) => ({
										...prev,
										rateKbps: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<div className="flex gap-2 justify-end">
						<Button
							variant="secondary"
							onClick={() => props.setImpairOpen(false)}
							disabled={props.impairSaving}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								void props
									.onApplyImpairment()
									.finally(() => props.setImpairOpen(false));
							}}
							disabled={props.impairSaving}
						>
							Apply
						</Button>
					</div>
				</div>
				<div className="text-xs text-muted-foreground">
					Tip: Right-click a link in the topology to configure impairment.
				</div>
			</DialogContent>
		</Dialog>
	);
}
