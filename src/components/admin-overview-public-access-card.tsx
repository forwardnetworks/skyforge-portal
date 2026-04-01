import type { AdminOverviewTabProps } from "./admin-settings-tab-types";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";

function providerLabel(provider: string) {
	switch (provider) {
	case "cloudflare":
		return "Cloudflare Gateway API";
	case "none":
	default:
		return "Direct only";
	}
}

export function AdminOverviewPublicAccessCard(props: AdminOverviewTabProps) {
	const cfg = props.config;
	const tunnel = cfg?.publicTunnel;
	const provider = tunnel?.provider ?? "none";
	const hostnames = tunnel?.hostnames ?? [];

	return (
		<Card>
			<CardHeader>
				<CardTitle>Public access</CardTitle>
				<CardDescription>
					Direct ingress stays on the in-cluster Gateway API path. Optional
					Cloudflare public access is shown here.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{props.configLoading ? (
					<Skeleton className="h-28 w-full" />
				) : (
					<>
						<div className="flex flex-wrap gap-2">
							<Badge variant={provider === "none" ? "outline" : "secondary"}>
								{providerLabel(provider)}
							</Badge>
							<Badge variant="outline">
								direct {tunnel?.directGatewayClass || "cilium"}
							</Badge>
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Public URL</div>
								<div className="font-medium break-all">{cfg?.publicUrl || "not set"}</div>
							</div>
							<div className="rounded-md border p-3 text-sm">
								<div className="text-muted-foreground">Hostnames</div>
								<div className="font-medium break-all">
									{hostnames.length ? hostnames.join(", ") : "none"}
								</div>
							</div>
						</div>
						{provider === "cloudflare" ? (
							<>
								<div className="grid gap-3 text-sm md:grid-cols-2">
									<div className="rounded-md border p-3">
										<div className="text-muted-foreground">Controller</div>
										<div className="font-medium break-all">
											{tunnel?.cloudflare.controllerImage || "not set"}
										</div>
										<div className="text-xs text-muted-foreground">
											{tunnel?.cloudflare.controllerNamespace || "release namespace"} · {tunnel?.cloudflare.controllerName || "controller name unset"}
										</div>
									</div>
									<div className="rounded-md border p-3">
										<div className="text-muted-foreground">Gateway wiring</div>
										<div className="font-medium">
											class {tunnel?.cloudflare.gatewayClassName || "not set"} · gateway {tunnel?.cloudflare.gatewayName || "not set"}
										</div>
										<div className="text-xs text-muted-foreground break-all">
											secret {tunnel?.cloudflare.credentialsSecretName || "not set"}
										</div>
									</div>
								</div>
								<div className="text-xs text-muted-foreground">
									Cloudflare Tunnel records can outlive route deletion if hostnames change.
									Keep DNS cleanup in mind during cutovers.
								</div>
							</>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
}
