export function parseAsOfTimestamp(value?: string): number | null {
	if (!value) return null;
	const ts = Date.parse(value);
	return Number.isNaN(ts) ? null : ts;
}

export function formatFreshnessAge(value?: string): string {
	const ts = parseAsOfTimestamp(value);
	if (ts == null) return "unknown age";
	const deltaMs = Date.now() - ts;
	if (deltaMs < 0) return "just now";
	const deltaSec = Math.floor(deltaMs / 1000);
	if (deltaSec < 60) return `${deltaSec}s ago`;
	const deltaMin = Math.floor(deltaSec / 60);
	if (deltaMin < 60) return `${deltaMin}m ago`;
	const deltaHours = Math.floor(deltaMin / 60);
	if (deltaHours < 24) return `${deltaHours}h ago`;
	const deltaDays = Math.floor(deltaHours / 24);
	return `${deltaDays}d ago`;
}
