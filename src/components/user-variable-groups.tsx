import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
	type UserVariableGroup,
	type UserVariableGroupListResponse,
	deleteUserVariableGroup,
	listUserVariableGroups,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { UserVariableGroupDialog } from "./user-variable-group-dialog";
import { UserVariableGroupsTable } from "./user-variable-groups-table";

type Props = {
	allowEdit: boolean;
};

export function UserVariableGroups({ allowEdit }: Props) {
	const queryClient = useQueryClient();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingGroup, setEditingGroup] = useState<UserVariableGroup | null>(
		null,
	);
	const [deleteTarget, setDeleteTarget] = useState<UserVariableGroup | null>(
		null,
	);

	const groupsQ = useQuery<UserVariableGroupListResponse>({
		queryKey: queryKeys.userVariableGroups(),
		queryFn: listUserVariableGroups,
		staleTime: 30_000,
	});

	const groups = groupsQ.data?.groups ?? [];

	const deleteMutation = useMutation({
		mutationFn: async (groupId: number) => deleteUserVariableGroup(groupId),
		onSuccess: () => {
			toast.success("Variable group deleted");
			queryClient.invalidateQueries({
				queryKey: queryKeys.userVariableGroups(),
			});
			setDeleteTarget(null);
		},
		onError: (e) =>
			toast.error("Failed to delete group", {
				description: (e as Error).message,
			}),
	});

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Variable Groups</CardTitle>
						<CardDescription>
							Define reusable environment variables for your deployments.
						</CardDescription>
					</div>
					<Button
						size="sm"
						onClick={() => setIsCreateOpen(true)}
						disabled={!allowEdit}
					>
						<Plus className="mr-2 h-4 w-4" />
						New Group
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<UserVariableGroupsTable
					groups={groups}
					isLoading={groupsQ.isLoading}
					allowEdit={allowEdit}
					onEdit={setEditingGroup}
					onDelete={setDeleteTarget}
				/>
			</CardContent>

			<UserVariableGroupDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				allowEdit={allowEdit}
				mode="create"
			/>

			{editingGroup && (
				<UserVariableGroupDialog
					open={!!editingGroup}
					onOpenChange={(open) => !open && setEditingGroup(null)}
					allowEdit={allowEdit}
					mode="edit"
					initialData={editingGroup}
				/>
			)}

			<AlertDialog
				open={!!deleteTarget}
				onOpenChange={(open) => !open && setDeleteTarget(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete variable group?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete <strong>{deleteTarget?.name}</strong>
							.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							onClick={() =>
								deleteTarget && deleteMutation.mutate(deleteTarget.id)
							}
						>
							{deleteMutation.isPending ? "Deleting…" : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</Card>
	);
}
