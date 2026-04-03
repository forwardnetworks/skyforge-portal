import { UserCog } from "lucide-react";
import type { AdminUsersSectionProps } from "./settings-section-types";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export function AdminUsersManagementCard(props: AdminUsersSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UserCog className="h-5 w-5" />
					User management
				</CardTitle>
				<CardDescription>
					Add or remove users from the Skyforge directory. Use purge for full
					state reset.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-2 md:grid-cols-[1fr_180px_auto]">
					<Input
						placeholder="username (e.g. jane.doe)"
						value={props.manageUsername}
						onChange={(e) => props.onManageUsernameChange(e.target.value)}
					/>
					<Select
						value={props.manageInitialRole}
						onValueChange={props.onManageInitialRoleChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Initial role" />
						</SelectTrigger>
						<SelectContent>
							{props.availableRbacRoles.map((role) => (
								<SelectItem key={`manage-role-${role}`} value={role}>
									{role}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						onClick={props.onCreateManagedUser}
						disabled={
							!props.manageUsername.trim() || props.createManagedUserPending
						}
					>
						{props.createManagedUserPending ? "Adding…" : "Add user"}
					</Button>
				</div>
				<div className="flex items-center justify-between rounded-md border p-3">
					<div>
						<div className="text-sm font-medium">
							Pre-provision default user scope
						</div>
						<div className="text-xs text-muted-foreground">
							Create the user scope now so Okta users can be targeted before
							first login.
						</div>
					</div>
					<Switch
						checked={props.manageProvisionDefaultUserScope}
						onCheckedChange={props.onManageProvisionDefaultUserScopeChange}
					/>
				</div>

				<div className="space-y-2 rounded-md border p-3">
					<div className="text-sm font-medium">Delete user</div>
					<Input
						placeholder="Filter users…"
						value={props.deleteManagedUserQuery}
						onChange={(e) =>
							props.onDeleteManagedUserQueryChange(e.target.value)
						}
					/>
					<div className="grid gap-2 md:grid-cols-[1fr_auto]">
						<Select
							value={props.deleteManagedUser}
							onValueChange={props.onDeleteManagedUserChange}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select user…" />
							</SelectTrigger>
							<SelectContent>
								{props.filteredManagedDeleteUsers.length > 0 ? (
									props.filteredManagedDeleteUsers.map((username) => (
										<SelectItem
											key={`delete-user-${username}`}
											value={username}
										>
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
							onClick={props.onDeleteManagedUser}
							disabled={
								!props.deleteManagedUser.trim() ||
								props.deleteManagedUserPending
							}
						>
							{props.deleteManagedUserPending ? "Deleting…" : "Delete user"}
						</Button>
					</div>
					<div className="text-xs text-muted-foreground">
						Delete removes directory + direct RBAC/API overrides. If user owns
						scopes, use purge.
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
