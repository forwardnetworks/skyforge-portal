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
              title="Services Up"
              value={statusData?.up ?? 0}
              gradient="green"
              icon={<CheckCircle2 className="w-5 h-5" />}
              trend={statusData ? { value: 100, direction: "up" } : undefined}
            />

            <BentoStatCard
              title="Services Down"
              value={statusData?.down ?? 0}
              gradient={statusData?.down ? "orange" : "blue"}
              icon={<Activity className="w-5 h-5" />}
            />

            {/* Live Activity Indicator */}
            <BentoItem gradient="purple" className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Platform Status
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
                      ? `Updated ${new Date(statusData.timestamp).toLocaleString()}`
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

      {/* Platform Health */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Platform Health
          </h2>
          {statusData?.timestamp && (
            <Badge variant="secondary" className="text-xs">
              {new Date(statusData.timestamp).toLocaleTimeString()}
            </Badge>
          )}
        </div>

        <BentoGrid className="gap-4">
          {summary.isLoading ? (
            <>
              <BentoItem gradient="blue" className="md:col-span-2"><Skeleton className="h-24 w-full" /></BentoItem>
              <BentoItem gradient="green"><Skeleton className="h-24 w-full" /></BentoItem>
              <BentoItem gradient="purple"><Skeleton className="h-24 w-full" /></BentoItem>
            </>
          ) : summary.isError ? (
            <BentoItem gradient="red" className="md:col-span-4">
              <div className="text-destructive">
                Error loading status: {(summary.error as Error).message}
              </div>
            </BentoItem>
          ) : (
            <>
              {/* Main Status Card */}
              <BentoItem
                gradient="blue"
                className="md:col-span-2 relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <h3 className="text-base font-semibold">
                      Platform Status
                    </h3>
                  </div>
                  {statusData?.status === "ok" && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  )}
                </div>
                <div
                  className={cn(
                    "text-4xl font-bold mb-2",
                    statusData?.status === "ok"
                      ? "text-emerald-500"
                      : statusData?.status === "degraded"
                        ? "text-amber-500"
                        : "text-muted-foreground"
                  )}
                >
                  {(statusData?.status ?? "unknown").toUpperCase()}
                </div>
                <div className="text-sm text-muted-foreground/80">
                  {statusData?.up ?? 0} of {checks.length} services operational
                </div>
                {downChecks.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {downChecks.slice(0, 5).map((check) => (
                      <Badge
                        key={check.name}
                        variant="outline"
                        className="text-xs border-red-500/50"
                      >
                        {check.name}
                      </Badge>
                    ))}
                    {downChecks.length > 5 && (
                      <Badge
                        variant="outline"
                        className="text-xs border-red-500/50"
                      >
                        +{downChecks.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </BentoItem>

              {/* Workspaces */}
              <BentoStatCard
                title="Active Workspaces"
                value={statusData?.workspacesTotal ?? 0}
                gradient="green"
                icon={<Cloud className="w-5 h-5" />}
                subtitle="BYOS + In-Cluster"
              />

              {/* Services */}
              <BentoStatCard
                title="Platform Services"
                value={statusData?.up ?? 0}
                gradient="purple"
                icon={<Database className="w-5 h-5" />}
                subtitle="Running smoothly"
              />
            </>
          )}
        </BentoGrid>
      </div>

      {/* Key Capabilities */}
      <div className="space-y-4 pb-12">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          What Skyforge Delivers
        </h2>

        <BentoGrid className="gap-4">
          {/* Infrastructure as Code */}
          <BentoItem gradient="blue" className="hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileCode2 className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="font-semibold">Infrastructure as Code</h3>
            </div>
            <p className="text-sm text-muted-foreground/80">
              Bring your own servers or deploy in-cluster. Define topology in
              Git, deploy with one command, tear down cleanly.
            </p>
          </BentoItem>

          {/* Lab Automation */}
          <BentoItem gradient="green" className="hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Workflow className="w-5 h-5 text-emerald-500" />
              </div>
              <h3 className="font-semibold">Lab Automation</h3>
            </div>
            <p className="text-sm text-muted-foreground/80">
              Repeatable network validation and demos. No manual clicking
              through tools—just push to Git and let workflows run.
            </p>
          </BentoItem>

          {/* Collaboration */}
          <BentoItem gradient="purple" className="hover-lift">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Network className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold">Team Collaboration</h3>
            </div>
            <p className="text-sm text-muted-foreground/80">
              Shared blueprints, consistent environments, audit trails. Onboard
              new team members in hours, not weeks.
            </p>
          </BentoItem>

          {/* Integrated Toolchain */}
          <BentoItem gradient="orange" className="hover-lift md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold">Integrated Toolchain</h3>
            </div>
            <p className="text-sm text-muted-foreground/80 mb-3">
              Source control, automation database, API workspace, and browser
              IDE—all connected. No more context switching between disconnected
              tools.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                Git
              </Badge>
              <Badge variant="secondary" className="text-xs">
                NetBox
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Nautobot
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Coder
              </Badge>
              <Badge variant="secondary" className="text-xs">
                API Testing
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Webhooks
              </Badge>
            </div>
          </BentoItem>
        </BentoGrid>
      </div>
    </div>
  );
}
