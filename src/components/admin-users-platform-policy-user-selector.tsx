import type { AdminUsersSectionProps } from "./settings-section-types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type Props = Pick<
	AdminUsersSectionProps,
	| "platformPolicyUserQuery"
	| "onPlatformPolicyUserQueryChange"
	| "platformPolicySearchMatches"
	| "platformPolicySearchCount"
	| "platformPolicyTargetUser"
	| "onPlatformPolicyTargetUserChange"
	| "filteredPlatformPolicyUsers"
>;

export function AdminUsersPlatformPolicyUserSelector(props: Props) {
	return (
		<div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
			<div className="space-y-2">
				<Label htmlFor="platform-policy-user-query">User search</Label>
				<Input
					id="platform-policy-user-query"
					value={props.platformPolicyUserQuery}
					onChange={(event) =>
						props.onPlatformPolicyUserQueryChange(event.target.value)
				}
					placeholder="Find a user"
				/>
				<div className="text-xs text-muted-foreground">
					{props.platformPolicySearchCount > 0
						? `${props.platformPolicySearchCount} matching users`
						: "No matching users"}
				</div>
				{props.platformPolicySearchMatches.length > 0 ? (
					<div className="flex flex-wrap gap-2 pt-1">
						{props.platformPolicySearchMatches.map((candidate) => (
							<Button
								key={candidate}
								type="button"
								size="sm"
								variant={
									candidate === props.platformPolicyTargetUser
										? "default"
										: "outline"
								}
								onClick={() =>
									props.onPlatformPolicyTargetUserChange(candidate)
								}
							>
								{candidate}
							</Button>
						))}
					</div>
				) : null}
			</div>
			<div className="space-y-2">
				<Label htmlFor="platform-policy-target-user">Target user</Label>
				<Select
					value={props.platformPolicyTargetUser}
					onValueChange={props.onPlatformPolicyTargetUserChange}
				>
					<SelectTrigger id="platform-policy-target-user">
						<SelectValue placeholder="Select user" />
					</SelectTrigger>
					<SelectContent>
						{props.filteredPlatformPolicyUsers.map((username) => (
							<SelectItem key={username} value={username}>
								{username}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
