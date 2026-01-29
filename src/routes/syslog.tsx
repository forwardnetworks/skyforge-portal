import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { type ListSyslogEventsResponse, listSyslogEvents } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useSyslogEvents } from "../lib/syslog-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { DataTable, type DataTableColumn } from "../components/ui/data-table";

export const Route = createFileRoute("/syslog")({
  component: SyslogPage
});

function SyslogPage() {
  useSyslogEvents(true, "200");

  const events = useQuery({
    queryKey: queryKeys.syslogEvents("200"),
    queryFn: () => listSyslogEvents({ limit: "200" }),
    staleTime: Infinity
  });

  const list = events.data?.events ?? [];
  type SyslogRow = NonNullable<ListSyslogEventsResponse["events"]>[number];

  const columns: Array<DataTableColumn<SyslogRow>> = [
    {
      id: "time",
      header: "Time",
      width: 190,
      cell: (e) => (
        <span className="text-muted-foreground whitespace-nowrap text-xs">
          {e.receivedAt ?? ""}
        </span>
      )
    },
    {
      id: "source",
      header: "Source",
      width: 160,
      cell: (e) => <span className="font-mono text-xs">{e.sourceIp ?? ""}</span>
    },
    {
      id: "app",
      header: "App",
      width: 160,
      cell: (e) => <span className="text-xs">{e.appName ?? ""}</span>
    },
    {
      id: "message",
      header: "Message",
      cell: (e) => (
        <span className="font-medium text-foreground text-sm line-clamp-2">
          {e.message ?? ""}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Syslog inbox</CardTitle>
          <CardDescription>Recent syslog events mapped to your user.</CardDescription>
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
            <div className="p-8 text-center text-destructive">Failed to load syslog events.</div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No syslog events"
              description="No syslog messages have been received yet."
            />
          ) : (
            <DataTable<SyslogRow>
              columns={columns}
              rows={list as SyslogRow[]}
              getRowId={(row) => String(row.id)}
              maxHeightClassName="max-h-[65vh]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
