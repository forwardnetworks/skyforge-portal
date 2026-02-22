import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import {
	getUserElasticConfig,
	getUserServiceNowConfig,
	listUserForwardCollectorConfigs,
} from "@/lib/skyforge-api";

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
	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		retry: false,
		staleTime: 10_000,
	});
	const elasticQ = useQuery({
		queryKey: queryKeys.userElasticConfig(),
		queryFn: getUserElasticConfig,
		retry: false,
		staleTime: 10_000,
	});

	const collectorCount = collectorsQ.data?.collectors?.length ?? 0;
	const hasCollector = collectorCount > 0;

	return (
		<div className="space-y-6 p-6">
			<div>
				<h1 className="text-2xl font-bold">Integrations</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Connect optional tools and accounts that enhance Skyforge workflows.
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

				<Card variant="glass">
					<CardHeader>
						<CardTitle>Elastic</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="text-muted-foreground">
							{elasticQ.isLoading
								? "Loading…"
								: !elasticQ.data?.enabled
									? "Disabled"
									: elasticQ.data?.configured
										? `Configured (${elasticQ.data.url ?? "endpoint"})`
										: "Not configured"}
						</div>
						<div className="flex flex-wrap gap-2">
							<Button asChild size="sm">
								<Link to="/dashboard/elastic">Open</Link>
							</Button>
							<Button asChild size="sm" variant="secondary">
								<a href="/kibana/">
									Kibana <ExternalLink className="ml-1 inline h-4 w-4" />
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>

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
								<Link to="/dashboard/settings">Open My Settings</Link>
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
