import { Users } from "lucide-react";
import type { AdminUsersTabProps } from "./admin-settings-tab-types";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export function AdminUsersPurgeCard(props: AdminUsersTabProps) {
	return (
		<Card variant="danger">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Users className="h-5 w-5" />
					Purge user (dev-only)
				</CardTitle>
				<CardDescription>
					Removes user state and associated user scopes to rerun first-login
					bootstrap.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<Input
					placeholder="Filter users…"
					value={props.purgeUserQuery}
					onChange={(e) => props.onPurgeUserQueryChange(e.target.value)}
				/>
				<Select
					value={props.purgeUsername}
					onValueChange={props.onPurgeUsernameChange}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select user…" />
					</SelectTrigger>
					<SelectContent>
						{props.filteredPurgeUserOptions.length > 0 ? (
							props.filteredPurgeUserOptions.map((username) => (
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
					disabled={!props.purgeUsername.trim() || props.purgeUserPending}
					onClick={props.onPurgeUser}
				>
					{props.purgeUserPending ? "Purging…" : "Purge user"}
				</Button>
			</CardContent>
		</Card>
	);
}
