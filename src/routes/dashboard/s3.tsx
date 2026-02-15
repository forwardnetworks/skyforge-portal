import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Eye, FolderPlus, Inbox, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	DataTable,
	type DataTableColumn,
} from "../../components/ui/data-table";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import { queryKeys } from "../../lib/query-keys";
import {
	PERSONAL_SCOPE_ID,
	createWorkspaceArtifactFolder,
	deleteWorkspaceArtifactObject,
	downloadWorkspaceArtifact,
	listWorkspaceArtifacts,
	putWorkspaceArtifactObject,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/s3")({
	component: S3Page,
});

function S3Page() {
	const selectedWorkspaceId = PERSONAL_SCOPE_ID;
	const [prefix, setPrefix] = useState("");

	const artifacts = useQuery({
		queryKey: queryKeys.workspaceArtifacts(selectedWorkspaceId),
		queryFn: async () =>
			listWorkspaceArtifacts(selectedWorkspaceId, {
				prefix: prefix || undefined,
			}),
		staleTime: 10_000,
		enabled: !!selectedWorkspaceId,
	});

	const list = artifacts.data?.items ?? [];

	const columns = useMemo((): Array<DataTableColumn<(typeof list)[number]>> => {
		return [
			{
				id: "object",
				header: "Object",
				cell: (item) => <span className="font-mono text-xs">{item.key}</span>,
			},
			{
				id: "actions",
				header: "Actions",
				width: 300,
				align: "right",
				cell: (item) => (
					<div className="flex justify-end gap-2">
						{item.key.toLowerCase().endsWith(".json") && (
							<Button
								variant="outline"
								size="sm"
								onClick={async () => {
									try {
										const resp = await downloadWorkspaceArtifact(
											selectedWorkspaceId,
											item.key,
										);
										const raw = atob(resp.fileData);
										const bin = new Uint8Array(raw.length);
										for (let i = 0; i < raw.length; i++)
											bin[i] = raw.charCodeAt(i);
										const txt = new TextDecoder().decode(bin);
										const pretty = JSON.stringify(JSON.parse(txt), null, 2);
										const blob = new Blob([pretty], {
											type: "application/json",
										});
										const url = URL.createObjectURL(blob);
										window.open(url, "_blank", "noopener,noreferrer");
										window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
									} catch (e) {
										toast.error("View failed", {
											description: (e as Error).message,
										});
									}
								}}
								disabled={!selectedWorkspaceId}
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
									const resp = await downloadWorkspaceArtifact(
										selectedWorkspaceId,
										item.key,
									);
									const raw = atob(resp.fileData);
									const bin = new Uint8Array(raw.length);
									for (let i = 0; i < raw.length; i++)
										bin[i] = raw.charCodeAt(i);
									const blob = new Blob([bin]);
									const url = URL.createObjectURL(blob);
									const a = document.createElement("a");
									a.href = url;
									a.download = item.key.split("/").pop() || "artifact";
									document.body.appendChild(a);
									a.click();
									a.remove();
									URL.revokeObjectURL(url);
								} catch (e) {
									toast.error("Download failed", {
										description: (e as Error).message,
									});
								}
							}}
							disabled={!selectedWorkspaceId}
						>
							<Download className="mr-2 h-3 w-3" />
							Download
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={async () => {
								if (!confirm(`Delete ${item.key}?`)) return;
								try {
									await deleteWorkspaceArtifactObject(
										selectedWorkspaceId,
										item.key,
									);
									toast.success("Deleted", { description: item.key });
									await artifacts.refetch();
								} catch (e) {
									toast.error("Delete failed", {
										description: (e as Error).message,
									});
								}
							}}
							disabled={!selectedWorkspaceId}
						>
							<Trash2 className="mr-2 h-3 w-3" />
							Delete
						</Button>
					</div>
				),
			},
		];
	}, [artifacts.refetch, selectedWorkspaceId]);

	const toolbar = (
		<div className="p-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
				<Input
					placeholder="Prefix (e.g. topology/)"
					value={prefix}
					onChange={(e) => setPrefix(e.target.value)}
					className="w-[260px]"
				/>
				<Button
					variant="outline"
					size="sm"
					onClick={() => artifacts.refetch()}
					disabled={!selectedWorkspaceId}
				>
					Refresh
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={async () => {
						if (!selectedWorkspaceId) return;
						const folder = window.prompt("Folder prefix (e.g. uploads/)");
						if (!folder) return;
						try {
							await createWorkspaceArtifactFolder(selectedWorkspaceId, folder);
							toast.success("Folder created");
							await artifacts.refetch();
						} catch (e) {
							toast.error("Create folder failed", {
								description: (e as Error).message,
							});
						}
					}}
					disabled={!selectedWorkspaceId}
				>
					<FolderPlus className="mr-2 h-3 w-3" />
					Folder
				</Button>
				<Button
					variant="outline"
					size="sm"
					onClick={() => {
						if (!selectedWorkspaceId) return;
						const input = document.createElement("input");
						input.type = "file";
						input.onchange = () => {
							const file = input.files?.[0];
							if (!file) return;
							void (async () => {
								try {
									const buf = new Uint8Array(await file.arrayBuffer());
									// Avoid `btoa` string size limits by chunking.
									let b64 = "";
									const chunkSize = 32 * 1024;
									for (let i = 0; i < buf.length; i += chunkSize) {
										const chunk = buf.subarray(i, i + chunkSize);
										b64 += btoa(String.fromCharCode(...chunk));
									}
									const key = (prefix || "") + file.name;
									await putWorkspaceArtifactObject(selectedWorkspaceId, {
										key,
										contentBase64: b64,
										contentType: file.type || "application/octet-stream",
									});
									toast.success("Uploaded", { description: key });
									await artifacts.refetch();
								} catch (e) {
									toast.error("Upload failed", {
										description: (e as Error).message,
									});
								}
							})();
						};
						input.click();
					}}
					disabled={!selectedWorkspaceId}
				>
					<Upload className="mr-2 h-3 w-3" />
					Upload
				</Button>
			</div>
		</div>
	);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>S3</CardTitle>
					<CardDescription>
						Personal artifacts and generated files (backed by the platform
						object store).
					</CardDescription>
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="p-0">
					{artifacts.isLoading ? (
						<div className="p-6 space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : (
						<div>
							{toolbar}
							{artifacts.isError ? (
								<div className="p-8 text-center text-destructive">
									Failed to list objects.
								</div>
							) : list.length === 0 ? (
								<div className="p-6">
									<EmptyState
										icon={Inbox}
										title="No objects found"
										description="No artifacts found."
									/>
								</div>
							) : (
								<DataTable
									columns={columns}
									rows={list}
									getRowId={(row) => row.key}
									maxHeightClassName="max-h-[60vh]"
									minWidthClassName="min-w-[900px]"
								/>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
