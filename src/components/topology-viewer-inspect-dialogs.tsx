import { InterfacesBody, RunningConfigBody } from "./topology-viewer-bodies";
import type { TopologyViewerDialogsProps } from "./topology-viewer-dialog-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

type Props = Pick<
	TopologyViewerDialogsProps,
	| "interfacesOpen"
	| "setInterfacesOpen"
	| "interfacesNodeId"
	| "fetchInterfaces"
	| "interfacesAutoRefresh"
	| "toggleInterfacesAutoRefresh"
	| "runningConfigOpen"
	| "setRunningConfigOpen"
	| "runningConfigNodeId"
	| "fetchRunningConfig"
>;

export function TopologyViewerInspectDialogs(props: Props) {
	return (
		<>
			<Dialog
				open={props.interfacesOpen}
				onOpenChange={props.setInterfacesOpen}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Interfaces</DialogTitle>
					</DialogHeader>
					<InterfacesBody
						node={props.interfacesNodeId}
						data={props.fetchInterfaces.data}
						loading={props.fetchInterfaces.isPending}
						error={
							props.fetchInterfaces.isError
								? (((props.fetchInterfaces.error as any)?.message ??
										"failed") as string)
								: ""
						}
						autoRefresh={props.interfacesAutoRefresh}
						onToggleAutoRefresh={props.toggleInterfacesAutoRefresh}
					/>
				</DialogContent>
			</Dialog>

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
		</>
	);
}
