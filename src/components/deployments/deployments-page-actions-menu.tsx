import { Clock3, ExternalLink, Info, MoreHorizontal, Play, StopCircle, Trash2 } from "lucide-react";
import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import type { UserScopeDeployment } from "../../lib/api-client";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function DeploymentsPageActionsMenu({
	deployment,
	state,
}: {
	deployment: UserScopeDeployment;
	state: Pick<
		DeploymentsPageState,
		| "deploymentForwardNetworkId"
		| "isManagedDeploymentType"
		| "openDeploymentInForward"
		| "pendingActions"
		| "resolveDeploymentPrimaryAction"
		| "openLifetimeDialog"
		| "setDestroyDialogOpen"
		| "setDestroyTarget"
		| "handleStart"
		| "handleStop"
		| "navigate"
	>;
}) {
	const primaryAction = state.resolveDeploymentPrimaryAction(deployment);
	const canBringUp = primaryAction === "bring_up";
	const canShutDown = primaryAction === "shut_down";
	const forwardNetworkId = state.deploymentForwardNetworkId(deployment);
	const isBusy =
		Boolean(deployment.activeTaskId) || Boolean(state.pendingActions[deployment.id]);
	const managedByLifetime = state.isManagedDeploymentType(deployment.family);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="h-8 w-8">
					<MoreHorizontal className="h-4 w-4" />
					<span className="sr-only">Open menu</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>Actions</DropdownMenuLabel>
				<DropdownMenuItem
					onClick={() =>
						void state.navigate({
							to: "/dashboard/deployments/$deploymentId",
							params: { deploymentId: deployment.id },
						})
					}
				>
					<Info className="mr-2 h-4 w-4" />
					Details
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => state.openDeploymentInForward(deployment)}
					disabled={!forwardNetworkId}
				>
					<ExternalLink className="mr-2 h-4 w-4" />
					Open in Forward
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{managedByLifetime ? (
					<DropdownMenuItem
						onClick={() => state.openLifetimeDialog(deployment)}
						disabled={isBusy || canShutDown}
					>
						<Clock3 className="mr-2 h-4 w-4" />
						Manage lifetime
					</DropdownMenuItem>
				) : null}
				{managedByLifetime ? <DropdownMenuSeparator /> : null}
				<DropdownMenuItem
					onClick={() => {
						if (canBringUp) {
							void state.handleStart(deployment);
							return;
						}
						if (canShutDown) {
							void state.handleStop(deployment);
						}
					}}
					disabled={isBusy || (!canBringUp && !canShutDown)}
				>
					{canShutDown ? (
						<StopCircle className="mr-2 h-4 w-4" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}
					{canShutDown ? "Shut down" : "Bring up"}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={() => {
						state.setDestroyTarget(deployment);
						state.setDestroyDialogOpen(true);
					}}
					className="text-destructive focus:text-destructive"
					disabled={Boolean(state.pendingActions[deployment.id])}
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
