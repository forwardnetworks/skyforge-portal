import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Shield, UserCog, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../components/ui/badge";
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
	type AdminAuditResponse,
	adminImpersonateStart,
	adminImpersonateStop,
	adminPurgeUser,
	getAdminAudit,
	getAdminEffectiveConfig,
	getAdminImpersonateStatus,
	getSession,
	reconcileQueuedTasks,
	reconcileRunningTasks,
} from "../../lib/skyforge-api";

export const Route = createFileRoute("/admin/settings")({
	component: AdminSettingsPage,
});

function AdminSettingsPage() {
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const isAdmin = !!sessionQ.data?.isAdmin;

	const [auditLimit, setAuditLimit] = useState("200");
	const auditQ = useQuery({
		queryKey: queryKeys.adminAudit(auditLimit),
		queryFn: () => getAdminAudit({ limit: auditLimit }),
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});

	const cfgQ = useQuery({
		queryKey: queryKeys.adminConfig(),
		queryFn: getAdminEffectiveConfig,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});

	const impersonateStatusQ = useQuery({
		queryKey: queryKeys.adminImpersonateStatus(),
		queryFn: getAdminImpersonateStatus,
		enabled: isAdmin,
		staleTime: 5_000,
		retry: false,
	});

	const reconcileQueued = useMutation({
		mutationFn: async (limit: number) => reconcileQueuedTasks({ limit }),
		onSuccess: (res) => {
			toast.success("Reconciled queued tasks", {
				description: `Considered ${res.consideredTasks}, republished ${res.republished}, errors ${res.publishErrors}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to reconcile queued tasks", {
				description: (e as Error).message,
			});
		},
	});

	const reconcileRunning = useMutation({
		mutationFn: async (body: {
			limit: number;
			hardMaxRuntimeMinutes: number;
			maxIdleMinutes: number;
		}) =>
			reconcileRunningTasks({
				limit: body.limit,
				hardMaxRuntimeMinutes: body.hardMaxRuntimeMinutes,
				maxIdleMinutes: body.maxIdleMinutes,
			}),
		onSuccess: (res) => {
			toast.success("Reconciled running tasks", {
				description: `Considered ${res.consideredTasks}, marked failed ${res.markedFailed}, errors ${res.finishErrors}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to reconcile running tasks", {
				description: (e as Error).message,
			});
		},
	});

	const [impersonateTarget, setImpersonateTarget] = useState("");
	const impersonateStart = useMutation({
		mutationFn: async () =>
			adminImpersonateStart({ username: impersonateTarget }),
		onSuccess: () => {
			toast.success("Impersonation started");
			void impersonateStatusQ.refetch();
			// The impersonation cookie is set by the API response; refresh to load the new session.
			window.location.reload();
		},
		onError: (e) => {
			toast.error("Failed to impersonate", {
				description: (e as Error).message,
			});
		},
	});

	const impersonateStop = useMutation({
		mutationFn: async () => adminImpersonateStop(),
		onSuccess: () => {
			toast.success("Impersonation stopped");
			void impersonateStatusQ.refetch();
			window.location.reload();
		},
		onError: (e) => {
			toast.error("Failed to stop impersonation", {
				description: (e as Error).message,
			});
		},
	});

	const [purgeUsername, setPurgeUsername] = useState("");
	const purgeUser = useMutation({
		mutationFn: async () =>
			adminPurgeUser({ username: purgeUsername, confirm: purgeUsername }),
		onSuccess: (res) => {
			toast.success("User purged", {
				description: `Deleted personal resources: ${res.deletedOwners}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to purge user", {
				description: (e as Error).message,
			});
		},
	});

	const auditColumns = useMemo<
		DataTableColumn<AdminAuditResponse["events"][number]>[]
	>(
		() => [
			{
				id: "createdAt",
				header: "Time",
				cell: (r) => (
					<span className="font-mono text-xs text-muted-foreground">
						{r.createdAt}
					</span>
				),
				width: 220,
			},
			{
				id: "actor",
				header: "Actor",
				cell: (r) => (
					<div className="flex items-center gap-2">
						<span className="font-medium">{r.actorUsername}</span>
						{r.actorIsAdmin ? <Badge variant="secondary">admin</Badge> : null}
						{r.impersonatedUsername ? (
							<Badge variant="outline">as {r.impersonatedUsername}</Badge>
						) : null}
					</div>
				),
				width: 260,
			},
			{ id: "action", header: "Action", cell: (r) => r.action, width: 260 },
			{
				id: "ownerUsername",
				header: "Context",
				cell: (r) => (
					<span className="font-mono text-xs text-muted-foreground">
						{r.ownerUsername}
					</span>
				),
				width: 220,
			},
			{
				id: "details",
				header: "Details",
				cell: (r) => (
					<span className="text-xs text-muted-foreground">{r.details}</span>
				),
			},
		],
		[],
	);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>System settings</CardTitle>
					<CardDescription>Admin-only settings for Skyforge.</CardDescription>
				</CardHeader>
			</Card>

			{!isAdmin && (
				<Card variant="danger">
					<CardContent className="pt-6">
						<div className="text-center font-medium">
							Admin access required.
						</div>
					</CardContent>
				</Card>
			)}

			{isAdmin && (
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="audit">Audit</TabsTrigger>
						<TabsTrigger value="tasks">Tasks</TabsTrigger>
						<TabsTrigger value="users">Users</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Effective config</CardTitle>
								<CardDescription>
									Read-only view of the running server's non-secret Encore
									config.
								</CardDescription>
							</CardHeader>
							<CardContent>
								{cfgQ.isLoading ? (
									<Skeleton className="h-40 w-full" />
								) : cfgQ.data ? (
									<div className="space-y-3">
										{cfgQ.data.missing?.length ? (
											<div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
												<div className="font-medium">Missing config</div>
												<ul className="list-disc pl-5 text-muted-foreground">
													{cfgQ.data.missing.map((m) => (
														<li key={m}>{m}</li>
													))}
												</ul>
											</div>
										) : null}
										<pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/50 p-3 text-xs">
											{JSON.stringify(cfgQ.data, null, 2)}
										</pre>
									</div>
								) : (
									<EmptyState
										title="No config"
										description="Could not load effective config."
									/>
								)}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Impersonation</CardTitle>
								<CardDescription>
									Impersonate another user to reproduce issues or verify UX.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center gap-3">
									<Shield className="h-5 w-5 text-muted-foreground" />
									<div className="text-sm">
										<span className="font-medium">
											{impersonateStatusQ.data?.actorUsername ||
												sessionQ.data?.username ||
												"—"}
										</span>
										{impersonateStatusQ.data?.impersonating ? (
											<>
												{" "}
												→{" "}
												<span className="font-medium">
													{impersonateStatusQ.data.effectiveUsername}
												</span>
												<Badge className="ml-2" variant="secondary">
													impersonating
												</Badge>
											</>
										) : (
											<Badge className="ml-2" variant="outline">
												not impersonating
											</Badge>
										)}
									</div>
								</div>

								<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
									<Input
										placeholder="user@example.com"
										value={impersonateTarget}
										onChange={(e) => setImpersonateTarget(e.target.value)}
									/>
									<Button
										onClick={() => impersonateStart.mutate()}
										disabled={
											impersonateStart.isPending ||
											!impersonateTarget.trim() ||
											impersonateStatusQ.data?.impersonating
										}
									>
										<UserCog className="mr-2 h-4 w-4" />
										Impersonate
									</Button>
									<Button
										variant="outline"
										onClick={() => impersonateStop.mutate()}
										disabled={
											impersonateStop.isPending ||
											!impersonateStatusQ.data?.impersonating
										}
									>
										Stop
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="audit" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Audit log</CardTitle>
								<CardDescription>
									Recent admin and user actions.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div className="flex items-center gap-2">
										<span className="text-sm text-muted-foreground">Limit</span>
										<Input
											className="w-28"
											value={auditLimit}
											onChange={(e) => setAuditLimit(e.target.value)}
										/>
									</div>
									<Badge variant="outline">
										{auditQ.data?.timestamp ?? "—"}
									</Badge>
								</div>
								<DataTable
									rows={auditQ.data?.events ?? []}
									columns={auditColumns}
									getRowId={(row) => String(row.id)}
									isLoading={auditQ.isLoading}
									emptyText="No audit events."
									minWidthClassName="min-w-[1100px]"
								/>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="tasks" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Task reconciliation</CardTitle>
								<CardDescription>
									Manual guardrails for stuck queued/running jobs.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div className="font-medium">Queued tasks</div>
										<div className="text-sm text-muted-foreground">
											Republish missing queue events.
										</div>
									</div>
									<Button
										variant="outline"
										disabled={reconcileQueued.isPending}
										onClick={() => reconcileQueued.mutate(200)}
									>
										{reconcileQueued.isPending
											? "Running…"
											: "Reconcile queued"}
									</Button>
								</div>

								<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div className="font-medium">Running tasks</div>
										<div className="text-sm text-muted-foreground">
											Mark long-running/no-log tasks failed.
										</div>
									</div>
									<Button
										variant="outline"
										disabled={reconcileRunning.isPending}
										onClick={() =>
											reconcileRunning.mutate({
												limit: 50,
												hardMaxRuntimeMinutes: 12 * 60,
												maxIdleMinutes: 120,
											})
										}
									>
										{reconcileRunning.isPending
											? "Running…"
											: "Reconcile running"}
									</Button>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="users" className="space-y-6">
						<Card variant="danger">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Purge user (dev-only)
								</CardTitle>
								<CardDescription>
									Removes user state and associated personal resources to rerun
									first-login bootstrap.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Input
									placeholder="user@example.com"
									value={purgeUsername}
									onChange={(e) => setPurgeUsername(e.target.value)}
								/>
								<Button
									variant="destructive"
									disabled={!purgeUsername.trim() || purgeUser.isPending}
									onClick={() => purgeUser.mutate()}
								>
									{purgeUser.isPending ? "Purging…" : "Purge user"}
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			)}
		</div>
	);
}
