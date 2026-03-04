import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Shield, Trash2, UserCog, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../components/ui/select";
import {
	type AdminWorkspacePodCleanupResponse,
	type AdminAuditResponse,
	type QuickDeployTemplate,
	adminCleanupWorkspacePods,
	adminImpersonateStart,
	adminImpersonateStop,
	adminPurgeUser,
	getAdminAudit,
	getAdminEffectiveConfig,
	getAdminImpersonateStatus,
	getAdminQuickDeployCatalog,
	getAdminQuickDeployTemplateOptions,
	getGovernancePolicy,
	getSession,
	getUserScopeNetlabTemplates,
	listUserScopes,
	reconcileQueuedTasks,
	reconcileRunningTasks,
	updateAdminQuickDeployCatalog,
	updateGovernancePolicy,
} from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/admin/settings")({
	component: AdminSettingsPage,
});

function quickDeployTemplateIdFromPath(path: string): string {
	return path
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function quickDeployTemplateNameFromPath(path: string): string {
	const normalized = path
		.trim()
		.replace(/\/topology\.ya?ml$/i, "")
		.split("/")
		.filter((part) => part.length > 0);
	if (normalized.length === 0) {
		return "Template";
	}
	const last = normalized.slice(-2).join(" / ");
	return last.replace(/[-_]/g, " ");
}

function AdminSettingsPage() {
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const isAdmin = !!sessionQ.data?.isAdmin;
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		enabled: isAdmin,
		staleTime: 30_000,
		retry: false,
	});
	const allUserScopes = userScopesQ.data ?? [];
	const adminScopeID = useMemo(() => {
		if (allUserScopes.length === 0) return "";
		if (!effectiveUsername) return allUserScopes[0]?.id ?? "";
		const mine = allUserScopes.filter((scope) => {
			if (String(scope.createdBy ?? "").trim() === effectiveUsername) return true;
			if ((scope.owners ?? []).includes(effectiveUsername)) return true;
			if (String(scope.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return (mine[0]?.id ?? allUserScopes[0]?.id ?? "").trim();
	}, [allUserScopes, effectiveUsername]);

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
	const governancePolicyQ = useQuery({
		queryKey: queryKeys.governancePolicy(),
		queryFn: getGovernancePolicy,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const quickDeployCatalogQ = useQuery({
		queryKey: queryKeys.adminQuickDeployCatalog(),
		queryFn: getAdminQuickDeployCatalog,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const quickDeployTemplateOptionsQ = useQuery({
		queryKey: ["adminQuickDeployTemplateOptions"],
		queryFn: getAdminQuickDeployTemplateOptions,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const blueprintNetlabTemplatesQ = useQuery({
		queryKey: queryKeys.userTemplates(
			adminScopeID || "none",
			"netlab",
			"blueprints",
			"",
			"netlab",
		),
		queryFn: () =>
			getUserScopeNetlabTemplates(adminScopeID, {
				source: "blueprints",
				dir: "netlab",
			}),
		enabled: isAdmin && adminScopeID.length > 0,
		staleTime: 15_000,
		retry: false,
	});
	const [blockedOrgIdsCsv, setBlockedOrgIdsCsv] = useState("");
	const [quickDeployTemplates, setQuickDeployTemplates] = useState<
		QuickDeployTemplate[]
	>([]);
	const [selectedQuickDeployOption, setSelectedQuickDeployOption] = useState("");
	useEffect(() => {
		if (!quickDeployCatalogQ.data?.templates) {
			return;
		}
		setQuickDeployTemplates(
			quickDeployCatalogQ.data.templates.map((item) => ({
				id: item.id,
				name: item.name,
				description: item.description,
				template: item.template,
			})),
		);
	}, [quickDeployCatalogQ.data?.templates]);
	const saveForwardBlacklist = useMutation({
		mutationFn: async () => {
			const currentPolicy = governancePolicyQ.data?.policy;
			if (!currentPolicy) {
				throw new Error("governance policy not loaded");
			}
			const ids = blockedOrgIdsCsv
				.split(",")
				.map((v) => v.trim())
				.filter((v) => v.length > 0);
			return updateGovernancePolicy({
				policy: {
					...currentPolicy,
					blockedForwardOrgIds: ids,
				},
			});
		},
		onSuccess: async () => {
			toast.success("Forward org blacklist saved");
			await governancePolicyQ.refetch();
		},
		onError: (e) => {
			toast.error("Failed to save Forward org blacklist", {
				description: (e as Error).message,
			});
		},
	});
	const saveQuickDeployCatalog = useMutation({
		mutationFn: async () =>
			updateAdminQuickDeployCatalog({
				templates: quickDeployTemplates,
			}),
		onSuccess: async () => {
			toast.success("Quick deploy catalog saved");
			await quickDeployCatalogQ.refetch();
		},
		onError: (e) => {
			toast.error("Failed to save quick deploy catalog", {
				description: (e as Error).message,
			});
		},
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
	const [cleanupScopeMode, setCleanupScopeMode] = useState<"all" | "scope">(
		"all",
	);
	const [cleanupScopeID, setCleanupScopeID] = useState("");
	const [cleanupNamespace, setCleanupNamespace] = useState("");
	const [cleanupResult, setCleanupResult] =
		useState<AdminWorkspacePodCleanupResponse | null>(null);
	const cleanupWorkspacePods = useMutation({
		mutationFn: async (dryRun: boolean) =>
			adminCleanupWorkspacePods({
				dryRun,
				userScopeId:
					cleanupScopeMode === "scope" ? cleanupScopeID.trim() : undefined,
				namespace: cleanupNamespace.trim() || undefined,
			}),
		onSuccess: (res, dryRun) => {
			setCleanupResult(res);
			toast.success(dryRun ? "Pod cleanup preview complete" : "Pod cleanup complete", {
				description: `Namespaces ${res.namespacesConsidered}, owners ${res.topologyOwnersFound}, deleted topologies ${res.topologiesDeleted}`,
			});
		},
		onError: (e) => {
			toast.error("Failed to clean workspace pods", {
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
	const [purgeUserQuery, setPurgeUserQuery] = useState("");
	const purgeUserOptions = useMemo(() => {
		const users = new Set<string>();
		for (const scope of allUserScopes) {
			const createdBy = String(scope.createdBy ?? "").trim();
			if (createdBy) users.add(createdBy);
			for (const owner of scope.owners ?? []) {
				const value = String(owner ?? "").trim();
				if (value) users.add(value);
			}
			for (const editor of scope.editors ?? []) {
				const value = String(editor ?? "").trim();
				if (value) users.add(value);
			}
			for (const viewer of scope.viewers ?? []) {
				const value = String(viewer ?? "").trim();
				if (value) users.add(value);
			}
		}
		return Array.from(users).sort((a, b) => a.localeCompare(b));
	}, [allUserScopes]);
	const filteredPurgeUserOptions = useMemo(() => {
		const query = purgeUserQuery.trim().toLowerCase();
		if (!query) return purgeUserOptions;
		return purgeUserOptions.filter((username) =>
			username.toLowerCase().includes(query),
		);
	}, [purgeUserOptions, purgeUserQuery]);
	const purgeUser = useMutation({
		mutationFn: async () =>
			adminPurgeUser({ username: purgeUsername, confirm: purgeUsername }),
		onSuccess: (res) => {
			toast.success("User purged", {
				description: `Deleted user scopes: ${res.deletedUserScopes}`,
			});
			setPurgeUsername("");
			setPurgeUserQuery("");
			void userScopesQ.refetch();
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
				id: "userId",
				header: "User Scope",
				cell: (r) => (
					<span className="font-mono text-xs text-muted-foreground">
						{r.userId}
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
	const blockedOrgIdsDisplay = useMemo(() => {
		if (blockedOrgIdsCsv.trim()) {
			return blockedOrgIdsCsv;
		}
		const ids = governancePolicyQ.data?.policy?.blockedForwardOrgIds ?? [];
		return ids.join(",");
	}, [blockedOrgIdsCsv, governancePolicyQ.data?.policy?.blockedForwardOrgIds]);
	const upsertQuickDeployTemplateField = (
		index: number,
		field: keyof QuickDeployTemplate,
		value: string,
	) => {
		setQuickDeployTemplates((prev) =>
			prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
		);
	};
	const removeQuickDeployTemplate = (index: number) => {
		setQuickDeployTemplates((prev) => prev.filter((_, i) => i !== index));
	};
	const addQuickDeployTemplate = () => {
		setQuickDeployTemplates((prev) => [
			...prev,
			{ id: "", name: "", description: "", template: "" },
		]);
	};
	const availableQuickDeployTemplates = useMemo(() => {
		const fromAdminOptions = quickDeployTemplateOptionsQ.data?.templates ?? [];
		const fromScopeCatalog = blueprintNetlabTemplatesQ.data?.templates ?? [];
		const merged = new Set<string>();
		for (const item of [...fromAdminOptions, ...fromScopeCatalog]) {
			const path = String(item ?? "").trim();
			if (!path) continue;
			merged.add(path);
		}
		return Array.from(merged).sort((a, b) => a.localeCompare(b));
	}, [quickDeployTemplateOptionsQ.data?.templates, blueprintNetlabTemplatesQ.data?.templates]);
	const addQuickDeployTemplateFromOption = () => {
		const template = selectedQuickDeployOption.trim();
		if (!template) return;
		const exists = quickDeployTemplates.some(
			(item) => item.template.trim().toLowerCase() === template.toLowerCase(),
		);
		if (exists) {
			toast.message("Template already in catalog", { description: template });
			return;
		}
		const name = quickDeployTemplateNameFromPath(template);
		const id = quickDeployTemplateIdFromPath(template);
		setQuickDeployTemplates((prev) => [
			...prev,
			{
				id,
				name,
				description: `Blueprint topology: ${template}`,
				template,
			},
		]);
		setSelectedQuickDeployOption("");
	};
	const hasQuickDeployTemplateRows =
		quickDeployTemplates.filter((item) => item.template.trim().length > 0)
			.length > 0;

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

						<Card>
							<CardHeader>
								<CardTitle>Forward org blacklist</CardTitle>
								<CardDescription>
									Block collector creation for specific Forward org IDs.
									Credentials can still be saved; admin users are exempt.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Input
									placeholder="1499,1744"
									value={blockedOrgIdsDisplay}
									onChange={(e) => setBlockedOrgIdsCsv(e.target.value)}
								/>
								<div className="text-xs text-muted-foreground">
									Comma-separated org IDs from Forward.
								</div>
								<Button
									onClick={() => saveForwardBlacklist.mutate()}
									disabled={
										saveForwardBlacklist.isPending ||
										governancePolicyQ.isLoading ||
										!governancePolicyQ.data?.policy
									}
								>
									{saveForwardBlacklist.isPending
										? "Saving…"
										: "Save blacklist"}
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Quick Deploy Catalog</CardTitle>
								<CardDescription>
									Curate the one-click Quick Deploy cards shown to users. Focus
									these entries on stable, high-value demo topologies.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-xs text-muted-foreground">
									Source: {quickDeployCatalogQ.data?.source ?? "default"}
								</div>
								<div className="text-xs text-muted-foreground">
									Blueprint repo:{" "}
									{quickDeployTemplateOptionsQ.data?.repo ??
										quickDeployCatalogQ.data?.repo ??
										"skyforge/blueprints"}{" "}
									@{" "}
									{quickDeployTemplateOptionsQ.data?.branch ??
										quickDeployCatalogQ.data?.branch ??
										"main"}{" "}
									(dir:{" "}
									{quickDeployTemplateOptionsQ.data?.dir ??
										quickDeployCatalogQ.data?.dir ??
										"netlab"}
									)
								</div>
								<div className="grid gap-2 md:grid-cols-[1fr_auto]">
									<Select
										value={selectedQuickDeployOption}
										onValueChange={setSelectedQuickDeployOption}
									>
										<SelectTrigger>
											<SelectValue placeholder="Pick a blueprint template from index…" />
										</SelectTrigger>
										<SelectContent>
											{availableQuickDeployTemplates.map((path) => (
												<SelectItem key={path} value={path}>
													{path}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										variant="outline"
										onClick={addQuickDeployTemplateFromOption}
										disabled={
											saveQuickDeployCatalog.isPending ||
											!selectedQuickDeployOption.trim()
										}
									>
										<Plus className="mr-2 h-4 w-4" />
										Add from index
									</Button>
								</div>
								{blueprintNetlabTemplatesQ.isError ||
								quickDeployTemplateOptionsQ.isError ? (
									<div className="text-xs text-amber-600">
										Template index lookup failed. You can still edit manually,
										but save will validate paths server-side.
									</div>
								) : null}
								<div className="space-y-3">
									{quickDeployTemplates.map((item, index) => (
										<div
											key={`${item.id}-${item.template}-${index}`}
											className="rounded-md border p-3"
										>
											<div className="grid gap-2 md:grid-cols-2">
												<Input
													placeholder="Card name"
													value={item.name}
													onChange={(e) =>
														upsertQuickDeployTemplateField(
															index,
															"name",
															e.target.value,
														)
													}
												/>
												<Input
													placeholder="ID (optional)"
													value={item.id ?? ""}
													onChange={(e) =>
														upsertQuickDeployTemplateField(
															index,
															"id",
															e.target.value,
														)
													}
												/>
											</div>
											<Input
												className="mt-2"
												list="quick-deploy-template-options"
												placeholder="Template path (for example: EVPN/ebgp/topology.yml)"
												value={item.template}
												onChange={(e) =>
													upsertQuickDeployTemplateField(
														index,
														"template",
														e.target.value,
													)
												}
											/>
											<Input
												className="mt-2"
												placeholder="Description"
												value={item.description ?? ""}
												onChange={(e) =>
													upsertQuickDeployTemplateField(
														index,
														"description",
														e.target.value,
													)
												}
											/>
											<div className="mt-2 flex justify-end">
												<Button
													size="sm"
													variant="outline"
													onClick={() => removeQuickDeployTemplate(index)}
													disabled={saveQuickDeployCatalog.isPending}
												>
													<Trash2 className="mr-2 h-4 w-4" />
													Remove
												</Button>
											</div>
										</div>
									))}
								</div>
								<datalist id="quick-deploy-template-options">
									{availableQuickDeployTemplates.map((path) => (
										<option key={path} value={path} />
									))}
								</datalist>
								<div className="flex flex-wrap items-center gap-2">
									<Button
										variant="outline"
										onClick={addQuickDeployTemplate}
										disabled={saveQuickDeployCatalog.isPending}
									>
										<Plus className="mr-2 h-4 w-4" />
										Add entry
									</Button>
									<Button
										onClick={() => saveQuickDeployCatalog.mutate()}
										disabled={
											saveQuickDeployCatalog.isPending ||
											quickDeployCatalogQ.isLoading ||
											!hasQuickDeployTemplateRows
										}
									>
										{saveQuickDeployCatalog.isPending
											? "Saving…"
											: "Save catalog"}
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

								<div className="space-y-3 rounded-md border p-3">
									<div>
										<div className="font-medium">Workspace pod cleanup</div>
										<div className="text-sm text-muted-foreground">
											Force-clean clabernetes topology pods/resources when
											deployment deletion leaves stragglers.
										</div>
									</div>
									<div className="grid gap-2 md:grid-cols-2">
										<Select
											value={cleanupScopeMode}
											onValueChange={(v) =>
												setCleanupScopeMode(v === "scope" ? "scope" : "all")
											}
										>
											<SelectTrigger>
												<SelectValue placeholder="Scope mode" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All user scopes</SelectItem>
												<SelectItem value="scope">
													Single user scope
												</SelectItem>
											</SelectContent>
										</Select>
										{cleanupScopeMode === "scope" ? (
											<Select
												value={cleanupScopeID}
												onValueChange={setCleanupScopeID}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select user scope…" />
												</SelectTrigger>
												<SelectContent>
													{allUserScopes.map((scope) => (
														<SelectItem key={scope.id} value={scope.id}>
															{scope.slug} ({scope.createdBy})
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										) : (
											<Input
												placeholder="Optional namespace override (ws-...)"
												value={cleanupNamespace}
												onChange={(e) => setCleanupNamespace(e.target.value)}
											/>
										)}
									</div>
									<div className="flex flex-wrap gap-2">
										<Button
											variant="outline"
											disabled={
												cleanupWorkspacePods.isPending ||
												(cleanupScopeMode === "scope" &&
													!cleanupScopeID.trim())
											}
											onClick={() => cleanupWorkspacePods.mutate(true)}
										>
											Preview cleanup
										</Button>
										<Button
											variant="destructive"
											disabled={
												cleanupWorkspacePods.isPending ||
												(cleanupScopeMode === "scope" &&
													!cleanupScopeID.trim())
											}
											onClick={() => cleanupWorkspacePods.mutate(false)}
										>
											{cleanupWorkspacePods.isPending
												? "Running…"
												: "Run cleanup"}
										</Button>
									</div>
									{cleanupResult ? (
										<div className="rounded-md border bg-muted/40 p-3 text-xs">
											<div>
												namespaces={cleanupResult.namespacesConsidered} owners=
												{cleanupResult.topologyOwnersFound} topologies=
												{cleanupResult.topologiesFound} deleted=
												{cleanupResult.topologiesDeleted}
											</div>
											{cleanupResult.errors?.length ? (
												<div className="mt-2 text-amber-600">
													{cleanupResult.errors.join(" | ")}
												</div>
											) : null}
										</div>
									) : null}
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
									Removes user state and associated user scopes to rerun
									first-login bootstrap.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								<Input
									placeholder="Filter users…"
									value={purgeUserQuery}
									onChange={(e) => setPurgeUserQuery(e.target.value)}
								/>
								<Select value={purgeUsername} onValueChange={setPurgeUsername}>
									<SelectTrigger>
										<SelectValue placeholder="Select user…" />
									</SelectTrigger>
									<SelectContent>
										{filteredPurgeUserOptions.length > 0 ? (
											filteredPurgeUserOptions.map((username) => (
												<SelectItem key={username} value={username}>
													{username}
												</SelectItem>
											))
										) : (
											<div className="px-2 py-1.5 text-sm text-muted-foreground">
												No matching users
											</div>
										)}
									</SelectContent>
								</Select>
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
