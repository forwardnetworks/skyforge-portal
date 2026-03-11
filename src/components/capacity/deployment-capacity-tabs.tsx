import { DeploymentCapacityDevicesTab } from "@/components/capacity/deployment-capacity-devices-tab";
import { DeploymentCapacityGrowthTab } from "@/components/capacity/deployment-capacity-growth-tab";
import { DeploymentCapacityHealthTab } from "@/components/capacity/deployment-capacity-health-tab";
import { DeploymentCapacityInterfacesTab } from "@/components/capacity/deployment-capacity-interfaces-tab";
import { DeploymentCapacityRawTab } from "@/components/capacity/deployment-capacity-raw-tab";
import { DeploymentCapacityRoutingTab } from "@/components/capacity/deployment-capacity-routing-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityTabs(props: {
	deploymentId: string;
	page: DeploymentCapacityPageState;
}) {
	const { deploymentId, page } = props;

	return (
		<Tabs defaultValue="interfaces" className="space-y-4">
			<TabsList>
				<TabsTrigger value="interfaces">Interfaces</TabsTrigger>
				<TabsTrigger value="devices">Devices</TabsTrigger>
				<TabsTrigger value="growth">Growth</TabsTrigger>
				<TabsTrigger value="routing">Routing/BGP</TabsTrigger>
				<TabsTrigger value="health">Health</TabsTrigger>
				<TabsTrigger value="raw">Raw</TabsTrigger>
			</TabsList>
			<TabsContent value="interfaces" className="space-y-4">
				<DeploymentCapacityInterfacesTab
					deploymentId={deploymentId}
					page={page}
				/>
			</TabsContent>
			<TabsContent value="devices" className="space-y-4">
				<DeploymentCapacityDevicesTab deploymentId={deploymentId} page={page} />
			</TabsContent>
			<TabsContent value="growth" className="space-y-4">
				<DeploymentCapacityGrowthTab page={page} />
			</TabsContent>
			<TabsContent value="routing" className="space-y-4">
				<DeploymentCapacityRoutingTab page={page} />
			</TabsContent>
			<TabsContent value="health" className="space-y-4">
				<DeploymentCapacityHealthTab page={page} />
			</TabsContent>
			<TabsContent value="raw" className="space-y-4">
				<DeploymentCapacityRawTab page={page} />
			</TabsContent>
		</Tabs>
	);
}
