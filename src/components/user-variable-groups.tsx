import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "../lib/query-keys";
import {
	type UserVariableGroup,
	type UserVariableGroupListResponse,
	type UserVariableGroupUpsertRequest,
	createUserVariableGroup,
	deleteUserVariableGroup,
	listUserVariableGroups,
	updateUserVariableGroup,
} from "../lib/skyforge-api";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./ui/table";
import { Textarea } from "./ui/textarea";

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
				{groupsQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading groups…</div>
				) : groups.length === 0 ? (
					<div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
						No variable groups defined.
					</div>
				) : (
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
								{groups.map((g: UserVariableGroup) => (
									<TableRow key={g.id}>
										<TableCell className="font-medium">{g.name}</TableCell>
										<TableCell className="text-muted-foreground text-xs">
											{Object.keys(g.variables ?? {}).length} variables
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => setEditingGroup(g)}
													disabled={!allowEdit}
												>
													<Edit2 className="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:text-destructive"
													onClick={() => setDeleteTarget(g)}
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
				)}
			</CardContent>

			<VariableGroupDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
				allowEdit={allowEdit}
				mode="create"
			/>

			{editingGroup && (
				<VariableGroupDialog
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

function VariableGroupDialog({
	open,
	onOpenChange,
	allowEdit,
	mode,
	initialData,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allowEdit: boolean;
	mode: "create" | "edit";
	initialData?: UserVariableGroup;
}) {
	const queryClient = useQueryClient();
	const [name, setName] = useState(initialData?.name ?? "");
	const [vars, setVars] = useState<{ key: string; value: string }[]>(() => {
		if (!initialData?.variables) return [{ key: "", value: "" }];
		return Object.entries(initialData.variables).map(([key, value]) => ({
			key,
			value,
		}));
	});

	const mutation = useMutation({
		mutationFn: async () => {
			const variables: Record<string, string> = {};
			for (const v of vars) {
				if (v.key.trim()) {
					variables[v.key.trim()] = v.value;
				}
			}
			const payload: UserVariableGroupUpsertRequest = {
				name: name.trim(),
				variables,
			};
			if (mode === "create") return createUserVariableGroup(payload);
			return updateUserVariableGroup(initialData?.id ?? 0, payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.userVariableGroups(),
			});
			toast.success(mode === "create" ? "Variable group created" : "Saved");
			onOpenChange(false);
		},
		onError: (e) =>
			toast.error("Failed to save group", {
				description: (e as Error).message,
			}),
	});

	const setVar = (idx: number, next: { key: string; value: string }) => {
		setVars((prev) => prev.map((v, i) => (i === idx ? next : v)));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "New variable group" : "Edit variable group"}
					</DialogTitle>
					<DialogDescription>
						Group common environment variables to reuse across deployments.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1">
						<Label>Name</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Defaults"
							disabled={!allowEdit}
						/>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label>Variables</Label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() =>
									setVars((prev) => [...prev, { key: "", value: "" }])
								}
								disabled={!allowEdit}
							>
								Add variable
							</Button>
						</div>
						<div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
							{vars.map((v, idx) => (
								<div key={idx} className="grid grid-cols-12 gap-2">
									<Input
										value={v.key}
										onChange={(e) =>
											setVar(idx, { key: e.target.value, value: v.value })
										}
										placeholder="KEY"
										className="col-span-5 font-mono text-xs"
										disabled={!allowEdit}
									/>
									<Textarea
										value={v.value}
										onChange={(e) =>
											setVar(idx, { key: v.key, value: e.target.value })
										}
										placeholder="Value"
										rows={1}
										className="col-span-7 text-xs"
										disabled={!allowEdit}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => mutation.mutate()}
						disabled={!allowEdit || mutation.isPending}
					>
						{mutation.isPending ? "Saving…" : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
