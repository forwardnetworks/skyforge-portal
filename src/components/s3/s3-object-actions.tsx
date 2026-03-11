import { Button } from "@/components/ui/button";
import {
	deleteUserScopeArtifactObject,
	downloadUserScopeArtifact,
} from "@/lib/api-client";
import { Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { confirmDeleteObject } from "@/components/s3/s3-object-dialogs";
import type { S3ObjectRow } from "@/components/s3/s3-types";

type S3ObjectActionsProps = {
	item: S3ObjectRow;
	selectedUserScopeId: string;
	onChanged: () => Promise<unknown> | unknown;
};

function decodeBase64ToBytes(fileData: string) {
	const raw = atob(fileData);
	const bytes = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i++) {
		bytes[i] = raw.charCodeAt(i);
	}
	return bytes;
}

function triggerFileDownload(data: BlobPart, filename: string) {
	const blob = new Blob([data]);
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	URL.revokeObjectURL(url);
}

async function viewJsonObject(selectedUserScopeId: string, key: string) {
	const response = await downloadUserScopeArtifact(selectedUserScopeId, key);
	const bytes = decodeBase64ToBytes(response.fileData);
	const text = new TextDecoder().decode(bytes);
	const pretty = JSON.stringify(JSON.parse(text), null, 2);
	const blob = new Blob([pretty], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	window.open(url, "_blank", "noopener,noreferrer");
	window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function downloadObject(selectedUserScopeId: string, key: string) {
	const response = await downloadUserScopeArtifact(selectedUserScopeId, key);
	const bytes = decodeBase64ToBytes(response.fileData);
	triggerFileDownload(bytes, key.split("/").pop() || "artifact");
}

export function S3ObjectActions(props: S3ObjectActionsProps) {
	const { item, selectedUserScopeId, onChanged } = props;
	const disabled = !selectedUserScopeId;
	const canViewJson = item.key.toLowerCase().endsWith(".json");

	return (
		<div className="flex justify-end gap-2">
			{canViewJson && (
				<Button
					variant="outline"
					size="sm"
					onClick={async () => {
						try {
							await viewJsonObject(selectedUserScopeId, item.key);
						} catch (error) {
							toast.error("View failed", {
								description: (error as Error).message,
							});
						}
					}}
					disabled={disabled}
				>
					<Eye className="mr-2 h-3 w-3" />
					View
				</Button>
			)}
			<Button
				variant="outline"
				size="sm"
				onClick={async () => {
					try {
						await downloadObject(selectedUserScopeId, item.key);
					} catch (error) {
						toast.error("Download failed", {
							description: (error as Error).message,
						});
					}
				}}
				disabled={disabled}
			>
				<Download className="mr-2 h-3 w-3" />
				Download
			</Button>
			<Button
				variant="destructive"
				size="sm"
				onClick={async () => {
					if (!confirmDeleteObject(item.key)) return;
					try {
						await deleteUserScopeArtifactObject(selectedUserScopeId, item.key);
						toast.success("Deleted", { description: item.key });
						await onChanged();
					} catch (error) {
						toast.error("Delete failed", {
							description: (error as Error).message,
						});
					}
				}}
				disabled={disabled}
			>
				<Trash2 className="mr-2 h-3 w-3" />
				Delete
			</Button>
		</div>
	);
}
