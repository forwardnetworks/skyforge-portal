import {
	downloadText,
	toCSV,
} from "@/components/capacity/deployment-capacity-utils";
import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { DeploymentCapacityInterfacesTabProps } from "./deployment-capacity-interface-tab-types";

export function DeploymentCapacityInterfacesToolbar(
	props: DeploymentCapacityInterfacesTabProps,
) {
	const { deploymentId, page } = props;
	const {
		windowLabel,
		ifaceMetric,
		setIfaceMetric,
		ifaceFilter,
		setIfaceFilter,
		ifaceRows,
		setPickIfaceOpen,
		inventory,
	} = page;

	return (
		<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<CardTitle className="text-base">Interface Capacity</CardTitle>
			<div className="flex flex-col gap-2 md:flex-row md:items-center">
				<Input
					placeholder="Filter (device / interface)…"
					value={ifaceFilter}
					onChange={(e) => setIfaceFilter(e.target.value)}
					className="w-[260px]"
				/>
				<Select
					value={ifaceMetric}
					onValueChange={(v) => setIfaceMetric(v as typeof ifaceMetric)}
				>
					<SelectTrigger className="w-[240px]">
						<SelectValue placeholder="Metric" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="util_ingress">Utilization (ingress)</SelectItem>
						<SelectItem value="util_egress">Utilization (egress)</SelectItem>
						<SelectItem value="if_error_ingress">Errors (ingress)</SelectItem>
						<SelectItem value="if_error_egress">Errors (egress)</SelectItem>
						<SelectItem value="if_packet_loss_ingress">
							Packet loss (ingress)
						</SelectItem>
						<SelectItem value="if_packet_loss_egress">
							Packet loss (egress)
						</SelectItem>
					</SelectContent>
				</Select>
				<Button
					variant="outline"
					onClick={() => {
						const headers = [
							"device",
							"interface",
							"direction",
							"window",
							"metric",
							"speedMbps",
							"adminStatus",
							"operStatus",
							"p95",
							"p99",
							"max",
							"slopePerDay",
							"forecastCrossingTs",
							"samples",
						];
						const rows = ifaceRows.map((r) => [
							r.device,
							r.iface,
							r.dir,
							windowLabel,
							ifaceMetric,
							r.speedMbps ?? "",
							r.admin ?? "",
							r.oper ?? "",
							r.p95 ?? "",
							r.p99 ?? "",
							r.max ?? "",
							r.slopePerDay ?? "",
							r.forecastCrossingTs ?? "",
							r.samples ?? 0,
						]);
						downloadText(
							`capacity_interfaces_${deploymentId}_${windowLabel}_${ifaceMetric}.csv`,
							"text/csv",
							toCSV(headers, rows),
						);
					}}
					disabled={ifaceRows.length === 0}
				>
					Export CSV
				</Button>
				<Button
					variant="outline"
					onClick={() => setPickIfaceOpen(true)}
					disabled={inventory.isLoading || inventory.isError}
					title="Pick any interface from NQE inventory and load trend from Forward perf history"
				>
					Pick interface
				</Button>
			</div>
		</CardHeader>
	);
}
