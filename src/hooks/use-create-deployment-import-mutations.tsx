import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	convertUserScopeEveLab,
	importUserScopeEveLab,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { CreateDeploymentMutationsArgs } from "./use-create-deployment-mutations-types";

export function useCreateDeploymentImportMutations(
	args: CreateDeploymentMutationsArgs,
) {
	const {
		navigate,
		queryClient,
		watchUserScopeId,
		importServer,
		importLabPath,
		importDeploymentName,
		importCreateContainerlab,
		importContainerlabServer,
		setImportOpen,
	} = args;

	const importEveLab = useMutation({
		mutationFn: async () => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			const server = importServer.trim();
			if (!server) throw new Error("Select an EVE-NG server.");
			const labPath = importLabPath.trim();
			if (!labPath) throw new Error("Select an EVE-NG lab.");
			return importUserScopeEveLab(watchUserScopeId, {
				server,
				labPath,
				deploymentName: importDeploymentName.trim() || undefined,
			});
		},
		onSuccess: async (deployment) => {
			toast.success("EVE-NG lab imported", {
				description: deployment?.name ?? "Deployment created.",
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			setImportOpen(false);
			await navigate({
				to: "/dashboard/deployments",
				search: { userId: watchUserScopeId },
			});
		},
		onError: (error) => {
			toast.error("Failed to import EVE-NG lab", {
				description: (error as Error).message,
			});
		},
	});

	const convertEveLab = useMutation({
		mutationFn: async () => {
			if (!watchUserScopeId) throw new Error("Select a user first.");
			const server = importServer.trim();
			if (!server) throw new Error("Select an EVE-NG server.");
			const labPath = importLabPath.trim();
			if (!labPath) throw new Error("Select an EVE-NG lab.");
			const createDeployment = importCreateContainerlab;
			const containerlabServer = importContainerlabServer.trim();
			if (createDeployment && !containerlabServer) {
				throw new Error("Select a Containerlab server.");
			}
			return convertUserScopeEveLab(watchUserScopeId, {
				server,
				labPath,
				createDeployment,
				containerlabServer: createDeployment ? containerlabServer : undefined,
			});
		},
		onSuccess: async (resp) => {
			const warnings = resp?.warnings ?? [];
			toast.success("Containerlab template created", {
				description: resp?.path ?? "Template saved.",
			});
			if (warnings.length > 0) {
				toast.message("Conversion warnings", {
					description: warnings.slice(0, 3).join(" | "),
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			setImportOpen(false);
			if (resp?.deployment) {
				await navigate({
					to: "/dashboard/deployments",
					search: { userId: watchUserScopeId },
				});
			}
		},
		onError: (error) => {
			toast.error("Failed to convert EVE-NG lab", {
				description: (error as Error).message,
			});
		},
	});

	return { importEveLab, convertEveLab };
}
