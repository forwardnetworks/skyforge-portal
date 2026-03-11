import { RunningConfigBody } from "./topology-viewer-bodies";
import type { TopologyViewerDialogsProps } from "./topology-viewer-dialog-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type Props = Pick<
	TopologyViewerDialogsProps,
	| "runningConfigOpen"
	| "setRunningConfigOpen"
	| "runningConfigNodeId"
	| "fetchRunningConfig"
>;

export function TopologyViewerRunningConfigDialog(props: Props) {
	return (
		<Dialog
			open={props.runningConfigOpen}
			onOpenChange={props.setRunningConfigOpen}
		>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle>Running config</DialogTitle>
				</DialogHeader>
				<RunningConfigBody
					node={props.runningConfigNodeId}
					data={props.fetchRunningConfig.data}
					loading={props.fetchRunningConfig.isPending}
					error={
						props.fetchRunningConfig.isError
							? (((props.fetchRunningConfig.error as any)?.message ??
									"failed") as string)
							: ""
					}
				/>
			</DialogContent>
		</Dialog>
	);
}
