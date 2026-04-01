import type { AdminIdentitySectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
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

export function AdminOverviewAuthCard(props: AdminIdentitySectionProps) {
	const authSaveDisabled =
		props.saveAuthSettingsPending ||
		props.authSettingsLoading ||
		((props.authSettings?.primaryProvider ?? "local") ===
			props.authProviderDraft &&
			Boolean(props.authSettings?.breakGlassEnabled) ===
				props.breakGlassEnabledDraft &&
			String(
				props.authSettings?.breakGlassLabel ?? "Emergency local login",
			).trim() ===
				(props.breakGlassLabelDraft.trim() || "Emergency local login"));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Authentication</CardTitle>
				<CardDescription>
					Select primary login provider and emergency local access behavior.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{props.authSettingsLoading ? (
					<Skeleton className="h-20 w-full" />
				) : (
					<>
						<div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
							<div className="text-sm text-muted-foreground">
								Primary provider
							</div>
							<Select
								value={props.authProviderDraft}
								onValueChange={(value) => {
									if (value === "local" || value === "okta") {
										props.onAuthProviderChange(value);
									}
								}}
								disabled={props.saveAuthSettingsPending}
							>
								<SelectTrigger className="max-w-xs">
									<SelectValue placeholder="Select provider" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="local">local</SelectItem>
									<SelectItem
										value="okta"
										disabled={!props.authSettings?.oidcAvailable}
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
								value={props.breakGlassEnabledDraft ? "true" : "false"}
								onValueChange={(value) =>
									props.onBreakGlassEnabledChange(value === "true")
								}
								disabled={props.saveAuthSettingsPending}
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
								value={props.breakGlassLabelDraft}
								onChange={(e) => props.onBreakGlassLabelChange(e.target.value)}
								disabled={props.saveAuthSettingsPending}
								placeholder="Emergency local login"
								className="max-w-md"
							/>
						</div>
						<div className="text-xs text-muted-foreground">
							Config default:{" "}
							{props.authSettings?.configuredProvider ?? "local"} · Active
							provider: {props.authSettings?.primaryProvider ?? "local"} · Okta
							available: {props.authSettings?.oidcAvailable ? "yes" : "no"}
						</div>
						<div className="flex flex-wrap gap-2">
							{(props.authSettings?.providers ?? []).map((provider) => (
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
								onClick={props.onSaveAuthSettings}
								disabled={authSaveDisabled}
							>
								{props.saveAuthSettingsPending
									? "Saving..."
									: "Save auth settings"}
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
