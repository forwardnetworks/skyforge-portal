import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { listWebhookEvents } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useWebhookEvents } from "../lib/webhook-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Time</TableHead>
                  <TableHead className="w-[140px]">Source</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead className="w-[100px] text-right">ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((e) => (
                  <TableRow key={String(e.id)}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">{e.receivedAt ?? ""}</TableCell>
                    <TableCell>{e.sourceIp ?? ""}</TableCell>
                    <TableCell className="font-medium text-sm">
                      {e.method} {e.path}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground text-right">{String(e.id)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
