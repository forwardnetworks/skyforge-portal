import { TopologyViewer } from "@/components/topology-viewer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { queryKeys } from "@/lib/query-keys";
import {
	type DeploymentTopology,
	getUserContainerlabTemplate,
	getUserContexts,
} from "@/lib/skyforge-api";
import {
	parseTemplateSourceUI,
	toTemplateSourceBackend,
} from "@/lib/template-source";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import YAML from "yaml";

export const Route = createFileRoute("/dashboard/labs/map")({
	component: LabsMapPage,
});

function parseContainerlabYamlToTopology(yamlText: string): DeploymentTopology {
	const parsed = YAML.parse(String(yamlText ?? "")) as any;
	const topology = parsed?.topology ?? {};
	const nodesObj = topology?.nodes ?? {};
	const nodes = Object.entries(nodesObj).map(([id, cfg]) => {
		const kind = String((cfg as any)?.kind ?? "");
		return {
			id: String(id),
			label: String(id),
			kind,
			status: "unknown",
			mgmtIp: "",
		};
	});

	const edges: any[] = [];
	const links = Array.isArray(topology?.links) ? topology.links : [];
	for (let i = 0; i < links.length; i++) {
		const l = links[i] as any;
		const eps = Array.isArray(l?.endpoints) ? l.endpoints : [];
		if (eps.length !== 2) continue;
		const a = String(eps[0] ?? "");
		const b = String(eps[1] ?? "");
		const aNode = a.split(":")[0];
		const bNode = b.split(":")[0];
		if (!aNode || !bNode) continue;
		edges.push({
			id: `e${i + 1}`,
			source: aNode,
			target: bNode,
			label: `${a} ↔ ${b}`,
		});
	}

	return {
		nodes,
		edges,
	} as any;
}

function LabsMapPage() {
	const search = Route.useSearch() as any;
	const source = parseTemplateSourceUI(String(search?.source ?? "user"));
	const sourceBackend = toTemplateSourceBackend(source);
	const dir = String(search?.dir ?? "containerlab/designer");
	const file = String(search?.file ?? "");

	const userContextsQ = useQuery({
		queryKey: queryKeys.userContexts(),
		queryFn: getUserContexts,
		retry: false,
		staleTime: 30_000,
	});
	const userContextId = useMemo(() => {
		const list = (userContextsQ.data?.userContexts ?? []) as Array<{
			id?: string;
		}>;
		return String(list[0]?.id ?? "").trim();
	}, [userContextsQ.data?.userContexts]);

	const templateQ = useQuery({
		queryKey: userContextId
			? ["containerlabTemplateMap", userContextId, source, dir, file]
			: ["containerlabTemplateMap", "none"],
		queryFn: async () => {
			if (!userContextId) throw new Error("user context ID is required");
			if (!file) throw new Error("file is required");
			return getUserContainerlabTemplate(userContextId, {
				source: sourceBackend,
				dir,
				file,
			});
		},
		enabled: Boolean(userContextId) && Boolean(file),
		retry: false,
		staleTime: 30_000,
	});

	const topology = useMemo(() => {
		if (!templateQ.data?.yaml) return null;
		try {
			return parseContainerlabYamlToTopology(templateQ.data.yaml);
		} catch {
			return null;
		}
	}, [templateQ.data?.yaml]);

	if (!file) {
		return (
			<div className="h-screen w-screen p-6">
				<div className="max-w-2xl space-y-4">
					<div className="text-2xl font-bold tracking-tight">Lab map</div>
					<div className="text-sm text-muted-foreground">
						Open this page from the Lab Designer “Open map” button, or provide
						query params.
					</div>
					<Card>
						<CardHeader>
							<CardTitle>Parameters</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="space-y-1">
								<Label>User context</Label>
								<Input
									value={userContextId}
									readOnly
									placeholder={
										userContextsQ.isLoading ? "Resolving…" : "Unavailable"
									}
								/>
							</div>
							<div className="space-y-1">
								<Label>File</Label>
								<Input value={file} readOnly placeholder="file missing" />
							</div>
							<div className="text-xs text-muted-foreground">
								Example:{" "}
								<span className="font-mono">
									/dashboard/labs/map?source=user&amp;dir=containerlab/designer&amp;file=lab.clab.yml
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (templateQ.isLoading || templateQ.isFetching) {
		return (
			<div className="h-screen w-screen p-6">
				<div className="flex items-center gap-3">
					<Skeleton className="h-9 w-9" />
					<Skeleton className="h-8 w-64" />
				</div>
				<div className="mt-6">
					<Skeleton className="h-[75vh] w-full" />
				</div>
			</div>
		);
	}

	if (!templateQ.data || !topology) {
		return (
			<div className="h-screen w-screen p-6">
				<EmptyState
					title="Map unavailable"
					description={
						templateQ.isError
							? "Failed to load template."
							: "Template YAML could not be parsed into a topology."
					}
					action={{ label: "Close", onClick: () => window.close() }}
				/>
			</div>
		);
	}

	return (
		<div className="h-screen w-screen flex flex-col bg-background">
			<div className="flex items-center justify-between gap-3 border-b px-4 py-3">
				<div className="flex items-center gap-3 min-w-0">
					<Link
						to="/dashboard/labs/designer"
						search={{}}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
						title="Back to designer"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div className="min-w-0">
						<div className="font-semibold truncate">Lab map</div>
						<div className="text-xs text-muted-foreground font-mono truncate">
							{templateQ.data.path}
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							void navigator.clipboard?.writeText(templateQ.data.yaml);
						}}
					>
						Copy YAML
					</Button>
				</div>
			</div>

			<div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_520px]">
				<div className="min-h-0 p-3">
					<div className="h-full rounded-xl border overflow-hidden">
						<TopologyViewer
							topology={topology as any}
							userContextId={userContextId}
							enableTerminal={false}
							fullHeight
						/>
					</div>
				</div>
				<div className="min-h-0 border-l bg-background p-3">
					<Card className="h-full">
						<CardHeader className="pb-3">
							<CardTitle>YAML</CardTitle>
						</CardHeader>
						<CardContent className="h-[calc(100%-56px)]">
							<Textarea
								value={templateQ.data.yaml}
								readOnly
								className="h-full font-mono text-xs"
							/>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
