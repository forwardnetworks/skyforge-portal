import type { AdminUsersSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

function formatResetRunTime(value?: string): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function tenantResetBadgeVariant(status?: string): "secondary" | "default" | "destructive" | "outline" {
	switch (status) {
		case "ready":
			return "default";
		case "failed":
			return "destructive";
		case "requested":
		case "draining":
		case "deleting":
		case "reprovisioning":
		case "validating":
			return "secondary";
		default:
			return "outline";
	}
}

export function AdminUsersForwardResetCard(props: AdminUsersSectionProps) {
	const {
		platformPolicyTargetUser,
		adminForwardTenantResetRunsLoading,
		adminForwardTenantResetRuns,
		adminForwardTenantResetMode,
		adminForwardTenantResetConfirm,
		requestAdminForwardTenantResetPending,
		onAdminForwardTenantResetModeChange,
		onAdminForwardTenantResetConfirmChange,
		onRequestAdminForwardTenantReset,
	} = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Forward Org Reset</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-sm text-muted-foreground">
					Queue a managed reset for the selected user’s Forward org and inspect recent reset history.
				</div>
				<div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
					<div className="space-y-2">
						<Label htmlFor="admin-forward-reset-mode">Reset mode</Label>
						<Select
							value={adminForwardTenantResetMode}
							onValueChange={(value) =>
								onAdminForwardTenantResetModeChange(
									value as "hard-reset" | "curated-reset",
								)
							}
						>
							<SelectTrigger id="admin-forward-reset-mode">
								<SelectValue placeholder="Select reset mode" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="hard-reset">hard-reset</SelectItem>
								<SelectItem value="curated-reset">curated-reset</SelectItem>
							</SelectContent>
						</Select>
						<div className="text-xs text-muted-foreground">
							`curated-reset` preserves the managed baseline contract; `hard-reset` fully rebuilds without curated restore intent.
						</div>
						<div className="rounded border border-destructive/30 bg-destructive/5 p-3">
							<div className="text-sm font-medium text-destructive">
								Destructive reset confirmation
							</div>
							<div className="mt-1 text-xs text-muted-foreground">
								Type the selected username to confirm that this reset will
								rebuild that user&apos;s managed Forward org state.
							</div>
							<Input
								className="mt-3"
								value={adminForwardTenantResetConfirm}
								onChange={(event) =>
									onAdminForwardTenantResetConfirmChange(event.target.value)
								}
								placeholder={platformPolicyTargetUser || "username"}
							/>
						</div>
					</div>
					<Button
						variant="destructive"
						disabled={
							requestAdminForwardTenantResetPending ||
							!platformPolicyTargetUser ||
							adminForwardTenantResetConfirm.trim().toLowerCase() !==
								platformPolicyTargetUser.trim().toLowerCase()
						}
						onClick={onRequestAdminForwardTenantReset}
					>
						{requestAdminForwardTenantResetPending
							? "Queueing…"
							: "Queue reset"}
					</Button>
				</div>

				{!platformPolicyTargetUser ? (
					<div className="text-sm text-muted-foreground">
						Select a user first.
					</div>
				) : adminForwardTenantResetRunsLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading reset history…
					</div>
				) : adminForwardTenantResetRuns.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No reset history for this user yet.
					</div>
				) : (
					<div className="space-y-3">
						{adminForwardTenantResetRuns.slice(0, 8).map((run) => (
							<div key={run.id} className="rounded border p-3">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<div className="text-sm font-medium">{run.mode}</div>
										<Badge variant={tenantResetBadgeVariant(run.status)}>
											{run.status}
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground">
										{formatResetRunTime(run.updatedAt || run.createdAt)}
									</div>
								</div>
								<div className="mt-2 text-xs text-muted-foreground">
									Requested by {run.requestedBy || "—"}
									{run.reason ? ` • ${run.reason}` : ""}
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									Baseline deployments: {run.baseline?.deployments?.length ?? 0}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
