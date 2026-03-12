import type { UserSettingsPageState } from "./user-settings-types";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

function formatMode(value: string | null | undefined): string {
	if (!value) return "unreported";
	return value.replace(/[-_]/g, " ");
}

export function UserSettingsPlatformPolicyCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;
	const policy = page.currentPlatformPolicyQ.data;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Platform Policy</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Your effective launch, reservation, persistence, and tenant reset
					policy.
				</p>
				{page.currentPlatformPolicyQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading policy…</div>
				) : page.currentPlatformPolicyQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load effective platform policy.
					</div>
				) : policy ? (
					<div className="space-y-4">
						<div className="space-y-2">
							<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Operating mode
							</div>
							<div className="flex flex-wrap gap-2">
								{policy.primaryOperatingMode ? (
									<Badge>{formatMode(policy.primaryOperatingMode)}</Badge>
								) : null}
								{(policy.operatingModes ?? [])
									.filter((mode: string) => mode !== policy.primaryOperatingMode)
									.map((mode: string) => (
										<Badge key={mode} variant="outline">
											{formatMode(mode)}
										</Badge>
									))}
								{!policy.primaryOperatingMode &&
								(policy.operatingModes ?? []).length === 0 ? (
									<span className="text-sm text-muted-foreground">Unreported</span>
								) : null}
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Profiles
							</div>
							<div className="flex flex-wrap gap-2">
								{policy.profiles.length > 0 ? (
									policy.profiles.map((profile) => (
										<Badge key={profile} variant="outline">
											{profile}
										</Badge>
									))
								) : (
									<span className="text-sm text-muted-foreground">None</span>
								)}
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
							<QuotaStat
								label="Max concurrent labs"
								value={policy.quota.maxConcurrentLabs}
							/>
							<QuotaStat
								label="Max persistent labs"
								value={policy.quota.maxPersistentLabs}
							/>
							<QuotaStat
								label="Max persistent hours"
								value={policy.quota.maxPersistentHours}
							/>
							<QuotaStat
								label="Max resource class"
								value={policy.quota.maxResourceClass || "small"}
							/>
						</div>
						<div className="space-y-2">
							<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Capabilities
							</div>
							<div className="flex flex-wrap gap-2">
								{policy.capabilities.length > 0 ? (
									policy.capabilities.map((capability) => (
										<Badge key={capability}>{capability}</Badge>
									))
								) : (
									<span className="text-sm text-muted-foreground">None</span>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="text-sm text-muted-foreground">
						No platform policy resolved.
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function QuotaStat(props: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border border-border/60 bg-background/60 p-3">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{props.label}
			</div>
			<div className="mt-1 text-lg font-semibold">{props.value}</div>
		</div>
	);
}
