import type {
	ForwardObservabilitySummary,
	ObservabilityAdvisory,
} from "@/lib/api-client-forward-observability";

export function healthVariant(
	status?: string,
): "secondary" | "destructive" | "outline" {
	switch (
		String(status ?? "")
			.trim()
			.toLowerCase()
	) {
		case "ok":
		case "up":
		case "healthy":
			return "secondary";
		case "degraded":
		case "down":
			return "destructive";
		default:
			return "outline";
	}
}

export function advisoryVariant(
	level?: string,
): "secondary" | "destructive" | "outline" {
	switch (
		String(level ?? "")
			.trim()
			.toLowerCase()
	) {
		case "crit":
			return "destructive";
		case "warn":
			return "outline";
		case "ok":
			return "secondary";
		default:
			return "outline";
	}
}

export function formatSecondsAge(value?: number | null): string {
	if (value == null || Number.isNaN(value) || value <= 0) {
		return "0s";
	}
	if (value < 60) {
		return `${Math.round(value)}s`;
	}
	const minutes = Math.floor(value / 60);
	const seconds = Math.round(value % 60);
	if (minutes < 60) {
		return `${minutes}m ${seconds}s`;
	}
	const hours = Math.floor(minutes / 60);
	const remMinutes = minutes % 60;
	return `${hours}h ${remMinutes}m`;
}

export function formatPercent(value?: number | null): string {
	if (value == null || Number.isNaN(value)) {
		return "—";
	}
	return `${Math.round(value)}%`;
}

export function summarizeForwardTargets(
	forward?: ForwardObservabilitySummary | null,
) {
	const targetJobs = forward?.targetJobs ?? [];
	if (targetJobs.length > 0) {
		return targetJobs.reduce(
			(acc, job) => ({
				totalTargets: acc.totalTargets + (job.totalTargets ?? 0),
				upTargets: acc.upTargets + (job.upTargets ?? 0),
				downTargets: acc.downTargets + (job.downTargets ?? 0),
			}),
			{ totalTargets: 0, upTargets: 0, downTargets: 0 },
		);
	}
	const totalTargets = Math.round(forward?.prometheusTargetCount ?? 0);
	const upTargets = Math.round(forward?.prometheusUpSum ?? 0);
	return {
		totalTargets,
		upTargets,
		downTargets: Math.max(totalTargets - upTargets, 0),
	};
}

export function activeAdvisories(
	advisories?: ObservabilityAdvisory[] | null,
): ObservabilityAdvisory[] {
	return (advisories ?? []).filter(
		(advisory) =>
			String(advisory.level ?? "")
				.trim()
				.toLowerCase() !== "ok",
	);
}
