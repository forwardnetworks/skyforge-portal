import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useDashboardEvents } from "../lib/dashboard-events";
import {
		resolveDeploymentDisplayStatus,
		resolveDeploymentPrimaryAction,
} from "./deployment-detail-utils";
import {
	deploymentForwardNetworkId,
	formatDeploymentType,
} from "./deployments-page-utils";
import { useDeploymentsPageActions } from "./use-deployments-page-actions";
import { useDeploymentsPageData } from "./use-deployments-page-data";

export function useDeploymentsPage(userId?: string) {
	useDashboardEvents(true);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const data = useDeploymentsPageData({ navigate, userId });
	const actions = useDeploymentsPageActions({
		allowNoExpiry: data.allowNoExpiry,
		authMode: data.authMode,
		defaultLifetimeHours: data.defaultLifetimeHours,
		lifetimeHoursOptions: data.lifetimeHoursOptions,
		loginHref: data.loginHref,
		navigate,
		queryClient,
	});

	return {
		authMode: data.authMode,
		deployments: data.deployments,
		destroyAlsoDeleteForward: actions.destroyAlsoDeleteForward,
		destroyDialogOpen: actions.destroyDialogOpen,
		destroyHasForward: Boolean(
			actions.destroyTarget &&
				deploymentForwardNetworkId(actions.destroyTarget),
		),
		destroyTarget: actions.destroyTarget,
		handleDestroy: actions.handleDestroy,
		handleLogin: actions.handleLogin,
		handleStart: actions.handleStart,
		handleStop: actions.handleStop,
		isFeedOpen: data.isFeedOpen,
		isManagedDeploymentType: data.isManagedDeploymentType,
		lifetimeDialogOpen: actions.lifetimeDialogOpen,
		lifetimeHoursOptions: data.lifetimeHoursOptions,
		lifetimeSelection: actions.lifetimeSelection,
		lifetimeTarget: actions.lifetimeTarget,
		loginHref: data.loginHref,
		navigate,
		openDeploymentInForward: actions.openDeploymentInForward,
		openLifetimeDialog: actions.openLifetimeDialog,
		pendingActions: actions.pendingActions,
		runs: data.runs,
		saveLifetimeMutation: actions.saveLifetimeMutation,
		searchQuery: data.searchQuery,
		userScopes: data.userScopes,
		selectedUserScope: data.selectedUserScope,
		selectedUserScopeId: data.selectedUserScopeId,
		setDestroyAlsoDeleteForward: actions.setDestroyAlsoDeleteForward,
		setDestroyDialogOpen: actions.setDestroyDialogOpen,
		setDestroyTarget: actions.setDestroyTarget,
		setIsFeedOpen: data.setIsFeedOpen,
		setLifetimeDialogOpen: actions.setLifetimeDialogOpen,
		setLifetimeSelection: actions.setLifetimeSelection,
		setLifetimeTarget: actions.setLifetimeTarget,
		setSearchQuery: data.setSearchQuery,
		setStatusFilter: data.setStatusFilter,
		setTypeFilter: data.setTypeFilter,
		setSelectedUserScopeId: (nextScopeId: string) => {
			const scopeId = String(nextScopeId ?? "").trim();
			if (!scopeId || scopeId === data.selectedUserScopeId) return;
			void navigate({
				search: { userId: scopeId } as never,
				replace: true,
			});
		},
		snap: data.snap,
		statusFilter: data.statusFilter,
		typeFilter: data.typeFilter,
		allowNoExpiry: data.allowNoExpiry,
		formatDeploymentType,
		formatLifetimeCell: data.formatLifetimeCell,
		deploymentForwardNetworkId,
		resolveDeploymentDisplayStatus,
		resolveDeploymentPrimaryAction,
	};
}

export type DeploymentsPageState = ReturnType<typeof useDeploymentsPage>;
