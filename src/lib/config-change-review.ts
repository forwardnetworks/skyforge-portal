export type ConfigChangeReviewArtifactRef = {
	kind?: string;
	name?: string;
	key?: string;
};

export function reviewArtifactRefsFromJSON(
	reviewJson?: string,
): ConfigChangeReviewArtifactRef[] {
	const raw = String(reviewJson || "").trim();
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as {
			artifactRefs?: ConfigChangeReviewArtifactRef[];
		};
		return Array.isArray(parsed.artifactRefs) ? parsed.artifactRefs : [];
	} catch {
		return [];
	}
}

export function reviewExecutionBackendFromJSON(reviewJson?: string): string {
	const raw = String(reviewJson || "").trim();
	if (!raw) return "";
	try {
		const parsed = JSON.parse(raw) as { executionBackend?: unknown };
		return String(parsed.executionBackend || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
