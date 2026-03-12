import { apiFetch } from "./http";
import type {
	CapacityPathSearchQuery,
	ForwardNetworkCapacityPathBottleneckItem,
	ForwardNetworkCapacityPathBottlenecksCoverage,
} from "./api-client-deployments-capacity-shared";

export type ForwardNetworkCapacityPathBottlenecksRequest = {
	window: string;
	snapshotId?: string;
	includeHops?: boolean;
	queries: CapacityPathSearchQuery[];
};

export type ForwardNetworkCapacityPathBottlenecksResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	window: string;
	snapshotId?: string;
	coverage?: ForwardNetworkCapacityPathBottlenecksCoverage | null;
	items: ForwardNetworkCapacityPathBottleneckItem[];
};

export async function postForwardNetworkCapacityPathBottlenecks(
	userId: string,
	networkRef: string,
	body: ForwardNetworkCapacityPathBottlenecksRequest,
): Promise<ForwardNetworkCapacityPathBottlenecksResponse> {
	return apiFetch<ForwardNetworkCapacityPathBottlenecksResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/path-bottlenecks`,
		{ method: "POST", body: JSON.stringify(body) },
	);
}
