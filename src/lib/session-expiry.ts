const DEFAULT_WARNING_WINDOW_MS = 15 * 60_000;

type SessionExpiryRecord = {
	expiresAt?: unknown;
};

function toSessionExpiryRecord(session: unknown): SessionExpiryRecord {
	if (!session || typeof session !== "object") {
		return {};
	}
	return session as SessionExpiryRecord;
}

export type SessionExpiryWarning = {
	expiresAt: string;
	minutesRemaining: number;
};

export function getSessionExpiryWarning(
	session: unknown,
	opts?: {
		nowMs?: number;
		warningWindowMs?: number;
	},
): SessionExpiryWarning | null {
	const expiresAtRaw = toSessionExpiryRecord(session).expiresAt;
	const expiresAt = typeof expiresAtRaw === "string" ? expiresAtRaw.trim() : "";
	if (expiresAt === "") return null;

	const expiresAtMs = Date.parse(expiresAt);
	if (!Number.isFinite(expiresAtMs)) return null;

	const nowMs = opts?.nowMs ?? Date.now();
	const warningWindowMs = opts?.warningWindowMs ?? DEFAULT_WARNING_WINDOW_MS;
	const remainingMs = expiresAtMs - nowMs;
	if (remainingMs <= 0 || remainingMs > warningWindowMs) return null;

	return {
		expiresAt,
		minutesRemaining: Math.max(1, Math.ceil(remainingMs / 60_000)),
	};
}
