import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type * as z from "zod";
import { USER_REPO_SOURCE, formSchema } from "./create-deployment-shared";
import { validateUserScopeNetlabTemplateSync } from "../lib/api-client-deployments-actions-estimates";
import { toAPITemplateSource } from "./create-deployment-shared";
import { useCreateDeploymentData } from "./use-create-deployment-data";
import { useCreateDeploymentMutations } from "./use-create-deployment-mutations";
import { buildValidationEnvironment } from "./use-create-deployment-validate-mutation";

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

	const [templatePreviewOpen, setTemplatePreviewOpen] = useState(false);
	const [terraformProviderFilter, setTerraformProviderFilter] = useState("all");
	const lastAutoNameRef = useRef("");

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			userId: userId || "",
			name: "",
			kind: "kne_netlab",
			source: "blueprints",
			templateRepoId: "",
			template: "",
			netlabServer: "",
			forwardCollectorId: "none",
			deploymentMode: "in_cluster",
			labLifetime: "",
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

	const { mutation, validateTemplate, uploadNetlabTemplate } =
		useCreateDeploymentMutations({
			navigate,
			queryClient,
			form,
			watchUserScopeId,
			watchKind,
			watchSource,
			watchTemplate,
			watchTemplateRepoId,
			effectiveSource: data.effectiveSource,
			templatesDir: data.templatesQ.data?.dir,
			allowNoExpiry: data.allowNoExpiry,
			managedFamilies: data.managedFamilies,
			lifetimeAllowedHours: data.lifetimeAllowedHours,
			variableGroups: data.variableGroups,
		});

	const validationEnvironment = buildValidationEnvironment(form, data.variableGroups);
	const validationEnvKey = JSON.stringify(
		Object.entries(validationEnvironment).sort(([left], [right]) =>
			left.localeCompare(right),
		),
	);
	const resetValidateTemplate = validateTemplate.reset;
	const resetUploadNetlabTemplate = uploadNetlabTemplate.reset;

	useEffect(() => {
		resetValidateTemplate();
		resetUploadNetlabTemplate();
	}, [
		watchKind,
		watchSource,
		watchTemplate,
		watchTemplateRepoId,
		watchUserScopeId,
		resetValidateTemplate,
		resetUploadNetlabTemplate,
	]);

	useEffect(() => {
		if (!watchUserScopeId || !watchTemplate) return;
		if (data.watchSpec.engine !== "netlab") return;
		if (watchKind === "terraform") return;
		const body: {
			source: string;
			repo?: string;
			dir?: string;
			template: string;
			environment?: Record<string, string>;
		} = {
			source: toAPITemplateSource(data.effectiveSource),
			template: watchTemplate,
		};
		if (
			(data.effectiveSource === "external" || data.effectiveSource === "custom") &&
			watchTemplateRepoId
		) {
			body.repo = watchTemplateRepoId;
		}
		if (data.templatesQ.data?.dir) {
			body.dir = data.templatesQ.data.dir;
		}
		if (Object.keys(validationEnvironment).length > 0) {
			body.environment = validationEnvironment;
		}
		void queryClient.prefetchQuery({
			queryKey: [
				"userScopeNetlabValidationWarm",
				watchUserScopeId,
				watchKind,
				data.effectiveSource,
				watchTemplateRepoId ?? "",
				data.templatesQ.data?.dir ?? "",
				watchTemplate,
				validationEnvKey,
			],
			queryFn: () => validateUserScopeNetlabTemplateSync(watchUserScopeId, body),
			staleTime: 30_000,
		});
	}, [
		data.effectiveSource,
		data.templatesQ.data?.dir,
		data.watchSpec.engine,
		queryClient,
		validationEnvKey,
		watchKind,
		watchTemplate,
		watchTemplateRepoId,
		watchUserScopeId,
	]);

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

	useEffect(() => {
		const base = (watchTemplate || watchKind).split("/").pop() || watchKind;
		const ts = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\..+/, "")
			.slice(0, 15);
		const nextAutoName = `${base}-${ts}`;
		const currentName = String(form.getValues("name") ?? "").trim();
		const previousAutoName = lastAutoNameRef.current;
		if (
			currentName !== "" &&
			currentName !== previousAutoName &&
			currentName !== nextAutoName
		) {
			return;
		}
		lastAutoNameRef.current = nextAutoName;
		if (currentName === nextAutoName) {
			return;
		}
		setValue("name", nextAutoName, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: false,
		});
	}, [form, setValue, watchKind, watchTemplate]);

	function onSubmit(values: z.infer<typeof formSchema>) {
		mutation.mutate(values);
	}

	return {
		navigate,
		form,
		onSubmit,
		watchUserScopeId,
		watchKind,
		watchSource,
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
		byosNetlabEnabled: data.byosNetlabEnabled,
		byosKNEEnabled: data.byosKNEEnabled,
		forwardCollectorsQ: data.forwardCollectorsQ,
		selectableCollectors: data.selectableCollectors,
		effectiveSource: data.effectiveSource,
		externalAllowed: data.externalAllowed,
		externalRepos: data.externalRepos,
		byosServerRefs: data.byosServerRefs,
		userNetlabServersQ: data.userNetlabServersQ,
		userKNEServersQ: data.userKNEServersQ,
		templates: data.templates,
		templatesQ: data.templatesQ,
		terraformProviders: data.terraformProviders,
		terraformProviderFilter,
		setTerraformProviderFilter,
		awsSsoStatusQ: data.awsSsoStatusQ,
		awsTerraformReadinessQ: data.awsTerraformReadinessQ,
		userAwsSsoQ: data.userAwsSsoQ,
		awsSsoSession: data.awsSsoSession,
		awsSsoPollStatus: data.awsSsoPollStatus,
		startAwsSsoM: data.startAwsSsoM,
		templatePreviewOpen,
		setTemplatePreviewOpen,
		templatePreviewQ: data.templatePreviewQ,
		selectedTemplateEstimate: data.selectedTemplateEstimate,
		templateEstimatePending: data.templateEstimatePending,
		templateEstimateQ: data.templateEstimateQ,
		mutation,
		validateTemplate,
		uploadNetlabTemplate,
		netlabValidationResult:
			(uploadNetlabTemplate.data as any)?.result ??
			(validateTemplate.data as any)?.result ??
			null,
		variableGroups: data.variableGroups,
		fields,
		netlabDeviceOptions: data.netlabDeviceOptions,
		netlabDeviceOptionsQ: data.netlabDeviceOptionsQ,
		setValue,
		append,
		remove,
	};
}

export type CreateDeploymentPageState = ReturnType<
	typeof useCreateDeploymentPage
>;
