import { ForwardNetworkCapacityChangesTab } from "@/components/capacity/forward-network-capacity-changes-tab";
import { ForwardNetworkCapacityDeviceTrendDialog } from "@/components/capacity/forward-network-capacity-device-trend-dialog";
import { ForwardNetworkCapacityDevicesTab } from "@/components/capacity/forward-network-capacity-devices-tab";
import { ForwardNetworkCapacityGrowthTab } from "@/components/capacity/forward-network-capacity-growth-tab";
import { ForwardNetworkCapacityHealthTab } from "@/components/capacity/forward-network-capacity-health-tab";
import { ForwardNetworkCapacityInterfaceTrendDialog } from "@/components/capacity/forward-network-capacity-interface-trend-dialog";
import { ForwardNetworkCapacityInterfacesTab } from "@/components/capacity/forward-network-capacity-interfaces-tab";
import { ForwardNetworkCapacityPickDeviceDialog } from "@/components/capacity/forward-network-capacity-pick-device-dialog";
import { ForwardNetworkCapacityPickInterfaceDialog } from "@/components/capacity/forward-network-capacity-pick-interface-dialog";
import { ForwardNetworkCapacityPlanTab } from "@/components/capacity/forward-network-capacity-plan-tab";
import { ForwardNetworkCapacityRawTab } from "@/components/capacity/forward-network-capacity-raw-tab";
import { ForwardNetworkCapacityRoutingTab } from "@/components/capacity/forward-network-capacity-routing-tab";
import { ForwardNetworkCapacityScorecardTab } from "@/components/capacity/forward-network-capacity-scorecard-tab";
import { ForwardNetworkCapacityTcamEvidenceDialog } from "@/components/capacity/forward-network-capacity-tcam-evidence-dialog";
import {
	fmtNum,
	fmtPct01,
	fmtSpeedMbps,
} from "@/components/capacity/forward-network-capacity-utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForwardNetworkCapacityPage } from "@/hooks/use-forward-network-capacity-page";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-networks/$networkRef/capacity",
)({
	validateSearch: (search) => searchSchema.parse(search),
	component: ForwardNetworkCapacityPage,
});

function ForwardNetworkCapacityPage() {
	const { networkRef } = Route.useParams();
	const { userId } = Route.useSearch();
	const page = useForwardNetworkCapacityPage(networkRef, userId);

	if (!page.ownerUserId) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/forward-networks"
						search={{ userId: "" } as any}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<h1 className="text-2xl font-bold tracking-tight">Capacity</h1>
				</div>
				<Card>
					<CardContent className="pt-6 text-sm text-muted-foreground">
						User is required.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6 pb-20">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div className="flex items-center gap-3">
					<Link
						to="/dashboard/forward-networks"
						search={{ userId: page.ownerUserId } as any}
						className={buttonVariants({
							variant: "outline",
							size: "icon",
							className: "h-9 w-9",
						})}
						title="Back to Forward networks"
					>
						<ArrowLeft className="h-4 w-4" />
					</Link>
					<div>
						<h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
							<TrendingUp className="h-5 w-5" /> Capacity
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
								: "Enqueue a background rollup task"
						}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						{page.refresh.isPending ? "Queueing…" : "Refresh"}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">As Of</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						<div className="font-mono text-xs">
							{page.summary.data?.asOf ?? page.inventory.data?.asOf ?? "—"}
						</div>
						<div className="mt-2 flex items-center gap-2">
							{page.summary.data?.stale ? (
								<Badge variant="destructive">Stale</Badge>
							) : (
								<Badge variant="secondary">Fresh</Badge>
							)}
							<Badge variant="outline" className="font-mono text-xs">
								{page.forwardNetworkId || "no-forward"}
							</Badge>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Hot Interfaces</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						<div className="text-2xl font-semibold">{page.overview.above}</div>
						<div className="mt-1 text-xs text-muted-foreground">
							util_* max &gt;= 85%
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Soonest Saturation</CardTitle>
					</CardHeader>
					<CardContent className="text-sm">
						{page.overview.soonest?.forecastCrossingTs ? (
							<div className="space-y-1">
								<div className="font-mono text-xs">
									{page.overview.soonest.forecastCrossingTs}
								</div>
								<div className="text-xs text-muted-foreground">
									{String(page.overview.soonest.details?.["deviceName"] ?? "")}{" "}
									{String(
										page.overview.soonest.details?.["interfaceName"] ?? "",
									)}{" "}
									{String(page.overview.soonest.details?.["direction"] ?? "")}
								</div>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">—</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Coverage</CardTitle>
					</CardHeader>
					<CardContent className="space-y-1 text-sm">
						{(() => {
							const c = page.coverage.data;
							const pct = (num: number, den: number) =>
								!den ? "—" : `${((num / den) * 100).toFixed(0)}%`;
							const ifacePct = c ? pct(c.ifacesWithSpeed, c.ifacesTotal) : "—";
							const rollupDen = c
								? c.rollupsInterfaceTotal + c.rollupsDeviceTotal
								: 0;
							const rollupPct = c ? pct(c.rollupsWithSamples, rollupDen) : "—";
							return (
								<div className="space-y-2">
									<div className="flex items-center justify-between gap-3">
										<div className="text-xs text-muted-foreground">
											Ifaces w/speed
										</div>
										<div className="font-medium">
											{ifacePct}{" "}
											<span className="text-xs text-muted-foreground">
												({c ? `${c.ifacesWithSpeed}/${c.ifacesTotal}` : "—"})
											</span>
										</div>
									</div>
									<div className="flex items-center justify-between gap-3">
										<div className="text-xs text-muted-foreground">
											Rollups w/samples
										</div>
										<div className="font-medium">
											{rollupPct}{" "}
											<span className="text-xs text-muted-foreground">
												({c ? `${c.rollupsWithSamples}/${rollupDen}` : "—"})
											</span>
										</div>
									</div>
									<div className="text-xs text-muted-foreground">
										Inv:{" "}
										<span className="font-mono">{c?.asOfInventory ?? "—"}</span>
										{" · "}Rollups:{" "}
										<span className="font-mono">{c?.asOfRollups ?? "—"}</span>
									</div>
								</div>
							);
						})()}
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="interfaces" className="space-y-4">
				<TabsList>
					<TabsTrigger value="scorecard">Scorecard</TabsTrigger>
					<TabsTrigger value="interfaces">Interfaces</TabsTrigger>
					<TabsTrigger value="devices">Devices</TabsTrigger>
					<TabsTrigger value="growth">Growth</TabsTrigger>
					<TabsTrigger value="plan">Plan</TabsTrigger>
					<TabsTrigger value="routing">Routing/BGP</TabsTrigger>
					<TabsTrigger value="changes">Changes</TabsTrigger>
					<TabsTrigger value="health">Health</TabsTrigger>
					<TabsTrigger value="raw">Raw</TabsTrigger>
				</TabsList>
				<TabsContent value="scorecard" className="space-y-4">
					<ForwardNetworkCapacityScorecardTab page={page} />
				</TabsContent>
				<TabsContent value="interfaces" className="space-y-4">
					<ForwardNetworkCapacityInterfacesTab page={page} />
				</TabsContent>
				<TabsContent value="devices" className="space-y-4">
					<ForwardNetworkCapacityDevicesTab page={page} />
				</TabsContent>
				<TabsContent value="growth" className="space-y-4">
					<ForwardNetworkCapacityGrowthTab page={page} />
				</TabsContent>
				<TabsContent value="plan" className="space-y-4">
					<ForwardNetworkCapacityPlanTab page={page} />
				</TabsContent>
				<TabsContent value="routing" className="space-y-4">
					<ForwardNetworkCapacityRoutingTab page={page} />
				</TabsContent>
				<TabsContent value="changes" className="space-y-4">
					<ForwardNetworkCapacityChangesTab page={page} />
				</TabsContent>
				<TabsContent value="health" className="space-y-4">
					<ForwardNetworkCapacityHealthTab page={page} />
				</TabsContent>
				<TabsContent value="raw" className="space-y-4">
					<ForwardNetworkCapacityRawTab page={page} />
				</TabsContent>
			</Tabs>

			<ForwardNetworkCapacityInterfaceTrendDialog page={page} />
			<ForwardNetworkCapacityDeviceTrendDialog page={page} />
			<ForwardNetworkCapacityPickInterfaceDialog page={page} />
			<ForwardNetworkCapacityPickDeviceDialog page={page} />
			<ForwardNetworkCapacityTcamEvidenceDialog page={page} />
		</div>
	);
}
