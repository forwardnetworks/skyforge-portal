import type { QueryClient } from "@tanstack/react-query";
import type { UseFormReturn, UseFormSetValue } from "react-hook-form";
import type { z } from "zod";
import type { ExternalTemplateRepo } from "../lib/api-client";
import type { DeploymentKind, formSchema } from "./create-deployment-shared";
import { useCreateDeploymentSettings } from "./use-create-deployment-settings";
import { useCreateDeploymentTemplateCatalog } from "./use-create-deployment-template-catalog";

type CreateDeploymentForm = z.infer<typeof formSchema>;

type Args = {
	queryClient: QueryClient;
	setTerraformProviderFilter: (value: string) => void;
	setValue: UseFormSetValue<CreateDeploymentForm>;
	terraformProviderFilter: string;
	templatePreviewOpen: boolean;
	userId?: string;
	watchForwardCollectorId?: string;
	watchKind: DeploymentKind;
	watchLabLifetime?: string;
	watchSource: string;
	watchTemplate?: string;
	watchTemplateRepoId?: string;
	watchUserScopeId?: string;
	watchDeploymentMode?: string;
	form: UseFormReturn<CreateDeploymentForm>;
};

export function useCreateDeploymentData(args: Args) {
	const settings = useCreateDeploymentSettings({
		queryClient: args.queryClient,
		setValue: args.setValue,
		userId: args.userId,
		watchDeploymentMode: args.watchDeploymentMode,
		watchKind: args.watchKind,
		watchLabLifetime: args.watchLabLifetime,
		watchTemplate: args.watchTemplate,
		watchUserScopeId: args.watchUserScopeId,
	});

	const catalog = useCreateDeploymentTemplateCatalog({
		queryClient: args.queryClient,
		setTerraformProviderFilter: args.setTerraformProviderFilter,
		setValue: (name, value) => args.setValue(name, value),
		terraformProviderFilter: args.terraformProviderFilter,
		templatePreviewOpen: args.templatePreviewOpen,
		externalTemplateRepos: settings.userSettingsQ.data?.externalTemplateRepos as
			| ExternalTemplateRepo[]
			| undefined,
		templatesUpdatedAt: settings.templatesUpdatedAt,
		watchForwardCollectorId: args.watchForwardCollectorId,
		watchKind: args.watchKind,
		watchSource: args.watchSource,
		watchSpec: settings.watchSpec,
		watchTemplate: args.watchTemplate,
		watchTemplateRepoId: args.watchTemplateRepoId,
		watchUserScopeId: args.watchUserScopeId,
		defaultForwardCollectorConfigId:
			settings.userSettingsQ.data?.defaultForwardCollectorConfigId,
	});

	return {
		...settings,
		...catalog,
	};
}
