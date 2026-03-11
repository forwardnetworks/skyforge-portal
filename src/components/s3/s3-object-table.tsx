import { S3ObjectActions } from "@/components/s3/s3-object-actions";
import type { S3ObjectRow } from "@/components/s3/s3-types";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { useMemo } from "react";

type S3ObjectTableProps = {
	rows: S3ObjectRow[];
	selectedUserScopeId: string;
	onObjectsChanged: () => Promise<unknown> | unknown;
};

export function S3ObjectTable(props: S3ObjectTableProps) {
	const { rows, selectedUserScopeId, onObjectsChanged } = props;

	const columns = useMemo((): Array<DataTableColumn<S3ObjectRow>> => {
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
					<S3ObjectActions
						item={item}
						selectedUserScopeId={selectedUserScopeId}
						onChanged={onObjectsChanged}
					/>
				),
			},
		];
	}, [onObjectsChanged, selectedUserScopeId]);

	return (
		<DataTable
			columns={columns}
			rows={rows}
			getRowId={(row) => row.key}
			maxHeightClassName="max-h-[60vh]"
			minWidthClassName="min-w-[900px]"
		/>
	);
}
