import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Activity,
	BarChart3,
	Boxes,
	Clock,
	CreditCard,
	Database,
	DollarSign,
	Inbox,
	Layers,
	RefreshCcw,
	Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "../../components/ui/badge";
import {
	BentoGrid,
	BentoItem,
	BentoStatCard,
} from "../../components/ui/bento-grid";
import { Button } from "../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import {
	DataTable,
	type DataTableColumn,
} from "../../components/ui/data-table";
import { EmptyState } from "../../components/ui/empty-state";
import { Input } from "../../components/ui/input";
import { Skeleton } from "../../components/ui/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../components/ui/tabs";
import { queryKeys } from "../../lib/query-keys";
import {
	getGovernancePolicy,
	getGovernanceSummary,
	getSession,
	listGovernanceCosts,
	listGovernanceResources,
	listGovernanceUsage,
	syncGovernanceSources,
	updateGovernancePolicy,
} from "../../lib/skyforge-api";

function formatSeconds(seconds: unknown): string {
	const n = Number(seconds);
	if (!Number.isFinite(n) || n <= 0) return "—";
	if (n < 60) return `${Math.round(n)}s`;
	const mins = Math.round(n / 60);
	if (mins < 60) return `${mins}m`;
	const hours = Math.round(mins / 60);
	if (hours < 48) return `${hours}h`;
	const days = Math.round(hours / 24);
	return `${days}d`;
}

// Search Params Schema
const governanceSearchSchema = z.object({
	q: z.string().optional().catch(""),
	tab: z
		.enum(["policy", "resources", "costs", "usage"])
		.optional()
		.catch("policy"),
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
				queryKey: queryKeys.governancePolicy(),
				queryFn: getGovernancePolicy,
			}),
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
				queryKey: queryKeys.governanceUsage("500"),
				queryFn: () => listGovernanceUsage({ limit: "500" }),
			}),
		]);
	},
	component: GovernancePage,
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
		enabled: isAdmin,
	});
	const policy = useQuery({
		queryKey: queryKeys.governancePolicy(),
		queryFn: getGovernancePolicy,
		staleTime: 30_000,
		enabled: isAdmin,
		retry: false,
	});
	const resources = useQuery({
		queryKey: queryKeys.governanceResources("500"),
		queryFn: () => listGovernanceResources({ limit: "500" }),
		staleTime: 30_000,
		enabled: isAdmin,
	});
	const costs = useQuery({
		queryKey: queryKeys.governanceCosts("50"),
		queryFn: () => listGovernanceCosts({ limit: "50" }),
		staleTime: 30_000,
		enabled: isAdmin,
	});
	const usage = useQuery({
		queryKey: queryKeys.governanceUsage("500"),
		queryFn: () => listGovernanceUsage({ limit: "500" }),
		staleTime: 30_000,
		enabled: isAdmin,
	});

	const usageSnapshots = usage.data?.usage ?? [];
	const clusterUsage = useMemo(() => {
		const byMetric = new Map<
			string,
			NonNullable<typeof usage.data>["usage"][number]
		>();
		for (const snap of usageSnapshots) {
			if (snap.scopeType !== "cluster") continue;
			const metric = String(snap.metric ?? "");
			if (!metric) continue;
			const prev = byMetric.get(metric);
			if (!prev) {
				byMetric.set(metric, snap);
				continue;
			}
			if (
				new Date(String(snap.collectedAt)).getTime() >
				new Date(String(prev.collectedAt)).getTime()
			) {
				byMetric.set(metric, snap);
			}
		}
		return byMetric;
	}, [usageSnapshots]);

	const topUsers = useMemo(() => {
		type Row = {
			user: string;
			deploymentsActive: number;
			deploymentsTotal: number;
			collectorsTotal: number;
			tasksRunning: number;
			lastSeenAt: string;
		};
		const rows = new Map<string, Row>();
		for (const snap of usageSnapshots) {
			if (snap.scopeType !== "user") continue;
			const user = String(snap.scopeId ?? "").trim();
			if (!user) continue;
			const metric = String(snap.metric ?? "").trim();
			if (!metric) continue;
			const value = Number(snap.value ?? 0);
			const collectedAt = String(snap.collectedAt ?? "");
			const row =
				rows.get(user) ??
				({
					user,
					deploymentsActive: 0,
					deploymentsTotal: 0,
					collectorsTotal: 0,
					tasksRunning: 0,
					lastSeenAt: collectedAt,
				} satisfies Row);
			switch (metric) {
				case "deployments.active":
					row.deploymentsActive = value;
					break;
				case "deployments.total":
					row.deploymentsTotal = value;
					break;
				case "collectors.total":
					row.collectorsTotal = value;
					break;
				case "tasks.running":
					row.tasksRunning = value;
					break;
				default:
					break;
			}
			if (
				new Date(collectedAt).getTime() > new Date(row.lastSeenAt).getTime()
			) {
				row.lastSeenAt = collectedAt;
			}
			rows.set(user, row);
		}
		return Array.from(rows.values()).sort((a, b) => {
			if (b.deploymentsActive !== a.deploymentsActive)
				return b.deploymentsActive - a.deploymentsActive;
			if (b.tasksRunning !== a.tasksRunning)
				return b.tasksRunning - a.tasksRunning;
			return a.user.localeCompare(b.user);
		});
	}, [usageSnapshots]);

	const filteredResources = useMemo(() => {
		const list = resources.data?.resources ?? [];
		const query = q?.trim().toLowerCase() || "";
		if (!query) return list;
		return list.filter((r) => {
			const haystack = [
				r.name,
				r.resourceId,
				r.resourceType,
				r.workspaceName,
				r.owner,
				r.provider,
			]
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
			toast.success("Governance sources synced", {
				description: "Resource inventory updated.",
			});
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: queryKeys.governanceSummary(),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.governanceResources("500"),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.governanceCosts("50"),
				}),
				queryClient.invalidateQueries({
					queryKey: queryKeys.governanceUsage("500"),
				}),
			]);
		},
		onError: (e) => {
			toast.error("Failed to sync governance sources", {
				description: (e as Error).message,
			});
		},
	});

	const [policyDraft, setPolicyDraft] = useState({
		maxDeploymentsPerUser: 0,
		maxCollectorsPerUser: 0,
	});
	useEffect(() => {
		if (!policy.data?.policy) return;
		setPolicyDraft({
			maxDeploymentsPerUser: policy.data.policy.maxDeploymentsPerUser ?? 0,
			maxCollectorsPerUser: policy.data.policy.maxCollectorsPerUser ?? 0,
		});
	}, [
		policy.data?.policy?.maxDeploymentsPerUser,
		policy.data?.policy?.maxCollectorsPerUser,
	]);

	const savePolicy = useMutation({
		mutationFn: async () =>
			updateGovernancePolicy({
				policy: {
					maxDeploymentsPerUser: Math.max(0, policyDraft.maxDeploymentsPerUser),
					maxCollectorsPerUser: Math.max(0, policyDraft.maxCollectorsPerUser),
				},
			}),
		onSuccess: async () => {
			toast.success("Governance policy saved");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.governancePolicy(),
			});
		},
		onError: (e) => {
			toast.error("Failed to save governance policy", {
				description: (e as Error).message,
			});
		},
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
							<CardDescription>
								Admin-only guardrails, inventory, cost, and usage telemetry.
							</CardDescription>
						</div>
						<Button
							variant="outline"
							size="sm"
							disabled={sync.isPending || !isAdmin}
							onClick={() => sync.mutate()}
						>
							<RefreshCcw
								className={`mr-2 h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`}
							/>
							{sync.isPending ? "Syncing…" : "Sync sources"}
						</Button>
					</div>
				</CardHeader>
			</Card>

			{!isAdmin && (
				<Card variant="danger">
					<CardContent className="pt-6">
						<div className="text-center font-medium text-destructive">
							Admin access required.
						</div>
					</CardContent>
				</Card>
			)}

			{(policy.isError ||
				summary.isError ||
				resources.isError ||
				costs.isError ||
				usage.isError) && (
				<Card variant="danger">
					<CardContent className="pt-6">
						<div className="text-center font-medium">
							Failed to load governance data.
						</div>
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
						value={
							summaryData
								? `${summaryData.costLast30Days} ${summaryData.costCurrency}`
								: "—"
						}
						icon={<DollarSign className="h-5 w-5" />}
						gradient="orange"
					/>
				</BentoGrid>
			)}

			{/* Tabbed Data Views */}
			<Tabs value={tab} onValueChange={handleTabChange} className="space-y-6">
				<TabsList>
					<TabsTrigger value="policy" className="gap-2">
						<Inbox className="h-4 w-4" />
						Policy
					</TabsTrigger>
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

				<TabsContent value="policy" className="space-y-6 animate-in fade-in-50">
					<Card>
						<CardHeader>
							<CardTitle>Policy</CardTitle>
							<CardDescription>
								Optional guardrails. Use 0 for unlimited.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<div className="text-sm font-medium">
										Max deployments per user
									</div>
									<Input
										inputMode="numeric"
										value={String(policyDraft.maxDeploymentsPerUser)}
										onChange={(e) =>
											setPolicyDraft((prev) => ({
												...prev,
												maxDeploymentsPerUser:
													Number.parseInt(e.target.value || "0", 10) || 0,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Applies when creating new deployment definitions.
									</p>
								</div>
								<div className="space-y-2">
									<div className="text-sm font-medium">
										Max collectors per user
									</div>
									<Input
										inputMode="numeric"
										value={String(policyDraft.maxCollectorsPerUser)}
										onChange={(e) =>
											setPolicyDraft((prev) => ({
												...prev,
												maxCollectorsPerUser:
													Number.parseInt(e.target.value || "0", 10) || 0,
											}))
										}
									/>
									<p className="text-xs text-muted-foreground">
										Applies when creating in-cluster Forward collectors.
									</p>
								</div>
							</div>

							<div className="flex items-center justify-between gap-3">
								<div className="text-xs text-muted-foreground">
									{policy.data?.retrievedAt
										? `Loaded ${policy.data.retrievedAt}`
										: ""}
								</div>
								<Button
									onClick={() => savePolicy.mutate()}
									disabled={savePolicy.isPending || !isAdmin}
								>
									{savePolicy.isPending ? "Saving…" : "Save policy"}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent
					value="resources"
					className="space-y-6 animate-in fade-in-50"
				>
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
												cell: (r) => (
													<span className="font-medium">{r.name}</span>
												),
											},
											{
												id: "provider",
												header: "Provider",
												width: 140,
												cell: (r) => r.provider,
											},
											{
												id: "type",
												header: "Type",
												width: 160,
												cell: (r) => r.resourceType,
											},
											{
												id: "workspace",
												header: "Workspace",
												width: 200,
												cell: (r) => r.workspaceName,
											},
											{
												id: "owner",
												header: "Owner",
												width: 160,
												cell: (r) => r.owner,
											},
											{
												id: "status",
												header: "Status",
												width: 120,
												cell: (r) => (
													<Badge
														variant={
															r.status === "active" ? "default" : "secondary"
														}
													>
														{r.status ?? "unknown"}
													</Badge>
												),
											},
										] satisfies Array<
											DataTableColumn<(typeof filteredResources)[number]>
										>
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
							<CardDescription>
								Historical spend data per provider.
							</CardDescription>
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
												cell: (c) => (
													<span className="font-medium">{c.provider}</span>
												),
											},
											{
												id: "currency",
												header: "Currency",
												width: 120,
												cell: (c) => c.currency,
											},
											{
												id: "amount",
												header: "Amount",
												width: 140,
												cell: (c) => c.amount,
											},
											{
												id: "periodEnd",
												header: "Period End",
												width: 200,
												align: "right",
												cell: (c) => (
													<span className="text-muted-foreground">
														{c.periodEnd}
													</span>
												),
											},
										] satisfies Array<
											DataTableColumn<
												NonNullable<typeof costs.data>["costs"][number]
											>
										>
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
							<CardDescription>
								Lightweight snapshots of cluster load and user activity (no
								Prometheus).
							</CardDescription>
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
								<div className="space-y-6">
									<BentoGrid>
										<BentoStatCard
											title="CPU p95"
											value={
												clusterUsage.get("node.cpu_active.p95")?.value ?? "—"
											}
											subtitle="Last snapshot"
											icon={<Activity className="h-4 w-4" />}
										/>
										<BentoStatCard
											title="Mem p95"
											value={
												clusterUsage.get("node.mem_used.p95")?.value ?? "—"
											}
											subtitle="Last snapshot"
											icon={<Layers className="h-4 w-4" />}
										/>
										<BentoStatCard
											title="Disk p95"
											value={
												clusterUsage.get("node.disk_used.p95")?.value ?? "—"
											}
											subtitle="Last snapshot"
											icon={<Database className="h-4 w-4" />}
										/>
										<BentoStatCard
											title="Active users (24h)"
											value={clusterUsage.get("users.active_24h")?.value ?? "—"}
											subtitle="Distinct users"
											icon={<Inbox className="h-4 w-4" />}
										/>
										<BentoStatCard
											title="Active deployments"
											value={
												clusterUsage.get("deployments.active")?.value ?? "—"
											}
											subtitle="Last snapshot"
											icon={<Activity className="h-4 w-4" />}
											gradient="green"
										/>
										<BentoStatCard
											title="Queued tasks"
											value={clusterUsage.get("tasks.queued")?.value ?? "—"}
											subtitle={`Oldest: ${formatSeconds(
												clusterUsage.get("tasks.oldest_queued_age_seconds")
													?.value,
											)}`}
											icon={<Clock className="h-4 w-4" />}
											gradient="orange"
										/>
										<BentoStatCard
											title="Pods"
											value={clusterUsage.get("k8s.pods.total")?.value ?? "—"}
											subtitle={`Pending: ${
												clusterUsage.get("k8s.pods.pending")?.value ?? "—"
											}`}
											icon={<Boxes className="h-4 w-4" />}
											gradient="purple"
										/>
										<BentoStatCard
											title="Workspace pods"
											value={
												clusterUsage.get("k8s.pods.ws.total")?.value ?? "—"
											}
											subtitle={`Pending: ${
												clusterUsage.get("k8s.pods.ws.pending")?.value ?? "—"
											}`}
											icon={<Boxes className="h-4 w-4" />}
											gradient="purple"
										/>
										<BentoStatCard
											title="Workspace namespaces"
											value={
												clusterUsage.get("k8s.namespaces.ws")?.value ?? "—"
											}
											subtitle={`All namespaces: ${
												clusterUsage.get("k8s.namespaces.total")?.value ?? "—"
											}`}
											icon={<Boxes className="h-4 w-4" />}
											gradient="purple"
										/>
									</BentoGrid>

									<Card variant="glass">
										<CardHeader>
											<CardTitle className="text-base">Top Users</CardTitle>
											<CardDescription>
												Latest per-user activity snapshots (sorted by active
												deployments).
											</CardDescription>
										</CardHeader>
										<CardContent>
											{topUsers.length === 0 ? (
												<EmptyState
													icon={BarChart3}
													title="No user activity"
													description="No per-user snapshots available yet."
												/>
											) : (
												<DataTable
													columns={
														[
															{
																id: "user",
																header: "User",
																width: 240,
																cell: (r) => (
																	<span className="font-medium">{r.user}</span>
																),
															},
															{
																id: "deploymentsActive",
																header: "Active Deployments",
																width: 180,
																cell: (r) => r.deploymentsActive,
															},
															{
																id: "tasksRunning",
																header: "Running Tasks",
																width: 160,
																cell: (r) => r.tasksRunning,
															},
															{
																id: "collectorsTotal",
																header: "Collectors",
																width: 140,
																cell: (r) => r.collectorsTotal,
															},
															{
																id: "deploymentsTotal",
																header: "Total Deployments",
																width: 170,
																cell: (r) => r.deploymentsTotal,
															},
															{
																id: "lastSeenAt",
																header: "Last Updated",
																align: "right",
																width: 220,
																cell: (r) => (
																	<span className="text-muted-foreground">
																		{r.lastSeenAt}
																	</span>
																),
															},
														] satisfies Array<
															DataTableColumn<(typeof topUsers)[number]>
														>
													}
													rows={topUsers.slice(0, 50)}
													getRowId={(r) => r.user}
													maxHeightClassName="max-h-[45vh]"
													minWidthClassName="min-w-[1000px]"
												/>
											)}
										</CardContent>
									</Card>

									<Card variant="glass">
										<CardHeader>
											<CardTitle className="text-base">Raw Snapshots</CardTitle>
											<CardDescription>
												Most recent usage snapshot records (for debugging).
											</CardDescription>
										</CardHeader>
										<CardContent>
											<DataTable
												columns={
													[
														{
															id: "scope",
															header: "Scope",
															width: 180,
															cell: (u) =>
																u.scopeType === "user"
																	? `user:${u.scopeId ?? ""}`
																	: u.scopeType,
														},
														{
															id: "metric",
															header: "Metric",
															cell: (u) => u.metric,
														},
														{
															id: "value",
															header: "Value",
															width: 160,
															cell: (u) =>
																typeof u.value === "number"
																	? u.value
																	: String(u.value),
														},
														{
															id: "collectedAt",
															header: "Collected At",
															width: 220,
															align: "right",
															cell: (u) => (
																<span className="text-muted-foreground">
																	{u.collectedAt}
																</span>
															),
														},
													] satisfies Array<
														DataTableColumn<
															NonNullable<typeof usage.data>["usage"][number]
														>
													>
												}
												rows={(usage.data?.usage ?? []).slice(0, 200)}
												getRowId={(u) =>
													`${u.provider}:${u.scopeType}:${u.scopeId ?? ""}:${u.metric}:${u.collectedAt}`
												}
												maxHeightClassName="max-h-[50vh]"
												minWidthClassName="min-w-[900px]"
											/>
										</CardContent>
									</Card>
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
