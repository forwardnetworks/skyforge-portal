import { useDeploymentCapacityDeviceColumns } from "@/hooks/use-deployment-capacity-device-columns";
import { useDeploymentCapacityInterfaceColumns } from "@/hooks/use-deployment-capacity-interface-columns";

import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";

export function useDeploymentCapacityColumns(
	input: Pick<DeploymentCapacityDerivedInput, "ifaceMetric">,
) {
	const { ifaceMetric } = input;

	const ifaceColumns = useDeploymentCapacityInterfaceColumns({ ifaceMetric });
	const deviceColumns = useDeploymentCapacityDeviceColumns();

	return { ifaceColumns, deviceColumns };
}
