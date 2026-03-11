import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
	type UserVariableGroup,
	type UserVariableGroupUpsertRequest,
	createUserVariableGroup,
	updateUserVariableGroup,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { Button } from "./ui/button";
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
import { Textarea } from "./ui/textarea";

type UserVariableGroupDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	allowEdit: boolean;
	mode: "create" | "edit";
	initialData?: UserVariableGroup;
};

export function UserVariableGroupDialog({
	open,
	onOpenChange,
	allowEdit,
	mode,
	initialData,
}: UserVariableGroupDialogProps) {
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
			for (const variable of vars) {
				if (variable.key.trim()) {
					variables[variable.key.trim()] = variable.value;
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
		onError: (error) =>
			toast.error("Failed to save group", {
				description: (error as Error).message,
			}),
	});

	const setVar = (idx: number, next: { key: string; value: string }) => {
		setVars((prev) => prev.map((variable, i) => (i === idx ? next : variable)));
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
							{vars.map((variable, idx) => (
								<div key={idx} className="grid grid-cols-12 gap-2">
									<Input
										value={variable.key}
										onChange={(e) =>
											setVar(idx, {
												key: e.target.value,
												value: variable.value,
											})
										}
										placeholder="KEY"
										className="col-span-5 font-mono text-xs"
										disabled={!allowEdit}
									/>
									<Textarea
										value={variable.value}
										onChange={(e) =>
											setVar(idx, {
												key: variable.key,
												value: e.target.value,
											})
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
