import { useCreateDeploymentCreateMutation } from "./use-create-deployment-create-mutation";
import { useCreateDeploymentImportMutations } from "./use-create-deployment-import-mutations";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";
import { useCreateDeploymentValidateMutation } from "./use-create-deployment-validate-mutation";

export function useCreateDeploymentMutations(
	args: CreateDeploymentMutationsArgs,
) {
	const mutation = useCreateDeploymentCreateMutation(args);
	const { importEveLab, convertEveLab } =
		useCreateDeploymentImportMutations(args);
	const validateNetlabTemplate = useCreateDeploymentValidateMutation(args);

	return { mutation, importEveLab, convertEveLab, validateNetlabTemplate };
}
