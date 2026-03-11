import type { TopologyViewerDialogsProps } from "./topology-viewer-dialog-types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Props = Pick<
	TopologyViewerDialogsProps,
	| "captureOpen"
	| "setCaptureOpen"
	| "captureEdgeLabel"
	| "capture"
	| "setCapture"
	| "captureLinkPending"
	| "onRunCapture"
>;

export function TopologyViewerCaptureDialog(props: Props) {
	return (
		<Dialog open={props.captureOpen} onOpenChange={props.setCaptureOpen}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Capture pcap</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					{props.captureEdgeLabel ? (
						<div className="text-xs text-muted-foreground font-mono truncate">
							{props.captureEdgeLabel}
						</div>
					) : null}
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<Label htmlFor="capSide">Side</Label>
							<select
								id="capSide"
								className="h-9 w-full rounded-md border bg-background px-3 text-sm"
								value={props.capture.side}
								onChange={(e) =>
									props.setCapture((prev) => ({
										...prev,
										side: e.target.value as "source" | "target",
									}))
								}
							>
								<option value="source">Source</option>
								<option value="target">Target</option>
							</select>
						</div>
						<div className="space-y-1">
							<Label htmlFor="capDuration">Duration (s)</Label>
							<Input
								id="capDuration"
								inputMode="numeric"
								value={props.capture.duration}
								onChange={(e) =>
									props.setCapture((prev) => ({
										...prev,
										duration: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="capPackets">Max packets</Label>
							<Input
								id="capPackets"
								inputMode="numeric"
								value={props.capture.packets}
								onChange={(e) =>
									props.setCapture((prev) => ({
										...prev,
										packets: e.target.value,
									}))
								}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="capSnaplen">Snaplen</Label>
							<Input
								id="capSnaplen"
								inputMode="numeric"
								value={props.capture.snaplen}
								onChange={(e) =>
									props.setCapture((prev) => ({
										...prev,
										snaplen: e.target.value,
									}))
								}
							/>
						</div>
					</div>
					<div className="flex gap-2 justify-end">
						<Button
							variant="secondary"
							onClick={() => props.setCaptureOpen(false)}
							disabled={props.captureLinkPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								void props
									.onRunCapture()
									.finally(() => props.setCaptureOpen(false));
							}}
							disabled={props.captureLinkPending}
						>
							{props.captureLinkPending ? "Capturing…" : "Capture"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
