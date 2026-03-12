import { DeploymentDetailConfigTab } from "@/components/deployments/deployment-detail-config-tab";
import { DeploymentDetailDeleteDialog } from "@/components/deployments/deployment-detail-delete-dialog";
import { DeploymentDetailHeader } from "@/components/deployments/deployment-detail-header";
import { DeploymentDetailLogsTab } from "@/components/deployments/deployment-detail-logs-tab";
import { DeploymentDetailPlacementCard } from "@/components/deployments/deployment-detail-placement-card";
import { DeploymentDetailStandaloneView } from "@/components/deployments/deployment-detail-standalone-view";
import { DeploymentDetailTopologyTab } from "@/components/deployments/deployment-detail-topology-tab";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	formatResourceEstimateSummary,
	useDeploymentDetailPage,
} from "@/hooks/use-deployment-detail-page";
import { createFileRoute } from "@tanstack/react-router";
import { Box, FileJson, Network, Terminal } from "lucide-react";

export const Route = createFileRoute("/dashboard/deployments/$deploymentId/")({
	component: DeploymentDetailPage,
	validateSearch: (search: Record<string, unknown>) => {
		const out: { action?: string; node?: string; tab?: string } = {};
		if (typeof search.action === "string" && search.action.trim())
			out.action = search.action.trim();
		if (typeof search.node === "string" && search.node.trim())
			out.node = search.node.trim();
		if (typeof search.tab === "string" && search.tab.trim())
			out.tab = search.tab.trim();
		return out;
	},
});

function DeploymentDetailPage() {
	const { deploymentId } = Route.useParams();
	const { action, node, tab } = Route.useSearch();
	const page = useDeploymentDetailPage({ deploymentId, action, node, tab });

	const standalone = (
		<DeploymentDetailStandaloneView page={page} action={action} node={node} />
	);
	if (standalone.props.page.deployment && standalone.type) {
		const maybe = standalone;
		if (
			maybe !== null &&
			(action === "terminal" || action === "logs" || action === "describe")
		)
			return maybe;
	}

	if (!page.deployment) {
		if (page.snap.isLoading || page.snap.isFetching) {
			return (
				<div className="space-y-5 p-4 lg:p-5">
					<div className="flex items-center gap-4">
						<Skeleton className="h-10 w-32" />
						<Skeleton className="h-10 w-48" />
					</div>
					<Skeleton className="h-[400px] w-full" />
				</div>
			);
		}
		return (
			<div className="p-6">
				<EmptyState
					icon={Box}
					title="Deployment not found"
					description="This deployment may have been deleted or you don't have access."
					action={{
						label: "Back to Deployments",
						onClick: () => page.navigate({ to: "/dashboard/deployments" }),
					}}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-5 p-4 pb-16 lg:p-5 lg:pb-20">
			<DeploymentDetailHeader page={page} />
			<Card>
				<CardHeader className="pb-3">
					<CardTitle>Deployment Resources</CardTitle>
					<CardDescription>
						Estimated footprint from the selected template.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-sm">
					<div className="font-medium">
						{page.resourceEstimatePending
							? "Estimating resources…"
							: formatResourceEstimateSummary(page.resourceEstimate)}
					</div>
					{page.resourceEstimate?.reason ? (
						<div className="text-xs text-muted-foreground mt-1">
							{page.resourceEstimate.reason}
						</div>
					) : null}
				</CardContent>
			</Card>
			<DeploymentDetailPlacementCard page={page} />
			<Tabs
				value={page.activeTab}
				onValueChange={(v) =>
					page.setActiveTab(v as "topology" | "logs" | "config")
				}
				className="space-y-6"
			>
				<TabsList>
					<TabsTrigger value="topology" className="gap-2">
						<Network className="h-4 w-4" /> Topology
					</TabsTrigger>
					<TabsTrigger value="logs" className="gap-2">
						<Terminal className="h-4 w-4" /> Logs & Events
					</TabsTrigger>
					<TabsTrigger value="config" className="gap-2">
						<FileJson className="h-4 w-4" /> Configuration
					</TabsTrigger>
				</TabsList>
				<DeploymentDetailTopologyTab page={page} />
				<DeploymentDetailLogsTab page={page} />
				<DeploymentDetailConfigTab page={page} />
			</Tabs>
			<DeploymentDetailDeleteDialog page={page} />
		</div>
	);
}
