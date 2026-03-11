import {
	fmtNum,
	fmtPct01,
	fmtSpeedMbps,
} from "@/components/capacity/deployment-capacity-utils";
import { SimpleLineChart } from "@/components/capacity/simple-line-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityInterfaceTrendDialog(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;
	const selectedIface = page.selectedIface;

	return (
		<Dialog
			open={Boolean(selectedIface)}
			onOpenChange={(open) => !open && page.setSelectedIface(null)}
		>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle className="text-base">Interface Trend</DialogTitle>
				</DialogHeader>
				{selectedIface ? (
					<div className="space-y-3">
						<div className="text-sm">
							<span className="font-mono text-xs">
								{selectedIface.device} {selectedIface.iface} {selectedIface.dir}
							</span>{" "}
							<Badge variant="outline" className="ml-2">
								{page.windowLabel}
							</Badge>
							<Badge variant="secondary" className="ml-2">
								{page.ifaceMetric}
							</Badge>
							<Select
								value={selectedIface.dir}
								onValueChange={(value) =>
									page.setSelectedIface((current) =>
										current ? { ...current, dir: String(value) } : current,
									)
								}
							>
								<SelectTrigger className="ml-2 inline-flex h-7 w-[140px]">
									<SelectValue placeholder="Direction" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="INGRESS">INGRESS</SelectItem>
									<SelectItem value="EGRESS">EGRESS</SelectItem>
								</SelectContent>
							</Select>
							{selectedIface.vrf || selectedIface.vrfNames?.length ? (
								<div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
									<Badge variant="outline" className="font-mono text-xs">
										VRF
									</Badge>
									<span className="font-mono text-xs">
										{selectedIface.vrf ??
											(selectedIface.vrfNames ?? []).slice(0, 3).join(", ")}
										{(selectedIface.vrfNames ?? []).length > 3 ? "…" : ""}
									</span>
									<Button
										variant="outline"
										className="h-7 px-2"
										onClick={() => {
											page.setRoutingDeviceFilter(selectedIface.device);
											const vrf =
												selectedIface.vrf ??
												selectedIface.vrfNames?.[0] ??
												"all";
											page.setRoutingVrfFilter(vrf);
										}}
										title="Filter Routing/BGP tables to this device/VRF"
									>
										Filter routing
									</Button>
								</div>
							) : null}
						</div>
						{page.ifaceHistory.isLoading ? (
							<Skeleton className="h-24 w-full" />
						) : page.ifaceHistory.isError ? (
							<div className="text-sm text-destructive">
								Failed to load history
							</div>
						) : (
							<SimpleLineChart points={page.ifacePoints} />
						)}
						{(() => {
							const vrfs = selectedIface.vrfNames?.length
								? selectedIface.vrfNames
								: selectedIface.vrf
									? [selectedIface.vrf]
									: [];
							if (!vrfs.length) return null;
							const routeScale = (page.inventory.data?.routeScale ?? []).filter(
								(route) =>
									route.deviceName === selectedIface.device &&
									vrfs.includes(route.vrf),
							);
							const bgpNeighbors = (
								page.inventory.data?.bgpNeighbors ?? []
							).filter(
								(neighbor) =>
									neighbor.deviceName === selectedIface.device &&
									vrfs.includes(neighbor.vrf),
							);
							const ipv4Routes = routeScale.reduce(
								(total, route) => total + Number(route.ipv4Routes ?? 0),
								0,
							);
							const ipv6Routes = routeScale.reduce(
								(total, route) => total + Number(route.ipv6Routes ?? 0),
								0,
							);
							const establishedNeighbors = bgpNeighbors.filter((neighbor) =>
								String(neighbor.sessionState ?? "")
									.toUpperCase()
									.includes("ESTABLISHED"),
							).length;
							return (
								<div className="rounded-md border bg-muted/20 p-3 text-xs">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<div className="text-muted-foreground">
											Routing context for{" "}
											<span className="font-mono">
												{vrfs.slice(0, 3).join(", ")}
											</span>
											{vrfs.length > 3 ? "…" : ""}
										</div>
										<Button
											variant="outline"
											className="h-7 px-2"
											onClick={() => {
												page.setRoutingDeviceFilter(selectedIface.device);
												page.setRoutingVrfFilter(vrfs[0] ?? "all");
											}}
										>
											View in Routing tab
										</Button>
									</div>
									<div className="mt-2 grid grid-cols-2 gap-2">
										<div>
											FIB routes (sum):{" "}
											<span className="font-mono">
												v4={ipv4Routes} v6={ipv6Routes}
											</span>
										</div>
										<div className="text-right">
											BGP neighbors:{" "}
											<span className="font-mono">
												{bgpNeighbors.length} ({establishedNeighbors}{" "}
												established)
											</span>
										</div>
									</div>
								</div>
							);
						})()}
						<div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
							<div>
								p95:{" "}
								{page.ifaceMetric.startsWith("util_")
									? fmtPct01(
											selectedIface.p95 ?? page.ifaceComputed.p95 ?? undefined,
										)
									: fmtNum(
											selectedIface.p95 ?? page.ifaceComputed.p95 ?? undefined,
										)}
							</div>
							<div className="text-right">
								max:{" "}
								{page.ifaceMetric.startsWith("util_")
									? fmtPct01(
											selectedIface.max ?? page.ifaceComputed.max ?? undefined,
										)
									: fmtNum(
											selectedIface.max ?? page.ifaceComputed.max ?? undefined,
										)}
							</div>
							<div>
								slope/day:{" "}
								{page.ifaceMetric.startsWith("util_")
									? fmtPct01(selectedIface.slopePerDay)
									: fmtNum(selectedIface.slopePerDay)}
							</div>
							<div className="text-right">
								forecast:{" "}
								<span className="font-mono">
									{selectedIface.forecastCrossingTs ?? "—"}
								</span>
							</div>
							<div>speed: {fmtSpeedMbps(selectedIface.speedMbps ?? null)}</div>
							<div className="text-right">
								p95 (Gbps): {(() => {
									if (!page.ifaceMetric.startsWith("util_")) return "—";
									const speed = Number(selectedIface.speedMbps ?? 0);
									const p95 = Number(
										selectedIface.p95 ?? page.ifaceComputed.p95 ?? Number.NaN,
									);
									if (!speed || !Number.isFinite(p95)) return "—";
									return ((p95 * speed) / 1000).toFixed(2);
								})()}
							</div>
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
