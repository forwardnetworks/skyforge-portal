import { Shield, UserCog } from "lucide-react";
import type { AdminOverviewTabProps } from "./admin-settings-tab-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

export function AdminOverviewImpersonationCard(props: AdminOverviewTabProps) {
	return (
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
							{props.impersonateStatus?.actorUsername ||
								props.sessionUsername ||
								"—"}
						</span>
						{props.impersonateStatus?.impersonating ? (
							<>
								{" "}
								→{" "}
								<span className="font-medium">
									{props.impersonateStatus.effectiveUsername}
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
						value={props.impersonateTarget}
						onValueChange={props.onImpersonateTargetChange}
						disabled={
							props.impersonateStartPending ||
							props.impersonateStatus?.impersonating
						}
					>
						<SelectTrigger className="sm:flex-1">
							<SelectValue placeholder="Select user to impersonate" />
						</SelectTrigger>
						<SelectContent>
							{props.impersonateUserOptions.map((username) => (
								<SelectItem key={username} value={username}>
									{username}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						onClick={props.onImpersonateStart}
						disabled={
							props.impersonateStartPending ||
							!props.impersonateTarget ||
							props.impersonateStatus?.impersonating
						}
					>
						<UserCog className="mr-2 h-4 w-4" />
						Impersonate
					</Button>
					<Button
						variant="outline"
						onClick={props.onImpersonateStop}
						disabled={
							props.impersonateStopPending ||
							!props.impersonateStatus?.impersonating
						}
					>
						Stop
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
