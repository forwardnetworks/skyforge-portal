import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";
import { buttonVariants } from "../ui/button";
import { Checkbox } from "../ui/checkbox";

export function DeploymentsDeleteDialog({
	destroyAlsoDeleteForward,
	destroyDialogOpen,
	destroyHasForward,
	destroyTarget,
	handleDestroy,
	pendingActions,
	setDestroyAlsoDeleteForward,
	setDestroyDialogOpen,
}: Pick<
	DeploymentsPageState,
	| "destroyAlsoDeleteForward"
	| "destroyDialogOpen"
	| "destroyHasForward"
	| "destroyTarget"
	| "handleDestroy"
	| "pendingActions"
	| "setDestroyAlsoDeleteForward"
	| "setDestroyDialogOpen"
>) {
	return (
		<AlertDialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete deployment?</AlertDialogTitle>
					<AlertDialogDescription>
						This will force-delete "{destroyTarget?.name}" from Skyforge
						regardless of current runtime state. This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				{destroyHasForward && (
					<div className="flex items-start gap-3 rounded-md border p-3">
						<Checkbox
							checked={destroyAlsoDeleteForward}
							onCheckedChange={(v) => setDestroyAlsoDeleteForward(Boolean(v))}
							id="delete-forward-network"
						/>
						<label
							htmlFor="delete-forward-network"
							className="text-sm leading-tight cursor-pointer"
						>
							Also delete the Forward network associated with this deployment.
						</label>
					</div>
				)}
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDestroy}
						disabled={Boolean(
							destroyTarget && pendingActions[destroyTarget.id],
						)}
						className={buttonVariants({ variant: "destructive" })}
					>
						{destroyTarget && pendingActions[destroyTarget.id]
							? "Deleting…"
							: "Delete"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
