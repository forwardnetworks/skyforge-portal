import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	type AdminPlatformRoleProfileDefinition,
	type AdminUserAPIPermission,
	getAdminAPICatalog,
	getAdminPlatformRoleProfiles,
	getAdminRoleAPIPermissions,
	putAdminPlatformRoleProfile,
	putAdminRoleAPIPermissions,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { EmptyState } from "./ui/empty-state";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";

const editableCapabilities = [
	"view_curated_catalog",
	"launch_curated_templates",
	"launch_custom_templates",
	"persist_lab_state",
	"reserve_future_capacity",
	"manage_integrations",
	"manage_platform_operations",
	"impersonate_users",
	"manage_users_roles",
	"override_reservations",
	"reset_own_forward_tenant",
	"reset_curated_forward_tenant",
	"manage_testdrive_tenants",
];

const editableOperatingModes = [
	"curated-demo",
	"training",
	"sandbox",
	"persistent-integration",
	"admin-advanced",
];

const editableResourceClasses = ["small", "standard", "heavy", "demo-foundry"];

type ApiDecision = "allow" | "deny";

function apiPermissionKey(entry: {
	service: string;
	endpoint: string;
	method: string;
}) {
	return `${entry.service}::${entry.endpoint}::${entry.method}`;
}

function draftFromPermissions(
	permissions: AdminUserAPIPermission[] | undefined,
): Record<string, ApiDecision> {
	const out: Record<string, ApiDecision> = {};
	for (const permission of permissions ?? []) {
		const decision = String(permission.decision ?? "")
			.trim()
			.toLowerCase();
		if (decision !== "allow" && decision !== "deny") continue;
		out[
			apiPermissionKey({
				service: String(permission.service ?? ""),
				endpoint: String(permission.endpoint ?? ""),
				method: String(permission.method ?? ""),
			})
		] = decision;
	}
	return out;
}

function cloneRoleProfile(
	profile: AdminPlatformRoleProfileDefinition | undefined,
): AdminPlatformRoleProfileDefinition | null {
	if (!profile) return null;
	return {
		...profile,
		quota: { ...profile.quota },
		capabilities: [...(profile.capabilities ?? [])],
		operatingModes: [...(profile.operatingModes ?? [])],
	};
}

export function AdminUsersRoleProfilesCard() {
	const queryClient = useQueryClient();
	const [selectedProfile, setSelectedProfile] = useState("");
	const [draft, setDraft] = useState<AdminPlatformRoleProfileDefinition | null>(
		null,
	);
	const [apiFilter, setApiFilter] = useState("");
	const [apiDraft, setApiDraft] = useState<Record<string, ApiDecision>>({});

	const profilesQ = useQuery({
		queryKey: queryKeys.adminPlatformRoleProfiles(),
		queryFn: getAdminPlatformRoleProfiles,
		staleTime: 30_000,
		retry: false,
	});
	const apiCatalogQ = useQuery({
		queryKey: queryKeys.adminApiCatalog(),
		queryFn: getAdminAPICatalog,
		staleTime: 60_000,
		retry: false,
	});
	const roleApiPermsQ = useQuery({
		queryKey: queryKeys.adminRoleApiPermissions(selectedProfile || "none"),
		queryFn: () => getAdminRoleAPIPermissions(selectedProfile),
		enabled: selectedProfile.trim().length > 0,
		staleTime: 15_000,
		retry: false,
	});

	const profiles = profilesQ.data?.profiles ?? [];
	const selectedDefinition = useMemo(
		() => profiles.find((item) => item.profile === selectedProfile),
		[profiles, selectedProfile],
	);

	useEffect(() => {
		if (!selectedProfile && profiles.length > 0) {
			setSelectedProfile(profiles[0]?.profile ?? "");
		}
	}, [profiles, selectedProfile]);

	useEffect(() => {
		setDraft(cloneRoleProfile(selectedDefinition));
	}, [selectedDefinition]);

	useEffect(() => {
		setApiDraft(draftFromPermissions(roleApiPermsQ.data?.permissions));
	}, [roleApiPermsQ.data?.permissions]);

	const filteredApiEntries = useMemo(() => {
		const q = apiFilter.trim().toLowerCase();
		const entries = apiCatalogQ.data?.entries ?? [];
		if (!q) return entries;
		return entries.filter((entry) => {
			const tags = (entry.tags ?? []).join(" ").toLowerCase();
			return (
				entry.service.toLowerCase().includes(q) ||
				entry.endpoint.toLowerCase().includes(q) ||
				entry.method.toLowerCase().includes(q) ||
				entry.path.toLowerCase().includes(q) ||
				String(entry.summary ?? "")
					.toLowerCase()
					.includes(q) ||
				tags.includes(q)
			);
		});
	}, [apiCatalogQ.data?.entries, apiFilter]);

	const saveProfile = useMutation({
		mutationFn: async () => {
			if (!draft) throw new Error("select a role profile");
			return putAdminPlatformRoleProfile(draft.profile, draft);
		},
		onSuccess: async () => {
			toast.success("Role profile updated");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformRoleProfiles(),
			});
			await queryClient.invalidateQueries({
				queryKey: queryKeys.adminPlatformOverview(),
			});
		},
		onError: (err) =>
			toast.error("Failed to update role profile", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const saveApiPermissions = useMutation({
		mutationFn: async () => {
			if (!selectedProfile.trim()) throw new Error("select a role profile");
			const permissions: AdminUserAPIPermission[] = [];
			for (const [key, decision] of Object.entries(apiDraft)) {
				const [service, endpoint, method] = key.split("::");
				if (!service || !endpoint || !method) continue;
				permissions.push({ service, endpoint, method, decision });
			}
			return putAdminRoleAPIPermissions(selectedProfile, { permissions });
		},
		onSuccess: async () => {
			toast.success("Role API permissions updated");
			await roleApiPermsQ.refetch();
		},
		onError: (err) =>
			toast.error("Failed to update role API permissions", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	function toggleList(
		field: "capabilities" | "operatingModes",
		value: string,
		enabled: boolean,
	) {
		setDraft((prev) => {
			if (!prev) return prev;
			const current = new Set(prev[field] ?? []);
			if (enabled) current.add(value);
			else current.delete(value);
			return { ...prev, [field]: Array.from(current) };
		});
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Role profiles</CardTitle>
				<CardDescription>
					Admin-managed capability bundles, quotas, and endpoint policy for each
					platform role. Per-user API overrides still win over role policy.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-3 md:grid-cols-[280px_1fr_auto]">
					<Select value={selectedProfile} onValueChange={setSelectedProfile}>
						<SelectTrigger>
							<SelectValue placeholder="Select role profile" />
						</SelectTrigger>
						<SelectContent>
							{profiles.map((profile) => (
								<SelectItem key={profile.profile} value={profile.profile}>
									{profile.displayName || profile.profile}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="flex flex-wrap items-center gap-2">
						{selectedDefinition?.defaultForNewUsers ? (
							<Badge>Default for new users</Badge>
						) : null}
						{selectedDefinition?.system ? (
							<Badge variant="outline">System</Badge>
						) : null}
						{selectedDefinition?.enabled === false ? (
							<Badge variant="destructive">Disabled</Badge>
						) : null}
					</div>
					<Button
						onClick={() => saveProfile.mutate()}
						disabled={!draft || saveProfile.isPending}
					>
						{saveProfile.isPending ? "Saving…" : "Save role"}
					</Button>
				</div>
				{profilesQ.isLoading || !draft ? (
					<Skeleton className="h-40 w-full" />
				) : (
					<div className="grid gap-6 xl:grid-cols-2">
						<div className="space-y-4 rounded-lg border p-4">
							<div className="grid gap-3 md:grid-cols-2">
								<div className="space-y-1 text-sm">
									<span className="text-muted-foreground">Display name</span>
									<Input
										value={draft.displayName}
										onChange={(e) =>
											setDraft((prev) =>
												prev ? { ...prev, displayName: e.target.value } : prev,
											)
										}
									/>
								</div>
								<div className="space-y-1 text-sm">
									<span className="text-muted-foreground">Sort order</span>
									<Input
										value={String(draft.sortOrder ?? 0)}
										onChange={(e) =>
											setDraft((prev) =>
												prev
													? {
															...prev,
															sortOrder:
																Number.parseInt(e.target.value, 10) || 0,
														}
													: prev,
											)
										}
									/>
								</div>
							</div>
							<div className="space-y-1 text-sm">
								<span className="text-muted-foreground">Description</span>
								<Input
									value={draft.description}
									onChange={(e) =>
										setDraft((prev) =>
											prev ? { ...prev, description: e.target.value } : prev,
										)
									}
								/>
							</div>
							<div className="flex flex-wrap gap-4 text-sm">
								<div className="flex items-center gap-2">
									<Checkbox
										checked={draft.enabled}
										onCheckedChange={(next) =>
											setDraft((prev) =>
												prev ? { ...prev, enabled: Boolean(next) } : prev,
											)
										}
									/>
									Enabled
								</div>
								<div className="flex items-center gap-2">
									<Checkbox
										checked={draft.defaultForNewUsers}
										onCheckedChange={(next) =>
											setDraft((prev) =>
												prev
													? { ...prev, defaultForNewUsers: Boolean(next) }
													: prev,
											)
										}
									/>
									Default for new users
								</div>
							</div>
							<div className="grid gap-3 md:grid-cols-2">
								{[
									["maxConcurrentLabs", "Concurrent labs"],
									["maxPersistentLabs", "Persistent labs"],
									["maxPersistentHours", "Persistent hours"],
								].map(([field, label]) => (
									<div key={field} className="space-y-1 text-sm">
										<span className="text-muted-foreground">{label}</span>
										<Input
											value={String(
												draft.quota[field as keyof typeof draft.quota] ?? 0,
											)}
											onChange={(e) =>
												setDraft((prev) =>
													prev
														? {
																...prev,
																quota: {
																	...prev.quota,
																	[field]:
																		Number.parseInt(e.target.value, 10) || 0,
																},
															}
														: prev,
												)
											}
										/>
									</div>
								))}
								<div className="space-y-1 text-sm">
									<span className="text-muted-foreground">
										Max resource class
									</span>
									<Select
										value={draft.quota.maxResourceClass}
										onValueChange={(value) =>
											setDraft((prev) =>
												prev
													? {
															...prev,
															quota: { ...prev.quota, maxResourceClass: value },
														}
													: prev,
											)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{editableResourceClasses.map((value) => (
												<SelectItem key={value} value={value}>
													{value}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
						<div className="space-y-4 rounded-lg border p-4">
							<div className="text-sm font-medium">Capabilities</div>
							<div className="grid gap-2 md:grid-cols-2">
								{editableCapabilities.map((capability) => (
									<div
										key={capability}
										className="flex items-start gap-2 text-sm"
									>
										<Checkbox
											checked={(draft.capabilities ?? []).includes(capability)}
											onCheckedChange={(next) =>
												toggleList("capabilities", capability, Boolean(next))
											}
										/>
										<span className="font-mono text-xs">{capability}</span>
									</div>
								))}
							</div>
							<div className="text-sm font-medium">Operating modes</div>
							<div className="grid gap-2 md:grid-cols-2">
								{editableOperatingModes.map((mode) => (
									<div key={mode} className="flex items-start gap-2 text-sm">
										<Checkbox
											checked={(draft.operatingModes ?? []).includes(mode)}
											onCheckedChange={(next) =>
												toggleList("operatingModes", mode, Boolean(next))
											}
										/>
										<span className="font-mono text-xs">{mode}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				)}
				<div className="space-y-3 rounded-lg border p-4">
					<div className="grid gap-3 md:grid-cols-[1fr_auto]">
						<Input
							placeholder="Filter role API permissions by service, endpoint, path, tag…"
							value={apiFilter}
							onChange={(e) => setApiFilter(e.target.value)}
						/>
						<Button
							onClick={() => saveApiPermissions.mutate()}
							disabled={!selectedProfile || saveApiPermissions.isPending}
						>
							{saveApiPermissions.isPending
								? "Saving…"
								: "Save role API permissions"}
						</Button>
					</div>
					<div className="text-xs text-muted-foreground">
						Role overrides for{" "}
						<span className="font-mono">{selectedProfile || "—"}</span>:{" "}
						{Object.keys(apiDraft).length} explicit entries.
					</div>
					{apiCatalogQ.isLoading || roleApiPermsQ.isLoading ? (
						<Skeleton className="h-40 w-full" />
					) : filteredApiEntries.length === 0 ? (
						<EmptyState
							title="No API endpoints"
							description="No catalog entries match the current filter."
						/>
					) : (
						<div className="max-h-[420px] overflow-auto rounded-md border">
							<table className="w-full text-sm">
								<thead className="sticky top-0 bg-muted/70">
									<tr>
										<th className="px-3 py-2 text-left font-medium">
											Service.Endpoint
										</th>
										<th className="px-3 py-2 text-left font-medium">Method</th>
										<th className="px-3 py-2 text-left font-medium">Path</th>
										<th className="px-3 py-2 text-left font-medium">
											Role access
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredApiEntries.map((entry) => {
										const key = apiPermissionKey(entry);
										const decision = apiDraft[key] ?? "inherit";
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
															const value = e.target.value;
															setApiDraft((prev) => {
																if (value === "inherit") {
																	const next = { ...prev };
																	delete next[key];
																	return next;
																}
																return { ...prev, [key]: value as ApiDecision };
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
				</div>
			</CardContent>
		</Card>
	);
}
