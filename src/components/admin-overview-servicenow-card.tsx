import type { AdminOverviewTabProps } from "./admin-settings-tab-types";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AdminOverviewServiceNowCard(props: AdminOverviewTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>ServiceNow Global Integration</CardTitle>
				<CardDescription>
					Global PDI settings and shared app installation controls.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Instance URL</Label>
						<Input
							value={props.serviceNowInstanceURLDraft}
							onChange={(e) =>
								props.onServiceNowInstanceURLChange(e.target.value)
							}
							placeholder="https://dev12345.service-now.com"
						/>
					</div>
					<div className="space-y-2">
						<Label>Admin username</Label>
						<Input
							value={props.serviceNowAdminUsernameDraft}
							onChange={(e) =>
								props.onServiceNowAdminUsernameChange(e.target.value)
							}
							placeholder="admin"
						/>
					</div>
					<div className="space-y-2">
						<Label>Admin password</Label>
						<Input
							type="password"
							value={props.serviceNowAdminPasswordDraft}
							onChange={(e) =>
								props.onServiceNowAdminPasswordChange(e.target.value)
							}
							placeholder={
								props.serviceNowGlobalConfig?.hasAdminPassword
									? "(leave blank to keep stored)"
									: ""
							}
						/>
					</div>
				</div>
				<div className="text-xs text-muted-foreground">
					User-specific Forward bindings are provisioned during each user's
					ServiceNow setup. Shared asset installation does not use an admin
					Forward credential set.
				</div>
				<div className="text-xs text-muted-foreground">
					Current status:{" "}
					{props.serviceNowGlobalConfigLoading
						? "loading"
						: props.serviceNowGlobalConfig?.configured
							? "configured"
							: "not configured"}
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<Button
						onClick={props.onSaveServiceNowGlobalConfig}
						disabled={props.saveServiceNowGlobalConfigPending}
					>
						Save global settings
					</Button>
					<Button
						variant="secondary"
						onClick={props.onPushServiceNowForwardConfig}
						disabled={
							props.pushServiceNowForwardConfigPending ||
							!props.serviceNowGlobalConfig?.configured
						}
					>
						Install shared app assets
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
