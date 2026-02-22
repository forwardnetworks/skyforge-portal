import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Hammer } from "lucide-react";
import { useMemo } from "react";
import { TopologyViewer } from "../../../components/topology-viewer";
import { Badge } from "../../../components/ui/badge";
import { buttonVariants } from "../../../components/ui/button";
import { EmptyState } from "../../../components/ui/empty-state";
import { Skeleton } from "../../../components/ui/skeleton";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import { queryKeys } from "../../../lib/query-keys";
import {
	type DashboardSnapshot,
	type UserScopeDeployment,
	getDeploymentTopology,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute(
	"/dashboard/deployments/$deploymentId/map",
)({
	component: DeploymentMapPage,
});

function DeploymentMapPage() {
	const { deploymentId } = Route.useParams();
	useDashboardEvents(true);

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: async () => null,
		initialData: null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const deployment = useMemo(() => {
		return (snap.data?.deployments ?? []).find(
			(d: UserScopeDeployment) => d.id === deploymentId,
		);
	}, [deploymentId, snap.data?.deployments]);

	const userId = String(deployment?.userId ?? "");
	const deploymentType = String(deployment?.type ?? "");
	const status =
		deployment?.activeTaskStatus ?? deployment?.lastStatus ?? "unknown";

	const topology = useQuery({
		queryKey: queryKeys.deploymentTopology(userId, deploymentId),
		queryFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			return getDeploymentTopology(deployment.userId, deployment.id);
		},
		enabled:
			!!deployment &&
			["containerlab", "netlab-c9s", "clabernetes"].includes(deploymentType),
		retry: false,
		staleTime: 10_000,
	});

	if (!deployment) {
		if (snap.isLoading || snap.isFetching) {
			return (
				<div className="h-screen w-screen p-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-9 w-9" />
						<Skeleton className="h-8 w-64" />
					</div>
					<div className="mt-6">
						<Skeleton className="h-[75vh] w-full" />
					</div>
				</div>
			);
		}
		return (
			<div className="h-screen w-screen p-6">
				<EmptyState
					title="Deployment not found"
					description="This deployment may have been deleted or you don't have access."
					action={{ label: "Back", onClick: () => window.close() }}
				/>
			</div>
		);
	}

	return (
		<div className="h-screen w-screen flex flex-col bg-background">
			<div className="flex items-center justify-between gap-3 border-b px-4 py-3">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						to="/dashboard/deployments/$deploymentId"
						params={{ deploymentId }}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
						title="Back to deployment"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="min-w-0">
						<div className="flex items-center gap-2 min-w-0">
							<div className="font-semibold truncate">{deployment.name}</div>
							<Badge variant="secondary" className="capitalize">
								{status}
							</Badge>
							<Badge variant="outline" className="capitalize">
								{deploymentType || "unknown"}
							</Badge>
						</div>
						<div className="text-xs text-muted-foreground font-mono truncate">
							{deployment.id}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<a
						href={`/dashboard/labs/designer?userId=${encodeURIComponent(userId)}&importDeploymentId=${encodeURIComponent(deploymentId)}`}
						target="_blank"
						rel="noreferrer noopener"
						className={buttonVariants({ variant: "outline", size: "sm" })}
						title="Open this running topology in the Lab Designer (new tab)"
					>
						<Hammer className="mr-2 h-4 w-4" />
						Edit in Designer
					</a>
					<Link
						to="/dashboard/deployments/$deploymentId"
						params={{ deploymentId }}
						className={buttonVariants({ variant: "outline", size: "sm" })}
						title="Open the deployment page"
					>
						<ExternalLink className="mr-2 h-4 w-4" />
						Details
					</Link>
				</div>
			</div>

			<div className="flex-1 min-h-0 p-3">
				<div className="h-full">
					<TopologyViewer
						topology={topology.data}
						userId={deployment.userId}
						deploymentId={deployment.id}
						enableTerminal={["netlab-c9s", "clabernetes"].includes(
							deployment.type,
						)}
						fullHeight
					/>
				</div>
			</div>
		</div>
	);
}
