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
	return reviewStringFieldFromJSON(reviewJson, "executionBackend");
}

export function reviewVerificationBackendFromJSON(reviewJson?: string): string {
	return reviewStringFieldFromJSON(reviewJson, "verificationBackend");
}

function reviewStringFieldFromJSON(
	reviewJson: string | undefined,
	field: "executionBackend" | "verificationBackend",
): string {
	const raw = String(reviewJson || "").trim();
	if (!raw) return "";
	try {
		const parsed = JSON.parse(raw) as {
			executionBackend?: unknown;
			verificationBackend?: unknown;
		};
		return String(parsed[field] || "").trim().toLowerCase();
	} catch {
		return "";
	}
}
