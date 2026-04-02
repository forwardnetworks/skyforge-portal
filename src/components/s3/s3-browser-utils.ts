import type {
	BrowserRow,
	BrowserSourceMode,
	PlatformBucketObjectRow,
	S3ObjectRow,
} from "@/components/s3/s3-types";

function trimSlashes(value: string): string {
	return value.replace(/^\/+|\/+$/g, "");
}

export function normalizePrefix(value: string): string {
	const trimmed = trimSlashes(value.trim());
	return trimmed ? `${trimmed}/` : "";
}

export function splitSegments(prefix: string): string[] {
	return trimSlashes(prefix).split("/").filter(Boolean);
}

export function humanDate(value?: string): string {
	if (!value) return "-";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
}

export function displayContentType(contentType?: string): string {
	return contentType?.trim() || "-";
}

export function buildBrowserRows(
	sourceMode: BrowserSourceMode,
	prefix: string,
	userObjects: S3ObjectRow[],
	platformObjects: PlatformBucketObjectRow[],
): BrowserRow[] {
	const items = sourceMode === "user-scope" ? userObjects : platformObjects;
	const normalizedPrefix = normalizePrefix(prefix);
	const folders = new Map<string, BrowserRow>();
	const files: BrowserRow[] = [];

	for (const item of items) {
		const fullKey = String(item.key ?? "").trim();
		if (!fullKey) continue;
		const relative = normalizedPrefix && fullKey.startsWith(normalizedPrefix)
			? fullKey.slice(normalizedPrefix.length)
			: fullKey;
		if (!relative) continue;
		const parts = relative.split("/").filter(Boolean);
		if (parts.length === 0) continue;
		if (parts.length > 1) {
			const folderName = parts[0] ?? "";
			const folderKey = `${normalizedPrefix}${folderName}/`;
			if (!folders.has(folderKey)) {
				folders.set(folderKey, {
					id: `${sourceMode}:dir:${folderKey}`,
					key: folderName,
					name: folderName,
					fullKey: folderKey,
					size: 0,
					isDirectory: true,
					sourceMode,
				});
			}
			continue;
		}
		files.push({
			id: `${sourceMode}:file:${fullKey}`,
			key: fullKey,
			name: parts[0] ?? fullKey,
			fullKey,
			size: Number(item.size ?? 0),
			lastModified: item.lastModified,
			contentType: item.contentType,
			isDirectory: false,
			sourceMode,
		});
	}

	return [...folders.values(), ...files].sort((a, b) => {
		if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}
