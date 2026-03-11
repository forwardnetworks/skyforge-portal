import type { CreateDeploymentPageState } from "../../hooks/use-create-deployment-page";
import { CreateDeploymentConfigSection } from "./create-deployment-config-section";
import { CreateDeploymentTemplateSection } from "./create-deployment-template-section";

type Props = {
	page: CreateDeploymentPageState;
};

export function CreateDeploymentBasicsSection({ page }: Props) {
	return (
		<div className="grid gap-6 md:grid-cols-2">
			<CreateDeploymentConfigSection page={page} />
			<CreateDeploymentTemplateSection page={page} />
		</div>
	);
}
