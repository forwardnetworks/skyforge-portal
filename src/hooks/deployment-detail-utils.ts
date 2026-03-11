import type {
	ResourceEstimateSummary,
	UserScopeDeployment,
} from "@/lib/api-client";

export function formatResourceEstimateSummary(
	estimate?: ResourceEstimateSummary,
): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	const cpu = Number.isFinite(estimate.vcpu) ? estimate.vcpu.toFixed(1) : "0.0";
	const ram = Number.isFinite(estimate.ramGiB)
		? estimate.ramGiB.toFixed(1)
		: "0.0";
	return `${cpu} vCPU • ${ram} GiB RAM`;
}

export function resourceEstimateReasonFromError(err: unknown): string {
	const msg = String((err as Error)?.message ?? "").trim();
	if (!msg) return "Resource estimate unavailable";
	if (msg.toLowerCase().includes("timed out")) {
		return "Resource estimate timed out";
	}
	return "Resource estimate unavailable";
}

export function normalizeDeploymentLifecycleState(raw: unknown): string {
	return String(raw ?? "")
		.trim()
		.toLowerCase();
}

export function resolveDeploymentDisplayStatus(d: UserScopeDeployment): string {
	const lifecycle = normalizeDeploymentLifecycleState(d.lifecycleState);
	if (lifecycle) {
		switch (lifecycle) {
			case "draft":
				return "draft";
			case "queued_bring_up":
			case "queued_shut_down":
			case "queued_destroy":
				return "queued";
			case "bringing_up":
				return "bringing up";
			case "shutting_down":
				return "shutting down";
			case "active":
				return "active";
			case "stopped":
				return "stopped";
			case "destroying":
				return "destroying";
			case "failed":
				return "failed";
			default:
				return "unknown";
		}
	}
	const active = String(d.activeTaskStatus ?? "")
		.trim()
		.toLowerCase();
	if (active) return active;
	const last = String(d.lastStatus ?? "")
		.trim()
		.toLowerCase();
	return last || "unknown";
}

export function resolveDeploymentPrimaryAction(
	d: UserScopeDeployment,
): "bring_up" | "shut_down" | "none" {
	const explicit = String(d.primaryAction ?? "")
		.trim()
		.toLowerCase();
	if (
		explicit === "bring_up" ||
		explicit === "shut_down" ||
		explicit === "none"
	)
		return explicit;

	const lifecycle = normalizeDeploymentLifecycleState(d.lifecycleState);
	switch (lifecycle) {
		case "queued_bring_up":
		case "bringing_up":
		case "queued_shut_down":
		case "shutting_down":
		case "queued_destroy":
		case "destroying":
			return "none";
		case "active":
			return "shut_down";
		default:
			break;
	}
	const status = resolveDeploymentDisplayStatus(d).toLowerCase();
	if (["running", "active", "healthy"].includes(status)) return "shut_down";
	return "bring_up";
}
