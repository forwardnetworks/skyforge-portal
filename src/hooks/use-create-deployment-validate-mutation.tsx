import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { validateUserScopeNetlabTemplate } from "../lib/api-client";
import { toAPITemplateSource } from "./create-deployment-shared";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";

export function useCreateDeploymentValidateMutation(
	args: CreateDeploymentMutationsArgs,
) {
	const {
		navigate,
		form,
		watchUserScopeId,
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
			return validateUserScopeNetlabTemplate(watchUserScopeId, body);
		},
		onSuccess: async (res: any) => {
			const runId = String(res?.task?.id ?? res?.task?.task_id ?? "").trim();
			toast.success("Validation queued", {
				description: runId
					? `Run ${runId} started.`
					: "Validation run started.",
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
