import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	validateUserScopeNetlabTemplate,
	validateUserScopeTerraformTemplate,
} from "../lib/api-client";
import { toAPITemplateSource } from "./create-deployment-shared";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";

export function useCreateDeploymentValidateMutation(
	args: CreateDeploymentMutationsArgs,
) {
	const {
		navigate,
		form,
		watchUserScopeId,
		watchKind,
		watchTemplate,
		watchTemplateRepoId,
		effectiveSource,
		templatesDir,
		variableGroups,
	} = args;

	return useMutation({
		mutationFn: async () => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			if (!watchTemplate) throw new Error("Select a template first.");
			const envFromList = new Map<string, string>();
			for (const kv of form.getValues("env") || []) {
				const k = (kv?.key ?? "").trim();
				if (!k) continue;
				envFromList.set(k, String(kv?.value ?? ""));
			}
			const groupIdRaw = String(form.getValues("variableGroupId") ?? "none");
			const groupId = groupIdRaw !== "none" ? Number(groupIdRaw) : null;
			const groupVars = groupId
				? variableGroups.find((g) => g.id === groupId)?.variables
				: undefined;
			const env: Record<string, string> = { ...(groupVars ?? {}) };
			for (const [k, v] of envFromList.entries()) env[k] = v;
			const body: any = {
				source: toAPITemplateSource(effectiveSource),
				template: watchTemplate,
				environment: env,
			};
			if (
				(effectiveSource === "external" || effectiveSource === "custom") &&
				watchTemplateRepoId
			) {
				body.repo = watchTemplateRepoId;
			}
			if (templatesDir) body.dir = templatesDir;
			if (watchKind === "terraform") {
				body.cloud = inferTerraformCloudFromTemplate(watchTemplate, templatesDir);
				return validateUserScopeTerraformTemplate(watchUserScopeId, body);
			}
			return validateUserScopeNetlabTemplate(watchUserScopeId, body);
		},
		onSuccess: async (res: any) => {
			const runId = String(res?.task?.id ?? res?.task?.task_id ?? "").trim();
			const title =
				watchKind === "terraform" ? "Terraform plan queued" : "Validation queued";
			const description =
				watchKind === "terraform"
					? runId
						? `Plan run ${runId} started.`
						: "Terraform plan started."
					: runId
						? `Run ${runId} started.`
						: "Validation run started.";
			toast.success(title, {
				description,
			});
			if (runId) {
				navigate({ to: "/dashboard/runs/$runId", params: { runId } });
			}
		},
		onError: (err: any) => {
			toast.error("Validation failed", {
				description: String(err?.message ?? err),
			});
		},
	});
}

function inferTerraformCloudFromTemplate(
	template: string,
	templatesDir?: string,
): string | undefined {
	const candidates = [`${templatesDir ?? ""}/${template}`, template];
	for (const candidate of candidates) {
		const parts = String(candidate)
			.split("/")
			.map((part) => part.trim().toLowerCase())
			.filter(Boolean);
		for (const part of parts) {
			if (part === "aws" || part === "azure" || part === "gcp") {
				return part;
			}
		}
	}
	return undefined;
}
