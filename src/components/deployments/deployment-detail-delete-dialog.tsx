import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";

export function DeploymentDetailDeleteDialog({
	page,
}: { page: DeploymentDetailPageState }) {
	const { deployment, destroyDialogOpen, setDestroyDialogOpen, handleDestroy } =
		page;
	if (!deployment) return null;
	return (
		<AlertDialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete deployment?</AlertDialogTitle>
					<AlertDialogDescription>
						This will force-delete <strong>{deployment.name}</strong> from
						Skyforge regardless of current runtime state. This action cannot be
						undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDestroy}
						className={buttonVariants({ variant: "destructive" })}
					>
						Delete Deployment
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
