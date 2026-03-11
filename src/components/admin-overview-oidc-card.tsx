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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";

export function AdminOverviewOIDCCard(props: AdminOverviewTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>OIDC settings</CardTitle>
				<CardDescription>
					Runtime Okta/OIDC configuration. These values are stored in Skyforge
					settings (not chart-only config).
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{props.oidcSettingsLoading ? (
					<Skeleton className="h-28 w-full" />
				) : (
					<>
						<div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
							<div className="text-sm text-muted-foreground">Enabled</div>
							<Select
								value={props.oidcEnabledDraft ? "true" : "false"}
								onValueChange={(value) =>
									props.onOidcEnabledChange(value === "true")
								}
								disabled={props.saveOIDCSettingsPending}
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
								value={props.oidcIssuerDraft}
								onChange={(e) => props.onOidcIssuerChange(e.target.value)}
								disabled={props.saveOIDCSettingsPending}
							/>
							<Input
								placeholder="Discovery URL (optional)"
								value={props.oidcDiscoveryDraft}
								onChange={(e) => props.onOidcDiscoveryChange(e.target.value)}
								disabled={props.saveOIDCSettingsPending}
							/>
							<Input
								placeholder="Client ID"
								value={props.oidcClientIDDraft}
								onChange={(e) => props.onOidcClientIdChange(e.target.value)}
								disabled={props.saveOIDCSettingsPending}
							/>
							<Input
								placeholder="Redirect URL"
								value={props.oidcRedirectDraft}
								onChange={(e) => props.onOidcRedirectChange(e.target.value)}
								disabled={props.saveOIDCSettingsPending}
							/>
						</div>
						<div className="space-y-2">
							<Input
								type="password"
								placeholder={
									props.oidcSettings?.hasClientSecret
										? "Client secret (leave blank to keep current)"
										: "Client secret"
								}
								value={props.oidcClientSecretDraft}
								onChange={(e) => props.onOidcClientSecretChange(e.target.value)}
								disabled={props.saveOIDCSettingsPending}
							/>
							<div className="text-xs text-muted-foreground">
								Stored client secret:{" "}
								{props.oidcSettings?.hasClientSecret ? "present" : "not set"}
							</div>
						</div>
						<div>
							<Button
								onClick={props.onSaveOIDCSettings}
								disabled={props.saveOIDCSettingsPending}
							>
								{props.saveOIDCSettingsPending
									? "Saving…"
									: "Save OIDC settings"}
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
