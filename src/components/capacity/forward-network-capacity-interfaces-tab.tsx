import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ForwardNetworkCapacityInterfaceGroupSummary } from "./forward-network-capacity-interface-group-summary";
import { ForwardNetworkCapacityInterfaceRollups } from "./forward-network-capacity-interface-rollups";
import type { ForwardNetworkCapacityInterfacesTabProps } from "./forward-network-capacity-interface-tab-types";
import { ForwardNetworkCapacityInterfacesToolbar } from "./forward-network-capacity-interfaces-toolbar";

export function ForwardNetworkCapacityInterfacesTab({
	page,
}: ForwardNetworkCapacityInterfacesTabProps) {
	return (
		<Card>
			<CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<CardTitle className="text-base">Interface Insights</CardTitle>
				<ForwardNetworkCapacityInterfacesToolbar page={page} />
			</CardHeader>
			<CardContent className="space-y-3">
				<ForwardNetworkCapacityInterfaceGroupSummary page={page} />
				<ForwardNetworkCapacityInterfaceRollups page={page} />
			</CardContent>
		</Card>
	);
}
