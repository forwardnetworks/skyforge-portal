import {
	displayContentType,
	humanDate,
} from "@/components/s3/s3-browser-utils";
import { S3ObjectActions } from "@/components/s3/s3-object-actions";
import type { BrowserRow, PlatformBucketPreview } from "@/components/s3/s3-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { formatBytes } from "@/components/topology-viewer-utils";
import { Folder, FolderOpen } from "lucide-react";
import { useMemo } from "react";

type S3ObjectTableProps = {
	rows: BrowserRow[];
	selectedUserScopeId: string;
	selectedBucket: string;
	onObjectsChanged: () => Promise<unknown> | unknown;
	onPreviewPlatformObject: (
		bucket: string,
		key: string,
		maxBytes?: string,
	) => Promise<PlatformBucketPreview>;
	onOpenPrefix: (prefix: string) => void;
};

export function S3ObjectTable(props: S3ObjectTableProps) {
	const {
		rows,
		selectedUserScopeId,
		selectedBucket,
		onObjectsChanged,
		onPreviewPlatformObject,
		onOpenPrefix,
	} = props;

	const columns = useMemo((): Array<DataTableColumn<BrowserRow>> => {
		return [
			{
				id: "name",
				header: "Name",
				width: "minmax(320px, 2fr)",
				cell: (item) =>
					item.isDirectory ? (
						<Button
							variant="ghost"
							size="sm"
							onClick={(event) => {
								event.stopPropagation();
								onOpenPrefix(item.fullKey);
							}}
							className="h-auto justify-start px-0 py-0 font-medium"
						>
							<FolderOpen className="h-4 w-4 text-amber-500" />
							<span>{item.name}</span>
						</Button>
					) : (
						<div className="flex items-center gap-2 min-w-0">
							<Folder className="h-4 w-4 text-transparent" />
							<div className="min-w-0">
								<div className="truncate font-medium">{item.name}</div>
								<div className="truncate font-mono text-[11px] text-muted-foreground">
									{item.fullKey}
								</div>
							</div>
						</div>
					),
			},
			{
				id: "kind",
				header: "Kind",
				width: 140,
				cell: (item) => (
					<Badge variant={item.isDirectory ? "secondary" : "outline"}>
						{item.isDirectory ? "Folder" : "Object"}
					</Badge>
				),
			},
			{
				id: "size",
				header: "Size",
				width: 120,
				align: "right",
				cell: (item) => (item.isDirectory ? "-" : formatBytes(item.size)),
			},
			{
				id: "modified",
				header: "Modified",
				width: 200,
				cell: (item) => (item.isDirectory ? "-" : humanDate(item.lastModified)),
			},
			{
				id: "contentType",
				header: "Content Type",
				width: "minmax(180px, 1fr)",
				cell: (item) => (item.isDirectory ? "-" : displayContentType(item.contentType)),
			},
			{
				id: "actions",
				header: "Actions",
				width: 420,
				align: "right",
				cell: (item) => (
					<S3ObjectActions
						item={item}
						selectedUserScopeId={selectedUserScopeId}
						selectedBucket={selectedBucket}
						onChanged={onObjectsChanged}
						onPreviewPlatformObject={onPreviewPlatformObject}
					/>
				),
			},
		];
	}, [
		onObjectsChanged,
		onOpenPrefix,
		onPreviewPlatformObject,
		selectedBucket,
		selectedUserScopeId,
	]);

	return (
		<DataTable
			columns={columns}
			rows={rows}
			getRowId={(row) => row.id}
			maxHeightClassName="max-h-[60vh]"
			minWidthClassName="min-w-[1320px]"
		/>
	);
}
