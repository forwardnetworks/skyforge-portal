import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Server } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getUIConfig,
	getUserInfobloxStatus,
	getUserServiceNowConfig,
	wakeUserInfoblox,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/dashboard/integrations")({
	component: IntegrationsPage,
});

function IntegrationsPage() {
	const snQ = useQuery({
		queryKey: queryKeys.userServiceNowConfig(),
		queryFn: getUserServiceNowConfig,
		retry: false,
		staleTime: 10_000,
	});
	const infobloxQ = useQuery({
		queryKey: ["infobloxStatus", "integrationsPage"],
		queryFn: getUserInfobloxStatus,
		retry: false,
		staleTime: 10_000,
	});
	const wake = useMutation({
		mutationFn: wakeUserInfoblox,
		onSuccess: async (resp) => {
			toast.message(resp.message || "Wake requested");
			await infobloxQ.refetch();
		},
		onError: (error) => {
			toast.error("Failed to wake Infoblox", {
				description: error instanceof Error ? error.message : String(error),
			});
		},
	});
	const uiConfigQ = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		retry: false,
		staleTime: 10_000,
	});
	const infobloxEnabled = uiConfigQ.data?.features?.infobloxEnabled ?? false;
	const jiraEnabled = uiConfigQ.data?.features?.jiraEnabled ?? false;
	const jiraBaseUrl = uiConfigQ.data?.jiraBaseUrl ?? "";
	const rapid7Enabled = uiConfigQ.data?.features?.rapid7Enabled ?? false;
	const rapid7BaseUrl = uiConfigQ.data?.rapid7BaseUrl ?? "";
	const infobloxBaseUrl = uiConfigQ.data?.infobloxBaseUrl ?? "/infoblox/";
	const netboxEnabled = uiConfigQ.data?.features?.netboxEnabled ?? false;
	const nautobotEnabled = uiConfigQ.data?.features?.nautobotEnabled ?? false;

	const infobloxStatus = infobloxQ.data?.ready
		? "Ready"
		: infobloxQ.data?.printableStatus || "Not ready";

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Integrations</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Status hub for external tools and in-cluster services.
				</p>
			</div>

			<div className="space-y-3">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					External Tools
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{jiraEnabled && (
						<Card variant="glass">
							<CardHeader>
								<CardTitle>Jira</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="text-muted-foreground">
									{jiraBaseUrl
										? `Configured (${jiraBaseUrl})`
										: "Enabled, but no Jira URL is configured yet"}
								</div>
								<div className="flex gap-2">
									{jiraBaseUrl ? (
										<Button asChild size="sm">
											<a href={jiraBaseUrl}>Open</a>
										</Button>
									) : (
										<Button size="sm" disabled>
											Open
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{rapid7Enabled && (
						<Card variant="glass">
							<CardHeader>
								<CardTitle>Rapid7</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="text-muted-foreground">
									{rapid7BaseUrl
										? `Configured (${rapid7BaseUrl})`
										: "Enabled, but no Rapid7 URL is configured yet"}
								</div>
								<div className="flex gap-2">
									{rapid7BaseUrl ? (
										<Button asChild size="sm">
											<a href={rapid7BaseUrl}>Open</a>
										</Button>
									) : (
										<Button size="sm" disabled>
											Open
										</Button>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{netboxEnabled && (
						<Card variant="glass">
							<CardHeader>
								<CardTitle>NetBox</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="text-muted-foreground">Enabled</div>
								<div className="flex gap-2">
									<Button asChild size="sm">
										<a href="/netbox/" target="_blank" rel="noreferrer noopener">
											Open
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}

					{nautobotEnabled && (
						<Card variant="glass">
							<CardHeader>
								<CardTitle>Nautobot</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="text-muted-foreground">Enabled</div>
								<div className="flex gap-2">
									<Button asChild size="sm">
										<a href="/nautobot/" target="_blank" rel="noreferrer noopener">
											Open
										</a>
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<div className="space-y-3">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
					In-Cluster Services
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
				<Card variant="glass">
					<CardHeader>
						<CardTitle>ServiceNow</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="text-muted-foreground">
							{snQ.isLoading
								? "Loading…"
								: snQ.data?.configured
									? `Configured (${snQ.data.instanceUrl ?? "instance"})`
									: "Not configured"}
						</div>
							<div className="flex gap-2">
								<Button asChild size="sm">
									<Link to="/dashboard/servicenow">Open</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

				{infobloxEnabled && (
					<Card variant="glass">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Server className="h-5 w-5" />
								Infoblox
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="text-muted-foreground">
								{infobloxQ.isLoading ? "Loading…" : infobloxStatus}
							</div>
							<div className="flex gap-2">
								<Button size="sm" onClick={() => wake.mutate()} disabled={wake.isPending}>
									{wake.isPending ? "Starting…" : "Start/Wake"}
								</Button>
								<Button asChild size="sm">
									<a href={infobloxBaseUrl}>Open UI</a>
								</Button>
								<Button asChild size="sm" variant="secondary">
									<Link to="/dashboard/integrations/infoblox/console">
										Open Console
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
				</div>
			</div>
		</div>
	);
}
