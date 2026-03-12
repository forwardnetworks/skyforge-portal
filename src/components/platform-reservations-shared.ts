export function canCancelReservation(status?: string): boolean {
	return status === "requested" || status === "approved";
}

export function formatCount(value: number | undefined): string {
	return (value ?? 0).toLocaleString();
}

export function formatMode(value: string | null | undefined): string {
	if (!value) return "unreported";
	return value.replace(/[-_]/g, " ");
}
