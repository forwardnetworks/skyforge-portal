import type { GroupSummaryRow } from "@/components/capacity/deployment-capacity-types";
import {
	fmtNum,
	fmtPct01,
} from "@/components/capacity/deployment-capacity-utils";
import type { DataTableColumn } from "@/components/ui/data-table";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function buildDeploymentCapacityInterfaceGroupColumns(
	groupBy: DeploymentCapacityPageState["groupBy"],
	ifaceMetric: DeploymentCapacityPageState["ifaceMetric"],
): Array<DataTableColumn<GroupSummaryRow>> {
	if (!ifaceMetric.startsWith("util_")) {
		return [
			{
				id: "group",
				header: "Group",
				cell: (r) => <span className="font-mono text-xs">{r.group}</span>,
				width: 260,
			},
			{
				id: "count",
				header: "Count",
				align: "right",
				cell: (r) => <span className="text-xs">{r.count}</span>,
				width: 90,
			},
			{
				id: "hot",
				header: "Hot",
				align: "right",
				cell: (r) => <span className="text-xs">{r.hotCount}</span>,
				width: 90,
			},
			{
				id: "p95",
				header: "Max p95",
				align: "right",
				cell: (r) => fmtNum(r.maxP95),
				width: 100,
			},
		];
	}

	return [
		{
			id: "group",
			header: "Group",
			cell: (r) => <span className="font-mono text-xs">{r.group}</span>,
			width: 220,
		},
		...(groupBy === "vrf"
			? ([
					{
						id: "routes",
						header: "Routes (v4/v6)",
						align: "right",
						cell: (r: GroupSummaryRow) => (
							<span className="text-xs tabular-nums">
								{Number(r.ipv4RoutesSum ?? 0)}/{Number(r.ipv6RoutesSum ?? 0)}
							</span>
						),
						width: 130,
					},
					{
						id: "bgp",
						header: "BGP",
						align: "right",
						cell: (r: GroupSummaryRow) => (
							<span className="text-xs tabular-nums">
								{Number(r.bgpNeighbors ?? 0)} ({Number(r.bgpEstablished ?? 0)})
							</span>
						),
						width: 100,
					},
				] as Array<DataTableColumn<GroupSummaryRow>>)
			: []),
		{
			id: "count",
			header: "Ifaces",
			align: "right",
			cell: (r) => <span className="text-xs tabular-nums">{r.count}</span>,
			width: 80,
		},
		{
			id: "speed",
			header: "Σ Speed (Gbps)",
			align: "right",
			cell: (r) => (
				<span className="text-xs tabular-nums">
					{r.sumSpeedGbps !== undefined ? r.sumSpeedGbps.toFixed(1) : "—"}
				</span>
			),
			width: 120,
		},
		{
			id: "p95sum",
			header: "Σ p95 (Gbps)",
			align: "right",
			cell: (r) => (
				<span className="text-xs tabular-nums">
					{r.sumP95Gbps !== undefined ? r.sumP95Gbps.toFixed(2) : "—"}
				</span>
			),
			width: 120,
		},
		{
			id: "maxsum",
			header: "Σ Max (Gbps)",
			align: "right",
			cell: (r) => (
				<span className="text-xs tabular-nums">
					{r.sumMaxGbps !== undefined ? r.sumMaxGbps.toFixed(2) : "—"}
				</span>
			),
			width: 120,
		},
		{
			id: "utilp95",
			header: "Util@p95",
			align: "right",
			cell: (r) => {
				const denom = Number(r.sumSpeedGbps ?? 0);
				const num = Number(r.sumP95Gbps ?? 0);
				if (!denom)
					return <span className="text-muted-foreground text-xs">—</span>;
				return (
					<span className="text-xs tabular-nums">{fmtPct01(num / denom)}</span>
				);
			},
			width: 90,
		},
		{
			id: "utilmax",
			header: "Util@max",
			align: "right",
			cell: (r) => {
				const denom = Number(r.sumSpeedGbps ?? 0);
				const num = Number(r.sumMaxGbps ?? 0);
				if (!denom)
					return <span className="text-muted-foreground text-xs">—</span>;
				return (
					<span className="text-xs tabular-nums">{fmtPct01(num / denom)}</span>
				);
			},
			width: 90,
		},
		{
			id: "headroom",
			header: "Headroom@85 (Gbps)",
			align: "right",
			cell: (r) => {
				const denom = Number(r.sumSpeedGbps ?? 0);
				const p95 = Number(r.sumP95Gbps ?? 0);
				if (!denom)
					return <span className="text-muted-foreground text-xs">—</span>;
				const head = Math.max(0, denom * 0.85 - p95);
				return <span className="text-xs tabular-nums">{head.toFixed(2)}</span>;
			},
			width: 150,
		},
		{
			id: "p95cov",
			header: "p95 cov",
			align: "right",
			cell: (r) => (
				<span className="text-xs tabular-nums">
					{Number(r.p95Count ?? 0)}/{r.count}
				</span>
			),
			width: 90,
		},
		{
			id: "soonest",
			header: "Soonest",
			cell: (r) => (
				<span className="font-mono text-xs">
					{r.soonestForecast ? r.soonestForecast.slice(0, 10) : "—"}
				</span>
			),
			width: 110,
		},
	];
}
