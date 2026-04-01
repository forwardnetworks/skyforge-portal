import { Shield } from "lucide-react";
import type { AdminUsersSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
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

export function AdminUsersRbacCard(props: AdminUsersSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Shield className="h-5 w-5" />
					RBAC role assignments
				</CardTitle>
				<CardDescription>
					Assign direct roles to users. Effective roles include config admin
					users plus direct grants.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<Input
					placeholder="Filter users…"
					value={props.rbacUserQuery}
					onChange={(e) => props.onRbacUserQueryChange(e.target.value)}
				/>
				<div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
					<Select
						value={props.rbacTargetUser}
						onValueChange={props.onRbacTargetUserChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select user…" />
						</SelectTrigger>
						<SelectContent>
							{props.filteredRbacKnownUsers.length > 0 ? (
								props.filteredRbacKnownUsers.map((username) => (
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
					<Select
						value={props.rbacTargetRole}
						onValueChange={props.onRbacTargetRoleChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Role" />
						</SelectTrigger>
						<SelectContent>
							{props.availableRbacRoles.map((role) => (
								<SelectItem key={role} value={role}>
									{role}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						onClick={props.onUpsertRbacRole}
						disabled={
							!props.rbacTargetUser.trim() ||
							!props.rbacTargetRole.trim() ||
							props.upsertRbacRolePending
						}
					>
						{props.upsertRbacRolePending ? "Saving…" : "Assign role"}
					</Button>
				</div>

				{props.adminUserRolesLoading ? (
					<Skeleton className="h-28 w-full" />
				) : props.filteredRbacRows.length === 0 ? (
					<EmptyState
						title="No users"
						description="No users available for RBAC assignment."
					/>
				) : (
					<div className="space-y-3">
						{props.filteredRbacRows.map((row) => {
							const username = String(row.username ?? "").trim();
							const directRoles = row.directRoles ?? [];
							const effectiveRoles = row.effectiveRoles ?? [];
							return (
								<div key={username} className="rounded-md border p-3 text-sm">
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
															disabled={props.revokeRbacRolePending}
															onClick={() =>
																props.onRevokeRbacRole({
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
	);
}
