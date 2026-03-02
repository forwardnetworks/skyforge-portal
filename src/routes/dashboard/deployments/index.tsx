import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	Activity,
	Box,
	ChevronLeft,
	ChevronRight,
	Clock3,
	Filter,
	Inbox,
	Info,
	MoreHorizontal,
	Play,
	Plus,
	Search,
	StopCircle,
	Trash2,
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
	DialogFooter,
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
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Skeleton } from "../../../components/ui/skeleton";
import {
	type DashboardSnapshot,
	type DeploymentLifetimePolicyResponse,
	type SkyforgeUserScope,
	type UserScopeDeployment,
	buildLoginUrl,
	deleteDeployment,
	getDashboardSnapshot,
	getDeploymentLifetimePolicy,
	getSession,
	listUserScopes,
	preflightDeploymentAction,
	runDeploymentAction,
	updateDeploymentLease,
} from "../../../lib/api-client";
import { loginWithPopup } from "../../../lib/auth-popup";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import {
	noOpMessageForDeploymentAction,
	readDeploymentActionMeta,
} from "../../../lib/deployment-actions";
import { queryKeys } from "../../../lib/query-keys";
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
		useState<UserScopeDeployment | null>(null);
	const [destroyDialogOpen, setDestroyDialogOpen] = useState(false);
	const [destroyAlsoDeleteForward, setDestroyAlsoDeleteForward] =
		useState(false);
	const [lifetimeTarget, setLifetimeTarget] =
		useState<UserScopeDeployment | null>(null);
	const [lifetimeDialogOpen, setLifetimeDialogOpen] = useState(false);
	const [lifetimeSelection, setLifetimeSelection] = useState("24");
	const [pendingActions, setPendingActions] = useState<Record<string, boolean>>(
		{},
	);

	const session = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery<DeploymentLifetimePolicyResponse>({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		retry: false,
		staleTime: 30_000,
	});

	// Filters state
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");

	// UI state
	const [isFeedOpen, setIsFeedOpen] = useState(true);
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});
	const allUserScopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
	const effectiveUsername = String(session.data?.username ?? "").trim();
	const userScopes = useMemo(() => {
		if (!effectiveUsername) return allUserScopes;
		const mine = allUserScopes.filter((w) => {
			if (String(w.createdBy ?? "").trim() === effectiveUsername) return true;
			if ((w.owners ?? []).includes(effectiveUsername)) return true;
			if (String(w.slug ?? "").trim() === effectiveUsername) return true;
			return false;
		});
		return mine.length > 0 ? mine : allUserScopes;
	}, [allUserScopes, effectiveUsername]);

	const lastUserScopeKey = "skyforge.lastUserScopeId.deployments";

	// Use URL param if available, otherwise fallback to last-selected, then first user.
	const selectedUserScopeId = useMemo(() => {
		if (userId && userScopes.some((w: SkyforgeUserScope) => w.id === userId))
			return userId;
		const stored =
			typeof window !== "undefined"
				? (window.localStorage.getItem(lastUserScopeKey) ?? "")
				: "";
		if (stored && userScopes.some((w: SkyforgeUserScope) => w.id === stored))
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

	const selectedUserScope = useMemo(
		() =>
			userScopes.find((w: SkyforgeUserScope) => w.id === selectedUserScopeId) ??
			null,
		[userScopes, selectedUserScopeId],
	);

	const allDeployments = useMemo(() => {
		const all = (snap.data?.deployments ?? []) as UserScopeDeployment[];
		return selectedUserScopeId
			? all.filter((d: UserScopeDeployment) => d.userId === selectedUserScopeId)
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
				const status = resolveDeploymentDisplayStatus(d).toLowerCase();
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
				const depType = String(d.family ?? "")
					.trim()
					.toLowerCase();
				const engine = String(d.engine ?? "")
					.trim()
					.toLowerCase();
				if (
					typeFilter === "netlab" &&
					!(
						(depType === "c9s" && engine === "netlab") ||
						(depType === "byos" && engine === "netlab")
					)
				)
					return false;
				if (
					typeFilter === "containerlab" &&
					!(
						(depType === "c9s" && engine === "containerlab") ||
						(depType === "byos" && engine === "containerlab")
					)
				)
					return false;
				if (typeFilter === "terraform" && d.family !== "terraform")
					return false;
			}
			return true;
		});
	}, [allDeployments, searchQuery, statusFilter, typeFilter]);

	const handleStart = async (d: UserScopeDeployment) => {
		if (pendingActions[d.id]) return;
		setPendingActions((prev) => ({ ...prev, [d.id]: true }));
		try {
			const preflight = await preflightDeploymentAction(
				d.userId,
				d.id,
				"start",
			);
			const preflightMeta = readDeploymentActionMeta(preflight);
			if (preflightMeta.noOp) {
				toast.message(
					noOpMessageForDeploymentAction("start", preflightMeta.reason),
					{
						description: d.name,
					},
				);
				await queryClient.invalidateQueries({
					queryKey: queryKeys.dashboardSnapshot(),
				});
				return;
			}
			const resp = await runDeploymentAction(d.userId, d.id, "start");
			const meta = readDeploymentActionMeta(resp);
			if (meta.noOp) {
				toast.message(noOpMessageForDeploymentAction("start", meta.reason), {
					description: d.name,
				});
			} else {
				toast.success("Deployment starting", {
					description: `${d.name} is queued to start.`,
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		} catch (e) {
			toast.error("Start preflight/action failed", {
				description: (e as Error).message,
			});
		} finally {
			setPendingActions((prev) => {
				const next = { ...prev };
				delete next[d.id];
				return next;
			});
		}
	};

	const handleStop = async (d: UserScopeDeployment) => {
		if (pendingActions[d.id]) return;
		setPendingActions((prev) => ({ ...prev, [d.id]: true }));
		try {
			const preflight = await preflightDeploymentAction(d.userId, d.id, "stop");
			const preflightMeta = readDeploymentActionMeta(preflight);
			if (preflightMeta.noOp) {
				toast.message(
					noOpMessageForDeploymentAction("stop", preflightMeta.reason),
					{
						description: d.name,
					},
				);
				await queryClient.invalidateQueries({
					queryKey: queryKeys.dashboardSnapshot(),
				});
				return;
			}
			const resp = await runDeploymentAction(d.userId, d.id, "stop");
			const meta = readDeploymentActionMeta(resp);
			if (meta.noOp) {
				toast.message(noOpMessageForDeploymentAction("stop", meta.reason), {
					description: d.name,
				});
			} else {
				toast.success("Deployment stopping", {
					description: `${d.name} is queued to stop.`,
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
		} catch (e) {
			toast.error("Stop preflight/action failed", {
				description: (e as Error).message,
			});
		} finally {
			setPendingActions((prev) => {
				const next = { ...prev };
				delete next[d.id];
				return next;
			});
		}
	};

	const fallbackManagedFamilies = ["c9s", "byos", "terraform"];
	const managedFamilies = useMemo(
		() =>
			new Set(
				(lifetimePolicyQ.data?.managedFamilies ?? fallbackManagedFamilies).map(
					(v) => String(v).trim().toLowerCase(),
				),
			),
		[lifetimePolicyQ.data?.managedFamilies],
	);
	const lifetimeHoursOptions = useMemo(() => {
		const raw = lifetimePolicyQ.data?.allowedHours ?? [4, 8, 24, 72];
		const out = raw
			.map((h) => Number.parseInt(String(h), 10))
			.filter((h) => Number.isFinite(h) && h > 0);
		return out.length > 0 ? out : [4, 8, 24, 72];
	}, [lifetimePolicyQ.data?.allowedHours]);
	const defaultLifetimeHours =
		Number.parseInt(String(lifetimePolicyQ.data?.defaultHours ?? 24), 10) || 24;
	const allowNoExpiry =
		Boolean(session.data?.isAdmin) &&
		Boolean(lifetimePolicyQ.data?.allowNoExpiry ?? true);

	const isManagedDeploymentType = (typ: string) =>
		managedFamilies.has(String(typ).trim().toLowerCase());

	const parseLeaseHours = (value: unknown): number => {
		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.max(0, Math.trunc(value));
		}
		const parsed = Number.parseInt(String(value ?? "").trim(), 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
	};

	const formatLifetimeCell = (d: UserScopeDeployment): string => {
		if (!isManagedDeploymentType(d.family)) {
			return "Not managed";
		}
		const cfg = d.config ?? {};
		const enabled =
			cfg.leaseEnabled === true ||
			String(cfg.leaseEnabled ?? "")
				.trim()
				.toLowerCase() === "true";
		if (!enabled) {
			return "No expiry";
		}
		const stoppedAt = String(cfg.leaseStoppedAt ?? "").trim();
		if (stoppedAt !== "") {
			return "Stopped";
		}
		const hours = parseLeaseHours(cfg.leaseHours);
		const expiresAt = String(cfg.leaseExpiresAt ?? "").trim();
		if (expiresAt === "") {
			return hours > 0 ? `${hours}h` : "Active";
		}
		const ts = new Date(expiresAt);
		if (Number.isNaN(ts.getTime())) {
			return hours > 0 ? `${hours}h` : "Active";
		}
		const remainingMs = ts.getTime() - Date.now();
		if (remainingMs <= 0) {
			return "Expired";
		}
		const remainingHours = Math.max(1, Math.ceil(remainingMs / 3_600_000));
		const prefix = hours > 0 ? `${hours}h` : "Active";
		return `${prefix} (${remainingHours}h left)`;
	};

	const openLifetimeDialog = (d: UserScopeDeployment) => {
		const cfg = d.config ?? {};
		const enabled =
			cfg.leaseEnabled === true ||
			String(cfg.leaseEnabled ?? "")
				.trim()
				.toLowerCase() === "true";
		const existingHours = parseLeaseHours(cfg.leaseHours);
		const defaultSelection = String(defaultLifetimeHours);
		let nextSelection = defaultSelection;
		if (!enabled && allowNoExpiry) {
			nextSelection = "__none";
		} else if (
			existingHours > 0 &&
			lifetimeHoursOptions.includes(existingHours)
		) {
			nextSelection = String(existingHours);
		}
		setLifetimeSelection(nextSelection);
		setLifetimeTarget(d);
		setLifetimeDialogOpen(true);
	};

	const saveLifetimeMutation = useMutation({
		mutationFn: async () => {
			if (!lifetimeTarget) {
				throw new Error("No deployment selected");
			}
			let enabled = true;
			let hours = Number.parseInt(lifetimeSelection, 10);
			if (allowNoExpiry && lifetimeSelection === "__none") {
				enabled = false;
				hours = defaultLifetimeHours;
			}
			if (!Number.isFinite(hours) || hours <= 0) {
				hours = defaultLifetimeHours;
			}
			return updateDeploymentLease(lifetimeTarget.userId, lifetimeTarget.id, {
				enabled,
				hours,
			});
		},
		onSuccess: async () => {
			toast.success("Deployment lifetime updated");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			setLifetimeDialogOpen(false);
			setLifetimeTarget(null);
		},
		onError: (e) => {
			toast.error("Failed to update deployment lifetime", {
				description: (e as Error).message,
			});
		},
	});

	const deploymentColumns = useMemo((): Array<
		DataTableColumn<UserScopeDeployment>
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
						{formatDeploymentType(d)}
					</span>
				),
			},
			{
				id: "status",
				header: "Status",
				width: 150,
				cell: (d) => <StatusBadge status={resolveDeploymentDisplayStatus(d)} />,
			},
			{
				id: "lifetime",
				header: "Lifetime",
				width: 210,
				cell: (d) => (
					<span className="text-muted-foreground">{formatLifetimeCell(d)}</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				width: 120,
				align: "right",
				cell: (d) => {
					const status = resolveDeploymentDisplayStatus(d).toLowerCase();
					const isRunning = ["running", "active", "healthy"].includes(status);
					const isBusy =
						Boolean(d.activeTaskId) || Boolean(pendingActions[d.id]);
					const managedByLifetime = isManagedDeploymentType(d.family);
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
								{managedByLifetime && (
									<DropdownMenuItem
										onClick={() => openLifetimeDialog(d)}
										disabled={isBusy}
									>
										<Clock3 className="mr-2 h-4 w-4" />
										Manage lifetime
									</DropdownMenuItem>
								)}
								{managedByLifetime && <DropdownMenuSeparator />}
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
	}, [
		handleStart,
		handleStop,
		isManagedDeploymentType,
		navigate,
		openLifetimeDialog,
		pendingActions,
	]);

	const runs = useMemo(() => {
		const all = (snap.data?.runs ?? []) as Record<string, unknown>[];
		if (!selectedUserScopeId) return all;
		return all.filter(
			(r: Record<string, unknown>) =>
				String(r.userId ?? "") === selectedUserScopeId,
		);
	}, [selectedUserScopeId, snap.data?.runs]);

	const loginHref = buildLoginUrl(
		window.location.pathname + window.location.search,
	);

	const handleDestroy = async () => {
		if (!destroyTarget) return;
		if (pendingActions[destroyTarget.id]) return;
		setPendingActions((prev) => ({ ...prev, [destroyTarget.id]: true }));
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
		} finally {
			setPendingActions((prev) => {
				const next = { ...prev };
				delete next[destroyTarget.id];
				return next;
			});
		}
	};

	const formatDeploymentType = (d: UserScopeDeployment) => {
		const typ = String(d.family ?? "")
			.trim()
			.toLowerCase();
		const engine = String(d.engine ?? "")
			.trim()
			.toLowerCase();
		if (typ === "c9s" && engine === "netlab") return "Netlab (C9S)";
		if (typ === "c9s" && engine === "containerlab") return "Containerlab (C9S)";
		if (typ === "c9s") return "C9S";
		if (typ === "byos" && engine === "netlab") return "Netlab (BYOS)";
		if (typ === "byos" && engine === "containerlab")
			return "Containerlab (BYOS)";
		if (typ === "byos" && engine === "eve_ng") return "EVE-NG (BYOS)";
		if (typ === "byos") return "BYOS";
		if (typ === "terraform") return "Terraform";
		return String(d.family ?? "");
	};

	const destroyHasForward = !!destroyTarget?.config?.forwardNetworkId;

	return (
		<div className="space-y-6 p-6">
			{/* Top Header / User Context */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Deployments</h1>
					<p className="text-muted-foreground text-sm">
						Manage deployments and monitor activity.
					</p>
				</div>

				<div className="flex items-center gap-3">
					{selectedUserScope ? (
						<Badge variant="outline">
							{selectedUserScope.name} ({selectedUserScope.slug})
						</Badge>
					) : (
							<Badge variant="secondary">No user selected</Badge>
					)}
				</div>
			</div>

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
												: "You haven't created any deployments for this user yet."
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

			<Dialog open={lifetimeDialogOpen} onOpenChange={setLifetimeDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Manage deployment lifetime</DialogTitle>
						<DialogDescription>
							Set automatic expiry for "{lifetimeTarget?.name}". Managed
							deployments are stopped on expiry (Terraform uses destroy).
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						<Label htmlFor="deployment-lifetime-select">Lifetime</Label>
						<Select
							value={lifetimeSelection}
							onValueChange={setLifetimeSelection}
							disabled={saveLifetimeMutation.isPending}
						>
							<SelectTrigger id="deployment-lifetime-select">
								<SelectValue placeholder="Select a lifetime" />
							</SelectTrigger>
							<SelectContent>
								{allowNoExpiry && (
									<SelectItem value="__none">No expiry (admin only)</SelectItem>
								)}
								{lifetimeHoursOptions.map((hours) => (
									<SelectItem key={String(hours)} value={String(hours)}>
										{hours} hours
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setLifetimeDialogOpen(false);
								setLifetimeTarget(null);
							}}
							disabled={saveLifetimeMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							onClick={() => saveLifetimeMutation.mutate()}
							disabled={saveLifetimeMutation.isPending || !lifetimeTarget}
						>
							{saveLifetimeMutation.isPending ? "Saving…" : "Save lifetime"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

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
							disabled={Boolean(
								destroyTarget && pendingActions[destroyTarget.id],
							)}
							className={buttonVariants({ variant: "destructive" })}
						>
							{destroyTarget && pendingActions[destroyTarget.id]
								? "Deleting…"
								: "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function resolveDeploymentDisplayStatus(d: UserScopeDeployment): string {
	const active = String(d.activeTaskStatus ?? "")
		.trim()
		.toLowerCase();
	if (active) return active;

	const last = String(d.lastStatus ?? "")
		.trim()
		.toLowerCase();
	if (!last) return "unknown";
	if (!["success", "succeeded"].includes(last)) return last;

	const cfg = d.config ?? {};
	const lastAction = String(cfg["lastAction"] ?? "")
		.trim()
		.toLowerCase();

	if (["stop", "destroy", "down", "delete"].includes(lastAction)) {
		return "stopped";
	}
	if (["create", "start", "up", "deploy", "apply"].includes(lastAction)) {
		return "running";
	}
	return d.family === "terraform" ? "ready" : "running";
}

function StatusBadge({
	status,
	size = "default",
}: { status: string; size?: "default" | "xs" }) {
	let variant: "default" | "secondary" | "destructive" | "outline" =
		"secondary";
	const s = status.toLowerCase();
	const label = s === "crashloopbackoff" ? "crashloop" : status;

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
