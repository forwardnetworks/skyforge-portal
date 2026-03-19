import { DeploymentStatusBadge } from "@/components/deployments/deployment-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";
import { Link } from "@tanstack/react-router";
import {
	ArrowLeft,
	ExternalLink,
	Play,
	StopCircle,
	Trash2,
	TrendingUp,
} from "lucide-react";

export function DeploymentDetailHeader({
	page,
}: { page: DeploymentDetailPageState }) {
	const {
		deployment,
		deploymentId,
		status,
		primaryAction,
		isBusy,
		forwardNetworkID,
		handleStart,
		handleStop,
		setDestroyDialogOpen,
		actionPending,
	} = page;
	if (!deployment) return null;
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div className="flex items-center gap-3">
				<Link
					to="/dashboard/deployments"
					className={buttonVariants({
						variant: "outline",
						size: "icon",
						className: "h-9 w-9",
					})}
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div>
					<h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
						{deployment.name}
						<DeploymentStatusBadge status={status} />
					</h1>
					<p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
						<span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
							{deployment.id}
						</span>
						<span>•</span>
						<span className="capitalize">{deployment.family}</span>
					</p>
					{deployment.actionReason ? (
						<p className="text-xs text-muted-foreground mt-1">
							{deployment.actionReason}
						</p>
					) : null}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Link
					to="/dashboard/deployments/$deploymentId/capacity"
					params={{ deploymentId }}
					className={buttonVariants({ variant: "outline", size: "sm" })}
					title="Capacity rollups and forecasting"
				>
					<TrendingUp className="mr-2 h-4 w-4" /> Capacity
				</Link>
				<Button
					variant="outline"
					size="sm"
					disabled={!forwardNetworkID}
					title={
						forwardNetworkID
						? "Open this deployment network in Forward"
						: "Forward network is not available yet"
					}
					onClick={() => {
						if (!forwardNetworkID) return;
						const nextPath = `/search?networkId=${encodeURIComponent(forwardNetworkID)}`;
						const url = `/api/forward/session?next=${encodeURIComponent(nextPath)}`;
						const popup = window.open(url, "_blank", "noopener,noreferrer");
						if (!popup) {
							window.location.href = url;
						}
					}}
				>
					<ExternalLink className="mr-2 h-4 w-4" />
					Open in Forward
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (primaryAction === "shut_down") void handleStop();
						else if (primaryAction === "bring_up") void handleStart();
					}}
					disabled={isBusy || primaryAction === "none"}
				>
					{primaryAction === "shut_down" ? (
						<StopCircle className="mr-2 h-4 w-4" />
					) : (
						<Play className="mr-2 h-4 w-4" />
					)}{" "}
					{primaryAction === "shut_down" ? "Shut Down" : "Bring Up"}
				</Button>
				<Button
					variant="destructive"
					size="sm"
					onClick={() => setDestroyDialogOpen(true)}
					disabled={actionPending}
				>
					<Trash2 className="mr-2 h-4 w-4" /> Delete
				</Button>
			</div>
		</div>
	);
}
