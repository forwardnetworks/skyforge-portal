import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";

export function DeploymentCapacityHeader(props: {
	deploymentId: string;
	page: DeploymentCapacityPageState;
}) {
	const { deploymentId, page } = props;
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div className="flex items-center gap-3">
				<Link
					to="/dashboard/deployments/$deploymentId"
					params={{ deploymentId }}
					className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
					title="Back to deployment"
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
						<TrendingUp className="h-5 w-5" /> Capacity
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Deployment:{" "}
						<span className="font-medium">{page.deployment?.name}</span>
					</p>
				</div>
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Select
					value={page.windowLabel}
					onValueChange={(v) => page.setWindowLabel(v as any)}
				>
					<SelectTrigger className="w-[110px]">
						<SelectValue placeholder="Window" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="24h">24h</SelectItem>
						<SelectItem value="7d">7d</SelectItem>
						<SelectItem value="30d">30d</SelectItem>
					</SelectContent>
				</Select>

				<Select
					value={page.locationFilter}
					onValueChange={page.setLocationFilter}
				>
					<SelectTrigger className="w-[190px]">
						<SelectValue placeholder="Location" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All locations</SelectItem>
						{page.groupingOptions.locations.map((loc) => (
							<SelectItem key={loc} value={loc}>
								{loc}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={page.vrfFilter} onValueChange={page.setVrfFilter}>
					<SelectTrigger className="w-[170px]">
						<SelectValue placeholder="VRF" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All VRFs</SelectItem>
						{page.groupingOptions.vrfs.map((v) => (
							<SelectItem key={v} value={v}>
								{v}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={page.tagFilter} onValueChange={page.setTagFilter}>
					<SelectTrigger className="w-[170px]">
						<SelectValue placeholder="Tag" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All tags</SelectItem>
						{page.groupingOptions.tags.map((t) => (
							<SelectItem key={t} value={t}>
								{t}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select value={page.groupFilter} onValueChange={page.setGroupFilter}>
					<SelectTrigger className="w-[170px]">
						<SelectValue placeholder="Group" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All groups</SelectItem>
						{page.groupingOptions.groups.map((g) => (
							<SelectItem key={g} value={g}>
								{g}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					value={page.groupBy}
					onValueChange={(v) => page.setGroupBy(v as any)}
				>
					<SelectTrigger className="w-[140px]">
						<SelectValue placeholder="Group by" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">No grouping</SelectItem>
						<SelectItem value="location">Location</SelectItem>
						<SelectItem value="tag">Tag</SelectItem>
						<SelectItem value="group">Group</SelectItem>
						<SelectItem value="vrf">VRF</SelectItem>
					</SelectContent>
				</Select>

				<Button
					variant="outline"
					onClick={() => page.refresh.mutate()}
					disabled={
						page.refresh.isPending ||
						!page.forwardEnabled ||
						!page.forwardNetworkId
					}
					title={
						!page.forwardEnabled || !page.forwardNetworkId
							? "Enable Forward and run sync first"
							: "Enqueue a background rollup task"
					}
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					{page.refresh.isPending ? "Queueing…" : "Refresh"}
				</Button>
			</div>
		</div>
	);
}
