import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Workflow } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	getUIConfig,
	getUserServiceNowConfig,
	listUserForwardCollectorConfigs,
	wakeUserInfoblox,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/dashboard/integrations")({
	component: IntegrationsPage,
});

function IntegrationsPage() {
	const [startingInfoblox, setStartingInfoblox] = useState(false);
	const snQ = useQuery({
		queryKey: queryKeys.userServiceNowConfig(),
		queryFn: getUserServiceNowConfig,
		retry: false,
		staleTime: 10_000,
	});
	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		retry: false,
		staleTime: 10_000,
	});
	const uiConfigQ = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		retry: false,
		staleTime: 10_000,
	});
	const collectorCount = collectorsQ.data?.collectors?.length ?? 0;
	const hasCollector = collectorCount > 0;
	const infobloxEnabled = uiConfigQ.data?.features?.infobloxEnabled ?? false;
	const infobloxBaseUrl = uiConfigQ.data?.infobloxBaseUrl ?? "/infoblox";
	const jiraEnabled = uiConfigQ.data?.features?.jiraEnabled ?? false;
	const jiraBaseUrl = uiConfigQ.data?.jiraBaseUrl ?? "";

	const launchInfoblox = async () => {
		const href = infobloxBaseUrl || "/infoblox/";
		const popup = window.open("about:blank", "_blank", "noopener,noreferrer");
		setStartingInfoblox(true);
		try {
			const resp = await wakeUserInfoblox();
			if (!resp.ready) {
				toast.message(resp.message ?? "Infoblox VM is starting");
			}
		} catch (error) {
			console.error("infoblox wake failed", error);
			toast.error("Failed to start Infoblox VM; opening route directly");
		} finally {
			setStartingInfoblox(false);
			if (popup && !popup.closed) {
				popup.location.href = href;
				return;
			}
			window.open(href, "_blank", "noopener,noreferrer");
		}
	};

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Integrations</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Connect optional tools and services that enhance Skyforge workflows.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				<Card variant="glass">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Workflow className="h-5 w-5" />
							Forward collector
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="text-muted-foreground">
							{collectorsQ.isLoading
								? "Loading…"
								: hasCollector
									? `${collectorCount} collector(s) configured`
									: "No collectors configured"}
						</div>
						<div className="flex gap-2">
							<Button asChild size="sm">
								<Link to="/dashboard/forward">Open</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

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
							<Button asChild size="sm" variant="secondary">
								<Link
									to="/dashboard/docs/$slug"
									params={{ slug: "servicenow" }}
								>
									Docs
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

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
										<a
											href={jiraBaseUrl}
											target="_blank"
											rel="noreferrer noopener"
										>
											Open
										</a>
									</Button>
								) : (
									<Button size="sm" disabled>
										Open
									</Button>
								)}
								<Button asChild size="sm" variant="secondary">
									<Link
										to="/dashboard/docs/$slug"
										params={{ slug: "getting-started" }}
									>
										Plan
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				{infobloxEnabled && (
					<Card variant="glass">
						<CardHeader>
							<CardTitle>Infoblox</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<div className="text-muted-foreground">
								KubeVirt-backed NIOS appliance exposed through the shared Skyforge ingress.
							</div>
							<div className="flex gap-2">
								<Button size="sm" onClick={launchInfoblox} disabled={startingInfoblox}>
									{startingInfoblox ? "Starting…" : "Open"}
								</Button>
							</div>
						</CardContent>
					</Card>
				)}

				<Card variant="glass">
					<CardHeader>
						<CardTitle>Advanced settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="text-muted-foreground">
							Cloud creds, BYOL servers, defaults, and external template repos.
						</div>
						<div className="flex flex-wrap gap-2">
							<Button asChild size="sm" variant="secondary">
								<Link to="/settings">Open Settings</Link>
							</Button>
							<Button asChild size="sm" variant="secondary">
								<a href="/dashboard/docs/getting-started">
									Getting started{" "}
									<ExternalLink className="ml-1 inline h-4 w-4" />
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
