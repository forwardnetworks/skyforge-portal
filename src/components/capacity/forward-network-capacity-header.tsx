import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { forwardNetworkInsightsEmptyText } from "./forward-network-insights-messaging";
import type { ForwardNetworkCapacityPageContentProps } from "./forward-network-capacity-page-shared";

export function ForwardNetworkCapacityHeader({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	return (
		<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div className="flex items-center gap-3">
				<Link
					to="/dashboard/forward-analytics"
					search={{ userId: page.ownerUserId } as any}
					className={buttonVariants({
						variant: "outline",
						size: "icon",
						className: "h-9 w-9",
					})}
					title="Back to Forward analytics"
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
						<TrendingUp className="h-5 w-5" /> Network Insights
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Forward network:{" "}
						<span className="font-medium">
							{page.networkName || page.networkRefId}
						</span>
						{page.forwardNetworkId ? (
							<span className="ml-2 font-mono text-xs">
								{page.forwardNetworkId}
							</span>
						) : null}
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
					disabled={page.refresh.isPending || !page.forwardNetworkId}
					title={
						!page.forwardNetworkId
							? "Load the saved Forward network first"
							: forwardNetworkInsightsEmptyText(page)
					}
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					{page.refresh.isPending ? "Queueing…" : "Refresh"}
				</Button>
			</div>
		</div>
	);
}

export function ForwardNetworkCapacityMissingUser() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center gap-3">
				<Link
					to="/dashboard/forward-analytics"
					search={{ userId: "" } as any}
					className={buttonVariants({
						variant: "outline",
						size: "icon",
						className: "h-9 w-9",
					})}
				>
					<ArrowLeft className="h-4 w-4" />
				</Link>
				<h1 className="text-2xl font-bold tracking-tight">Network Insights</h1>
			</div>
			<div className="rounded-lg border p-6 text-sm text-muted-foreground">
				User is required.
			</div>
		</div>
	);
}

export function ForwardNetworkCapacityAsOfBadge({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	return page.summary.data?.stale ? (
		<Badge variant="destructive">Stale</Badge>
	) : (
		<Badge variant="secondary">Fresh</Badge>
	);
}
