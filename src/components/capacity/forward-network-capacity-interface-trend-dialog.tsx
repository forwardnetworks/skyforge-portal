import {
	fmtNum,
	fmtPct01,
	fmtSpeedMbps,
} from "@/components/capacity/forward-network-capacity-utils";
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
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityInterfaceTrendDialog({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Dialog
			open={Boolean(page.selectedIface)}
			onOpenChange={(v) => !v && page.setSelectedIface(null)}
		>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle className="text-base">Interface Trend</DialogTitle>
				</DialogHeader>
				{page.selectedIface ? (
					<div className="space-y-3">
						<div className="text-sm">
							<span className="font-mono text-xs">
								{page.selectedIface.device} {page.selectedIface.iface}{" "}
								{page.selectedIface.dir}
							</span>{" "}
							<Badge variant="outline" className="ml-2">
								{page.windowLabel}
							</Badge>
							<Badge variant="secondary" className="ml-2">
								{page.ifaceMetric}
							</Badge>
							<Select
								value={page.selectedIface.dir}
								onValueChange={(v) =>
									page.setSelectedIface((cur) =>
										cur ? { ...cur, dir: String(v) } : cur,
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
							{page.selectedIface.vrf || page.selectedIface.vrfNames?.length ? (
								<div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
									<Badge variant="outline" className="font-mono text-xs">
										VRF
									</Badge>
									<span className="font-mono text-xs">
										{page.selectedIface.vrf ??
											(page.selectedIface.vrfNames ?? [])
												.slice(0, 3)
												.join(", ")}
										{(page.selectedIface.vrfNames ?? []).length > 3 ? "…" : ""}
									</span>
									<Button
										variant="outline"
										className="h-7 px-2"
										onClick={() => {
											page.setRoutingDeviceFilter(page.selectedIface!.device);
											const v =
												page.selectedIface!.vrf ??
												page.selectedIface!.vrfNames?.[0] ??
												"all";
											page.setRoutingVrfFilter(v);
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
							const selectedIface = page.selectedIface!;
							const vrfs = selectedIface.vrfNames?.length
								? selectedIface.vrfNames
								: selectedIface.vrf
									? [selectedIface.vrf]
									: [];
							if (!vrfs.length) return null;
							const rs = (page.inventory.data?.routeScale ?? []).filter(
								(r) =>
									r.deviceName === selectedIface.device && vrfs.includes(r.vrf),
							);
							const bgp = (page.inventory.data?.bgpNeighbors ?? []).filter(
								(r) =>
									r.deviceName === selectedIface.device && vrfs.includes(r.vrf),
							);
							const v4 = rs.reduce(
								(acc, r) => acc + Number(r.ipv4Routes ?? 0),
								0,
							);
							const v6 = rs.reduce(
								(acc, r) => acc + Number(r.ipv6Routes ?? 0),
								0,
							);
							const up = bgp.filter((n) =>
								String(n.sessionState ?? "")
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
												v4={v4} v6={v6}
											</span>
										</div>
										<div className="text-right">
											BGP neighbors:{" "}
											<span className="font-mono">
												{bgp.length} ({up} established)
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
											page.selectedIface.p95 ??
												page.ifaceComputed.p95 ??
												undefined,
										)
									: fmtNum(
											page.selectedIface.p95 ??
												page.ifaceComputed.p95 ??
												undefined,
										)}
							</div>
							<div className="text-right">
								max:{" "}
								{page.ifaceMetric.startsWith("util_")
									? fmtPct01(
											page.selectedIface.max ??
												page.ifaceComputed.max ??
												undefined,
										)
									: fmtNum(
											page.selectedIface.max ??
												page.ifaceComputed.max ??
												undefined,
										)}
							</div>
							<div>
								slope/day:{" "}
								{page.ifaceMetric.startsWith("util_")
									? fmtPct01(page.selectedIface.slopePerDay)
									: fmtNum(page.selectedIface.slopePerDay)}
							</div>
							<div className="text-right">
								forecast:{" "}
								<span className="font-mono">
									{page.selectedIface.forecastCrossingTs ?? "—"}
								</span>
							</div>
							<div>
								speed: {fmtSpeedMbps(page.selectedIface.speedMbps ?? null)}
							</div>
							<div className="text-right">
								p95 (Gbps): {(() => {
									if (!page.ifaceMetric.startsWith("util_")) return "—";
									const speed = Number(page.selectedIface.speedMbps ?? 0);
									const p95 = Number(
										page.selectedIface.p95 ??
											page.ifaceComputed.p95 ??
											Number.NaN,
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
