import type { AdminRuntimeSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Switch } from "./ui/switch";

function statusVariant(status: string) {
	switch (status) {
	case "ready":
		return "secondary" as const;
	case "blocked":
	case "error":
		return "destructive" as const;
	default:
		return "outline" as const;
	}
}

export function AdminOverviewHetznerBurstCard(props: AdminRuntimeSectionProps) {
	const status = props.hetznerBurstStatus;
	const runtime = props.hetznerBurstRuntimePolicy;
	const loading =
		props.hetznerBurstStatusLoading || props.hetznerBurstRuntimePolicyLoading;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Hetzner Burst</CardTitle>
				<CardDescription>
					Forward-only Hetzner overflow scaffold. Runtime toggles here override
					baseline chart values without forcing an immediate deploy.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{loading ? <Skeleton className="h-36 w-full" /> : null}
				{!loading ? (
					<>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Provider</div>
								<div className="font-medium">
									{status?.provider || "hetzner"}
								</div>
								<div className="text-xs text-muted-foreground">
									{status?.location || "location unset"} · {status?.networkZone || "zone unset"}
								</div>
							</div>
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">State</div>
								<div className="flex flex-wrap gap-2 pt-1">
									<Badge variant={props.hetznerBurstEnabledDraft ? "secondary" : "outline"}>
										scaffold {props.hetznerBurstEnabledDraft ? "enabled" : "disabled"}
									</Badge>
									<Badge
										variant={
											props.hetznerBurstProvisioningEnabledDraft
												? "secondary"
												: "outline"
										}
									>
										provisioning {props.hetznerBurstProvisioningEnabledDraft ? "armed" : "disarmed"}
									</Badge>
									<Badge variant={status?.bootstrapReady ? "secondary" : "outline"}>
										bootstrap {status?.bootstrapReady ? "ready" : "not ready"}
									</Badge>
								</div>
								<div className="pt-2 text-xs text-muted-foreground">
									updated {runtime?.updatedAt || "baseline config"}
								</div>
							</div>
						</div>

						<div className="grid gap-3 md:grid-cols-3">
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Desired replicas</div>
								<div className="text-lg font-semibold">{status?.desiredReplicas ?? 0}</div>
							</div>
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Ready burst nodes</div>
								<div className="text-lg font-semibold">{status?.readyBurstNodes ?? 0}</div>
							</div>
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Managed workers</div>
								<div className="text-lg font-semibold">{status?.managedWorkerCount ?? 0}</div>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="flex items-center justify-between rounded-md border p-3">
								<div className="space-y-1 pr-4">
									<div className="text-sm font-medium">Enable scaffold</div>
									<div className="text-xs text-muted-foreground">
										Allows runtime reconcile to maintain Hetzner scaffold state.
									</div>
								</div>
								<Switch
									checked={props.hetznerBurstEnabledDraft}
									onCheckedChange={props.onHetznerBurstEnabledChange}
								/>
							</div>
							<div className="flex items-center justify-between rounded-md border p-3">
								<div className="space-y-1 pr-4">
									<div className="text-sm font-medium">Enable provisioning</div>
									<div className="text-xs text-muted-foreground">
										Arms worker lifecycle. Leave this off to keep Hetzner disarmed.
									</div>
								</div>
								<Switch
									checked={props.hetznerBurstProvisioningEnabledDraft}
									onCheckedChange={props.onHetznerBurstProvisioningEnabledChange}
									disabled={!props.hetznerBurstEnabledDraft}
								/>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							<Button
								onClick={props.onSaveHetznerBurstRuntimePolicy}
								disabled={props.saveHetznerBurstRuntimePolicyPending}
							>
								{props.saveHetznerBurstRuntimePolicyPending ? "Saving…" : "Save runtime settings"}
							</Button>
						</div>

						{status?.resources?.length ? (
							<div className="space-y-2 rounded-md border p-3 text-sm">
								<div className="font-medium">Scaffold resources</div>
								<div className="flex flex-wrap gap-2">
									{status.resources.map((resource) => (
										<Badge
											key={resource.resourceKey}
											variant={statusVariant(resource.status)}
										>
											{resource.kind} {resource.status}
										</Badge>
									))}
								</div>
								{status.resources.some((resource) => resource.lastError) ? (
									<div className="space-y-1 text-xs text-muted-foreground">
										{status.resources
											.filter((resource) => resource.lastError)
											.map((resource) => (
												<div key={`${resource.resourceKey}-error`}>
													{resource.kind}: {resource.lastError}
												</div>
											))}
									</div>
								) : null}
							</div>
						) : null}
					</>
				) : null}
			</CardContent>
		</Card>
	);
}
