import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type * as z from "zod";
import { useDashboardEvents } from "../lib/dashboard-events";
import { USER_REPO_SOURCE, formSchema } from "./create-deployment-shared";
import { useCreateDeploymentData } from "./use-create-deployment-data";
import { useCreateDeploymentMutations } from "./use-create-deployment-mutations";

export {
	USER_REPO_SOURCE,
	applyDeploymentModeToKind,
	deploymentModeFromKind,
	hostLabelFromURL,
	formatResourceEstimate,
	NETLAB_DEVICE_ENV_KEY,
	CUSTOM_ENV_KEY_VALUE,
	CUSTOM_ENV_VALUE,
	supportedEnvKeys,
} from "./create-deployment-shared";
export type { DeploymentMode } from "./create-deployment-shared";

export function useCreateDeploymentPage(userId?: string) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	useDashboardEvents(true);

	const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
	const [terraformProviderFilter, setTerraformProviderFilter] = useState("all");
	const [importOpen, setImportOpen] = useState(false);
	const [importServer, setImportServer] = useState("");
	const [importLabPath, setImportLabPath] = useState("");
	const [importDeploymentName, setImportDeploymentName] = useState("");
	const [importCreateContainerlab, setImportCreateContainerlab] =
		useState(false);
	const [importContainerlabServer, setImportContainerlabServer] = useState("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			userId: userId || "",
			name: "",
			kind: "c9s_netlab",
			source: "blueprints",
			templateRepoId: "",
			template: "",
			netlabServer: "",
			eveServer: "",
			forwardCollectorId: "none",
			deploymentMode: "in_cluster",
			labLifetime: "never",
			netlabInitialDebug: "",
			variableGroupId: "none",
			env: [],
		},
	});

	const { watch, setValue, control } = form;
	const { fields, append, remove } = useFieldArray({ control, name: "env" });

	const watchUserScopeId = watch("userId");
	const watchKind = watch("kind");
	const watchSource = watch("source");
	const watchTemplateRepoId = watch("templateRepoId");
	const watchTemplate = watch("template");
	const watchName = watch("name");
	const watchForwardCollectorId = watch("forwardCollectorId");
	const watchDeploymentMode = watch("deploymentMode");
	const watchLabLifetime = watch("labLifetime");
	const watchEnv = watch("env");

	const data = useCreateDeploymentData({
		form,
		importContainerlabServer,
		importCreateContainerlab,
		importLabPath,
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
		userId,
		watchDeploymentMode,
		watchForwardCollectorId,
		watchKind,
		watchLabLifetime,
		watchSource,
		watchTemplate,
		watchTemplateRepoId,
		watchUserScopeId,
	});

	useEffect(() => {
		const defaults = data.userSettingsQ.data?.defaultEnv ?? [];
		if (!defaults.length) return;
		const current = form.getValues("env") ?? [];
		if (current.length) return;
		setValue("env", defaults, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: true,
		});
	}, [data.userSettingsQ.data?.defaultEnv, form, setValue]);

	const { mutation, importEveLab, convertEveLab, validateNetlabTemplate } =
		useCreateDeploymentMutations({
			navigate,
			queryClient,
			form,
			watchUserScopeId,
			watchKind,
			watchTemplate,
			watchTemplateRepoId,
			effectiveSource: data.effectiveSource,
			templatesDir: data.templatesQ.data?.dir,
			allowNoExpiry: data.allowNoExpiry,
			managedFamilies: data.managedFamilies,
			lifetimeAllowedHours: data.lifetimeAllowedHours,
			variableGroups: data.variableGroups,
			importServer,
			importLabPath,
			importDeploymentName,
			importCreateContainerlab,
			importContainerlabServer,
			setImportOpen,
		});

	function onSubmit(values: z.infer<typeof formSchema>) {
		mutation.mutate(values);
	}

	return {
		navigate,
		form,
		onSubmit,
		watchUserScopeId,
		watchKind,
		watchTemplate,
		watchName,
		watchEnv,
		watchSpec: data.watchSpec,
		driverSummary: data.driverSummary,
		lifetimeManaged: data.lifetimeManaged,
		lifetimeCanEdit: data.lifetimeCanEdit,
		lifetimeOptions: data.lifetimeOptions,
		expiryAction: data.expiryAction,
		lifetimeDefaultHours: data.lifetimeDefaultHours,
		deploymentModeOptions: data.deploymentModeOptions,
		byosEveEnabled: data.byosEveEnabled,
		byosNetlabEnabled: data.byosNetlabEnabled,
		byosContainerlabEnabled: data.byosContainerlabEnabled,
		forwardCollectorsQ: data.forwardCollectorsQ,
		selectableCollectors: data.selectableCollectors,
		effectiveSource: data.effectiveSource,
		externalAllowed: data.externalAllowed,
		externalRepos: data.externalRepos,
		byosServerRefs: data.byosServerRefs,
		userNetlabServersQ: data.userNetlabServersQ,
		userContainerlabServersQ: data.userContainerlabServersQ,
		eveOptions: data.eveOptions,
		userEveServersQ: data.userEveServersQ,
		templates: data.templates,
		templatesQ: data.templatesQ,
		terraformProviders: data.terraformProviders,
		terraformProviderFilter,
		setTerraformProviderFilter,
		templatePreviewOpen,
		setTemplatePreviewOpen,
		templatePreviewQ: data.templatePreviewQ,
		selectedTemplateEstimate: data.selectedTemplateEstimate,
		templateEstimatePending: data.templateEstimatePending,
		templateEstimateQ: data.templateEstimateQ,
		mutation,
		validateNetlabTemplate,
		variableGroups: data.variableGroups,
		fields,
		netlabDeviceOptions: data.netlabDeviceOptions,
		netlabDeviceOptionsQ: data.netlabDeviceOptionsQ,
		setValue,
		append,
		remove,
		importOpen,
		setImportOpen,
		importServer,
		setImportServer,
		importLabPath,
		setImportLabPath,
		importDeploymentName,
		setImportDeploymentName,
		importCreateContainerlab,
		setImportCreateContainerlab,
		importContainerlabServer,
		setImportContainerlabServer,
		eveLabsQ: data.eveLabsQ,
		eveLabOptions: data.eveLabOptions,
		byosContainerlabServerRefs: data.byosContainerlabServerRefs,
		importEveLab,
		convertEveLab,
	};
}

export type CreateDeploymentPageState = ReturnType<
	typeof useCreateDeploymentPage
>;
