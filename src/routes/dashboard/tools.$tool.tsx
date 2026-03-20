import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	getManagedIntegrationsStatus,
	runManagedIntegrationAction,
} from "@/lib/api-client-managed-integrations";
import { getToolCatalog } from "@/lib/api-client-tool-catalog";
import { queryKeys } from "@/lib/query-keys";
import {
	composeToolContentUrl,
	indexToolLaunches,
	toolAllowsEmbedFallbackToNewTab,
	toolEmbedLoadTimeoutMs,
} from "@/lib/tool-launches";
import { requireToolRouteAccess } from "@/lib/ui-experience-route";

export const Route = createFileRoute("/dashboard/tools/$tool")({
	validateSearch: (search: Record<string, unknown>) => {
		const out: { path?: string } = {};
		if (typeof search.path === "string" && search.path.trim()) {
			const p = search.path.trim();
			if (p.startsWith("/")) out.path = p;
		}
		return out;
	},
	beforeLoad: async ({ context, params }) => {
		await requireToolRouteAccess(context, params.tool);
	},
	component: EmbeddedToolPage,
});

function EmbeddedToolPage() {
	const { tool } = Route.useParams();
	const { path } = Route.useSearch();
	const queryClient = useQueryClient();
	const [frameKey, setFrameKey] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const [loadTimedOut, setLoadTimedOut] = useState(false);
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		retry: false,
		staleTime: 5 * 60_000,
	});
	const managedIntegrationsQ = useQuery({
		queryKey: queryKeys.managedIntegrationsStatus(),
		queryFn: getManagedIntegrationsStatus,
		retry: false,
		staleTime: 30_000,
		refetchInterval: (query) => {
			const integrations = query.state.data?.integrations;
			if (!integrations || integrations.length === 0) return false;
			const status = integrations.find((integration) => integration.id === tool)?.status;
			return status === "standby" || status === "starting" ? 3_000 : false;
		},
	});
	const toolDef = useMemo(
		() => indexToolLaunches(toolCatalogQ.data?.tools)[tool],
		[tool, toolCatalogQ.data?.tools],
	);
	const runtimeStatus = useMemo(
		() =>
			managedIntegrationsQ.data?.integrations?.find(
				(integration) => integration.id === tool,
			) ?? null,
		[managedIntegrationsQ.data?.integrations, tool],
	);
	const wakeAction = runtimeStatus?.wakeAction ?? null;
	const autoWakeRequestedRef = useRef<Record<string, true>>({});
	const wakeMutation = useMutation({
		mutationFn: runManagedIntegrationAction,
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: queryKeys.managedIntegrationsStatus(),
			});
			toast.success("Integration wake requested");
		},
		onError: (error) => {
			toast.error("Failed to wake integration", {
				description: (error as Error).message,
			});
		},
	});

	const enabled = Boolean(toolDef);

	const src = useMemo(() => {
		const resolved = String(toolDef?.contentUrl ?? "").trim();
		if (!resolved) return "";
		return composeToolContentUrl(resolved, path ?? "");
	}, [path, toolDef?.contentUrl]);
	const embedLoadTimeoutMs = useMemo(
		() => toolEmbedLoadTimeoutMs(toolDef),
		[toolDef],
	);
	const allowEmbedFallbackToNewTab = useMemo(
		() => toolAllowsEmbedFallbackToNewTab(toolDef),
		[toolDef],
	);

	useEffect(() => {
		if (!runtimeStatus || runtimeStatus.status !== "standby") return;
		if (!wakeAction || wakeAction.allowed === false) return;
		if (autoWakeRequestedRef.current[tool]) return;
		autoWakeRequestedRef.current[tool] = true;
		wakeMutation.mutate(wakeAction);
	}, [runtimeStatus, tool, wakeAction, wakeMutation]);

	useEffect(() => {
		setLoaded(false);
		setLoadTimedOut(false);
	}, [frameKey, src]);

	useEffect(() => {
		if (loaded) return;
		if (embedLoadTimeoutMs <= 0) return;
		const timer = window.setTimeout(
			() => setLoadTimedOut(true),
			embedLoadTimeoutMs,
		);
		return () => window.clearTimeout(timer);
	}, [embedLoadTimeoutMs, loaded, frameKey, src]);

	if (toolCatalogQ.isLoading) {
		return (
			<div className="p-6 text-sm text-muted-foreground">Loading tool...</div>
		);
	}

	if (!enabled || !toolDef) {
		throw notFound();
	}

	if (String(toolDef.launchMode ?? "").trim() === "new_tab") {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>{toolDef.title}</CardTitle>
						<CardDescription>This tool opens in a new tab.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild size="sm">
							<a
								href={toolDef.navigationHref}
								target="_blank"
								rel="noreferrer noopener"
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Open in new tab
							</a>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (String(toolDef.launchMode ?? "").trim() === "embedded") {
		if (String(toolDef.embedMode ?? "").trim() !== "iframe") {
			throw new Error(`tool ${toolDef.id} is missing an iframe embed contract`);
		}
	}

	if (!src) {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>{toolDef.title}</CardTitle>
						<CardDescription>
							No launch URL is configured for this tool.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (
		runtimeStatus?.status === "standby" ||
		runtimeStatus?.status === "starting"
	) {
		const waitingForWake = runtimeStatus.status === "starting";
		return (
			<div className="p-6">
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>{toolDef.title}</CardTitle>
						<CardDescription>
							{waitingForWake
								? `${toolDef.title} is starting.`
								: `${toolDef.title} is in standby and is being started automatically.`}
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							{runtimeStatus.detail || "No additional detail reported."}
						</p>
						<div className="flex flex-wrap gap-2">
							{wakeAction ? (
								<Button
									size="sm"
									onClick={() => wakeMutation.mutate(wakeAction)}
									disabled={
										wakeMutation.isPending ||
										waitingForWake ||
										wakeAction.allowed === false
									}
								>
									{wakeAction.label || "Wake"}
								</Button>
							) : null}
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									queryClient.invalidateQueries({
										queryKey: queryKeys.managedIntegrationsStatus(),
									})
								}
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Refresh status
							</Button>
						</div>
						{wakeAction?.allowed === false && wakeAction.disabledReason ? (
							<p className="text-sm text-muted-foreground">
								{wakeAction.disabledReason}
							</p>
						) : null}
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
			<div className="border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:px-5 lg:px-6">
				<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
					<div className="min-w-0">
						<div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
							Embedded Workspace
						</div>
						<h1 className="truncate text-lg font-semibold tracking-tight">
							{toolDef.title}
						</h1>
						<p className="truncate text-sm text-muted-foreground">
							{toolDef.description}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setFrameKey((v) => v + 1);
							}}
						>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</Button>
					</div>
				</div>
			</div>
			<div className="relative flex-1 bg-muted/20">
				{!loaded && !loadTimedOut ? (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
						<div className="rounded-xl border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
							Loading {toolDef.title}...
						</div>
					</div>
				) : null}
				{!loaded && loadTimedOut ? (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/85 backdrop-blur-sm p-4">
						<Card className="max-w-xl w-full">
							<CardHeader>
								<CardTitle>Embedded View Still Loading</CardTitle>
								<CardDescription>
									{toolDef.title} has not finished loading within the configured
									embed timeout.
								</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setFrameKey((v) => v + 1)}
								>
									<RefreshCw className="mr-2 h-4 w-4" />
									Try again
								</Button>
								{allowEmbedFallbackToNewTab ? (
									<Button asChild size="sm">
										<a href={src} target="_blank" rel="noreferrer noopener">
											<ExternalLink className="mr-2 h-4 w-4" />
											Open in new tab
										</a>
									</Button>
								) : null}
							</CardContent>
						</Card>
					</div>
				) : null}
				<iframe
					key={frameKey}
					title={toolDef.title}
					src={src}
					className="h-full w-full border-0 bg-background"
					onLoad={() => {
						setLoaded(true);
						setLoadTimedOut(false);
					}}
				/>
			</div>
		</div>
	);
}
