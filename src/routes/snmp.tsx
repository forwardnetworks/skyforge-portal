import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { DataTable, type DataTableColumn } from "../components/ui/data-table";
import { EmptyState } from "../components/ui/empty-state";
import { Skeleton } from "../components/ui/skeleton";
import { queryKeys } from "../lib/query-keys";
import {
	type ListSnmpTrapEventsResponse,
	listSnmpTrapEvents,
} from "../lib/skyforge-api";
import { useSnmpTrapEvents } from "../lib/snmp-events";

export const Route = createFileRoute("/snmp")({
	component: SnmpTrapsPage,
});

function SnmpTrapsPage() {
	useSnmpTrapEvents(true, "200");

	const events = useQuery({
		queryKey: queryKeys.snmpTrapEvents("200"),
		queryFn: () => listSnmpTrapEvents({ limit: "200" }),
		staleTime: Number.POSITIVE_INFINITY,
	});

	const list = events.data?.events ?? [];
	type TrapRow = NonNullable<ListSnmpTrapEventsResponse["events"]>[number];

	const columns: Array<DataTableColumn<TrapRow>> = [
		{
			id: "time",
			header: "Time",
			width: 190,
			cell: (e) => (
				<span className="text-muted-foreground whitespace-nowrap text-xs">
					{e.receivedAt ?? ""}
				</span>
			),
		},
		{
			id: "source",
			header: "Source",
			width: 160,
			cell: (e) => (
				<span className="font-mono text-xs">{e.sourceIp ?? ""}</span>
			),
		},
		{
			id: "oid",
			header: "OID",
			cell: (e) => (
				<span className="font-medium text-foreground text-sm font-mono">
					{e.oid ?? ""}
				</span>
			),
		},
		{
			id: "id",
			header: "ID",
			width: 120,
			align: "right",
			cell: (e) => (
				<span className="font-mono text-xs text-muted-foreground">
					{String(e.id)}
				</span>
			),
		},
	];

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>SNMP trap inbox</CardTitle>
					<CardDescription>
						Recent SNMP trap events routed to your user.
					</CardDescription>
				</CardHeader>
			</Card>

			<Card>
				<CardContent className="p-0">
					{events.isLoading ? (
						<div className="p-6 space-y-4">
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
							<Skeleton className="h-12 w-full" />
						</div>
					) : events.isError ? (
						<div className="p-8 text-center text-destructive">
							Failed to load SNMP trap events.
						</div>
					) : list.length === 0 ? (
						<EmptyState
							icon={Inbox}
							title="No trap events"
							description="No SNMP traps have been received yet."
						/>
					) : (
						<DataTable<TrapRow>
							columns={columns}
							rows={list as TrapRow[]}
							getRowId={(row) => String(row.id)}
							maxHeightClassName="max-h-[65vh]"
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
