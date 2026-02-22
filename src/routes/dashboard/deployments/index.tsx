import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	Box,
	ChevronLeft,
	ChevronRight,
	Filter,
	Inbox,
	Info,
	MoreHorizontal,
	Play,
	Plus,
	Search,
	Settings,
	StopCircle,
	Trash2,
	Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	DataTable,
	type DataTableColumn,
} from "../../../components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { EmptyState } from "../../../components/ui/empty-state";
import { Input } from "../../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import { loginWithPopup } from "../../../lib/auth-popup";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import { queryKeys } from "../../../lib/query-keys";
import {
	type DashboardSnapshot,
	type JSONMap,
	type SkyforgeWorkspace,
	type WorkspaceDeployment,
	buildLoginUrl,
	createWorkspace,
	deleteDeployment,
	deleteWorkspace,
	destroyDeployment,
	getDashboardSnapshot,
	getSession,
	listUserScopes,
	startDeployment,
	stopDeployment,
} from "../../../lib/skyforge-api";
import { cn } from "../../../lib/utils";

// Search Schema
const deploymentsSearchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/")({
	validateSearch: (search) => deploymentsSearchSchema.parse(search),
	loaderDeps: ({ search: { userId } }) => ({ userId }),
	loader: async ({ context: { queryClient } }) => {
		// Prefetch userScopes to ensure selector is ready
		await queryClient.ensureQueryData({
			queryKey: queryKeys.userScopes(),
			queryFn: listUserScopes,
			staleTime: 30_000,
		});
	},
	component: DeploymentsPage,
});

function DeploymentsPage() {
	useDashboardEvents(true);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { userId } = Route.useSearch();

	const snap = useQuery<DashboardSnapshot | null>({
		queryKey: queryKeys.dashboardSnapshot(),
		queryFn: getDashboardSnapshot,
		initialData: () =>
			(queryClient.getQueryData(queryKeys.dashboardSnapshot()) as
				| DashboardSnapshot
				| undefined) ?? null,
		retry: false,
		staleTime: Number.POSITIVE_INFINITY,
	});

	const [destroyTarget, setDestroyTarget] =
		useState<WorkspaceDeployment | null>(null);
	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [destroyAlsoDeleteForward, setDestroyAlsoDeleteForward] =
		useState(false);

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});

	// Filters state
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");

	// UI state
	const [isFeedOpen, setIsFeedOpen] = useState(true);
	const [createUserScopeOpen, setCreateUserScopeOpen] = useState(false);
	const [createUserScopeName, setCreateUserScopeName] = useState("");
	const [createUserScopeSlug, setCreateUserScopeSlug] = useState("");
	const [deleteUserScopeOpen, setDeleteUserScopeOpen] = useState(false);
	const [deleteUserScopeConfirm, setDeleteUserScopeConfirm] = useState("");

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});
	const userScopes = (userScopesQ.data ?? []) as SkyforgeWorkspace[];

	const lastUserScopeKey = "skyforge.lastUserScopeId.deployments";

	// Use URL param if available, otherwise fallback to last-selected, then first user scope.
	const selectedUserScopeId = useMemo(() => {
		if (
			userId &&
			userScopes.some((w: SkyforgeWorkspace) => w.id === userId)
		)
			return userId;
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(lastUserScopeKey) ?? "")
				: "";
		if (stored && userScopes.some((w: SkyforgeWorkspace) => w.id === stored))
			return stored;
		return userScopes[0]?.id ?? "";
	}, [userId, userScopes]);

	useEffect(() => {
		if (!selectedUserScopeId) return;
		if (typeof window !== "undefined") {
			window.localStorage.setItem(lastUserScopeKey, selectedUserScopeId);
		}
		if (userId !== selectedUserScopeId) {
			navigate({
				search: { userId: selectedUserScopeId } as any,
				replace: true,
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedUserScopeId]);

	const selectedUserScope = useMemo(() => {
		return (
			userScopes.find((w: SkyforgeWorkspace) => w.id === selectedUserScopeId) ??
			null
		);
	}, [userScopes, selectedUserScopeId]);

	const createWs = useMutation({
		mutationFn: async () => {
			const name = String(createUserScopeName ?? "").trim();
			if (!name) throw new Error("User scope name is required");
			return createWorkspace({
				name,
				slug: String(createUserScopeSlug ?? "").trim() || undefined,
			} as any);
		},
		onSuccess: async (created) => {
			toast.success("User scope created");
			setCreateUserScopeOpen(false);
			setCreateUserScopeName("");
			setCreateUserScopeSlug("");
			await queryClient.invalidateQueries({ queryKey: queryKeys.userScopes() });
			if (created?.id) {
				navigate({
					search: { userId: created.id } as any,
					replace: true,
				});
			}
		},
		onError: (e) =>
			toast.error("Failed to create user scope", {
				description: (e as Error).message,
			}),
	});

	const delWs = useMutation({
		mutationFn: async () => {
			const confirm = String(deleteUserScopeConfirm ?? "").trim();
			if (!confirm) {
				throw new Error(
					`Type the user-scope slug (“${selectedUserScope?.slug ?? ""}”) to confirm`,
				);
			}
			return deleteWorkspace(selectedUserScopeId, { confirm });
		},
		onSuccess: async () => {
			toast.success("User scope deleted");
			setDeleteUserScopeOpen(false);
			setDeleteUserScopeConfirm("");
			await queryClient.invalidateQueries({ queryKey: queryKeys.userScopes() });
			navigate({ search: { userId: "" } as any, replace: true });
		},
		onError: (e) =>
			toast.error("Failed to delete user scope", {
				description: (e as Error).message,
			}),
	});

	// Sync internal state selection to URL
	const handleUserScopeChange = (newId: string) => {
		if (newId === "__create__") {
			setCreateUserScopeOpen(true);
			return;
		}
		if (typeof window !== "undefined") {
			window.localStorage.setItem(lastUserScopeKey, newId);
		}
		navigate({
			search: { userId: newId } as any,
			replace: true,
		});
	};

	const allDeployments = useMemo(() => {
		const all = (snap.data?.deployments ?? []) as WorkspaceDeployment[];
		return selectedUserScopeId
			? all.filter(
					(d: WorkspaceDeployment) => d.userId === selectedUserScopeId,
				)
			: all;
	}, [selectedUserScopeId, snap.data?.deployments]);

	// Apply filters
	const deployments = useMemo(() => {
		return allDeployments.filter((d) => {
			// Search
			if (
				searchQuery &&
				!d.name.toLowerCase().includes(searchQuery.toLowerCase())
			) {
				return false;
			}
			// Status
			if (statusFilter !== "all") {
				const status = (
					d.activeTaskStatus ??
					d.lastStatus ??
					"unknown"
				).toLowerCase();
				if (
					statusFilter === "running" &&
					!["running", "active", "healthy"].includes(status)
				)
					return false;
				if (
					statusFilter === "stopped" &&
					!["created", "stopped", "success", "succeeded", "ready"].includes(
						status,
					)
				)
					return false;
				if (
					statusFilter === "failed" &&
					!["failed", "error", "crashloopbackoff"].includes(status)
				)
					return false;
			}
			// Type
			if (typeFilter !== "all") {
				if (typeFilter === "netlab" && !d.type.startsWith("netlab"))
					return false;
				if (
					typeFilter === "containerlab" &&
					!["containerlab", "clabernetes"].includes(d.type)
				)
					return false;
				if (typeFilter === "terraform" && d.type !== "terraform") return false;
			}
			return true;
		});
	}, [allDeployments, searchQuery, statusFilter, typeFilter]);

	const handleStart = async (d: WorkspaceDeployment) => {
		try {
			await startDeployment(d.userId, d.id);
			toast.success("Deployment starting", {
				description: `${d.name} is queued to start.`,
			});
		} catch (e) {
			toast.error("Failed to start", { description: (e as Error).message });
		}
	};

	const handleStop = async (d: WorkspaceDeployment) => {
		try {
			await stopDeployment(d.userId, d.id);
			toast.success("Deployment stopping", {
				description: `${d.name} is queued to stop.`,
			});
		} catch (e) {
			toast.error("Failed to stop", { description: (e as Error).message });
		}
	};

	const deploymentColumns = useMemo((): Array<
		DataTableColumn<WorkspaceDeployment>
	> => {
		return [
			{
				id: "name",
				header: "Name",
				width: "minmax(240px, 1fr)",
				cell: (d) => (
					<Link
						to="/dashboard/deployments/$deploymentId"
						params={{ deploymentId: d.id }}
						className="hover:underline flex items-center gap-2 font-medium text-foreground"
					>
						{d.name}
					</Link>
				),
			},
			{
				id: "type",
				header: "Type",
				width: 160,
				cell: (d) => (
					<span className="text-muted-foreground">
						{formatDeploymentType(d.type)}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				width: 150,
				cell: (d) => (
					<StatusBadge
						status={d.activeTaskStatus ?? d.lastStatus ?? "unknown"}
					/>
				),
			},
			{
				id: "actions",
				header: "Actions",
				width: 120,
				align: "right",
				cell: (d) => {
					const status = (
						d.activeTaskStatus ??
						d.lastStatus ??
						"unknown"
					).toLowerCase();
					const isRunning = ["running", "active", "healthy"].includes(status);
					const isBusy = Boolean(d.activeTaskId);
					return (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<MoreHorizontal className="h-4 w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuLabel>Actions</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() =>
										navigate({
											to: "/dashboard/deployments/$deploymentId",
											params: { deploymentId: d.id },
										})
									}
								>
									<Info className="mr-2 h-4 w-4" />
									Details
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => handleStart(d)}
									disabled={isBusy || isRunning}
								>
									<Play className="mr-2 h-4 w-4" />
									Start
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => handleStop(d)}
									disabled={isBusy || !isRunning}
								>
									<StopCircle className="mr-2 h-4 w-4" />
									Stop
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={() => {
										setDestroyTarget(d);
										setDestroyDialogOpen(true);
									}}
									className="text-destructive focus:text-destructive"
									disabled={isBusy}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					);
				},
			},
		];
	}, [handleStart, handleStop, navigate]);

	const runs = useMemo(() => {
		const all = (snap.data?.runs ?? []) as JSONMap[];
		if (!selectedUserScopeId) return all;
		return all.filter(
			(r: JSONMap) => String(r.userId ?? "") === selectedUserScopeId,
		);
	}, [selectedUserScopeId, snap.data?.runs]);

	const loginHref = buildLoginUrl(
		window.location.pathname + window.location.search,
	);

	const handleDestroy = async () => {
		if (!destroyTarget) return;
		try {
			// "Destroy" in the UI means remove the deployment definition (and trigger provider cleanup).
			await deleteDeployment(destroyTarget.userId, destroyTarget.id, {
				forwardDelete: destroyAlsoDeleteForward,
			});
			toast.success("Deployment deleted", {
				description: `${destroyTarget.name} has been removed.`,
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			setDestroyDialogOpen(false);
			setDestroyTarget(null);
			setDestroyAlsoDeleteForward(false);
		} catch (e) {
			toast.error("Failed to delete", { description: (e as Error).message });
		}
	};

	const formatDeploymentType = (typ: string) => {
		switch (typ) {
			case "netlab":
				return "Netlab (BYOS)";
			case "netlab-c9s":
				return "Netlab";
			case "containerlab":
				return "Containerlab (BYOS)";
			case "clabernetes":
				return "Containerlab";
			default:
				return typ;
		}
	};

	const destroyHasForward = !!destroyTarget?.config?.forwardNetworkId;

	return (
		<div className="space-y-6 p-6">
			{/* Top Header / User Scope Context */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
					<p className="text-muted-foreground text-sm">
						Manage deployments and monitor activity.
					</p>
				</div>

				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
						<Select
							value={selectedUserScopeId}
							onValueChange={handleUserScopeChange}
							disabled={false}
						>
							<SelectTrigger className="w-[200px] h-8 bg-transparent border-0 focus:ring-0 shadow-none">
								<SelectValue placeholder="Select user scope" />
							</SelectTrigger>
							<SelectContent>
								{userScopes.map((w: SkyforgeWorkspace) => (
									<SelectItem key={w.id} value={w.id}>
										{w.name} ({w.slug})
									</SelectItem>
								))}
								<SelectItem value="__create__">
									<span className="flex items-center gap-2">
										<Plus className="h-4 w-4" />
										Add user scope…
									</span>
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								disabled={!selectedUserScopeId}
							>
								<Settings className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>User Scope</DropdownMenuLabel>
							<DropdownMenuItem
								onClick={() =>
									navigate({
										to: "/dashboard/settings",
									})
								}
							>
								<Users className="mr-2 h-4 w-4" />
								My settings
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => navigate({ to: "/dashboard/deployments" })}
							>
								<Inbox className="mr-2 h-4 w-4" />
								All deployments
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={() => {
									setDeleteUserScopeOpen(true);
									setDeleteUserScopeConfirm("");
								}}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Delete user scope…
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<Dialog open={createUserScopeOpen} onOpenChange={setCreateUserScopeOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Create user scope</DialogTitle>
						<DialogDescription>
							Create a new user scope and its backing Git repo.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<div className="text-sm font-medium">Name</div>
							<Input
								value={createUserScopeName}
								onChange={(e) => setCreateUserScopeName(e.target.value)}
								placeholder="Customer demo"
							/>
						</div>
						<div className="space-y-1.5">
							<div className="text-sm font-medium">Slug (optional)</div>
							<Input
								value={createUserScopeSlug}
								onChange={(e) => setCreateUserScopeSlug(e.target.value)}
								placeholder="customer-demo"
								className="font-mono"
							/>
							<p className="text-xs text-muted-foreground">
								Leave blank to auto-generate from name.
							</p>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setCreateUserScopeOpen(false)}
								disabled={createWs.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => createWs.mutate()}
								disabled={createWs.isPending}
							>
								{createWs.isPending ? "Creating…" : "Create"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			<Dialog open={deleteUserScopeOpen} onOpenChange={setDeleteUserScopeOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Delete user scope</DialogTitle>
						<DialogDescription>
							This deletes the user scope and its backing resources (Git repo,
							artifacts, and state). This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-sm">
							Type{" "}
							<span className="font-mono font-semibold">
								{selectedUserScope?.slug ?? ""}
							</span>{" "}
							to confirm.
						</div>
						<Input
							value={deleteUserScopeConfirm}
							onChange={(e) => setDeleteUserScopeConfirm(e.target.value)}
							placeholder={selectedUserScope?.slug ?? ""}
							className="font-mono"
						/>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setDeleteUserScopeOpen(false)}
								disabled={delWs.isPending}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => delWs.mutate()}
								disabled={delWs.isPending}
							>
								{delWs.isPending ? "Deleting…" : "Delete"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{!snap.data && (
				<Card className="border-dashed">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center justify-center space-y-4 py-8">
							<Skeleton className="h-4 w-64" />
							<div className="text-center text-muted-foreground">
								Loading dashboard…
								<div className="mt-2 text-xs">
									If you are logged out,{" "}
									<a
										className="text-primary underline hover:no-underline"
										href={loginHref}
										onClick={(e) => {
											e.preventDefault();
											void (async () => {
												const ok = await loginWithPopup({ loginHref });
												if (!ok) {
													window.location.href = loginHref;
													return;
												}
												await queryClient.invalidateQueries({
													queryKey: queryKeys.session(),
												});
											})();
										}}
									>
										login
									</a>
									.
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Main Content Flex Layout */}
			<div className="flex flex-col lg:flex-row gap-6 relative items-start">
				{/* Left Column: Deployments (Flexible) */}
				<div className="flex-1 min-w-0 space-y-4 w-full">
					{/* Toolbar */}
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="relative flex-1">
							<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search deployments..."
								className="pl-9"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<Select value={statusFilter} onValueChange={setStatusFilter}>
							<SelectTrigger className="w-[140px]">
								<Filter className="mr-2 h-4 w-4 text-muted-foreground" />
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Status</SelectItem>
								<SelectItem value="running">Running</SelectItem>
								<SelectItem value="stopped">Stopped</SelectItem>
								<SelectItem value="failed">Failed</SelectItem>
							</SelectContent>
						</Select>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-[140px]">
								<Box className="mr-2 h-4 w-4 text-muted-foreground" />
								<SelectValue placeholder="Type" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Types</SelectItem>
								<SelectItem value="netlab">Netlab</SelectItem>
								<SelectItem value="containerlab">Containerlab</SelectItem>
								<SelectItem value="terraform">Terraform</SelectItem>
							</SelectContent>
						</Select>
						<Link
							to="/dashboard/deployments/new"
							search={{ userId: selectedUserScopeId }}
							className={buttonVariants({ variant: "default" })}
						>
							<Plus className="mr-2 h-4 w-4" /> Create
						</Link>
					</div>

					<Card>
						<CardContent className="p-0">
							{!snap.data ? (
								<div className="p-6 space-y-4">
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
									<Skeleton className="h-10 w-full" />
								</div>
							) : deployments.length === 0 ? (
								<EmptyState
									icon={Inbox}
									title="No deployments found"
									description={
										searchQuery || statusFilter !== "all"
											? "Try adjusting your filters."
											: "You haven't created any deployments in this user scope yet."
									}
									action={
										!searchQuery && statusFilter === "all"
											? {
													label: "Create deployment",
													onClick: () =>
														navigate({
															to: "/dashboard/deployments/new",
															search: { userId: selectedUserScopeId },
														}),
												}
											: undefined
									}
								/>
							) : (
								<DataTable
									columns={deploymentColumns}
									rows={deployments}
									getRowId={(d) => d.id}
									minWidthClassName="min-w-0"
									scrollable={false}
								/>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Activity Feed (Collapsible) */}
				<div
					className={cn(
						"transition-all duration-300 ease-in-out border-l space-y-4 shrink-0",
						isFeedOpen
							? "w-full lg:w-80 xl:w-96 pl-6 opacity-100"
							: "w-0 lg:w-12 pl-0 opacity-100 border-none lg:border-l",
					)}
				>
					<div
						className={cn(
							"flex items-center gap-2 h-[40px]",
							!isFeedOpen && "justify-center",
						)}
					>
						{isFeedOpen ? (
							<>
								<Activity className="h-4 w-4 text-muted-foreground" />
								<h3 className="flex-1 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
									Activity Feed
								</h3>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 text-muted-foreground hover:text-foreground"
									onClick={() => setIsFeedOpen(false)}
									title="Collapse feed"
								>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</>
						) : (
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-foreground"
								onClick={() => setIsFeedOpen(true)}
								title="Expand activity feed"
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
						)}
					</div>

					<div className={cn("space-y-3", !isFeedOpen && "hidden")}>
						{!snap.data ? (
							<div className="space-y-3">
								<Skeleton className="h-20 w-full" />
								<Skeleton className="h-20 w-full" />
							</div>
						) : runs.length === 0 ? (
							<Card>
								<CardContent className="p-6 text-center text-sm text-muted-foreground">
									No recent activity.
								</CardContent>
							</Card>
						) : (
							<div className="space-y-3">
								{runs.slice(0, 15).map((r) => {
									const isFinished = [
										"success",
										"failed",
										"canceled",
										"error",
									].includes(String(r.status ?? "").toLowerCase());
									return (
										<Link
											key={String(r.id ?? Math.random())}
											to="/dashboard/runs/$runId"
											params={{ runId: String(r.id ?? "") }}
											className="block group"
										>
											<Card className="hover:border-primary/50 transition-colors">
												<CardContent className="p-3">
													<div className="flex items-start justify-between gap-2">
														<div className="flex flex-col gap-1 min-w-0">
															<div className="flex items-center gap-2">
																<span className="font-mono text-xs font-medium text-foreground">
																	#{String(r.id ?? "")}
																</span>
																<span className="text-xs text-muted-foreground truncate max-w-[120px]">
																	{String(r.tpl_alias ?? r.type ?? "Run")}
																</span>
															</div>
															<div className="text-xs text-muted-foreground truncate">
																{String(r.message || "No message")}
															</div>
														</div>
														<StatusBadge
															status={String(r.status ?? "")}
															size="xs"
														/>
													</div>
													<div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
														<span>{String(r.user_name ?? "system")}</span>
														<span>
															{new Date(String(r.created)).toLocaleString(
																undefined,
																{
																	month: "short",
																	day: "numeric",
																	hour: "numeric",
																	minute: "numeric",
																},
															)}
														</span>
													</div>
												</CardContent>
											</Card>
										</Link>
									);
								})}
							</div>
						)}
					</div>
				</div>
			</div>

			<AlertDialog open={destroyDialogOpen} onOpenChange={setDestroyDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete deployment?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove "{destroyTarget?.name}" from Skyforge and trigger
							provider cleanup. This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{destroyHasForward && (
						<div className="flex items-start gap-3 rounded-md border p-3">
							<Checkbox
								checked={destroyAlsoDeleteForward}
								onCheckedChange={(v) => setDestroyAlsoDeleteForward(Boolean(v))}
								id="delete-forward-network"
							/>
							<label
								htmlFor="delete-forward-network"
								className="text-sm leading-tight cursor-pointer"
							>
								Also delete the Forward network associated with this deployment.
							</label>
						</div>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDestroy}
							className={buttonVariants({ variant: "destructive" })}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function StatusBadge({
	status,
	size = "default",
}: { status: string; size?: "default" | "xs" }) {
	let variant: "default" | "secondary" | "destructive" | "outline" =
		"secondary";
	const s = status.toLowerCase();
	const label =
		s === "success" || s === "succeeded"
			? "ready"
			: s === "crashloopbackoff"
				? "crashloop"
				: status;

	if (["running", "active", "healthy"].includes(s)) variant = "default";
	if (["failed", "error", "crashloopbackoff"].includes(s))
		variant = "destructive";

	return (
		<Badge
			variant={variant}
			className={`capitalize ${size === "xs" ? "px-1.5 py-0 text-[10px] h-5" : ""}`}
		>
			{label}
		</Badge>
	);
}
