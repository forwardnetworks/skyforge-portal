export function userContextRelativePath(
	userContextId: string,
	suffix = "",
): string {
	void userContextId;
	const normalizedSuffix = suffix
		? suffix.startsWith("/")
			? suffix
			: `/${suffix}`
		: "";
	return `/personal${normalizedSuffix}`;
}

export function userContextApiPath(userContextId: string, suffix = ""): string {
	return `/api${userContextRelativePath(userContextId, suffix)}`;
}
