import { useMemo } from "react";
import type { ExternalTemplateRepo } from "../lib/api-client";
import type { DeploymentKind } from "./create-deployment-shared";
import { getDeploymentModeOptions } from "./create-deployment-template-catalog-shared";
import { useCreateDeploymentImportOptions } from "./use-create-deployment-import-options";
import { useCreateDeploymentTemplateCatalogCollectors } from "./use-create-deployment-template-catalog-collectors";
import { useCreateDeploymentTemplateCatalogNetlab } from "./use-create-deployment-template-catalog-netlab";
import { useCreateDeploymentTemplateCatalogTemplates } from "./use-create-deployment-template-catalog-templates";

export function useCreateDeploymentTemplateCatalog(args: {
	setTerraformProviderFilter: (value: string) => void;
	setValue: (name: "forwardCollectorId", value: string) => void;
	terraformProviderFilter: string;
	templatePreviewOpen: boolean;
	externalTemplateRepos?: ExternalTemplateRepo[];
	watchForwardCollectorId?: string;
	watchKind: DeploymentKind;
	watchSource: string;
	watchSpec: { family: string; engine?: string };
	watchTemplate?: string;
	watchTemplateRepoId?: string;
	watchUserScopeId?: string;
	defaultForwardCollectorConfigId?: string;
}) {
	const {
		defaultForwardCollectorConfigId,
		externalTemplateRepos,
		setTerraformProviderFilter,
		setValue,
		terraformProviderFilter,
		templatePreviewOpen,
		watchForwardCollectorId,
		watchKind,
		watchSource,
		watchSpec,
		watchTemplate,
		watchTemplateRepoId,
		watchUserScopeId,
	} = args;
	const scopeId = watchUserScopeId ?? "";

	const netlabCatalog = useCreateDeploymentTemplateCatalogNetlab({ scopeId });
	const importOptions = useCreateDeploymentImportOptions({
		watchKind,
	});
	const collectorCatalog = useCreateDeploymentTemplateCatalogCollectors({
		defaultForwardCollectorConfigId,
		setValue,
		watchForwardCollectorId,
		watchKind,
	});
	const templateCatalog = useCreateDeploymentTemplateCatalogTemplates({
		setTerraformProviderFilter,
		terraformProviderFilter,
		templatePreviewOpen,
		watchKind,
		watchSource,
		watchSpec,
		watchTemplate,
		watchTemplateRepoId,
		watchUserScopeId,
	});

	const deploymentModeOptions = useMemo(
		() => getDeploymentModeOptions(watchKind),
		[watchKind],
	);
	const externalRepos = useMemo(
		() =>
			(externalTemplateRepos ?? []).filter(
				(repo) =>
					!!repo &&
					typeof repo.id === "string" &&
					typeof repo.repo === "string",
			),
		[externalTemplateRepos],
	);
	const externalAllowed = externalRepos.length > 0;

	return {
		byosKNEEnabled: importOptions.byosKNEEnabled,
		byosKNEServerRefs: importOptions.byosKNEServerRefs,
		byosNetlabEnabled: importOptions.byosNetlabEnabled,
		byosServerRefs: importOptions.byosServerRefs,
		deploymentModeOptions,
		effectiveSource: templateCatalog.effectiveSource,
		externalAllowed,
		externalRepos,
		forwardCollectorsQ: collectorCatalog.forwardCollectorsQ,
		netlabDeviceOptions: netlabCatalog.netlabDeviceOptions,
		netlabDeviceOptionsQ: netlabCatalog.netlabDeviceOptionsQ,
		selectableCollectors: collectorCatalog.selectableCollectors,
		selectedTemplateEstimate: templateCatalog.selectedTemplateEstimate,
		templateEstimatePending: templateCatalog.templateEstimatePending,
		templateEstimateQ: templateCatalog.templateEstimateQ,
		templatePreviewQ: templateCatalog.templatePreviewQ,
		templates: templateCatalog.templates,
		templatesQ: templateCatalog.templatesQ,
		terraformProviders: templateCatalog.terraformProviders,
		userKNEServersQ: importOptions.userKNEServersQ,
		userNetlabServersQ: importOptions.userNetlabServersQ,
		variableGroups: collectorCatalog.variableGroups,
	};
}
