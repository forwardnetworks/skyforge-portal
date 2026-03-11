import { Edit2, Trash2 } from "lucide-react";
import type { UserVariableGroup } from "../lib/api-client";
import { Button } from "./ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";

type UserVariableGroupsTableProps = {
	groups: UserVariableGroup[];
	isLoading: boolean;
	allowEdit: boolean;
	onEdit: (group: UserVariableGroup) => void;
	onDelete: (group: UserVariableGroup) => void;
};

export function UserVariableGroupsTable({
	groups,
	isLoading,
	allowEdit,
	onEdit,
	onDelete,
}: UserVariableGroupsTableProps) {
	if (isLoading) {
		return <div className="text-sm text-muted-foreground">Loading groups…</div>;
	}

	if (groups.length === 0) {
		return (
			<div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
				No variable groups defined.
			</div>
		);
	}

	return (
		<div className="rounded-md border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Variables</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{groups.map((group) => (
						<TableRow key={group.id}>
							<TableCell className="font-medium">{group.name}</TableCell>
							<TableCell className="text-muted-foreground text-xs">
								{Object.keys(group.variables ?? {}).length} variables
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8"
										onClick={() => onEdit(group)}
										disabled={!allowEdit}
									>
										<Edit2 className="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-destructive hover:text-destructive"
										onClick={() => onDelete(group)}
										disabled={!allowEdit}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
