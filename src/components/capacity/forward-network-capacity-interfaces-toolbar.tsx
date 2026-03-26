import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { ForwardNetworkCapacityInterfacesTabProps } from "./forward-network-capacity-interface-tab-types";
import { downloadText, toCSV } from "./forward-network-capacity-utils";

export function ForwardNetworkCapacityInterfacesToolbar({
	page,
}: ForwardNetworkCapacityInterfacesTabProps) {
	return (
		<div className="flex flex-col gap-2 md:flex-row md:items-center">
			<Input
				placeholder="Filter (device / interface)…"
				value={page.ifaceFilter}
				onChange={(e) => page.setIfaceFilter(e.target.value)}
				className="w-[260px]"
			/>
			<Select
				value={page.ifaceMetric}
				onValueChange={(v) => page.setIfaceMetric(v as any)}
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
					const rows = page.ifaceRows.map((r) => [
						r.device,
						r.iface,
						r.dir,
						page.windowLabel,
						page.ifaceMetric,
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
						`insights_interfaces_${page.networkRefId}_${page.windowLabel}_${page.ifaceMetric}.csv`,
						"text/csv",
						toCSV(headers, rows),
					);
				}}
				disabled={page.ifaceRows.length === 0}
			>
				Export CSV
			</Button>
			<Button
				variant="outline"
				onClick={() => page.setPickIfaceOpen(true)}
				disabled={page.inventory.isLoading || page.inventory.isError}
				title="Pick any interface from NQE inventory and load trend from Forward perf history"
			>
				Pick interface
			</Button>
		</div>
	);
}
