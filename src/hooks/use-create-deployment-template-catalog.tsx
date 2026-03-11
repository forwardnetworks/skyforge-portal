import { useMemo } from "react";
import type { ExternalTemplateRepo } from "../lib/api-client";
import type { DeploymentKind } from "./create-deployment-shared";
import { getDeploymentModeOptions } from "./create-deployment-template-catalog-shared";
import { useCreateDeploymentImportOptions } from "./use-create-deployment-import-options";
import { useCreateDeploymentTemplateCatalogCollectors } from "./use-create-deployment-template-catalog-collectors";
import { useCreateDeploymentTemplateCatalogNetlab } from "./use-create-deployment-template-catalog-netlab";
import { useCreateDeploymentTemplateCatalogTemplates } from "./use-create-deployment-template-catalog-templates";

export function useCreateDeploymentTemplateCatalog(args: {
	importContainerlabServer: string;
	importCreateContainerlab: boolean;
	importOpen: boolean;
	importServer: string;
	queryClient: {
		invalidateQueries: (args: { queryKey: unknown[] }) => Promise<unknown>;
	};
	setImportContainerlabServer: (value: string) => void;
	setImportLabPath: (value: string) => void;
	setImportServer: (value: string) => void;
	setTerraformProviderFilter: (value: string) => void;
	setValue: (name: "forwardCollectorId", value: string) => void;
	terraformProviderFilter: string;
	templatePreviewOpen: boolean;
	externalTemplateRepos?: ExternalTemplateRepo[];
	templatesUpdatedAt?: string;
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
		importContainerlabServer,
		importCreateContainerlab,
		importOpen,
		importServer,
		queryClient,
		setImportContainerlabServer,
		setImportLabPath,
		setImportServer,
		setTerraformProviderFilter,
		setValue,
		terraformProviderFilter,
		templatePreviewOpen,
		templatesUpdatedAt,
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
		watchUserScopeId: scopeId,
		watchKind,
		importOpen,
		importServer,
		setImportServer,
		setImportLabPath,
		importCreateContainerlab,
		importContainerlabServer,
		setImportContainerlabServer,
	});
	const collectorCatalog = useCreateDeploymentTemplateCatalogCollectors({
		defaultForwardCollectorConfigId,
		setValue,
		watchForwardCollectorId,
		watchKind,
	});
	const templateCatalog = useCreateDeploymentTemplateCatalogTemplates({
		queryClient,
		setTerraformProviderFilter,
		terraformProviderFilter,
		templatePreviewOpen,
		templatesUpdatedAt,
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
		byosContainerlabEnabled: importOptions.byosContainerlabEnabled,
		byosContainerlabServerRefs: importOptions.byosContainerlabServerRefs,
		byosEveEnabled: importOptions.byosEveEnabled,
		byosNetlabEnabled: importOptions.byosNetlabEnabled,
		byosServerRefs: importOptions.byosServerRefs,
		deploymentModeOptions,
		effectiveSource: templateCatalog.effectiveSource,
		eveLabOptions: importOptions.eveLabOptions,
		eveLabsQ: importOptions.eveLabsQ,
		eveOptions: importOptions.eveOptions,
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
		userContainerlabServersQ: importOptions.userContainerlabServersQ,
		userEveServersQ: importOptions.userEveServersQ,
		userNetlabServersQ: importOptions.userNetlabServersQ,
		variableGroups: collectorCatalog.variableGroups,
	};
}
