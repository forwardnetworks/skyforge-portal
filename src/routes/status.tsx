import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	AlertTriangle,
	CheckCircle2,
	Cloud,
	Database,
	GitBranch,
	Globe,
	Network,
	Webhook,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { queryKeys } from "../lib/query-keys";
import {
	SKYFORGE_API,
	getStatusSummary,
	getUIConfig,
} from "../lib/skyforge-api";
import { useStatusSummaryEvents } from "../lib/status-events";

export const Route = createFileRoute("/status")({
	component: StatusPage,
});

type ToolStatus = "up" | "down" | "unknown";

function normalizeText(v: string): string {
	return String(v || "")
		.trim()
		.toLowerCase();
}

function resolveToolStatus(
	checks: Array<{ name: string; status: string }>,
	matchers: string[],
): ToolStatus {
	const normalizedMatchers = matchers.map(normalizeText).filter(Boolean);
	if (!normalizedMatchers.length) return "unknown";
	for (const check of checks) {
		const checkName = normalizeText(check.name);
		if (!normalizedMatchers.some((m) => checkName.includes(m))) continue;
		return check.status === "up" || check.status === "ok" ? "up" : "down";
	}
	return "unknown";
}

function StatusPage() {
	useStatusSummaryEvents(true);

	const summary = useQuery({
		queryKey: queryKeys.statusSummary(),
		queryFn: getStatusSummary,
		staleTime: Number.POSITIVE_INFINITY,
	});
	const uiConfig = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const statusData = summary.data;
	const checks = statusData?.checks ?? [];
	const downChecks = checks.filter(
		(c) => c.status !== "up" && c.status !== "ok",
	);
	const features = uiConfig.data?.features;

	const tools = [
		{
			id: "git",
			name: "Git",
			href: "/git/",
			icon: GitBranch,
			external: true,
			enabled: features?.giteaEnabled ?? true,
			matchers: ["gitea", "git"],
		},
		{
			id: "coder",
			name: "Coder",
			href: `${SKYFORGE_API}/coder/launch`,
			icon: Cloud,
			external: true,
			enabled: features?.coderEnabled ?? false,
			matchers: ["coder"],
		},
		{
			id: "netbox",
			name: "NetBox",
			href: "/netbox/",
			icon: Network,
			external: true,
			enabled: features?.netboxEnabled ?? false,
			matchers: ["netbox"],
		},
		{
			id: "kibana",
			name: "Kibana",
			href: "/kibana/",
			icon: Database,
			external: true,
			enabled:
				(features?.forwardEnabled ?? false) &&
				(features?.elasticEnabled ?? false),
			matchers: ["kibana", "elastic"],
		},
		{
			id: "forward",
			name: "Forward Collector",
			href: "/dashboard/fwd/collector",
			icon: Activity,
			external: false,
			enabled: features?.forwardEnabled ?? true,
			matchers: ["forward", "collector"],
		},
		{
			id: "webhooks",
			name: "Webhooks",
			href: "/webhooks",
			icon: Webhook,
			external: false,
			enabled: true,
			matchers: ["webhook"],
		},
	].filter((tool) => tool.enabled);

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						Platform Status
					</h1>
					<p className="text-sm text-muted-foreground">
						Live health, active alerts, and quick operator actions.
					</p>
				</div>
				{uiConfig.data?.externalUrl ? (
					<a
						className="text-sm text-primary hover:underline inline-flex items-center gap-1"
						href={uiConfig.data.externalUrl}
						target="_blank"
						rel="noreferrer"
					>
						<Globe className="h-4 w-4" />
						Public URL
					</a>
				) : null}
			</div>

			{summary.isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={`status-skeleton-${i}`}>
							<CardHeader className="pb-2">
								<Skeleton className="h-4 w-28" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-20" />
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Overall</CardDescription>
							<CardTitle className="text-2xl uppercase">
								{statusData?.status ?? "unknown"}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Services Healthy</CardDescription>
							<CardTitle className="text-2xl">
								{statusData?.up ?? 0} / {checks.length}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Services Degraded</CardDescription>
							<CardTitle className="text-2xl">
								{statusData?.down ?? 0}
							</CardTitle>
						</CardHeader>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardDescription>Active Deployments</CardDescription>
							<CardTitle className="text-2xl">
								{statusData?.deploymentsActive ?? 0}
							</CardTitle>
						</CardHeader>
					</Card>
				</div>
			)}

			<div className="grid gap-4 xl:grid-cols-3">
				<Card className="xl:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">Active Alerts</CardTitle>
						<CardDescription>
							Only non-healthy service checks are shown here.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{downChecks.length === 0 ? (
							<div className="flex items-center gap-2 text-emerald-600">
								<CheckCircle2 className="h-4 w-4" />
								<span className="text-sm">No active alerts.</span>
							</div>
						) : (
							<div className="flex flex-wrap gap-2">
								{downChecks.map((check) => (
									<Badge key={check.name} variant="destructive">
										{check.name}: {check.status}
									</Badge>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Quick Actions</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<Link
							className="block text-primary hover:underline"
							to="/dashboard/deployments/new"
						>
							Create deployment
						</Link>
						<Link
							className="block text-primary hover:underline"
							to="/dashboard/runs"
						>
							View run queue
						</Link>
						<Link className="block text-primary hover:underline" to="/webhooks">
							Webhooks
						</Link>
						<a
							className="block text-primary hover:underline"
							href="/redoc/"
							target="_blank"
							rel="noreferrer"
						>
							API Docs
						</a>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Tool Integrations</CardTitle>
					<CardDescription>
						Link into enabled tools and see service health mapping.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
						{tools.map((tool) => {
							const status = resolveToolStatus(checks, tool.matchers);
							const Icon = tool.icon;
							return (
								<a
									key={tool.id}
									href={tool.href}
									target={tool.external ? "_blank" : "_self"}
									rel={tool.external ? "noreferrer noopener" : undefined}
									className="rounded-lg border p-3 hover:bg-muted/40 transition-colors"
								>
									<div className="flex items-center justify-between">
										<Icon className="h-4 w-4 text-muted-foreground" />
										{status === "up" ? (
											<Badge className="bg-emerald-600 hover:bg-emerald-600">
												up
											</Badge>
										) : status === "down" ? (
											<Badge variant="destructive">down</Badge>
										) : (
											<Badge variant="secondary">
												<AlertTriangle className="mr-1 h-3 w-3" />
												unknown
											</Badge>
										)}
									</div>
									<div className="mt-2 text-sm font-medium">{tool.name}</div>
								</a>
							);
						})}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
