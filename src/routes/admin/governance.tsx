import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Database, DollarSign, Layers, RefreshCcw, Search, Inbox, CreditCard, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getGovernanceSummary,
  listGovernanceCosts,
  listGovernanceResources,
  listGovernanceUsage,
  syncGovernanceSources
} from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { BentoGrid, BentoStatCard, BentoItem } from "../../components/ui/bento-grid";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

// Search Params Schema
const governanceSearchSchema = z.object({
  q: z.string().optional().catch(""),
  tab: z.enum(["resources", "costs", "usage"]).optional().catch("resources"),
});

export const Route = createFileRoute("/admin/governance")({
  validateSearch: (search) => governanceSearchSchema.parse(search),
  loaderDeps: ({ search: { q, tab } }) => ({ q, tab }),
  loader: async ({ context: { queryClient } }) => {
    // Prefetch all data to ensure tab switching is instant
    await Promise.all([
      queryClient.ensureQueryData({
        queryKey: queryKeys.governanceSummary(),
        queryFn: getGovernanceSummary,
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.governanceResources("500"),
        queryFn: () => listGovernanceResources({ limit: "500" }),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.governanceCosts("50"),
        queryFn: () => listGovernanceCosts({ limit: "50" }),
      }),
      queryClient.ensureQueryData({
        queryKey: queryKeys.governanceUsage("50"),
        queryFn: () => listGovernanceUsage({ limit: "50" }),
      }),
    ]);
  },
  component: GovernancePage
});

function GovernancePage() {
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const { q, tab } = Route.useSearch();
  
  const session = queryClient.getQueryData<any>(queryKeys.session());
  const isAdmin = !!session?.isAdmin;

  const summary = useQuery({
    queryKey: queryKeys.governanceSummary(),
    queryFn: getGovernanceSummary,
    staleTime: 30_000
  });
  const resources = useQuery({
    queryKey: queryKeys.governanceResources("500"),
    queryFn: () => listGovernanceResources({ limit: "500" }),
    staleTime: 30_000
  });
  const costs = useQuery({
    queryKey: queryKeys.governanceCosts("50"),
    queryFn: () => listGovernanceCosts({ limit: "50" }),
    staleTime: 30_000
  });
  const usage = useQuery({
    queryKey: queryKeys.governanceUsage("50"),
    queryFn: () => listGovernanceUsage({ limit: "50" }),
    staleTime: 30_000
  });

  const filteredResources = useMemo(() => {
    const list = resources.data?.resources ?? [];
    const query = q?.trim().toLowerCase() || "";
    if (!query) return list;
    return list.filter((r) => {
      const haystack = [r.name, r.resourceId, r.resourceType, r.workspaceName, r.owner, r.provider]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [resources.data?.resources, q]);

  const sync = useMutation({
    mutationFn: async () => {
      await syncGovernanceSources();
    },
    onSuccess: async () => {
      toast.success("Governance sources synced", { description: "Resource inventory updated." });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceSummary() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceResources("500") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceCosts("50") }),
        queryClient.invalidateQueries({ queryKey: queryKeys.governanceUsage("50") })
      ]);
    },
    onError: (e) => {
      toast.error("Failed to sync governance sources", { description: (e as Error).message });
    }
  });

  const summaryData = summary.data;

  const handleSearch = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, q: value }),
      replace: true,
    });
  };

  const handleTabChange = (value: string) => {
    navigate({
      search: (prev) => ({ ...prev, tab: value as any }),
      replace: true,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Governance</CardTitle>
              <CardDescription>Admin-only inventory, cost, and usage telemetry.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={sync.isPending || !isAdmin}
              onClick={() => sync.mutate()}
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
              {sync.isPending ? "Syncing…" : "Sync sources"}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {!isAdmin && (
        <Card variant="danger">
          <CardContent className="pt-6">
            <div className="text-center font-medium text-destructive">Admin access required.</div>
          </CardContent>
        </Card>
      )}

      {(summary.isError || resources.isError || costs.isError || usage.isError) && (
        <Card variant="danger">
          <CardContent className="pt-6">
            <div className="text-center font-medium">Failed to load governance data.</div>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid - Always Visible */}
      {summary.isLoading ? (
        <BentoGrid>
          {[1, 2, 3, 4].map((i) => (
            <BentoItem key={i} className="h-32">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-8 w-16" />
            </BentoItem>
          ))}
        </BentoGrid>
      ) : (
        <BentoGrid>
          <BentoStatCard
            title="Resources tracked"
            value={String(summaryData?.resourceCount ?? "—")}
            icon={<Database className="h-5 w-5" />}
            gradient="blue"
          />
          <BentoStatCard
            title="Active resources"
            value={String(summaryData?.activeResources ?? "—")}
            icon={<Activity className="h-5 w-5" />}
            gradient="green"
          />
          <BentoStatCard
            title="Workspaces tracked"
            value={String(summaryData?.workspacesTracked ?? "—")}
            icon={<Layers className="h-5 w-5" />}
            gradient="purple"
          />
          <BentoStatCard
            title="Last 30d spend"
            value={summaryData ? `${summaryData.costLast30Days} ${summaryData.costCurrency}` : "—"}
            icon={<DollarSign className="h-5 w-5" />}
            gradient="orange"
          />
        </BentoGrid>
      )}

      {/* Tabbed Data Views */}
      <Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="resources" className="gap-2">
            <Database className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Financials
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Telemetry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resources" className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Resource Inventory</CardTitle>
                <div className="flex items-center gap-2">
                   <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8 w-full sm:w-[300px]"
                      placeholder="Search resources…"
                      value={q || ""}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                  {!resources.isLoading && (
                    <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                      {filteredResources.length} shown
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {resources.isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : filteredResources.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No resources found"
                  description="No resources match your search criteria."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Workspace</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.slice(0, 500).map((r) => (
                      <TableRow key={r.resourceId}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.provider}</TableCell>
                        <TableCell>{r.resourceType}</TableCell>
                        <TableCell>{r.workspaceName}</TableCell>
                        <TableCell>{r.owner}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === "active" ? "default" : "secondary"}>
                            {r.status ?? "unknown"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle>Cost Snapshots</CardTitle>
              <CardDescription>Historical spend data per provider.</CardDescription>
            </CardHeader>
            <CardContent>
              {costs.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (costs.data?.costs ?? []).length === 0 ? (
                <EmptyState
                  icon={CreditCard}
                  title="No cost data"
                  description="No financial snapshots available."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Period End</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(costs.data?.costs ?? []).slice(0, 50).map((c, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{c.provider}</TableCell>
                        <TableCell>{c.currency}</TableCell>
                        <TableCell>{c.amount}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{c.periodEnd}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle>Usage Telemetry</CardTitle>
              <CardDescription>System usage metrics and limits.</CardDescription>
            </CardHeader>
            <CardContent>
              {usage.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (usage.data?.usage ?? []).length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No usage data"
                  description="No telemetry snapshots available."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Collected At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(usage.data?.usage ?? []).slice(0, 50).map((u, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{u.provider}</TableCell>
                        <TableCell>{u.metric}</TableCell>
                        <TableCell>{u.value}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{u.collectedAt}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}