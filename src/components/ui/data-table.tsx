import { useVirtualizer } from "@tanstack/react-virtual";
import * as React from "react";

import { cn } from "@/lib/utils";

export type DataTableColumn<T> = {
	id: string;
	header: React.ReactNode;
	cell: (row: T) => React.ReactNode;
	width?: number | string;
	align?: "left" | "center" | "right";
	className?: string;
	headerClassName?: string;
};

type DataTableProps<T> = {
	columns: Array<DataTableColumn<T>>;
	rows: T[];
	getRowId: (row: T) => string;
	onRowClick?: (row: T) => void;
	getRowClassName?: (row: T, index: number) => string | undefined;
	getRowAriaSelected?: (row: T, index: number) => boolean | undefined;
	isLoading?: boolean;
	emptyText?: string;
	maxHeightClassName?: string;
	minWidthClassName?: string;
	estimateRowHeight?: number;
};

function toColumnWidth(width: DataTableColumn<unknown>["width"]) {
	if (width === undefined) return "minmax(0, 1fr)";
	if (typeof width === "number") return `${width}px`;
	return width;
}

export function DataTable<T>({
	columns,
	rows,
	getRowId,
	onRowClick,
	getRowClassName,
	getRowAriaSelected,
	isLoading,
	emptyText = "No results.",
	maxHeightClassName = "max-h-[70vh]",
	minWidthClassName = "min-w-[900px]",
	estimateRowHeight = 34,
}: DataTableProps<T>) {
	const parentRef = React.useRef<HTMLDivElement | null>(null);

	const gridTemplateColumns = React.useMemo(() => {
		return columns.map((c) => toColumnWidth(c.width)).join(" ");
	}, [columns]);

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => estimateRowHeight,
		overscan: 10,
	});

	const virtualRows = rowVirtualizer.getVirtualItems();

	return (
		<div className="w-full overflow-x-auto rounded-md border">
			<div className={cn(minWidthClassName)}>
				<div
					role="table"
					aria-rowcount={rows.length}
					className="w-full text-sm"
					style={{ gridTemplateColumns }}
				>
					<div
						role="rowgroup"
						className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur"
					>
						<div role="row" className="grid" style={{ gridTemplateColumns }}>
							{columns.map((col) => (
								<div
									key={col.id}
									role="columnheader"
									className={cn(
										"px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
										col.align === "center" && "text-center",
										col.align === "right" && "text-right",
										col.headerClassName,
									)}
								>
									{col.header}
								</div>
							))}
						</div>
					</div>

					<div
						ref={parentRef}
						role="rowgroup"
						className={cn("relative overflow-auto", maxHeightClassName)}
					>
						{isLoading ? (
							<div className="p-4 text-sm text-muted-foreground">Loading…</div>
						) : rows.length === 0 ? (
							<div className="p-4 text-sm text-muted-foreground">
								{emptyText}
							</div>
						) : (
							<div
								className="relative"
								style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
							>
								{virtualRows.map((virtualRow) => {
									const row = rows[virtualRow.index];
									const rowId = getRowId(row);
									const clickable = Boolean(onRowClick);
									const rowClassName = getRowClassName?.(row, virtualRow.index);
									const ariaSelected = getRowAriaSelected?.(
										row,
										virtualRow.index,
									);

									return (
										<div
											key={rowId}
											role="row"
											aria-rowindex={virtualRow.index + 1}
											aria-selected={ariaSelected}
											className={cn(
												"absolute left-0 right-0 grid border-b last:border-b-0",
												virtualRow.index % 2 === 0 && "bg-background",
												virtualRow.index % 2 === 1 && "bg-muted/20",
												clickable && "cursor-pointer hover:bg-muted/40",
												rowClassName,
											)}
											style={{
												gridTemplateColumns,
												transform: `translateY(${virtualRow.start}px)`,
											}}
											onClick={clickable ? () => onRowClick?.(row) : undefined}
										>
											{columns.map((col) => (
												<div
													key={col.id}
													role="cell"
													className={cn(
														"px-3 py-2 align-middle",
														col.align === "center" && "text-center",
														col.align === "right" && "text-right",
														col.className,
													)}
												>
													{col.cell(row)}
												</div>
											))}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
