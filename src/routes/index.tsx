import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LayoutDashboard, Activity } from "lucide-react";
import { buildLoginUrl, getStatusSummary } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useStatusSummaryEvents } from "../lib/status-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button, buttonVariants } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export const Route = createFileRoute("/")({
  component: LandingPage
});

function LandingPage() {
  useStatusSummaryEvents(true);

  const summary = useQuery({
    queryKey: queryKeys.statusSummary(),
    queryFn: getStatusSummary,
    retry: false,
    staleTime: Infinity
  });

  const loginHref = buildLoginUrl("/dashboard/deployments");

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      <Card variant="glass" className="border-none shadow-xl bg-gradient-to-br from-background via-background/80 to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-muted-foreground">Skyforge Automation Platform</Badge>
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
             Welcome to Skyforge
          </CardTitle>
          <CardDescription className="text-lg max-w-2xl mt-4 leading-relaxed">
            Launch Netlab/LabPP/Containerlab workflows, manage deployments, and stream run output live via SSE.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-wrap gap-4 pt-4">
            <a
              className={buttonVariants({ variant: "default", size: "lg" })}
              href={loginHref}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Login & open dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <Link
              className={buttonVariants({ variant: "secondary", size: "lg" })}
              to="/status"
            >
              <Activity className="mr-2 h-4 w-4" />
              Platform status
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick status</CardTitle>
            <CardDescription>
              {summary.isLoading && "Loading…"}
              {summary.isError && "Unable to load platform status."}
              {summary.data?.checks?.length ? "System health checks" : !summary.isLoading && !summary.isError ? "No status data." : null}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.data?.checks?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.data.checks.slice(0, 10).map((c, idx) => (
                    <TableRow key={`${c.name ?? idx}`}>
                      <TableCell className="font-medium">{c.name ?? "unknown"}</TableCell>
                      <TableCell>
                        <StatusBadge status={c.status ?? "unknown"} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.detail ?? ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "secondary";
  const s = status.toLowerCase();
  if (["pass", "ok", "healthy", "up"].includes(s)) variant = "default"; // Default maps to primary color (often green/blue in themes)
  if (["fail", "error", "down", "critical"].includes(s)) variant = "destructive";
  
  return <Badge variant={variant} className="capitalize">{status}</Badge>;
}