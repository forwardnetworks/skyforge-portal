import type { ResourceEstimateSummary } from "@/lib/api-client";

export function formatQuickDeployEstimate(
	estimate?: ResourceEstimateSummary,
): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	const vcpu = Number(estimate.vcpu ?? 0);
	const ramGiB = Number(estimate.ramGiB ?? 0);
	const storageGiB = Number(estimate.storageGiB ?? 0);
	if (
		!Number.isFinite(vcpu) ||
		!Number.isFinite(ramGiB) ||
		!Number.isFinite(storageGiB)
	) {
		return "Resource estimate unavailable";
	}
	if (vcpu <= 0 && ramGiB <= 0 && storageGiB <= 0) {
		return "Resource estimate unavailable";
	}
	return `${vcpu.toFixed(1)} vCPU • ${ramGiB.toFixed(1)} GiB RAM • ${storageGiB.toFixed(1)} GiB storage`;
}
