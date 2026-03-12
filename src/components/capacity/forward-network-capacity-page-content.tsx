import {
	ForwardNetworkCapacityHeader,
	ForwardNetworkCapacityMissingUser,
} from "@/components/capacity/forward-network-capacity-header";
import { ForwardNetworkCapacityDialogs } from "@/components/capacity/forward-network-capacity-dialogs";
import { ForwardNetworkCapacityOverviewCards } from "@/components/capacity/forward-network-capacity-overview-cards";
import { ForwardNetworkCapacityTabs } from "@/components/capacity/forward-network-capacity-tabs";
import type { ForwardNetworkCapacityPageContentProps } from "@/components/capacity/forward-network-capacity-page-shared";

export function ForwardNetworkCapacityPageContent({
	page,
}: ForwardNetworkCapacityPageContentProps) {
	if (!page.ownerUserId) {
		return <ForwardNetworkCapacityMissingUser />;
	}

	return (
		<div className="space-y-6 p-6 pb-20">
			<ForwardNetworkCapacityHeader page={page} />
			<ForwardNetworkCapacityOverviewCards page={page} />
			<ForwardNetworkCapacityTabs page={page} />
			<ForwardNetworkCapacityDialogs page={page} />
		</div>
	);
}
