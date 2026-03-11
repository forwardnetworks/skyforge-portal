import { useDeploymentCapacityColumns } from "@/hooks/use-deployment-capacity-columns";
import { useDeploymentCapacityGrowth } from "@/hooks/use-deployment-capacity-growth";
import { useDeploymentCapacityHistory } from "@/hooks/use-deployment-capacity-history";
import { useDeploymentCapacityRouting } from "@/hooks/use-deployment-capacity-routing";
import type { DeploymentCapacityDerivedInput } from "@/hooks/use-deployment-capacity-shared";

export function useDeploymentCapacityDerived(
	input: DeploymentCapacityDerivedInput,
) {
	const history = useDeploymentCapacityHistory(input);
	const columns = useDeploymentCapacityColumns(input);
	const growth = useDeploymentCapacityGrowth(input);
	const routing = useDeploymentCapacityRouting(input);

	return { ...history, ...columns, ...growth, ...routing };
}
