import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadUserScopeNetlabTemplateArchive } from "../lib/api-client-deployments-actions-estimates";
import { queryKeys } from "../lib/query-keys";
import { USER_REPO_SOURCE } from "./create-deployment-shared";
import { buildValidationEnvironment } from "./use-create-deployment-validate-mutation";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";

export function useCreateDeploymentUploadNetlabTemplateMutation(
	args: CreateDeploymentMutationsArgs,
) {
	const {
		form,
		queryClient,
		watchUserScopeId,
		variableGroups,
	} = args;

	return useMutation({
		mutationFn: async (file: File) => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			const fileBase64 = await readFileAsBase64(file);
			return uploadUserScopeNetlabTemplateArchive(watchUserScopeId, {
				filename: file.name,
				fileBase64,
				environment: buildValidationEnvironment(form, variableGroups),
			});
		},
		onSuccess: async (res) => {
			form.setValue("source", USER_REPO_SOURCE, {
				shouldDirty: true,
				shouldValidate: true,
			});
			form.setValue("templateRepoId", "", {
				shouldDirty: true,
				shouldValidate: true,
			});
			form.setValue("template", res.template, { shouldDirty: true, shouldValidate: true });
			await queryClient.invalidateQueries({ queryKey: queryKeys.userTemplates(watchUserScopeId, "netlab", USER_REPO_SOURCE, "", res.dir) });
			await queryClient.invalidateQueries({ queryKey: ["userTemplates"] });
			if (res.result.valid) {
				toast.success("Template uploaded", {
					description: `${res.uploadedFiles} files committed to the user repo and validation passed.`,
				});
				return;
			}
			const first = res.result.diagnostics?.[0];
			toast.error(res.result.infrastructureFailure ? "Template uploaded, validation unavailable" : "Template uploaded, validation failed", {
				description: first?.suggestion || first?.message || res.result.summary || "The uploaded template is in the user repo, but launch is blocked until validation passes.",
			});
		},
		onError: (error) => {
			toast.error("Failed to upload template", {
				description: (error as Error).message,
			});
		},
	});
}

async function readFileAsBase64(file: File): Promise<string> {
	const data = await file.arrayBuffer();
	let binary = "";
	const bytes = new Uint8Array(data);
	const chunk = 0x8000;
	for (let i = 0; i < bytes.length; i += chunk) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	}
	return btoa(binary);
}
