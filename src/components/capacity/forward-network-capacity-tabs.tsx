import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ForwardNetworkCapacityPageContentProps } from "./forward-network-capacity-page-shared";
import { ForwardNetworkCapacityChangesTab } from "./forward-network-capacity-changes-tab";
import { ForwardNetworkCapacityDevicesTab } from "./forward-network-capacity-devices-tab";
import { ForwardNetworkCapacityGrowthTab } from "./forward-network-capacity-growth-tab";
import { ForwardNetworkCapacityHealthTab } from "./forward-network-capacity-health-tab";
import { ForwardNetworkCapacityInterfacesTab } from "./forward-network-capacity-interfaces-tab";
import { ForwardNetworkCapacityInsightsTab } from "./forward-network-capacity-insights-tab";
import { ForwardNetworkCapacityPlanTab } from "./forward-network-capacity-plan-tab";
import { ForwardNetworkCapacityRawTab } from "./forward-network-capacity-raw-tab";
import { ForwardNetworkCapacityRoutingTab } from "./forward-network-capacity-routing-tab";
import { ForwardNetworkCapacityScorecardTab } from "./forward-network-capacity-scorecard-tab";

export function ForwardNetworkCapacityTabs({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	return (
		<Tabs defaultValue="interfaces" className="space-y-4">
			<TabsList>
				<TabsTrigger value="scorecard">Scorecard</TabsTrigger>
				<TabsTrigger value="interfaces">Interfaces</TabsTrigger>
				<TabsTrigger value="devices">Devices</TabsTrigger>
				<TabsTrigger value="growth">Growth</TabsTrigger>
				<TabsTrigger value="plan">Upgrade Planning</TabsTrigger>
				<TabsTrigger value="security">Security</TabsTrigger>
				<TabsTrigger value="cloud">Cloud</TabsTrigger>
				<TabsTrigger value="cost">Cost</TabsTrigger>
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
			<TabsContent value="security" className="space-y-4">
				<ForwardNetworkCapacityInsightsTab page={page} kind="security" />
			</TabsContent>
			<TabsContent value="cloud" className="space-y-4">
				<ForwardNetworkCapacityInsightsTab page={page} kind="cloud" />
			</TabsContent>
			<TabsContent value="cost" className="space-y-4">
				<ForwardNetworkCapacityInsightsTab page={page} kind="cost" />
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
	);
}
