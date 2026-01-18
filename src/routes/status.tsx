import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getStatusSummary, getUIConfig } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useStatusSummaryEvents } from "../lib/status-events";
import {
  BentoGrid,
  BentoItem,
  BentoStatCard,
  BentoWelcomeCard,
} from "../components/ui/bento-grid";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import {
  Activity,
  CheckCircle2,
  Cloud,
  Database,
  FileCode2,
  GitBranch,
  Network,
  Shield,
  Sparkles,
  Workflow,
  Zap,
  Globe,
} from "lucide-react";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/status")({
  component: StatusPage,
});

function StatusPage() {
  useStatusSummaryEvents(true);

  const summary = useQuery({
    queryKey: queryKeys.statusSummary(),
    queryFn: getStatusSummary,
    staleTime: Infinity,
  });

  const uiConfig = useQuery({
    queryKey: queryKeys.uiConfig(),
    queryFn: getUIConfig,
    staleTime: Infinity,
  });

  const statusData = summary.data;
  const checks = statusData?.checks ?? [];
  const downChecks = checks.filter((c) => c.status !== "up" && c.status !== "ok");

  return (
    <div className="space-y-8 p-6">
      {/* Premium Bento Grid Dashboard */}
      <BentoGrid className="gap-4">
        {/* Welcome Card */}
        <BentoWelcomeCard
          subtitle="Here's what's happening with your infrastructure today."
        />

        {/* Status Stats */}
        {summary.isLoading ? (
          <>
            <BentoItem className="h-32"><Skeleton className="h-full w-full" /></BentoItem>
            <BentoItem className="h-32"><Skeleton className="h-full w-full" /></BentoItem>
            <BentoItem className="h-32"><Skeleton className="h-full w-full" /></BentoItem>
          </>
        ) : (
          <>
            <BentoStatCard
              title="Active Deployments"
              value={statusData?.deploymentsActive ?? 0}
              gradient="green"
              icon={<Cloud className="w-5 h-5" />}
              subtitle={`${statusData?.deploymentsTotal ?? 0} total deployments`}
            />

            <BentoStatCard
              title="Services Operational"
              value={`${statusData?.up ?? 0} / ${checks.length}`}
              gradient={statusData?.up === checks.length ? "green" : "orange"}
              icon={<CheckCircle2 className="w-5 h-5" />}
            />

            <BentoStatCard
              title="Services Down"
              value={statusData?.down ?? 0}
              gradient={statusData?.down ? "red" : "blue"}
              icon={<Activity className="w-5 h-5" />}
            />

            {/* Live Activity Indicator */}
            <BentoItem gradient="purple" className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground/80">
                  <Zap className="w-4 h-4" />
                  Platform Health
                </h3>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <span
                    className={cn(
                      "text-3xl font-bold",
                      statusData?.status === "ok"
                        ? "text-emerald-500"
                        : statusData?.status === "degraded"
                          ? "text-amber-500"
                          : "text-muted-foreground"
                    )}
                  >
                    {(statusData?.status ?? "checking").toUpperCase()}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {statusData?.timestamp
                      ? `Refreshed ${new Date(statusData.timestamp).toLocaleTimeString()}`
                      : "Checking..."}
                  </p>
                </div>
              </div>
            </BentoItem>
          </>
        )}
      </BentoGrid>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {uiConfig.data?.externalUrl && (
          <Card variant="glass" className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-green-500">
                <Globe className="w-4 h-4" />
                Public Access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                This environment is securely accessible via Cloudflare Tunnel.
              </p>
              <div className="rounded bg-background/50 p-2 border">
                <a
                  className="text-primary hover:underline break-all font-mono text-xs"
                  href={uiConfig.data.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {uiConfig.data.externalUrl}
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              Skyforge at a Glance
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Skyforge coordinates lab + cloud tooling into repeatable,
              auditable workflows for platform teams.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                Teams can still run tools manually; Skyforge standardizes the
                "happy path".
              </li>
              <li>
                Enables consistent lab delivery across on-prem and cloud
                environments.
              </li>
              <li>
                Creates shared context for collaboration, troubleshooting, and
                handoffs.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-blue-500" />
              What You Can Do Here
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <Link className="text-primary hover:underline" to="/dashboard/deployments">
              → Open the dashboard
            </Link>
            <Link className="text-primary hover:underline" to="/dashboard/deployments/new">
              → Create a deployment
            </Link>
            <Link className="text-primary hover:underline" to="/dashboard/s3">
              → Browse artifacts (S3)
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              Status is refreshed automatically via Server-Sent Events.
            </p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Workflow className="w-4 h-4 text-purple-500" />
              How Workflows Run
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Skyforge connects source control, automation, and lab capacity
              into one delivery loop.
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Choose a blueprint (Git).</li>
              <li>Run deployments (native task engine).</li>
              <li>Validate on lab servers (BYOS + In-Cluster).</li>
              <li>Store artifacts + state (Skyforge storage).</li>
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Toolchain */}
      <BentoGrid className="gap-4">
        <BentoItem gradient="blue" className="md:col-span-4 hover-lift">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold">Integrated Toolchain & Status</h3>
                <p className="text-xs text-muted-foreground">Live health checks for all platform services.</p>
              </div>
            </div>
            
            {downChecks.length > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {downChecks.length} Service{downChecks.length > 1 ? 's' : ''} Reporting Issues
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { id: 'gitea', name: 'Git', path: '/git/', icon: GitBranch },
              { id: 'netbox', name: 'NetBox', path: '/netbox/', icon: Network },
              { id: 'nautobot', name: 'Nautobot', path: '/nautobot/', icon: Network },
              { id: 'coder', name: 'Coder', path: '/coder', icon: Cloud },
              { id: 'yaade', name: 'API Testing', path: '/api-testing/', icon: Zap },
              { id: 'webhooks', name: 'Webhooks', path: '/dashboard/webhooks', icon: Workflow },
            ].map((tool) => {
              // Find check status (simple fuzzy match)
              const check = checks.find(c => c.name.toLowerCase().includes(tool.id));
              const isUp = check ? (check.status === "up" || check.status === "ok") : true; 
              const statusColor = isUp ? "bg-emerald-500" : "bg-red-500";
              const Icon = tool.icon;

              return (
                <a
                  key={tool.id}
                  href={tool.path}
                  target={tool.path.startsWith("http") || tool.path.startsWith("/api") || tool.path.includes("/") ? "_blank" : "_self"}
                  className="flex flex-col items-center justify-center p-4 rounded-lg bg-background/50 border hover:bg-background/80 transition-colors group relative overflow-hidden"
                >
                  <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${statusColor} ${!isUp ? 'animate-pulse' : ''}`} />
                  <Icon className="w-6 h-6 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium">{tool.name}</span>
                  <span className={cn(
                    "text-[10px] mt-1 capitalize font-medium",
                    isUp ? "text-emerald-500/80" : "text-red-500"
                  )}>
                    {check?.status ?? "Operational"}
                  </span>
                </a>
              );
            })}
          </div>

          {downChecks.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Service Alerts</h4>
              <div className="flex flex-wrap gap-2">
                {downChecks.map(c => (
                  <Badge key={c.name} variant="outline" className="text-[10px] border-red-500/30 text-red-400 bg-red-500/5">
                    {c.name}: {c.status}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </BentoItem>
      </BentoGrid>
    </div>
  );
}
