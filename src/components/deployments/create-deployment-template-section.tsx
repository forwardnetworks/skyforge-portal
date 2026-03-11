import type { CreateDeploymentPageState } from "../../hooks/use-create-deployment-page";
import { CreateDeploymentTemplatePickerSection } from "./create-deployment-template-picker-section";
import { CreateDeploymentTemplateSourceSection } from "./create-deployment-template-source-section";

type Props = { page: CreateDeploymentPageState };

export function CreateDeploymentTemplateSection({ page }: Props) {
	return (
		<>
			<CreateDeploymentTemplateSourceSection page={page} />
			<CreateDeploymentTemplatePickerSection page={page} />
		</>
	);
}
