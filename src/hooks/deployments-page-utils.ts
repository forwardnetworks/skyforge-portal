import type { SkyforgeUserScope, UserScopeDeployment } from "../lib/api-client";
import {
	normalizeDeploymentLifecycleState,
	resolveDeploymentDisplayStatus,
} from "./deployment-detail-utils";

export function selectVisibleUserScopes(
	allUserScopes: SkyforgeUserScope[],
	effectiveUsername: string,
	isAdmin = false,
): SkyforgeUserScope[] {
	if (isAdmin) return allUserScopes;
	if (!effectiveUsername) return allUserScopes;
	const mine = allUserScopes.filter((scope) => {
		if (String(scope.createdBy ?? "").trim() === effectiveUsername) return true;
		if ((scope.owners ?? []).includes(effectiveUsername)) return true;
		if (String(scope.slug ?? "").trim() === effectiveUsername) return true;
		return false;
	});
	return mine.length > 0 ? mine : allUserScopes;
}

export function filterDeployments(
	deployments: UserScopeDeployment[],
	filters: {
		searchQuery: string;
		statusFilter: string;
		typeFilter: string;
	},
): UserScopeDeployment[] {
	const { searchQuery, statusFilter, typeFilter } = filters;
	return deployments.filter((deployment) => {
		if (
			searchQuery &&
			!deployment.name.toLowerCase().includes(searchQuery.toLowerCase())
		) {
			return false;
		}

		if (!matchesDeploymentStatusFilter(deployment, statusFilter)) {
			return false;
		}

		if (!matchesDeploymentTypeFilter(deployment, typeFilter)) {
			return false;
		}

		return true;
	});
}

export function filterRunsForUserScope(
	runs: Record<string, unknown>[],
	selectedUserScopeId: string,
): Record<string, unknown>[] {
	if (!selectedUserScopeId) return runs;
	return runs.filter((run) => String(run.userId ?? "") === selectedUserScopeId);
}

export function isManagedDeploymentType(
	managedFamilies: Set<string>,
	family: string,
): boolean {
	return managedFamilies.has(String(family).trim().toLowerCase());
}

export function parseLeaseHours(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.max(0, Math.trunc(value));
	}
	const parsed = Number.parseInt(String(value ?? "").trim(), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function resolveLifetimeSelection(args: {
	allowNoExpiry: boolean;
	defaultLifetimeHours: number;
	deployment: UserScopeDeployment;
	lifetimeHoursOptions: number[];
}): string {
	const {
		allowNoExpiry,
		defaultLifetimeHours,
		deployment,
		lifetimeHoursOptions,
	} = args;
	const config = deployment.config ?? {};
	const enabled = leaseEnabledFromConfig(config);
	const existingHours = parseLeaseHours(config.leaseHours);
	if (!enabled && allowNoExpiry) {
		return "__none";
	}
	if (existingHours > 0 && lifetimeHoursOptions.includes(existingHours)) {
		return String(existingHours);
	}
	return String(defaultLifetimeHours);
}

export function formatLifetimeCellFor(
	deployment: UserScopeDeployment,
	isManaged: boolean,
): string {
	if (!isManaged) return "Not managed";
	const config = deployment.config ?? {};
	if (!leaseEnabledFromConfig(config)) return "No expiry";
	const stoppedAt = String(config.leaseStoppedAt ?? "").trim();
	if (stoppedAt !== "") return "Stopped";
	const hours = parseLeaseHours(config.leaseHours);
	const expiresAt = String(config.leaseExpiresAt ?? "").trim();
	if (expiresAt === "") return hours > 0 ? `${hours}h` : "Active";
	const timestamp = new Date(expiresAt);
	if (Number.isNaN(timestamp.getTime()))
		return hours > 0 ? `${hours}h` : "Active";
	const remainingMs = timestamp.getTime() - Date.now();
	if (remainingMs <= 0) return "Expired";
	const remainingHours = Math.max(1, Math.ceil(remainingMs / 3_600_000));
	const prefix = hours > 0 ? `${hours}h` : "Active";
	return `${prefix} (${remainingHours}h left)`;
}

export function formatDeploymentType(deployment: UserScopeDeployment): string {
	const family = String(deployment.family ?? "")
		.trim()
		.toLowerCase();
	const engine = String(deployment.engine ?? "")
		.trim()
		.toLowerCase();
	if (family === "kne" && engine === "netlab") return "Netlab (KNE)";
	if (family === "kne" && engine === "kne") {
		return "KNE (Raw)";
	}
	if (family === "kne") return "KNE";
	if (family === "byos" && engine === "netlab") return "Netlab (BYOS)";
	if (family === "byos" && engine === "kne") {
		return "KNE (BYOS)";
	}
	if (family === "byos") return "BYOS";
	if (family === "terraform") return "Terraform";
	return String(deployment.family ?? "");
}

export function deploymentForwardNetworkId(
	deployment: UserScopeDeployment,
): string {
	const config = (deployment.config ?? {}) as Record<string, unknown>;
	return String(config.forwardNetworkId ?? "").trim();
}

function matchesDeploymentStatusFilter(
	deployment: UserScopeDeployment,
	statusFilter: string,
): boolean {
	if (statusFilter === "all") return true;
	const lifecycle = normalizeDeploymentLifecycleState(
		deployment.lifecycleState,
	);
	if (statusFilter === "running") {
		if (lifecycle) {
			return ["active", "queued_bring_up", "bringing_up"].includes(lifecycle);
		}
		return isDeploymentRunningState(deployment);
	}
	if (statusFilter === "stopped") {
		if (lifecycle) {
			return [
				"draft",
				"stopped",
				"queued_shut_down",
				"shutting_down",
				"queued_destroy",
				"destroying",
			].includes(lifecycle);
		}
		const status = resolveDeploymentDisplayStatus(deployment).toLowerCase();
		return ["created", "stopped", "success", "succeeded", "ready"].includes(
			status,
		);
	}
	if (statusFilter === "failed") {
		if (lifecycle) return lifecycle === "failed";
		const status = resolveDeploymentDisplayStatus(deployment).toLowerCase();
		return ["failed", "error", "crashloopbackoff"].includes(status);
	}
	return true;
}

function matchesDeploymentTypeFilter(
	deployment: UserScopeDeployment,
	typeFilter: string,
): boolean {
	if (typeFilter === "all") return true;
	const family = String(deployment.family ?? "")
		.trim()
		.toLowerCase();
	const engine = String(deployment.engine ?? "")
		.trim()
		.toLowerCase();
	if (typeFilter === "netlab") {
		return (
			(family === "kne" && engine === "netlab") ||
			(family === "byos" && engine === "netlab")
		);
	}
	if (typeFilter === "kne") {
		return family === "byos" && engine === "kne";
	}
	if (typeFilter === "terraform") return family === "terraform";
	return true;
}

function isDeploymentRunningState(deployment: UserScopeDeployment): boolean {
	const lifecycle = normalizeDeploymentLifecycleState(
		deployment.lifecycleState,
	);
	if (lifecycle) {
		return ["active", "queued_bring_up", "bringing_up"].includes(lifecycle);
	}
	const status = resolveDeploymentDisplayStatus(deployment).toLowerCase();
	return ["running", "active", "healthy"].includes(status);
}

function leaseEnabledFromConfig(config: Record<string, unknown>): boolean {
	return (
		config.leaseEnabled === true ||
		String(config.leaseEnabled ?? "")
			.trim()
			.toLowerCase() === "true"
	);
}
