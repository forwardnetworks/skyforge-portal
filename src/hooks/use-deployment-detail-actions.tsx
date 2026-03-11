import type { UserScopeDeployment } from "@/lib/api-client";
import {
	deleteDeployment,
	saveDeploymentNodeConfig,
	syncDeploymentForward,
	updateDeploymentForwardConfig,
} from "@/lib/api-client";
import {
	deploymentActionQueueDescription,
	noOpMessageForDeploymentAction,
	runDeploymentActionWithRetry,
} from "@/lib/deployment-actions";
import { queryKeys } from "@/lib/query-keys";
import { type QueryClient, useMutation } from "@tanstack/react-query";
import type { NavigateFn } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export function useDeploymentDetailActions(args: {
	deployment?: UserScopeDeployment;
	navigate: NavigateFn;
	queryClient: QueryClient;
	topologyNodes: Array<{ id: string }>;
}) {
	const { deployment, navigate, queryClient, topologyNodes } = args;
	const [actionPending, setActionPending] = useState(false);

	const handleStart = async () => {
		if (actionPending) return;
		setActionPending(true);
		try {
			if (!deployment) throw new Error("deployment not found");
			const action = await runDeploymentActionWithRetry(
				deployment.userId,
				deployment.id,
				"start",
			);
			if (!action.queued) {
				toast.message(
					noOpMessageForDeploymentAction("start", action.meta.reason),
					{
						description: deployment.name,
					},
				);
			} else {
				toast.success("Deployment starting", {
					description: deploymentActionQueueDescription(
						action.queue,
						deployment.name,
					),
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		} catch (error) {
			toast.error("Start action failed", {
				description: (error as Error).message,
			});
		} finally {
			setActionPending(false);
		}
	};

	const handleStop = async () => {
		if (actionPending) return;
		setActionPending(true);
		try {
			if (!deployment) throw new Error("deployment not found");
			const action = await runDeploymentActionWithRetry(
				deployment.userId,
				deployment.id,
				"stop",
			);
			if (!action.queued) {
				toast.message(
					noOpMessageForDeploymentAction("stop", action.meta.reason),
					{
						description: deployment.name,
					},
				);
			} else {
				toast.success("Deployment stopping", {
					description: deploymentActionQueueDescription(
						action.queue,
						deployment.name,
					),
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		} catch (error) {
			toast.error("Stop action failed", {
				description: (error as Error).message,
			});
		} finally {
			setActionPending(false);
		}
	};

	const handleDestroy = async () => {
		if (actionPending) return;
		setActionPending(true);
		try {
			if (!deployment) throw new Error("deployment not found");
			await deleteDeployment(deployment.userId, deployment.id);
			toast.success("Deployment deleted");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			navigate({
				to: "/dashboard/deployments",
				search: { userId: deployment.userId },
			});
		} catch (error) {
			toast.error("Failed to delete", {
				description: (error as Error).message,
			});
		} finally {
			setActionPending(false);
		}
	};

	const saveConfig = useMutation({
		mutationFn: async (nodeId: string) => {
			if (!deployment) throw new Error("deployment not found");
			return saveDeploymentNodeConfig(deployment.userId, deployment.id, nodeId);
		},
		onSuccess: (resp, nodeId) => {
			if (resp?.skipped) {
				toast.message("Save config skipped", {
					description: resp.message || `Node ${nodeId}`,
				});
				return;
			}
			toast.success("Save config queued/applied", {
				description: resp.stdout || `Node ${nodeId}`,
			});
		},
		onError: (error) =>
			toast.error("Save config failed", {
				description: (error as Error).message,
			}),
	});

	const saveAllConfigs = async () => {
		if (!deployment) return;
		if (!topologyNodes.length) {
			toast.message("No nodes to save");
			return;
		}
		if (saveConfig.isPending) return;
		toast.message("Saving configs…", {
			description: `Nodes: ${topologyNodes.length}`,
		});
		const ids = topologyNodes.map((node) => String(node.id));
		const concurrency = 3;
		let idx = 0;
		let ok = 0;
		let skipped = 0;
		let failed = 0;
		const worker = async () => {
			while (idx < ids.length) {
				const current = ids[idx++];
				try {
					const resp = await saveDeploymentNodeConfig(
						deployment.userId,
						deployment.id,
						current,
					);
					if (resp?.skipped) skipped++;
					else ok++;
				} catch {
					failed++;
				}
			}
		};
		await Promise.all(
			Array.from({ length: Math.min(concurrency, ids.length) }, worker),
		);
		if (failed) {
			toast.error("Save configs finished with errors", {
				description: `ok=${ok} skipped=${skipped} failed=${failed}`,
			});
			return;
		}
		toast.success("Save configs finished", {
			description: `ok=${ok} skipped=${skipped}`,
		});
	};

	const downloadDeploymentConfig = () => {
		try {
			if (!deployment) {
				toast.error("Cannot download config", {
					description: "Deployment not found.",
				});
				return;
			}
			const blob = new Blob(
				[JSON.stringify(deployment.config ?? {}, null, 2)],
				{
					type: "application/json",
				},
			);
			const a = document.createElement("a");
			const safeName = String(deployment.name ?? "deployment").replace(
				/[^a-zA-Z0-9._-]+/g,
				"_",
			);
			a.href = URL.createObjectURL(blob);
			a.download = `${safeName}.config.json`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(a.href), 5_000);
			toast.success("Downloaded config");
		} catch (error) {
			toast.error("Failed to download config", {
				description: (error as Error).message,
			});
		}
	};

	const updateForward = useMutation({
		mutationFn: async (next: {
			enabled: boolean;
			collectorConfigId?: string;
			autoSyncOnBringUp?: boolean;
		}) => {
			if (!deployment) throw new Error("deployment not found");
			return updateDeploymentForwardConfig(
				deployment.userId,
				deployment.id,
				next,
			);
		},
		onSuccess: async () => {
			toast.success("Forward settings updated");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		},
		onError: (error) =>
			toast.error("Failed to update Forward settings", {
				description: (error as Error).message,
			}),
	});

	const syncForward = useMutation({
		mutationFn: async () => {
			if (!deployment) throw new Error("deployment not found");
			return syncDeploymentForward(deployment.userId, deployment.id);
		},
		onSuccess: async (resp) => {
			toast.success("Forward sync queued", {
				description: `Run ${String(resp.run?.id ?? "")}`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		},
		onError: (error) =>
			toast.error("Failed to sync to Forward", {
				description: (error as Error).message,
			}),
	});

	return {
		actionPending,
		handleStart,
		handleStop,
		handleDestroy,
		saveConfig,
		saveAllConfigs,
		downloadDeploymentConfig,
		updateForward,
		syncForward,
	};
}
