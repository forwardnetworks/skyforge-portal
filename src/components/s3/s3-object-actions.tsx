import { confirmDeleteObject } from "@/components/s3/s3-object-dialogs";
import type {
	BrowserRow,
	BrowserSourceMode,
	PlatformBucketPreview,
} from "@/components/s3/s3-types";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
	deleteUserScopeArtifactObject,
	downloadUserScopeArtifact,
} from "@/lib/api-client";
import { Copy, Download, Eye, Link2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type S3ObjectActionsProps = {
	item: BrowserRow;
	selectedUserScopeId: string;
	selectedBucket: string;
	onChanged: () => Promise<unknown> | unknown;
	onPreviewPlatformObject: (
		bucket: string,
		key: string,
		maxBytes?: string,
	) => Promise<PlatformBucketPreview>;
};

function decodeBase64ToBytes(fileData: string) {
	const raw = atob(fileData);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		bytes[i] = raw.charCodeAt(i);
	}
	return bytes;
}

function triggerFileDownload(data: BlobPart, filename: string, contentType?: string) {
	const blob = new Blob([data], {
		type: contentType || "application/octet-stream",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

function isLikelyPreviewableText(item: BrowserRow): boolean {
	const key = item.fullKey.toLowerCase();
	const contentType = String(item.contentType ?? "").toLowerCase();
	return (
		contentType.startsWith("text/") ||
		contentType.includes("json") ||
		contentType.includes("yaml") ||
		contentType.includes("xml") ||
		key.endsWith(".json") ||
		key.endsWith(".yaml") ||
		key.endsWith(".yml") ||
		key.endsWith(".log") ||
		key.endsWith(".txt") ||
		key.endsWith(".md") ||
		key.endsWith(".xml") ||
		key.endsWith(".cue") ||
		key.endsWith(".sh") ||
		key.endsWith(".tf") ||
		key.endsWith(".csv")
	);
}

function userScopeRawHref(selectedUserScopeId: string, key: string): string {
	return `/files/artifacts/${encodeURIComponent(selectedUserScopeId)}/${key
		.split("/")
		.map((part) => encodeURIComponent(part))
		.join("/")}`;
}

export function S3ObjectActions(props: S3ObjectActionsProps) {
	const {
		item,
		selectedUserScopeId,
		selectedBucket,
		onChanged,
		onPreviewPlatformObject,
	} = props;
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewText, setPreviewText] = useState("");
	const [previewMeta, setPreviewMeta] = useState<{
		title: string;
		description?: string;
		truncated?: boolean;
	} | null>(null);
	const disabled = item.isDirectory;
	const canPreview = !item.isDirectory && isLikelyPreviewableText(item);
	const rawHref = useMemo(() => {
		if (item.sourceMode !== "user-scope" || !selectedUserScopeId) return "";
		return userScopeRawHref(selectedUserScopeId, item.fullKey);
	}, [item.fullKey, item.sourceMode, selectedUserScopeId]);

	const previewObject = async () => {
		try {
			if (item.sourceMode === "platform-bucket") {
				const response = await onPreviewPlatformObject(
					selectedBucket,
					item.fullKey,
					`${2 << 20}`,
				);
				const bytes = decodeBase64ToBytes(response.fileData);
				const text = new TextDecoder().decode(bytes);
				setPreviewMeta({
					title: item.fullKey,
					description: `${selectedBucket} • ${response.contentType || "application/octet-stream"}`,
					truncated: response.truncated,
				});
				setPreviewText(text);
				setPreviewOpen(true);
				return;
			}
			const response = await downloadUserScopeArtifact(
				selectedUserScopeId,
				item.fullKey,
			);
			const bytes = decodeBase64ToBytes(response.fileData);
			const text = new TextDecoder().decode(bytes);
			setPreviewMeta({
				title: item.fullKey,
				description: item.contentType || "application/octet-stream",
			});
			setPreviewText(text);
			setPreviewOpen(true);
		} catch (error) {
			toast.error("Preview failed", {
				description: (error as Error).message,
			});
		}
	};

	const downloadObject = async () => {
		try {
			if (item.sourceMode === "platform-bucket") {
				const response = await onPreviewPlatformObject(
					selectedBucket,
					item.fullKey,
					`${10 << 20}`,
				);
				const bytes = decodeBase64ToBytes(response.fileData);
				triggerFileDownload(
					bytes,
					item.name || "artifact",
					response.contentType || item.contentType,
				);
				return;
			}
			const response = await downloadUserScopeArtifact(
				selectedUserScopeId,
				item.fullKey,
			);
			const bytes = decodeBase64ToBytes(response.fileData);
			triggerFileDownload(bytes, item.name || "artifact", item.contentType);
		} catch (error) {
			toast.error("Download failed", {
				description: (error as Error).message,
			});
		}
	};

	const copyReference = async (mode: BrowserSourceMode) => {
		try {
			const text =
				mode === "platform-bucket"
					? `${selectedBucket}/${item.fullKey}`
					: item.fullKey;
			await navigator.clipboard?.writeText(text);
			toast.success("Reference copied", { description: text });
		} catch (error) {
			toast.error("Copy failed", {
				description: (error as Error).message,
			});
		}
	};

	const copyRawHref = async () => {
		if (!rawHref) return;
		try {
			await navigator.clipboard?.writeText(rawHref);
			toast.success("Raw URL copied", { description: rawHref });
		} catch (error) {
			toast.error("Copy failed", {
				description: (error as Error).message,
			});
		}
	};

	return (
		<>
			<div className="flex justify-end gap-2">
				{canPreview ? (
					<Button variant="outline" size="sm" onClick={() => void previewObject()}>
						<Eye className="mr-2 h-3 w-3" />
						Preview
					</Button>
				) : null}
				{!disabled ? (
					<Button variant="outline" size="sm" onClick={() => void downloadObject()}>
						<Download className="mr-2 h-3 w-3" />
						Download
					</Button>
				) : null}
				<Button
					variant="outline"
					size="sm"
					onClick={() => void copyReference(item.sourceMode)}
				>
					<Copy className="mr-2 h-3 w-3" />
					Copy key
				</Button>
				{rawHref ? (
					<Button variant="outline" size="sm" onClick={() => void copyRawHref()}>
						<Link2 className="mr-2 h-3 w-3" />
						Raw URL
					</Button>
				) : null}
				{item.sourceMode === "user-scope" && !disabled ? (
					<Button
						variant="destructive"
						size="sm"
						onClick={async () => {
							if (!confirmDeleteObject(item.fullKey)) return;
							try {
								await deleteUserScopeArtifactObject(
									selectedUserScopeId,
									item.fullKey,
								);
								toast.success("Deleted", { description: item.fullKey });
								await onChanged();
							} catch (error) {
								toast.error("Delete failed", {
									description: (error as Error).message,
								});
							}
						}}
					>
						<Trash2 className="mr-2 h-3 w-3" />
						Delete
					</Button>
				) : null}
			</div>

			<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>{previewMeta?.title ?? "Preview"}</DialogTitle>
						<DialogDescription>
							{previewMeta?.description}
							{previewMeta?.truncated ? " • truncated to preview limit" : ""}
						</DialogDescription>
					</DialogHeader>
					<Textarea
						readOnly
						value={previewText}
						className="min-h-[60vh] font-mono text-xs"
					/>
				</DialogContent>
			</Dialog>
		</>
	);
}

