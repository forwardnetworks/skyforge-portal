import { apiFetch } from "./http";
import type {
	CapacityBgpNeighborRow,
	CapacityDeviceInventoryRow,
	CapacityInterfaceInventoryRow,
	CapacityRouteScaleRow,
} from "./api-client-deployments-capacity-shared";

export type DeploymentCapacityInventoryResponse = {
	userId: string;
	deploymentId: string;
	forwardNetworkId: string;
	asOf?: string;
	snapshotId?: string;
	devices: CapacityDeviceInventoryRow[];
	interfaces: CapacityInterfaceInventoryRow[];
	interfaceVrfs?: Array<{
		deviceName: string;
		vrf: string;
		ifaceName: string;
		subIfaceName?: string | null;
	}>;
	hardwareTcam?: Array<{
		deviceName: string;
		vendor?: string;
		os?: string;
		model?: string | null;
		tcamUsed: number;
		tcamTotal: number;
		commandText?: string;
		evidence?: string;
	}>;
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export type ForwardNetworkCapacityInventoryResponse = {
	userId: string;
	networkRef: string;
	forwardNetworkId: string;
	asOf?: string;
	snapshotId?: string;
	devices: CapacityDeviceInventoryRow[];
	interfaces: CapacityInterfaceInventoryRow[];
	interfaceVrfs?: Array<{
		deviceName: string;
		vrf: string;
		ifaceName: string;
		subIfaceName?: string | null;
	}>;
	hardwareTcam?: Array<{
		deviceName: string;
		vendor?: string;
		os?: string;
		model?: string | null;
		tcamUsed: number;
		tcamTotal: number;
		commandText?: string;
		evidence?: string;
	}>;
	routeScale: CapacityRouteScaleRow[];
	bgpNeighbors: CapacityBgpNeighborRow[];
};

export async function getDeploymentCapacityInventory(
	userId: string,
	deploymentId: string,
): Promise<DeploymentCapacityInventoryResponse> {
	return apiFetch<DeploymentCapacityInventoryResponse>(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/capacity/inventory`,
	);
}

export async function getForwardNetworkCapacityInventory(
	userId: string,
	networkRef: string,
): Promise<ForwardNetworkCapacityInventoryResponse> {
	return apiFetch<ForwardNetworkCapacityInventoryResponse>(
		`/api/users/${encodeURIComponent(userId)}/forward-networks/${encodeURIComponent(networkRef)}/capacity/inventory`,
	);
}
