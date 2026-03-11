import { DeploymentCapacityDialogs } from "@/components/capacity/deployment-capacity-dialogs";
import { DeploymentCapacityHeader } from "@/components/capacity/deployment-capacity-header";
import { DeploymentCapacitySummaryCards } from "@/components/capacity/deployment-capacity-summary-cards";
import { DeploymentCapacityTabs } from "@/components/capacity/deployment-capacity-tabs";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDeploymentCapacityPage } from "@/hooks/use-deployment-capacity-page";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
	"/dashboard/deployments/$deploymentId/capacity",
)({
	component: DeploymentCapacityPage,
});

function DeploymentCapacityPage() {
	const { deploymentId } = Route.useParams();
	const page = useDeploymentCapacityPage(deploymentId);

	if (!page.deployment) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/deployments/$deploymentId"
						params={{ deploymentId }}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<h1 className="text-2xl font-bold tracking-tight">Capacity</h1>
				</div>
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Deployment not found.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 pb-20">
			<DeploymentCapacityHeader deploymentId={deploymentId} page={page} />
			<DeploymentCapacitySummaryCards page={page} />
			<DeploymentCapacityTabs deploymentId={deploymentId} page={page} />
			<DeploymentCapacityDialogs page={page} />
		</div>
	);
}
