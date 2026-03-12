export function normalizeInteger(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) {
		return Math.max(0, Math.floor(value));
	}
	if (typeof value === "string" && Number.isFinite(Number(value))) {
		return Math.max(0, Math.floor(Number(value)));
	}
	return 0;
}

export function toLocalDateTimeValue(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hour = String(date.getHours()).padStart(2, "0");
	const minute = String(date.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function toRFC3339(value: string): string {
	return new Date(value).toISOString();
}

export function addHours(date: Date, hours: number): Date {
	return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

export function getPriorityTier(reservation: { priorityTier?: string | null }): string {
	return (reservation.priorityTier ?? "standard") || "standard";
}

export function bumpCount(map: Record<string, number>, key: string): void {
	map[key] = (map[key] ?? 0) + 1;
}
