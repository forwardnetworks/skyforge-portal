import { Link } from "@tanstack/react-router";
import { Filter, Plus, Search, Box } from "lucide-react";
import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { useUIExperienceMode } from "../../hooks/use-ui-experience-mode";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { buttonVariants } from "../ui/button";

export function DeploymentsPageToolbar({
	state,
}: {
	state: Pick<
		DeploymentsPageState,
		| "searchQuery"
		| "setSearchQuery"
		| "statusFilter"
		| "setStatusFilter"
		| "typeFilter"
		| "setTypeFilter"
		| "selectedUserScopeId"
	>;
}) {
	const uiExperience = useUIExperienceMode();

	return (
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
			<Select value={state.statusFilter} onValueChange={state.setStatusFilter}>
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
			<Select value={state.typeFilter} onValueChange={state.setTypeFilter}>
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
			{uiExperience.isAdvanced ? (
				<>
					<Link
						to="/dashboard/deployments/new"
						search={{ userId: state.selectedUserScopeId }}
						className={buttonVariants({ variant: "default" })}
					>
						<Plus className="mr-2 h-4 w-4" /> Create
					</Link>
					<Link
						to="/dashboard/deployments/composite"
						search={{ userId: state.selectedUserScopeId }}
						className={buttonVariants({ variant: "secondary" })}
					>
						Composite
					</Link>
				</>
			) : null}
		</div>
	);
}
