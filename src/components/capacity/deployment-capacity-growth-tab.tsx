import { CapacityGrowthTabShared } from "@/components/capacity/capacity-growth-tab-shared";
import {
	fmtPct01,
	fmtSpeedMbps,
} from "@/components/capacity/deployment-capacity-utils";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityGrowthTab(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;

	return (
		<CapacityGrowthTabShared
			compareHours={page.compareHours}
			onCompareHoursChange={page.setCompareHours}
			ifaceGrowthMetric={page.growthIfaceMetric}
			onIfaceGrowthMetricChange={page.setGrowthIfaceMetric}
			deviceGrowthMetric={page.growthDeviceMetric}
			onDeviceGrowthMetricChange={page.setGrowthDeviceMetric}
			ifaceGrowth={page.ifaceGrowth}
			deviceGrowth={page.deviceGrowth}
			ifaceGrowthRows={page.ifaceGrowthRows}
			deviceGrowthRows={page.deviceGrowthRows}
			summaryAsOf={page.summary.data?.asOf}
			onIfaceRowClick={(row) => {
				page.setIfaceMetric(page.growthIfaceMetric as any);
				page.setSelectedIface({
					id: `${row.device}:${row.iface}:${row.dir}:growth`,
					device: row.device,
					iface: row.iface,
					dir: row.dir || "INGRESS",
					speedMbps: row.speedMbps ?? null,
					samples: 0,
				});
			}}
			onDeviceRowClick={(row) => {
				page.setDeviceMetric(page.growthDeviceMetric as any);
				page.setSelectedDevice({
					id: `${row.device}:growth`,
					device: row.device,
					metric: page.growthDeviceMetric,
					vendor: row.vendor,
					os: row.os,
					model: row.model,
					samples: 0,
				});
			}}
			formatPercent01={fmtPct01}
			formatSpeedMbps={fmtSpeedMbps}
		/>
	);
}
