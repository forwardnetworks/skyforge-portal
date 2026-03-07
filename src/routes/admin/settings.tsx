import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
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
	type AdminAPICatalogEntry,
	type AdminWorkspacePodCleanupResponse,
	type AdminAuditResponse,
	type AdminAuthSettingsResponse,
	type AdminOIDCSettingsResponse,
	type AdminUserAPIPermission,
	type QuickDeployTemplate,
	adminCleanupWorkspacePods,
	deleteAdminUserRole,
	adminImpersonateStart,
	adminImpersonateStop,
	adminPurgeUser,
	getAdminAPICatalog,
	getAdminAudit,
	getAdminAuthSettings,
	getAdminOIDCSettings,
	getAdminEffectiveConfig,
	getAdminImpersonateStatus,
	getAdminQuickDeployCatalog,
	getAdminUserAPIPermissions,
	getAdminUserRoles,
	getAdminQuickDeployTemplateOptions,
	getGovernancePolicy,
	getSession,
	getUserScopeNetlabTemplates,
	listUserScopes,
	reconcileQueuedTasks,
	reconcileRunningTasks,
	upsertAdminUserRole,
	putAdminAuthSettings,
	putAdminOIDCSettings,
	putAdminUserAPIPermissions,
	updateAdminQuickDeployCatalog,
	updateGovernancePolicy,
} from "../../lib/api-client";
import { requireAdminRouteAccess } from "../../lib/admin-route";
import { queryKeys } from "../../lib/query-keys";
import { sessionIsAdmin } from "../../lib/rbac";

export const Route = createFileRoute("/admin/settings")({
	beforeLoad: async ({ context }) => {
		await requireAdminRouteAccess(context);
		throw redirect({ to: "/settings", search: { tab: "admin" } });
	},
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

export function AdminSettingsPage() {
	const queryClient = useQueryClient();
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const isAdmin = sessionIsAdmin(sessionQ.data);
	const effectiveUsername = String(sessionQ.data?.username ?? "").trim();

	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		enabled: isAdmin,
		staleTime: 30_000,
		retry: false,
	});
	const allUserScopes = userScopesQ.data ?? [];
	const adminUserRolesQ = useQuery({
		queryKey: queryKeys.adminRbacUsers(),
		queryFn: getAdminUserRoles,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
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
	const authSettingsQ = useQuery({
		queryKey: queryKeys.adminAuthSettings(),
		queryFn: getAdminAuthSettings,
		enabled: isAdmin,
		staleTime: 15_000,
		retry: false,
	});
	const oidcSettingsQ = useQuery({
		queryKey: queryKeys.adminOidcSettings(),
		queryFn: getAdminOIDCSettings,
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
	const [authProviderDraft, setAuthProviderDraft] = useState<"local" | "okta">(
		"local",
	);
	const [breakGlassEnabledDraft, setBreakGlassEnabledDraft] = useState(false);
	const [breakGlassLabelDraft, setBreakGlassLabelDraft] = useState(
		"Emergency local login",
	);
	const [oidcEnabledDraft, setOidcEnabledDraft] = useState(false);
	const [oidcIssuerDraft, setOidcIssuerDraft] = useState("");
	const [oidcDiscoveryDraft, setOidcDiscoveryDraft] = useState("");
	const [oidcClientIDDraft, setOidcClientIDDraft] = useState("");
	const [oidcClientSecretDraft, setOidcClientSecretDraft] = useState("");
	const [oidcRedirectDraft, setOidcRedirectDraft] = useState("");
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
	useEffect(() => {
		const provider = String(authSettingsQ.data?.primaryProvider ?? "")
			.trim()
			.toLowerCase();
		if (provider === "okta" || provider === "local") {
			setAuthProviderDraft(provider);
		}
		setBreakGlassEnabledDraft(
			Boolean(authSettingsQ.data?.breakGlassEnabled),
		);
		setBreakGlassLabelDraft(
			String(authSettingsQ.data?.breakGlassLabel ?? "Emergency local login"),
		);
	}, [
		authSettingsQ.data?.primaryProvider,
		authSettingsQ.data?.breakGlassEnabled,
		authSettingsQ.data?.breakGlassLabel,
	]);
	const saveAuthSettings = useMutation({
		mutationFn: async () =>
			putAdminAuthSettings({
				primaryProvider: authProviderDraft,
				breakGlassEnabled: breakGlassEnabledDraft,
				breakGlassLabel: breakGlassLabelDraft.trim() || "Emergency local login",
			}),
		onSuccess: async (res: AdminAuthSettingsResponse) => {
			const nextMode = String(res.primaryProvider ?? "local");
			toast.success("Authentication mode updated", {
				description: `Primary provider: ${nextMode}`,
			});
			await Promise.all([
				authSettingsQ.refetch(),
				queryClient.invalidateQueries({ queryKey: queryKeys.uiConfig() }),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update authentication mode", {
				description: (e as Error).message,
			});
		},
	});
	useEffect(() => {
		const data = oidcSettingsQ.data;
		if (!data) return;
		setOidcEnabledDraft(Boolean(data.enabled));
		setOidcIssuerDraft(String(data.issuerUrl ?? ""));
		setOidcDiscoveryDraft(String(data.discoveryUrl ?? ""));
		setOidcClientIDDraft(String(data.clientId ?? ""));
		setOidcClientSecretDraft("");
		setOidcRedirectDraft(String(data.redirectUrl ?? ""));
	}, [oidcSettingsQ.data]);
	const saveOIDCSettings = useMutation({
		mutationFn: async () =>
			putAdminOIDCSettings({
				enabled: oidcEnabledDraft,
				issuerUrl: oidcIssuerDraft.trim(),
				discoveryUrl: oidcDiscoveryDraft.trim(),
				clientId: oidcClientIDDraft.trim(),
				clientSecret: oidcClientSecretDraft.trim(),
				redirectUrl: oidcRedirectDraft.trim(),
			}),
		onSuccess: async (res: AdminOIDCSettingsResponse) => {
			toast.success("OIDC settings updated", {
				description: res.enabled ? "OIDC is enabled" : "OIDC is disabled",
			});
			setOidcClientSecretDraft("");
			await Promise.all([
				oidcSettingsQ.refetch(),
				authSettingsQ.refetch(),
				queryClient.invalidateQueries({ queryKey: queryKeys.uiConfig() }),
			]);
		},
		onError: (e) => {
			toast.error("Failed to update OIDC settings", {
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
	const impersonateUserOptions = useMemo(() => {
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
		const current = String(impersonateStatusQ.data?.effectiveUsername ?? "").trim();
		if (current) users.delete(current);
		return Array.from(users).sort((a, b) => a.localeCompare(b));
	}, [allUserScopes, impersonateStatusQ.data?.effectiveUsername]);
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

	const [rbacUserQuery, setRbacUserQuery] = useState("");
	const [rbacTargetUser, setRbacTargetUser] = useState("");
	const [rbacTargetRole, setRbacTargetRole] = useState("ADMIN");
	const [apiPermTargetUser, setApiPermTargetUser] = useState("");
	const [apiPermFilter, setApiPermFilter] = useState("");
	const [apiPermDraft, setApiPermDraft] = useState<
		Record<string, "inherit" | "allow" | "deny">
	>({});
	const apiCatalogQ = useQuery({
		queryKey: queryKeys.adminApiCatalog(),
		queryFn: getAdminAPICatalog,
		enabled: isAdmin,
		staleTime: 60_000,
		retry: false,
	});
	const userApiPermsQ = useQuery({
		queryKey: queryKeys.adminUserApiPermissions(apiPermTargetUser || "none"),
		queryFn: () => getAdminUserAPIPermissions(apiPermTargetUser),
		enabled: isAdmin && apiPermTargetUser.trim().length > 0,
		staleTime: 15_000,
		retry: false,
	});
	const apiPermissionKey = (entry: {
		service: string;
		endpoint: string;
		method: string;
	}): string =>
		`${entry.service.trim()}::${entry.endpoint.trim()}::${entry.method
			.trim()
			.toUpperCase()}`;
	const availableRbacRoles = useMemo(() => {
		const roles = adminUserRolesQ.data?.availableRoles ?? [];
		const normalized = roles
			.map((role) => String(role ?? "").trim().toUpperCase())
			.filter((role) => role.length > 0);
		return normalized.length > 0 ? normalized : ["ADMIN", "USER"];
	}, [adminUserRolesQ.data?.availableRoles]);
	const rbacKnownUsers = useMemo(() => {
		const users = new Set<string>();
		for (const row of adminUserRolesQ.data?.users ?? []) {
			const username = String(row.username ?? "").trim();
			if (username) users.add(username);
		}
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
	}, [adminUserRolesQ.data?.users, allUserScopes]);
	const filteredRbacKnownUsers = useMemo(() => {
		const query = rbacUserQuery.trim().toLowerCase();
		if (!query) return rbacKnownUsers;
		return rbacKnownUsers.filter((username) =>
			username.toLowerCase().includes(query),
		);
	}, [rbacKnownUsers, rbacUserQuery]);
	useEffect(() => {
		if (!apiPermTargetUser.trim() && rbacKnownUsers.length > 0) {
			setApiPermTargetUser(rbacKnownUsers[0] ?? "");
			return;
		}
		if (
			apiPermTargetUser.trim() &&
			!rbacKnownUsers.includes(apiPermTargetUser.trim())
		) {
			setApiPermTargetUser(rbacKnownUsers[0] ?? "");
		}
	}, [rbacKnownUsers, apiPermTargetUser]);
	const filteredRbacRows = useMemo(() => {
		const query = rbacUserQuery.trim().toLowerCase();
		const rows = adminUserRolesQ.data?.users ?? [];
		if (!query) return rows;
		return rows.filter((row) =>
			String(row.username ?? "")
				.toLowerCase()
				.includes(query),
		);
	}, [adminUserRolesQ.data?.users, rbacUserQuery]);
	useEffect(() => {
		if (!availableRbacRoles.includes(rbacTargetRole)) {
			setRbacTargetRole(availableRbacRoles[0] ?? "ADMIN");
		}
	}, [availableRbacRoles, rbacTargetRole]);
	useEffect(() => {
		const permissions = userApiPermsQ.data?.permissions ?? [];
		const next: Record<string, "inherit" | "allow" | "deny"> = {};
		for (const perm of permissions) {
			const decisionRaw = String(perm.decision ?? "").trim().toLowerCase();
			if (decisionRaw !== "allow" && decisionRaw !== "deny") {
				continue;
			}
			next[
				apiPermissionKey({
					service: String(perm.service ?? ""),
					endpoint: String(perm.endpoint ?? ""),
					method: String(perm.method ?? ""),
				})
			] = decisionRaw;
		}
		setApiPermDraft(next);
	}, [userApiPermsQ.data?.permissions]);
	const filteredApiCatalogEntries = useMemo(() => {
		const entries = apiCatalogQ.data?.entries ?? [];
		const query = apiPermFilter.trim().toLowerCase();
		if (!query) {
			return entries;
		}
		return entries.filter((entry) => {
			const tags = (entry.tags ?? []).join(" ").toLowerCase();
			return (
				entry.service.toLowerCase().includes(query) ||
				entry.endpoint.toLowerCase().includes(query) ||
				entry.method.toLowerCase().includes(query) ||
				entry.path.toLowerCase().includes(query) ||
				String(entry.summary ?? "")
					.toLowerCase()
					.includes(query) ||
				tags.includes(query)
			);
		});
	}, [apiCatalogQ.data?.entries, apiPermFilter]);
	const saveUserApiPermissions = useMutation({
		mutationFn: async () => {
			if (!apiPermTargetUser.trim()) {
				throw new Error("select a target user");
			}
			const permissions: AdminUserAPIPermission[] = [];
			for (const [key, decision] of Object.entries(apiPermDraft)) {
				if (decision !== "allow" && decision !== "deny") {
					continue;
				}
				const [service, endpoint, method] = key.split("::");
				if (!service || !endpoint || !method) {
					continue;
				}
				permissions.push({
					service,
					endpoint,
					method,
					decision,
				});
			}
			return putAdminUserAPIPermissions(apiPermTargetUser, {
				permissions,
			});
		},
		onSuccess: async () => {
			toast.success("API permissions updated");
			await userApiPermsQ.refetch();
		},
		onError: (e) => {
			toast.error("Failed to update API permissions", {
				description: (e as Error).message,
			});
		},
	});
	const apiDraftOverrideCount = useMemo(
		() =>
			Object.values(apiPermDraft).filter(
				(v) => v === "allow" || v === "deny",
			).length,
		[apiPermDraft],
	);
	const upsertRbacRole = useMutation({
		mutationFn: async () =>
			upsertAdminUserRole(rbacTargetUser, { role: rbacTargetRole }),
		onSuccess: async () => {
			toast.success("Role updated");
			await Promise.all([adminUserRolesQ.refetch(), sessionQ.refetch()]);
		},
		onError: (e) => {
			toast.error("Failed to update role", {
				description: (e as Error).message,
			});
		},
	});
	const revokeRbacRole = useMutation({
		mutationFn: async (payload: { username: string; role: string }) =>
			deleteAdminUserRole(payload.username, payload.role),
		onSuccess: async () => {
			toast.success("Role removed");
			await Promise.all([adminUserRolesQ.refetch(), sessionQ.refetch()]);
		},
		onError: (e) => {
			toast.error("Failed to remove role", {
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
			void adminUserRolesQ.refetch();
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
								<CardTitle>Authentication</CardTitle>
								<CardDescription>
									Select primary login provider and emergency local access behavior.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{authSettingsQ.isLoading ? (
									<Skeleton className="h-20 w-full" />
								) : (
									<>
										<div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
											<div className="text-sm text-muted-foreground">
												Primary provider
											</div>
											<Select
												value={authProviderDraft}
												onValueChange={(value) => {
													if (value === "local" || value === "okta") {
														setAuthProviderDraft(value);
													}
												}}
												disabled={saveAuthSettings.isPending}
											>
												<SelectTrigger className="max-w-xs">
													<SelectValue placeholder="Select provider" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="local">local</SelectItem>
													<SelectItem
														value="okta"
														disabled={!authSettingsQ.data?.oidcAvailable}
													>
														okta
													</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
											<div className="text-sm text-muted-foreground">
												Break-glass local login
											</div>
											<Select
												value={breakGlassEnabledDraft ? "true" : "false"}
												onValueChange={(value) =>
													setBreakGlassEnabledDraft(value === "true")
												}
												disabled={saveAuthSettings.isPending}
											>
												<SelectTrigger className="max-w-xs">
													<SelectValue placeholder="Break-glass local login" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="false">disabled</SelectItem>
													<SelectItem value="true">enabled</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
											<div className="text-sm text-muted-foreground">
												Break-glass label
											</div>
											<Input
												value={breakGlassLabelDraft}
												onChange={(e) => setBreakGlassLabelDraft(e.target.value)}
												disabled={saveAuthSettings.isPending}
												placeholder="Emergency local login"
												className="max-w-md"
											/>
										</div>
										<div className="text-xs text-muted-foreground">
											Config default:{" "}
											{authSettingsQ.data?.configuredProvider ?? "local"} · Persisted
											override:{" "}
											{authSettingsQ.data?.persistedProvider || "none"} · Okta
											available: {authSettingsQ.data?.oidcAvailable ? "yes" : "no"}
										</div>
										<div className="flex flex-wrap gap-2">
											{(authSettingsQ.data?.providers ?? []).map((provider) => (
												<Badge
													key={provider.id}
													variant={provider.implemented ? "secondary" : "outline"}
												>
													{provider.label}
													{provider.implemented ? "" : " (coming soon)"}
												</Badge>
											))}
										</div>
										<div>
											<Button
												onClick={() => saveAuthSettings.mutate()}
												disabled={
													saveAuthSettings.isPending ||
													authSettingsQ.isLoading ||
													(authSettingsQ.data?.primaryProvider ?? "local") ===
														authProviderDraft &&
														Boolean(authSettingsQ.data?.breakGlassEnabled) ===
															breakGlassEnabledDraft &&
														String(
															authSettingsQ.data?.breakGlassLabel ??
																"Emergency local login",
														).trim() ===
															(breakGlassLabelDraft.trim() ||
																"Emergency local login")
												}
											>
												{saveAuthSettings.isPending
													? "Saving..."
													: "Save auth settings"}
											</Button>
										</div>
									</>
								)}
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>OIDC settings</CardTitle>
								<CardDescription>
									Runtime Okta/OIDC configuration. These values are stored in
									Skyforge settings (not chart-only config).
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{oidcSettingsQ.isLoading ? (
									<Skeleton className="h-28 w-full" />
								) : (
									<>
										<div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
											<div className="text-sm text-muted-foreground">Enabled</div>
											<Select
												value={oidcEnabledDraft ? "true" : "false"}
												onValueChange={(value) =>
													setOidcEnabledDraft(value === "true")
												}
												disabled={saveOIDCSettings.isPending}
											>
												<SelectTrigger className="max-w-xs">
													<SelectValue placeholder="Enable OIDC" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="false">disabled</SelectItem>
													<SelectItem value="true">enabled</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="grid gap-3 md:grid-cols-2">
											<Input
												placeholder="Issuer URL"
												value={oidcIssuerDraft}
												onChange={(e) => setOidcIssuerDraft(e.target.value)}
												disabled={saveOIDCSettings.isPending}
											/>
											<Input
												placeholder="Discovery URL (optional)"
												value={oidcDiscoveryDraft}
												onChange={(e) => setOidcDiscoveryDraft(e.target.value)}
												disabled={saveOIDCSettings.isPending}
											/>
											<Input
												placeholder="Client ID"
												value={oidcClientIDDraft}
												onChange={(e) => setOidcClientIDDraft(e.target.value)}
												disabled={saveOIDCSettings.isPending}
											/>
											<Input
												placeholder="Redirect URL"
												value={oidcRedirectDraft}
												onChange={(e) => setOidcRedirectDraft(e.target.value)}
												disabled={saveOIDCSettings.isPending}
											/>
										</div>
										<div className="space-y-2">
											<Input
												type="password"
												placeholder={
													oidcSettingsQ.data?.hasClientSecret
														? "Client secret (leave blank to keep current)"
														: "Client secret"
												}
												value={oidcClientSecretDraft}
												onChange={(e) =>
													setOidcClientSecretDraft(e.target.value)
												}
												disabled={saveOIDCSettings.isPending}
											/>
											<div className="text-xs text-muted-foreground">
												Stored client secret:{" "}
												{oidcSettingsQ.data?.hasClientSecret ? "present" : "not set"}
											</div>
										</div>
										<div>
											<Button
												onClick={() => saveOIDCSettings.mutate()}
												disabled={saveOIDCSettings.isPending}
											>
												{saveOIDCSettings.isPending
													? "Saving…"
													: "Save OIDC settings"}
											</Button>
										</div>
									</>
								)}
							</CardContent>
						</Card>

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
										<Select
											value={impersonateTarget}
											onValueChange={setImpersonateTarget}
											disabled={
												impersonateStart.isPending ||
												impersonateStatusQ.data?.impersonating
											}
										>
											<SelectTrigger className="sm:flex-1">
												<SelectValue placeholder="Select user to impersonate" />
											</SelectTrigger>
											<SelectContent>
												{impersonateUserOptions.map((username) => (
													<SelectItem key={username} value={username}>
														{username}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button
											onClick={() => impersonateStart.mutate()}
											disabled={
												impersonateStart.isPending ||
												!impersonateTarget ||
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
										Template index lookup failed. Save will still validate
										paths server-side.
									</div>
								) : null}
								<div className="space-y-3">
									{quickDeployTemplates.map((item, index) => {
										const currentTemplate = item.template.trim();
										const templateOptions =
											currentTemplate.length > 0 &&
											!availableQuickDeployTemplates.includes(currentTemplate)
												? [currentTemplate, ...availableQuickDeployTemplates]
												: availableQuickDeployTemplates;
										return (
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
												<Select
													value={item.template}
													onValueChange={(value) =>
														upsertQuickDeployTemplateField(
															index,
															"template",
															value,
														)
													}
												>
													<SelectTrigger className="mt-2">
														<SelectValue placeholder="Template path (for example: EVPN/ebgp/topology.yml)" />
													</SelectTrigger>
													<SelectContent>
														{templateOptions.map((path) => (
															<SelectItem key={path} value={path}>
																{path}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
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
										);
									})}
								</div>
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
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Shield className="h-5 w-5" />
									RBAC role assignments
								</CardTitle>
								<CardDescription>
									Assign direct roles to users. Effective roles include config
									admin users plus direct grants.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Input
									placeholder="Filter users…"
									value={rbacUserQuery}
									onChange={(e) => setRbacUserQuery(e.target.value)}
								/>
								<div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
									<Select value={rbacTargetUser} onValueChange={setRbacTargetUser}>
										<SelectTrigger>
											<SelectValue placeholder="Select user…" />
										</SelectTrigger>
										<SelectContent>
											{filteredRbacKnownUsers.length > 0 ? (
												filteredRbacKnownUsers.map((username) => (
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
									<Select value={rbacTargetRole} onValueChange={setRbacTargetRole}>
										<SelectTrigger>
											<SelectValue placeholder="Role" />
										</SelectTrigger>
										<SelectContent>
											{availableRbacRoles.map((role) => (
												<SelectItem key={role} value={role}>
													{role}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										onClick={() => upsertRbacRole.mutate()}
										disabled={
											!rbacTargetUser.trim() ||
											!rbacTargetRole.trim() ||
											upsertRbacRole.isPending
										}
									>
										{upsertRbacRole.isPending ? "Saving…" : "Assign role"}
									</Button>
								</div>

								{adminUserRolesQ.isLoading ? (
									<Skeleton className="h-28 w-full" />
								) : filteredRbacRows.length === 0 ? (
									<EmptyState
										title="No users"
										description="No users available for RBAC assignment."
									/>
								) : (
									<div className="space-y-3">
										{filteredRbacRows.map((row) => {
											const username = String(row.username ?? "").trim();
											const directRoles = row.directRoles ?? [];
											const effectiveRoles = row.effectiveRoles ?? [];
											return (
												<div
													key={username}
													className="rounded-md border p-3 text-sm"
												>
													<div className="mb-2 flex flex-wrap items-center gap-2">
														<span className="font-medium">{username}</span>
														{row.isConfigAdmin ? (
															<Badge variant="outline">config-admin</Badge>
														) : null}
														{row.isAdmin ? (
															<Badge variant="secondary">admin</Badge>
														) : null}
													</div>
													<div className="space-y-2">
														<div className="flex flex-wrap items-center gap-2">
															<span className="text-xs text-muted-foreground">
																Direct:
															</span>
															{directRoles.length > 0 ? (
																directRoles.map((role) => (
																	<div
																		key={`${username}-direct-${role}`}
																		className="inline-flex items-center gap-1"
																	>
																		<Badge variant="outline">{role}</Badge>
																		<Button
																			variant="ghost"
																			size="sm"
																			className="h-6 px-2"
																			disabled={revokeRbacRole.isPending}
																			onClick={() =>
																				revokeRbacRole.mutate({
																					username,
																					role: String(role),
																				})
																			}
																		>
																			Remove
																		</Button>
																	</div>
																))
															) : (
																<span className="text-xs text-muted-foreground">
																	none
																</span>
															)}
														</div>
														<div className="flex flex-wrap items-center gap-2">
															<span className="text-xs text-muted-foreground">
																Effective:
															</span>
															{effectiveRoles.length > 0 ? (
																effectiveRoles.map((role) => (
																	<Badge
																		key={`${username}-effective-${role}`}
																		variant="secondary"
																	>
																		{role}
																	</Badge>
																))
															) : (
																<span className="text-xs text-muted-foreground">
																	none
																</span>
															)}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>API permission overrides</CardTitle>
								<CardDescription>
									Explicit per-user endpoint permissions layered on top of role
									access. Use allow/deny only where needed.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid gap-2 md:grid-cols-[280px_1fr_auto]">
									<Select
										value={apiPermTargetUser}
										onValueChange={setApiPermTargetUser}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select user…" />
										</SelectTrigger>
										<SelectContent>
											{rbacKnownUsers.length > 0 ? (
												rbacKnownUsers.map((username) => (
													<SelectItem key={username} value={username}>
														{username}
													</SelectItem>
												))
											) : (
												<div className="px-2 py-1.5 text-sm text-muted-foreground">
													No users available
												</div>
											)}
										</SelectContent>
									</Select>
									<Input
										placeholder="Filter APIs by service, endpoint, path, tag…"
										value={apiPermFilter}
										onChange={(e) => setApiPermFilter(e.target.value)}
									/>
									<div className="flex items-center justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => {
												void userApiPermsQ.refetch();
											}}
											disabled={
												userApiPermsQ.isFetching || !apiPermTargetUser.trim()
											}
										>
											Reload
										</Button>
										<Button
											onClick={() => saveUserApiPermissions.mutate()}
											disabled={
												!apiPermTargetUser.trim() ||
												saveUserApiPermissions.isPending
											}
										>
											{saveUserApiPermissions.isPending
												? "Saving…"
												: "Save API permissions"}
										</Button>
									</div>
								</div>
								<div className="text-xs text-muted-foreground">
									Overrides for <span className="font-mono">{apiPermTargetUser || "—"}</span>:{" "}
									{apiDraftOverrideCount} explicit entries.
								</div>
								{apiCatalogQ.isLoading || userApiPermsQ.isLoading ? (
									<Skeleton className="h-40 w-full" />
								) : filteredApiCatalogEntries.length === 0 ? (
									<EmptyState
										title="No API endpoints"
										description="No catalog entries match the current filter."
									/>
								) : (
									<div className="max-h-[520px] overflow-auto rounded-md border">
										<table className="w-full text-sm">
											<thead className="sticky top-0 bg-muted/70">
												<tr>
													<th className="px-3 py-2 text-left font-medium">
														Service.Endpoint
													</th>
													<th className="px-3 py-2 text-left font-medium">
														Method
													</th>
													<th className="px-3 py-2 text-left font-medium">
														Path
													</th>
													<th className="px-3 py-2 text-left font-medium">
														Access
													</th>
												</tr>
											</thead>
											<tbody>
												{filteredApiCatalogEntries.map((entry) => {
													const key = apiPermissionKey(entry);
													const decision = apiPermDraft[key] ?? "inherit";
													return (
														<tr key={key} className="border-t align-top">
															<td className="px-3 py-2">
																<div className="font-mono text-xs">
																	{entry.service}.{entry.endpoint}
																</div>
																{entry.summary ? (
																	<div className="text-xs text-muted-foreground">
																		{entry.summary}
																	</div>
																) : null}
															</td>
															<td className="px-3 py-2">
																<Badge variant="outline">{entry.method}</Badge>
															</td>
															<td className="px-3 py-2 font-mono text-xs text-muted-foreground">
																{entry.path}
															</td>
															<td className="px-3 py-2">
																<select
																	className="h-8 rounded-md border bg-background px-2 text-xs"
																	value={decision}
																	onChange={(e) => {
																		const nextDecision = e.target.value as
																			| "inherit"
																			| "allow"
																			| "deny";
																		setApiPermDraft((prev) => {
																			if (nextDecision === "inherit") {
																				const next = { ...prev };
																				delete next[key];
																				return next;
																			}
																			return { ...prev, [key]: nextDecision };
																		});
																	}}
																>
																	<option value="inherit">inherit</option>
																	<option value="allow">allow</option>
																	<option value="deny">deny</option>
																</select>
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>
								)}
							</CardContent>
						</Card>

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
