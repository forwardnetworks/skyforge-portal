export type ConfigChangeArtifactRef = {
	kind?: string;
	name?: string;
	key?: string;
};

export type AutoRollbackOutcome = {
	outcome: string;
	reason: string;
};

export type AutoRollbackRequested = {
	eligibility: string;
	backend: string;
};

export function extractAutoRollbackOutcomes(
	refs: ConfigChangeArtifactRef[],
): AutoRollbackOutcome[] {
	const out: AutoRollbackOutcome[] = [];
	for (const ref of refs) {
		const kind = String(ref.kind || "").trim().toLowerCase();
		if (kind !== "forward-auto-rollback-status") continue;
		const parsed = parseArtifactKey(ref.key || "");
		const outcome = String(parsed.outcome || "").trim().toLowerCase();
		if (!outcome) continue;
		out.push({
			outcome,
			reason: String(parsed.reason || "").trim(),
		});
	}
	return out;
}

export function latestAutoRollbackRequest(
	refs: ConfigChangeArtifactRef[],
): AutoRollbackRequested | null {
	for (let i = refs.length - 1; i >= 0; i -= 1) {
		const ref = refs[i];
		const kind = String(ref?.kind || "").trim().toLowerCase();
		if (kind !== "forward-auto-rollback") continue;
		const parsed = parseArtifactKey(ref?.key || "");
		const requested = String(parsed.requested || "").trim().toLowerCase();
		if (requested !== "true" && requested !== "requested") continue;
		return {
			eligibility: String(parsed.eligibility || "unknown").trim().toLowerCase(),
			backend: String(parsed.backend || "").trim().toLowerCase(),
		};
	}
	return null;
}

export function latestAutoRollbackOutcome(
	refs: ConfigChangeArtifactRef[],
): AutoRollbackOutcome | null {
	const outcomes = extractAutoRollbackOutcomes(refs);
	if (!outcomes.length) return null;
	return outcomes[outcomes.length - 1] ?? null;
}

export function autoRollbackBadgeVariant(
	outcome: string,
): "default" | "secondary" | "destructive" | "outline" {
	switch (String(outcome).trim().toLowerCase()) {
		case "applied":
			return "default";
		case "unsupported":
			return "outline";
		case "failed":
			return "destructive";
		default:
			return "secondary";
	}
}

function parseArtifactKey(raw: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const segment of String(raw).split(";")) {
		const part = segment.trim();
		if (!part) continue;
		const idx = part.indexOf("=");
		if (idx <= 0) {
			out[part] = "true";
			continue;
		}
		const key = part.slice(0, idx).trim();
		const value = part.slice(idx + 1).trim();
		if (!key) continue;
		out[key] = value;
	}
	return out;
}
