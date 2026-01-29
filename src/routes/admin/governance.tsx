import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Database, DollarSign, Layers, RefreshCcw, Search, Inbox, CreditCard, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  getSession,
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
import { Badge } from "../../components/ui/badge";
import { BentoGrid, BentoStatCard, BentoItem } from "../../components/ui/bento-grid";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { DataTable, type DataTableColumn } from "../../components/ui/data-table";

// Search Params Schema
const governanceSearchSchema = z.object({
  q: z.string().optional().catch(""),
  tab: z.enum(["resources", "costs", "usage"]).optional().catch("resources"),
});

export const Route = createFileRoute("/admin/governance")({
  validateSearch: (search) => governanceSearchSchema.parse(search),
  loaderDeps: ({ search: { q, tab } }) => ({ q, tab }),
  loader: async ({ context: { queryClient } }) => {
    const session = await queryClient.ensureQueryData({
      queryKey: queryKeys.session(),
      queryFn: getSession,
      staleTime: 30_000,
      retry: false,
    });
    if (!session?.isAdmin) return;

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
  
  const sessionQ = useQuery({
    queryKey: queryKeys.session(),
    queryFn: getSession,
    staleTime: 30_000,
    retry: false,
  });
  const isAdmin = !!sessionQ.data?.isAdmin;

  const summary = useQuery({
    queryKey: queryKeys.governanceSummary(),
    queryFn: getGovernanceSummary,
    staleTime: 30_000,
    enabled: isAdmin
  });
  const resources = useQuery({
    queryKey: queryKeys.governanceResources("500"),
    queryFn: () => listGovernanceResources({ limit: "500" }),
    staleTime: 30_000,
    enabled: isAdmin
  });
  const costs = useQuery({
    queryKey: queryKeys.governanceCosts("50"),
    queryFn: () => listGovernanceCosts({ limit: "50" }),
    staleTime: 30_000,
    enabled: isAdmin
  });
  const usage = useQuery({
    queryKey: queryKeys.governanceUsage("50"),
    queryFn: () => listGovernanceUsage({ limit: "50" }),
    staleTime: 30_000,
    enabled: isAdmin
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
                <DataTable
                  columns={
                    [
                      {
                        id: "name",
                        header: "Name",
                        width: "minmax(220px, 1fr)",
                        cell: (r) => <span className="font-medium">{r.name}</span>
                      },
                      { id: "provider", header: "Provider", width: 140, cell: (r) => r.provider },
                      { id: "type", header: "Type", width: 160, cell: (r) => r.resourceType },
                      { id: "workspace", header: "Workspace", width: 200, cell: (r) => r.workspaceName },
                      { id: "owner", header: "Owner", width: 160, cell: (r) => r.owner },
                      {
                        id: "status",
                        header: "Status",
                        width: 120,
                        cell: (r) => (
                          <Badge variant={r.status === "active" ? "default" : "secondary"}>
                            {r.status ?? "unknown"}
                          </Badge>
                        )
                      }
                    ] satisfies Array<DataTableColumn<(typeof filteredResources)[number]>>
                  }
                  rows={filteredResources.slice(0, 500)}
                  getRowId={(r) => String(r.resourceId)}
                  maxHeightClassName="max-h-[60vh]"
                  minWidthClassName="min-w-[1100px]"
                />
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
                <DataTable
                  columns={
                    [
                      {
                        id: "provider",
                        header: "Provider",
                        width: 180,
                        cell: (c) => <span className="font-medium">{c.provider}</span>
                      },
                      { id: "currency", header: "Currency", width: 120, cell: (c) => c.currency },
                      { id: "amount", header: "Amount", width: 140, cell: (c) => c.amount },
                      {
                        id: "periodEnd",
                        header: "Period End",
                        width: 200,
                        align: "right",
                        cell: (c) => (
                          <span className="text-muted-foreground">{c.periodEnd}</span>
                        )
                      }
                    ] satisfies Array<DataTableColumn<(NonNullable<typeof costs.data>["costs"])[number]>>
                  }
                  rows={(costs.data?.costs ?? []).slice(0, 50)}
                  getRowId={(c) => `${c.provider}:${c.periodEnd}:${c.amount}`}
                  maxHeightClassName="max-h-[50vh]"
                  minWidthClassName="min-w-[900px]"
                />
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
                <DataTable
                  columns={
                    [
                      {
                        id: "provider",
                        header: "Provider",
                        width: 180,
                        cell: (u) => <span className="font-medium">{u.provider}</span>
                      },
                      { id: "metric", header: "Metric", cell: (u) => u.metric },
                      { id: "value", header: "Value", width: 200, cell: (u) => u.value },
                      {
                        id: "collectedAt",
                        header: "Collected At",
                        width: 220,
                        align: "right",
                        cell: (u) => (
                          <span className="text-muted-foreground">{u.collectedAt}</span>
                        )
                      }
                    ] satisfies Array<DataTableColumn<(NonNullable<typeof usage.data>["usage"])[number]>>
                  }
                  rows={(usage.data?.usage ?? []).slice(0, 50)}
                  getRowId={(u) => `${u.provider}:${u.metric}:${u.collectedAt}`}
                  maxHeightClassName="max-h-[50vh]"
                  minWidthClassName="min-w-[900px]"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
