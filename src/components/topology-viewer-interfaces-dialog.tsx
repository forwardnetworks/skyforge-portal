import { InterfacesBody } from "./topology-viewer-bodies";
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
>;

export function TopologyViewerInterfacesDialog(props: Props) {
	return (
		<Dialog open={props.interfacesOpen} onOpenChange={props.setInterfacesOpen}>
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
	);
}
