import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import type * as z from "zod";
import {
	type CreateUserScopeDeploymentRequest,
	createUserScopeDeployment,
} from "../lib/api-client";
import {
	deploymentActionQueueDescription,
	noOpMessageForDeploymentAction,
	runDeploymentActionWithRetry,
} from "../lib/deployment-actions";
import { queryKeys } from "../lib/query-keys";
import {
	type DeploymentMode,
	applyDeploymentModeToKind,
	deploymentKindToSpec,
	deploymentModeFromKind,
	type formSchema,
	hardRefreshToDeploymentTopology,
	toAPITemplateSource,
	waitForForwardSyncAndNetwork,
} from "./create-deployment-shared";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";

export function useCreateDeploymentCreateMutation(
	args: CreateDeploymentMutationsArgs,
) {
	const {
		navigate,
		queryClient,
		effectiveSource,
		templatesDir,
		allowNoExpiry,
		managedFamilies,
		lifetimeAllowedHours,
	} = args;

	return useMutation({
		mutationFn: async (values: z.infer<typeof formSchema>) => {
			const normalizedKind = applyDeploymentModeToKind(
				values.kind,
				(values.deploymentMode as DeploymentMode | undefined) ??
					deploymentModeFromKind(values.kind),
			);
			if (
				effectiveSource === "custom" &&
				!(values.templateRepoId || "").trim()
			) {
				throw new Error("One-shot repo URL is required");
			}
			const config: Record<string, unknown> = { template: values.template };

			if (values.variableGroupId && values.variableGroupId !== "none") {
				config.envGroupIds = [Number.parseInt(values.variableGroupId, 10)];
				config.envGroupScope = "user";
			}
			if (values.env && values.env.length > 0) {
				const envMap: Record<string, string> = {};
				for (const e of values.env) {
					if (e.key.trim()) envMap[e.key.trim()] = e.value;
				}
				if (Object.keys(envMap).length > 0) config.environment = envMap;
			}
			if (
				["kne_netlab", "kne_containerlab", "terraform"].includes(normalizedKind)
			) {
				const cid = String(values.forwardCollectorId ?? "none").trim();
				if (cid && cid !== "none") {
					config.forwardEnabled = true;
					(config as any).forwardCollectorId = cid;
				}
			}
			if (normalizedKind === "netlab" || normalizedKind === "containerlab") {
				const v = (values.netlabServer || "").trim();
				if (!v) throw new Error("BYOS server is required");
				config.netlabServer = v;
				config.templateSource = toAPITemplateSource(effectiveSource);
				if (
					(effectiveSource === "external" || effectiveSource === "custom") &&
					values.templateRepoId
				) {
					config.templateRepo = values.templateRepoId;
				}
				if (templatesDir) config.templatesDir = templatesDir;
			}
			if (normalizedKind === "kne_netlab") {
				config.templateSource = toAPITemplateSource(effectiveSource);
				if (
					(effectiveSource === "external" || effectiveSource === "custom") &&
					values.templateRepoId
				) {
					config.templateRepo = values.templateRepoId;
				}
				if (templatesDir) config.templatesDir = templatesDir;
				const debugFlags = String(values.netlabInitialDebug ?? "").trim();
				if (debugFlags) config.netlabInitialDebug = debugFlags;
			}
			if (
				normalizedKind === "kne_containerlab" ||
				normalizedKind === "terraform"
			) {
				config.templateSource = toAPITemplateSource(effectiveSource);
				if (
					(effectiveSource === "external" || effectiveSource === "custom") &&
					values.templateRepoId
				) {
					config.templateRepo = values.templateRepoId;
				}
				if (templatesDir) config.templatesDir = templatesDir;
			}
			const { family, engine } = deploymentKindToSpec(normalizedKind);
			config.engine = engine;
			if (
				managedFamilies.has(String(family).trim().toLowerCase())
			) {
				const selectedLifetime = String(values.labLifetime ?? "").trim();
				if (allowNoExpiry && selectedLifetime === "never") {
					config.leaseEnabled = false;
				} else {
					const selectedHours = Number.parseInt(selectedLifetime, 10);
					if (
						Number.isFinite(selectedHours) &&
						selectedHours > 0 &&
						lifetimeAllowedHours.includes(selectedHours)
					) {
						config.leaseEnabled = true;
						config.leaseHours = selectedHours;
					}
				}
			}
			const body: CreateUserScopeDeploymentRequest = {
				name: values.name,
				family,
				engine,
				config: config as any,
			};
			return createUserScopeDeployment(values.userId, body);
		},
		onSuccess: async (created, variables) => {
			const deploymentId = String(created?.id ?? "").trim();
			const scopeId = String(created?.userId ?? variables.userId ?? "").trim();
			if (!deploymentId || !scopeId) {
				throw new Error("Deployment created but ID is missing");
			}
			const forwardCollectorId = String(
				variables.forwardCollectorId ?? "none",
			).trim();
			const shouldOpenForward = Boolean(
				forwardCollectorId && forwardCollectorId !== "none",
			);
			try {
				const action = await runDeploymentActionWithRetry(
					scopeId,
					deploymentId,
					"create",
				);
				if (action.queued) {
					toast.success("Deployment created and bring-up queued", {
						description: deploymentActionQueueDescription(
							action.queue,
							variables.name,
						),
					});
				} else {
					toast.message(
						noOpMessageForDeploymentAction("create", action.meta.reason),
						{ description: variables.name },
					);
				}
			} catch (error) {
				toast.error("Deployment created, but bring-up was not queued", {
					description: (error as Error).message,
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			await navigate({
				to: "/dashboard/deployments/$deploymentId",
				params: { deploymentId },
				search: { tab: "topology" } as any,
			});
			if (shouldOpenForward && typeof window !== "undefined") {
				void (async () => {
					try {
						await waitForForwardSyncAndNetwork(scopeId, deploymentId);
						toast.success("Forward sync completed", {
							description:
								"Use the deployment page buttons to open the network in Forward.",
						});
						hardRefreshToDeploymentTopology(deploymentId);
					} catch (error) {
						toast.error("Forward sync did not complete", {
							description:
								error instanceof Error ? error.message : String(error),
						});
					}
				})();
			}
		},
		onError: (error) => {
			toast.error("Failed to create deployment", {
				description: (error as Error).message,
			});
		},
	});
}
