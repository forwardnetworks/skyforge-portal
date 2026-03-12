export function formatCurrencyFromCents(cents: number): string {
	const dollars = cents / 100;
	return `$${dollars.toLocaleString(undefined, {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

export function formatMilliCPU(value: number) {
	return `${(value / 1000).toFixed(1)} vCPU`;
}

export function formatMemoryGiB(value: number) {
	return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GiB`;
}

export function formatMode(value: string | null | undefined) {
	if (!value) return "unreported";
	return value.replace(/[-_]/g, " ");
}

export function renderCountMap(entries: Record<string, number> | undefined) {
	return Object.entries(entries ?? {}).sort((a, b) => a[0].localeCompare(b[0]));
}

export function renderUnavailableIfMissing(totalItems: number, label: string) {
	return totalItems === 0 ? `No ${label} available.` : null;
}
