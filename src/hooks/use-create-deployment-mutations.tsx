import { useCreateDeploymentCreateMutation } from "./use-create-deployment-create-mutation";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";
import { useCreateDeploymentValidateMutation } from "./use-create-deployment-validate-mutation";

export function useCreateDeploymentMutations(
	args: CreateDeploymentMutationsArgs,
) {
	const mutation = useCreateDeploymentCreateMutation(args);
	const validateNetlabTemplate = useCreateDeploymentValidateMutation(args);

	return { mutation, validateNetlabTemplate };
}
