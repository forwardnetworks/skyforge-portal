import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { ForwardTenantResetRunRow } from "./forward-tenant-reset-run-row";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;
type ManagedTenantKey = "demo" | "primary";

function tenantCopy(tenant: ManagedTenantKey) {
	if (tenant === "demo") {
		return {
			title: "Demo Org Reset",
			description:
				"Destroy and recreate the curated demo org, then replay the admin-managed demo seed catalog.",
			softLabel: "Rebuild from demo catalog",
			hardLabel: "Destroy and recreate demo",
			impact:
				"This replaces the current demo org state, replays all enabled demo seed snapshots into Demo Network, and rotates the demo credential. Deployment-backed networks and collector wiring are not touched.",
			allowCurated: true,
		};
	}
	return {
		title: "Deployment Org Rebuild",
		description:
			"Re-sync or fully rebuild the deployment Forward org when provisioning drifts.",
		softLabel: "Soft resync",
		hardLabel: "Hard rebuild",
		impact:
			"This deletes the managed deployment org state and reprovisions it from the Skyforge baseline. Use soft resync first unless the org is clearly broken.",
		allowCurated: false,
	};
}

export function ForwardTenantRebuildCard(props: {
	page: ForwardCredentialsPageState;
	tenant: ManagedTenantKey;
}) {
	const { page, tenant } = props;
	const state = page.tenants[tenant];
	const copy = tenantCopy(tenant);
	const resetRuns = state.resetRunsQ.data?.runs;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{copy.title}</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() =>
							page.requestTenantResetMutation.mutate({
								tenant,
								mode: copy.allowCurated ? "curated-reset" : "soft-reset",
							})
						}
						disabled={page.requestTenantResetMutation.isPending}
					>
						{page.requestTenantResetMutation.isPending ? "Queueing…" : copy.softLabel}
					</Button>
					<Button
						variant="destructive"
						onClick={() =>
							page.requestTenantResetMutation.mutate({
								tenant,
								mode: "hard-reset",
							})
						}
						disabled={
							page.requestTenantResetMutation.isPending ||
							!state.confirmHardReset
						}
					>
						{page.requestTenantResetMutation.isPending
							? "Queueing…"
							: copy.hardLabel}
					</Button>
				</div>
				<div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
					<div className="font-medium text-destructive">Hard rebuild impact</div>
					<div className="mt-1 text-muted-foreground">{copy.impact}</div>
					<div className="mt-3 flex items-center gap-2">
						<Checkbox
							checked={state.confirmHardReset}
							onCheckedChange={(value) =>
								page.setConfirmHardReset(tenant, Boolean(value))
							}
						/>
						<Label className="text-sm">
							I understand this rebuild replaces the current {tenant} org.
						</Label>
					</div>
				</div>

				{state.resetRunsQ.isLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading recent rebuild runs…
					</div>
				) : null}
				{state.resetRunsQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load reset runs.
					</div>
				) : null}
				{!state.resetRunsQ.isLoading && (resetRuns?.length ?? 0) === 0 ? (
					<div className="text-sm text-muted-foreground">
						No reset runs yet.
					</div>
				) : null}
				<div className="space-y-3">
					{resetRuns
						?.slice(0, 5)
						.map((run) => <ForwardTenantResetRunRow key={run.id} run={run} />)}
				</div>
			</CardContent>
		</Card>
	);
}
