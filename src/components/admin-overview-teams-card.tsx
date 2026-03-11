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
import { Switch } from "./ui/switch";

export function AdminOverviewTeamsCard(props: AdminOverviewTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Teams Bridge</CardTitle>
				<CardDescription>
					Global bridge settings for Skyforge-managed Teams-like inbound and
					outbound workflows.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between rounded-md border p-3">
					<div>
						<div className="font-medium">Enable Teams bridge</div>
						<div className="text-xs text-muted-foreground">
							Controls whether Teams pages and server endpoints are active.
						</div>
					</div>
					<Switch
						checked={props.teamsEnabledDraft}
						onCheckedChange={props.onTeamsEnabledChange}
					/>
				</div>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label>Display name</Label>
						<Input
							value={props.teamsDisplayNameDraft}
							onChange={(e) => props.onTeamsDisplayNameChange(e.target.value)}
							placeholder="Demo Teams tenant"
						/>
					</div>
					<div className="space-y-2">
						<Label>Public base URL</Label>
						<Input
							value={props.teamsPublicBaseURLDraft}
							onChange={(e) => props.onTeamsPublicBaseURLChange(e.target.value)}
							placeholder="https://skyforge.local.forwardnetworks.com"
						/>
					</div>
					<div className="space-y-2">
						<Label>Inbound shared secret</Label>
						<Input
							type="password"
							value={props.teamsInboundSecretDraft}
							onChange={(e) => props.onTeamsInboundSecretChange(e.target.value)}
							placeholder={
								props.teamsGlobalConfig?.hasInboundSharedSecret
									? "(leave blank to keep stored)"
									: ""
							}
						/>
					</div>
					<div className="space-y-2">
						<Label>Test outbound webhook URL</Label>
						<Input
							value={props.teamsTestWebhookURLDraft}
							onChange={(e) =>
								props.onTeamsTestWebhookURLChange(e.target.value)
							}
							placeholder="https://example.test/webhook"
						/>
					</div>
				</div>
				<div className="text-xs text-muted-foreground space-y-1">
					<div>
						Status:{" "}
						{props.teamsGlobalConfigLoading
							? "loading"
							: props.teamsGlobalConfig?.configured
								? "configured"
								: "not configured"}
					</div>
					{props.teamsGlobalConfig?.callbackUrl ? (
						<div>
							Callback URL: <code>{props.teamsGlobalConfig.callbackUrl}</code>
						</div>
					) : null}
				</div>
				<div className="flex items-center gap-2 flex-wrap">
					<Button
						onClick={props.onSaveTeamsGlobalConfig}
						disabled={props.saveTeamsGlobalConfigPending}
					>
						Save Teams settings
					</Button>
					<Button
						variant="secondary"
						onClick={props.onTestTeamsOutgoing}
						disabled={props.testTeamsOutgoingPending}
					>
						Send test message
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
