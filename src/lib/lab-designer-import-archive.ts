import type { ImportTopologySource } from "./api-client-deployments-actions-designer";
import { unzipSync } from "fflate";

export type ImportedTopologyUpload = {
	filename: string;
	topologyYAML: string;
	sidecarFiles?: Record<string, string>;
	displayName: string;
};

const TEXT_EXTENSIONS = new Set([
	".cfg",
	".clab",
	".conf",
	".crt",
	".env",
	".gns3",
	".ini",
	".json",
	".key",
	".md",
	".py",
	".sh",
	".text",
	".txt",
	".unl",
	".xml",
	".yaml",
	".yml",
]);

export async function readImportedTopologyUpload(
	file: File,
	source: "auto" | ImportTopologySource,
): Promise<ImportedTopologyUpload> {
	const name = String(file.name ?? "").trim();
	if (name.toLowerCase().endsWith(".zip")) {
		return readImportedTopologyArchiveData(await readFileBytes(file), name, source);
	}
	const text = await readFileText(file);
	return {
		filename: name || "topology.yml",
		topologyYAML: text,
		displayName: name || "Pasted topology",
	};
}

export function readImportedTopologyArchiveData(
	data: ArrayBuffer,
	archiveName: string,
	source: "auto" | ImportTopologySource,
): ImportedTopologyUpload {
	archiveName = String(archiveName ?? "").trim() || "archive.zip";
	const archive = unzipSync(new Uint8Array(data));
	const entries = Object.entries(archive)
		.map(([rawPath, bytes]) => ({
			path: normalizeArchivePath(rawPath),
			bytes,
		}))
		.filter((entry) => entry.path && !isIgnoredArchivePath(entry.path));
	if (entries.length === 0) {
		throw new Error("ZIP archive is empty");
	}

	const topologyEntry = pickTopologyArchiveEntry(entries, source);
	if (!topologyEntry) {
		throw new Error("ZIP archive does not contain a supported topology file");
	}

	const sidecarFiles: Record<string, string> = {};
	for (const entry of entries) {
		if (entry.path === topologyEntry.path) continue;
		if (!shouldIncludeArchiveEntry(entry.path, entry.bytes)) continue;
		sidecarFiles[entry.path] = decodeArchiveEntry(entry.bytes);
	}

	const sidecarCount = Object.keys(sidecarFiles).length;
	return {
		filename: topologyEntry.path,
		topologyYAML: decodeArchiveEntry(topologyEntry.bytes),
		sidecarFiles: sidecarCount > 0 ? sidecarFiles : undefined,
		displayName:
			sidecarCount > 0
				? `${archiveName} -> ${topologyEntry.path} + ${sidecarCount} sidecar${sidecarCount === 1 ? "" : "s"}`
				: `${archiveName} -> ${topologyEntry.path}`,
	};
}

function pickTopologyArchiveEntry(
	entries: Array<{ path: string; bytes: Uint8Array }>,
	source: "auto" | ImportTopologySource,
): { path: string; bytes: Uint8Array } | undefined {
	const ranked = entries
		.map((entry) => ({
			entry,
			score: scoreArchiveTopologyEntry(entry.path, source),
		}))
		.filter((item) => item.score > 0)
		.sort((a, b) => {
			if (b.score !== a.score) return b.score - a.score;
			if (a.entry.path.length !== b.entry.path.length) {
				return a.entry.path.length - b.entry.path.length;
			}
			return a.entry.path.localeCompare(b.entry.path);
		});
	return ranked[0]?.entry;
}

function scoreArchiveTopologyEntry(
	path: string,
	source: "auto" | ImportTopologySource,
): number {
	const lower = path.toLowerCase();
	if (source === "containerlab" || source === "auto") {
		if (lower.endsWith(".clab.yml") || lower.endsWith(".clab.yaml")) return 100;
	}
	if (source === "gns3" || source === "auto") {
		if (lower.endsWith(".gns3")) return source === "gns3" ? 100 : 95;
	}
	if (source === "eve-ng" || source === "auto") {
		if (lower.endsWith(".unl")) return source === "eve-ng" ? 100 : 95;
		if (lower.endsWith(".xml")) return source === "eve-ng" ? 90 : 80;
	}
	if (source === "containerlab" || source === "auto") {
		if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return 70;
	}
	if (source === "gns3" || source === "auto") {
		if (lower.endsWith(".json")) return source === "gns3" ? 80 : 60;
	}
	if (lower.endsWith(".txt")) return 20;
	return 0;
}

function shouldIncludeArchiveEntry(path: string, bytes: Uint8Array): boolean {
	const ext = archiveExtension(path);
	if (TEXT_EXTENSIONS.has(ext)) return true;
	return looksTextLike(bytes);
}

function looksTextLike(bytes: Uint8Array): boolean {
	if (bytes.length === 0) return true;
	let readable = 0;
	for (const byte of bytes) {
		if (byte === 9 || byte === 10 || byte === 13) {
			readable += 1;
			continue;
		}
		if (byte >= 32 && byte < 127) {
			readable += 1;
		}
	}
	return readable / bytes.length >= 0.85;
}

function decodeArchiveEntry(bytes: Uint8Array): string {
	return new TextDecoder().decode(bytes).replace(/\r\n/g, "\n");
}

function normalizeArchivePath(rawPath: string): string {
	const parts = String(rawPath ?? "")
		.replaceAll("\\", "/")
		.split("/")
		.map((part) => part.trim())
		.filter(Boolean);
	if (parts.length === 0) return "";
	const normalized: string[] = [];
	for (const part of parts) {
		if (part === ".") continue;
		if (part === "..") {
			normalized.pop();
			continue;
		}
		normalized.push(part);
	}
	return normalized.join("/");
}

function isIgnoredArchivePath(path: string): boolean {
	const lower = path.toLowerCase();
	return lower.startsWith("__macosx/") || lower.endsWith(".ds_store");
}

function archiveExtension(path: string): string {
	const idx = path.lastIndexOf(".");
	if (idx < 0) return "";
	return path.slice(idx).toLowerCase();
}

async function readFileText(file: File): Promise<string> {
	if (typeof file.text === "function") {
		return file.text();
	}
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result ?? ""));
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file"));
		reader.readAsText(file);
	});
}

async function readFileBytes(file: File): Promise<ArrayBuffer> {
	if (typeof file.arrayBuffer === "function") {
		return file.arrayBuffer();
	}
	return new Promise<ArrayBuffer>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const result = reader.result;
			if (result instanceof ArrayBuffer) {
				resolve(result);
				return;
			}
			reject(new Error("Failed to read file bytes"));
		};
		reader.onerror = () =>
			reject(reader.error ?? new Error("Failed to read file bytes"));
		reader.readAsArrayBuffer(file);
	});
}
