import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { type ListWebhookEventsResponse, listWebhookEvents } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useWebhookEvents } from "../lib/webhook-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { DataTable, type DataTableColumn } from "../components/ui/data-table";

export const Route = createFileRoute("/webhooks")({
  component: WebhooksPage
});

function WebhooksPage() {
  useWebhookEvents(true, "200");
  const events = useQuery({
    queryKey: queryKeys.webhookEvents("200"),
    queryFn: () => listWebhookEvents({ limit: "200" }),
    staleTime: Infinity
  });

  const list = events.data?.events ?? [];
  type WebhookRow = NonNullable<ListWebhookEventsResponse["events"]>[number];

  const columns: Array<DataTableColumn<WebhookRow>> = [
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
      id: "event",
      header: "Event",
      cell: (e) => (
        <span className="font-medium text-sm">
          {e.method} {e.path}
        </span>
      )
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
      )
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Webhook inbox</CardTitle>
          <CardDescription>Recent webhook events routed to your user.</CardDescription>
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
            <div className="p-8 text-center text-destructive">Failed to load webhook events.</div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No webhook events"
              description="No webhook events have been received yet."
            />
          ) : (
            <DataTable<WebhookRow>
              columns={columns}
              rows={list as WebhookRow[]}
              getRowId={(row) => String(row.id)}
              maxHeightClassName="max-h-[65vh]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
