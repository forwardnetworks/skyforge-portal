import { Link } from "@tanstack/react-router";
import {
	Box,
	Clock3,
	ExternalLink,
	Filter,
	Inbox,
	Info,
	MoreHorizontal,
	Play,
	Plus,
	Search,
	StopCircle,
	Trash2,
} from "lucide-react";
import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import type { UserScopeDeployment } from "../../lib/api-client";
import { Badge } from "../ui/badge";
import { Button, buttonVariants } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import type { DataTableColumn } from "../ui/data-table";
import { DataTable } from "../ui/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { DeploymentStatusBadge } from "./deployment-status-badge";
import { DeploymentsActivityFeed } from "./deployments-activity-feed";
import { DeploymentsDeleteDialog } from "./deployments-delete-dialog";
import { DeploymentsLifetimeDialog } from "./deployments-lifetime-dialog";

export function DeploymentsPageContent({
	state,
}: { state: DeploymentsPageState }) {
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
			cell: (deployment) => {
				const primaryAction = state.resolveDeploymentPrimaryAction(deployment);
				const canBringUp = primaryAction === "bring_up";
				const canShutDown = primaryAction === "shut_down";
				const forwardNetworkId = state.deploymentForwardNetworkId(deployment);
				const isBusy =
					Boolean(deployment.activeTaskId) ||
					Boolean(state.pendingActions[deployment.id]);
				const managedByLifetime = state.isManagedDeploymentType(
					deployment.family,
				);
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
									state.navigate({
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
							{managedByLifetime && (
								<DropdownMenuItem
									onClick={() => state.openLifetimeDialog(deployment)}
									disabled={isBusy || canShutDown}
								>
									<Clock3 className="mr-2 h-4 w-4" />
									Manage lifetime
								</DropdownMenuItem>
							)}
							{managedByLifetime && <DropdownMenuSeparator />}
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
			},
		},
	];

	return (
		<div className="space-y-5 p-4 lg:p-5">
			<div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
					<p className="text-sm text-muted-foreground">
						Manage deployments and monitor activity.
					</p>
				</div>
				<div className="flex items-center gap-3">
					{state.selectedUserScope ? (
						<Badge variant="outline">
							{state.selectedUserScope.name} ({state.selectedUserScope.slug})
						</Badge>
					) : (
						<Badge variant="secondary">No user selected</Badge>
					)}
				</div>
			</div>

			{!state.snap.data && (
				<Card className="border-dashed">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center justify-center space-y-4 py-8">
							<Skeleton className="h-4 w-64" />
							<div className="text-center text-muted-foreground">
								Loading dashboard…
								<div className="mt-2 text-xs">
									If you are logged out,{" "}
									<a
										className="text-primary underline hover:no-underline"
										href={state.loginHref}
										onClick={(event) => {
											event.preventDefault();
											void state.handleLogin();
										}}
									>
										login
									</a>
									.
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			<div className="relative flex flex-col items-start gap-6 lg:flex-row">
				<div className="w-full min-w-0 flex-1 space-y-4">
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search deployments..."
								className="pl-9"
								value={state.searchQuery}
								onChange={(event) => state.setSearchQuery(event.target.value)}
							/>
						</div>
						<Select
							value={state.statusFilter}
							onValueChange={state.setStatusFilter}
						>
							<SelectTrigger className="w-[140px]">
								<Filter className="mr-2 h-4 w-4 text-muted-foreground" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="running">Running</SelectItem>
								<SelectItem value="stopped">Stopped</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
							</SelectContent>
						</Select>
						<Select
							value={state.typeFilter}
							onValueChange={state.setTypeFilter}
						>
							<SelectTrigger className="w-[140px]">
								<Box className="mr-2 h-4 w-4 text-muted-foreground" />
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="netlab">Netlab</SelectItem>
								<SelectItem value="containerlab">Containerlab</SelectItem>
								<SelectItem value="terraform">Terraform</SelectItem>
							</SelectContent>
						</Select>
						<Link
							to="/dashboard/deployments/new"
							search={{ userId: state.selectedUserScopeId }}
							className={buttonVariants({ variant: "default" })}
						>
							<Plus className="mr-2 h-4 w-4" /> Create
						</Link>
					</div>

					<Card>
						<CardContent className="p-0">
							{!state.snap.data ? (
								<div className="space-y-4 p-6">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
							) : state.deployments.length === 0 ? (
								<EmptyState
									icon={Inbox}
									title="No deployments found"
									description={
										state.searchQuery || state.statusFilter !== "all"
											? "Try adjusting your filters."
											: "You haven't created any deployments for this user yet."
									}
									action={
										!state.searchQuery && state.statusFilter === "all"
											? {
													label: "Create deployment",
													onClick: () =>
														state.navigate({
															to: "/dashboard/deployments/new",
															search: { userId: state.selectedUserScopeId },
														}),
												}
											: undefined
									}
								/>
							) : (
								<DataTable
									columns={columns}
									rows={state.deployments}
									getRowId={(deployment) => deployment.id}
									minWidthClassName="min-w-0"
									scrollable={false}
								/>
							)}
						</CardContent>
					</Card>
				</div>

				<DeploymentsActivityFeed {...state} />
			</div>

			<DeploymentsLifetimeDialog {...state} />
			<DeploymentsDeleteDialog {...state} />
		</div>
	);
}
