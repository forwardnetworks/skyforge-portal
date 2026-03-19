import { type QueryClient, useMutation } from "@tanstack/react-query";
import type { useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UserScopeDeployment } from "../lib/api-client";
import { deleteDeployment, updateDeploymentLease } from "../lib/api-client";
import { loginWithPopup } from "../lib/auth-popup";
import {
	deploymentActionQueueDescription,
	noOpMessageForDeploymentAction,
	runDeploymentActionWithRetry,
} from "../lib/deployment-actions";
import { queryKeys } from "../lib/query-keys";
import { forwardNetworkSessionHref } from "../lib/tool-launches";
import {
	deploymentForwardNetworkId,
	resolveLifetimeSelection,
} from "./deployments-page-utils";

export function useDeploymentsPageActions(args: {
	allowNoExpiry: boolean;
	authMode: string | null;
	defaultLifetimeHours: number;
	lifetimeHoursOptions: number[];
	loginHref: string;
	navigate: ReturnType<typeof useNavigate>;
	queryClient: QueryClient;
}) {
	const {
		allowNoExpiry,
		authMode,
		defaultLifetimeHours,
		lifetimeHoursOptions,
		loginHref,
		queryClient,
	} = args;
	const [destroyTarget, setDestroyTarget] =
		useState<UserScopeDeployment | null>(null);
	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [destroyAlsoDeleteForward, setDestroyAlsoDeleteForward] =
		useState(false);
	const [lifetimeTarget, setLifetimeTarget] =
		useState<UserScopeDeployment | null>(null);
	const [lifetimeDialogOpen, setLifetimeDialogOpen] = useState(false);
	const [lifetimeSelection, setLifetimeSelection] = useState("24");
	const [pendingActions, setPendingActions] = useState<Record<string, boolean>>(
		{},
	);

	const clearPendingAction = useCallback((deploymentId: string) => {
		setPendingActions((prev) => {
			const next = { ...prev };
			delete next[deploymentId];
			return next;
		});
	}, []);

	const invalidateDashboardSnapshot = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			}),
		[queryClient],
	);

	const runQueuedDeploymentAction = useCallback(
		async (
			deployment: UserScopeDeployment,
			actionName: "start" | "stop",
			successTitle: string,
			failureTitle: string,
		) => {
			if (pendingActions[deployment.id]) return;
			setPendingActions((prev) => ({ ...prev, [deployment.id]: true }));
			try {
				const action = await runDeploymentActionWithRetry(
					deployment.userId,
					deployment.id,
					actionName,
				);
				if (!action.queued) {
					toast.message(
						noOpMessageForDeploymentAction(actionName, action.meta.reason),
						{
							description: deployment.name,
						},
					);
				} else {
					toast.success(successTitle, {
						description: deploymentActionQueueDescription(
							action.queue,
							deployment.name,
						),
					});
				}
				await invalidateDashboardSnapshot();
			} catch (error) {
				toast.error(failureTitle, {
					description: (error as Error).message,
				});
			} finally {
				clearPendingAction(deployment.id);
			}
		},
		[clearPendingAction, invalidateDashboardSnapshot, pendingActions],
	);

	const handleStart = useCallback(
		(deployment: UserScopeDeployment) =>
			runQueuedDeploymentAction(
				deployment,
				"start",
				"Deployment starting",
				"Start action failed",
			),
		[runQueuedDeploymentAction],
	);

	const handleStop = useCallback(
		(deployment: UserScopeDeployment) =>
			runQueuedDeploymentAction(
				deployment,
				"stop",
				"Deployment stopping",
				"Stop action failed",
			),
		[runQueuedDeploymentAction],
	);

	const openLifetimeDialog = useCallback(
		(deployment: UserScopeDeployment) => {
			setLifetimeSelection(
				resolveLifetimeSelection({
					allowNoExpiry,
					defaultLifetimeHours,
					deployment,
					lifetimeHoursOptions,
				}),
			);
			setLifetimeTarget(deployment);
			setLifetimeDialogOpen(true);
		},
		[
			allowNoExpiry,
			defaultLifetimeHours,
			lifetimeHoursOptions,
			setLifetimeDialogOpen,
			setLifetimeSelection,
			setLifetimeTarget,
		],
	);

	const saveLifetimeMutation = useMutation({
		mutationFn: async () => {
			if (!lifetimeTarget) throw new Error("No deployment selected");
			let enabled = true;
			let hours = Number.parseInt(lifetimeSelection, 10);
			if (allowNoExpiry && lifetimeSelection === "__none") {
				enabled = false;
				hours = defaultLifetimeHours;
			}
			if (!Number.isFinite(hours) || hours <= 0) {
				hours = defaultLifetimeHours;
			}
			return updateDeploymentLease(lifetimeTarget.userId, lifetimeTarget.id, {
				enabled,
				hours,
			});
		},
		onSuccess: async () => {
			toast.success("Deployment lifetime updated");
			await invalidateDashboardSnapshot();
			setLifetimeDialogOpen(false);
			setLifetimeTarget(null);
		},
		onError: (error) => {
			toast.error("Failed to update deployment lifetime", {
				description: (error as Error).message,
			});
		},
	});

	const handleLogin = useCallback(async () => {
		if (authMode !== "oidc") {
			window.location.href = loginHref;
			return;
		}
		const ok = await loginWithPopup({ loginHref });
		if (!ok) {
			window.location.href = loginHref;
			return;
		}
		await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
		await invalidateDashboardSnapshot();
	}, [authMode, invalidateDashboardSnapshot, loginHref, queryClient]);

	const openDeploymentInForward = useCallback(
		(deployment: UserScopeDeployment) => {
			const forwardNetworkID = deploymentForwardNetworkId(deployment);
			if (!forwardNetworkID) {
				toast.message("Forward network is not available yet");
				return;
			}
			const url = forwardNetworkSessionHref(forwardNetworkID);
			const popup = window.open(url, "_blank", "noopener,noreferrer");
			if (!popup) {
				toast.error("Pop-up blocked", {
					description:
						"Allow pop-ups for this site to open Forward in a new tab.",
				});
			}
		},
		[],
	);

	const handleDestroy = useCallback(async () => {
		const target = destroyTarget;
		if (!target || pendingActions[target.id]) return;
		setPendingActions((prev) => ({ ...prev, [target.id]: true }));
		try {
			await deleteDeployment(target.userId, target.id, {
				forwardDelete: destroyAlsoDeleteForward,
			});
			toast.success("Deployment deleted", {
				description: `${target.name} has been removed.`,
			});
			await invalidateDashboardSnapshot();
			setDestroyDialogOpen(false);
			setDestroyTarget(null);
			setDestroyAlsoDeleteForward(false);
		} catch (error) {
			toast.error("Failed to delete", {
				description: (error as Error).message,
			});
		} finally {
			clearPendingAction(target.id);
		}
	}, [
		clearPendingAction,
		destroyAlsoDeleteForward,
		destroyTarget,
		invalidateDashboardSnapshot,
		pendingActions,
	]);

	return {
		destroyAlsoDeleteForward,
		destroyDialogOpen,
		destroyTarget,
		handleDestroy,
		handleLogin,
		handleStart,
		handleStop,
		lifetimeDialogOpen,
		lifetimeSelection,
		lifetimeTarget,
		openDeploymentInForward,
		openLifetimeDialog,
		pendingActions,
		saveLifetimeMutation,
		setDestroyAlsoDeleteForward,
		setDestroyDialogOpen,
		setDestroyTarget,
		setLifetimeDialogOpen,
		setLifetimeSelection,
		setLifetimeTarget,
	};
}
