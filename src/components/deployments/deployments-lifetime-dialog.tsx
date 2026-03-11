import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

export function DeploymentsLifetimeDialog({
	allowNoExpiry,
	lifetimeDialogOpen,
	lifetimeHoursOptions,
	lifetimeSelection,
	lifetimeTarget,
	saveLifetimeMutation,
	setLifetimeDialogOpen,
	setLifetimeSelection,
}: Pick<
	DeploymentsPageState,
	| "allowNoExpiry"
	| "lifetimeDialogOpen"
	| "lifetimeHoursOptions"
	| "lifetimeSelection"
	| "lifetimeTarget"
	| "saveLifetimeMutation"
	| "setLifetimeDialogOpen"
	| "setLifetimeSelection"
>) {
	return (
		<Dialog open={lifetimeDialogOpen} onOpenChange={setLifetimeDialogOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Manage deployment lifetime</DialogTitle>
					<DialogDescription>
						Set automatic expiry for "{lifetimeTarget?.name}". Managed
						deployments are stopped on expiry (Terraform uses destroy).
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-2">
					<Label htmlFor="deployment-lifetime-select">Lifetime</Label>
					<Select
						value={lifetimeSelection}
						onValueChange={setLifetimeSelection}
						disabled={saveLifetimeMutation.isPending}
					>
						<SelectTrigger id="deployment-lifetime-select">
							<SelectValue placeholder="Select a lifetime" />
						</SelectTrigger>
						<SelectContent>
							{allowNoExpiry && (
								<SelectItem value="__none">No expiry (admin only)</SelectItem>
							)}
							{lifetimeHoursOptions.map((hours) => (
								<SelectItem key={String(hours)} value={String(hours)}>
									{hours} hours
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setLifetimeDialogOpen(false)}
						disabled={saveLifetimeMutation.isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={() => saveLifetimeMutation.mutate()}
						disabled={saveLifetimeMutation.isPending || !lifetimeTarget}
					>
						{saveLifetimeMutation.isPending ? "Saving…" : "Save lifetime"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
