import { Link } from "@tanstack/react-router";
import type { DataTableColumn } from "../ui/data-table";
import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import type { UserScopeDeployment } from "../../lib/api-client";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { DeploymentsPageActionsMenu } from "./deployments-page-actions-menu";

export function getDeploymentsTableColumns(state: DeploymentsPageState) {
	const columns: Array<DataTableColumn<UserScopeDeployment>> = [
		{
			id: "name",
			header: "Name",
			width: "minmax(240px, 1fr)",
			cell: (deployment) => (
				<Link
					to="/dashboard/deployments/$deploymentId"
					params={{ deploymentId: deployment.id }}
					className="flex items-center gap-2 font-medium text-foreground hover:underline"
				>
					{deployment.name}
				</Link>
			),
		},
		{
			id: "type",
			header: "Type",
			width: 160,
			cell: (deployment) => (
				<span className="text-muted-foreground">
					{state.formatDeploymentType(deployment)}
				</span>
			),
		},
		{
			id: "status",
			header: "Status",
			width: 150,
			cell: (deployment) => (
				<DeploymentStatusBadge
					status={state.resolveDeploymentDisplayStatus(deployment)}
				/>
			),
		},
		{
			id: "lifetime",
			header: "Lifetime",
			width: 210,
			cell: (deployment) => (
				<span className="text-muted-foreground">
					{state.formatLifetimeCell(deployment)}
				</span>
			),
		},
		{
			id: "actions",
			header: "Actions",
			width: 120,
			align: "right",
			cell: (deployment) => (
				<DeploymentsPageActionsMenu deployment={deployment} state={state} />
			),
		},
	];

	return columns;
}
