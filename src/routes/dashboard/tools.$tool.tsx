import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getToolCatalog } from "@/lib/api-client-tool-catalog";
import { queryKeys } from "@/lib/query-keys";
import { composeToolContentUrl, indexToolLaunches } from "@/lib/tool-launches";
import { requireAdvancedRouteAccess } from "@/lib/ui-experience-route";

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
		await requireAdvancedRouteAccess(context);
	},
	component: EmbeddedToolPage,
});

function EmbeddedToolPage() {
	const { tool } = Route.useParams();
	const { path } = Route.useSearch();
	const [frameKey, setFrameKey] = useState(0);
	const [loaded, setLoaded] = useState(false);
	const [loadTimedOut, setLoadTimedOut] = useState(false);
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		retry: false,
		staleTime: 5 * 60_000,
	});
	const toolDef = useMemo(
		() => indexToolLaunches(toolCatalogQ.data?.tools)[tool],
		[tool, toolCatalogQ.data?.tools],
	);

	const enabled = Boolean(toolDef);

	const src = useMemo(() => {
		const resolved = String(toolDef?.contentUrl ?? "").trim();
		if (!resolved) return "";
		return composeToolContentUrl(resolved, path ?? "");
	}, [path, toolDef?.contentUrl]);

	useEffect(() => {
		setLoaded(false);
		setLoadTimedOut(false);
	}, [frameKey, src]);

	useEffect(() => {
		if (loaded) return;
		const timer = window.setTimeout(() => setLoadTimedOut(true), 10_000);
		return () => window.clearTimeout(timer);
	}, [loaded, frameKey, src]);

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
								<CardTitle>Embedded View Unavailable</CardTitle>
								<CardDescription>
									{toolDef.title} did not finish loading in-frame. This usually
									means the app blocks iframe embedding.
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
								<Button asChild size="sm">
									<a href={src} target="_blank" rel="noreferrer noopener">
										<ExternalLink className="mr-2 h-4 w-4" />
										Open in new tab
									</a>
								</Button>
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
