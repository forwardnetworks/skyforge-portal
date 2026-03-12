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

export function ForwardTenantRebuildCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;
	const tenantResetRuns = page.tenantResetRunsQ.data?.runs;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Managed Tenant Rebuild</CardTitle>
				<CardDescription>
					Re-sync or fully rebuild the managed in-cluster Forward tenant when
					provisioning drifts.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						onClick={() => page.requestTenantResetMutation.mutate("soft-reset")}
						disabled={page.requestTenantResetMutation.isPending}
					>
						{page.requestTenantResetMutation.isPending
							? "Queueing…"
							: "Soft resync"}
					</Button>
					<Button
						variant="destructive"
						onClick={() => page.requestTenantResetMutation.mutate("hard-reset")}
						disabled={
							page.requestTenantResetMutation.isPending || !page.confirmHardReset
						}
					>
						{page.requestTenantResetMutation.isPending
							? "Queueing…"
							: "Hard rebuild"}
					</Button>
				</div>
				<div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm">
					<div className="font-medium text-destructive">Hard rebuild impact</div>
					<div className="mt-1 text-muted-foreground">
						This deletes the managed Forward tenant state and reprovisions it
						from the Skyforge baseline. Use soft resync first unless the tenant
						is clearly broken.
					</div>
					<div className="mt-3 flex items-center gap-2">
						<Checkbox
							checked={page.confirmHardReset}
							onCheckedChange={(value) =>
								page.setConfirmHardReset(Boolean(value))
							}
						/>
						<Label className="text-sm">
							I understand this rebuild replaces the current managed tenant.
						</Label>
					</div>
				</div>

				{page.tenantResetRunsQ.isLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading recent rebuild runs…
					</div>
				) : null}
				{page.tenantResetRunsQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load managed tenant rebuild runs.
					</div>
				) : null}
				{!page.tenantResetRunsQ.isLoading && (tenantResetRuns?.length ?? 0) === 0 ? (
					<div className="text-sm text-muted-foreground">
						No managed tenant rebuild runs yet.
					</div>
				) : null}
				<div className="space-y-3">
					{tenantResetRuns
						?.slice(0, 5)
						.map((run) => <ForwardTenantResetRunRow key={run.id} run={run} />)}
				</div>
			</CardContent>
		</Card>
	);
}
