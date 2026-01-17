import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Inbox } from "lucide-react";
import { listSyslogEvents } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useSyslogEvents } from "../lib/syslog-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Time</TableHead>
                  <TableHead className="w-[140px]">Source</TableHead>
                  <TableHead className="w-[140px]">App</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((e) => (
                  <TableRow key={String(e.id)}>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">{e.receivedAt ?? ""}</TableCell>
                    <TableCell className="font-mono text-xs">{e.sourceIp ?? ""}</TableCell>
                    <TableCell className="text-xs">{e.appName ?? ""}</TableCell>
                    <TableCell className="font-medium text-foreground text-sm line-clamp-2">{e.message ?? ""}</TableCell>
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
