import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
	dashboardModeGuidanceEntryID,
	formatCount,
	formatMode,
	QuotaTile,
	titleize,
} from "./dashboard-shared";

export function DashboardPolicySummaryCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const policy = page.platformAvailability?.policy;
	const operatingModes = policy?.operatingModes ?? [];
	const primaryOperatingMode = policy?.primaryOperatingMode;
	const modeGuidance = policy
		? page.dashboardContent.find(
				(entry) =>
					entry.id === dashboardModeGuidanceEntryID(primaryOperatingMode),
			)
		: null;
	if (policy && !modeGuidance) {
		throw new Error(
			`dashboard content entry ${dashboardModeGuidanceEntryID(primaryOperatingMode)} is missing`,
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Policy summary</CardTitle>
				<CardDescription>
					Effective profiles and launch ceilings for this account.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{policy ? (
					<>
						<div className="space-y-2">
							<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Operating mode
							</div>
							<div className="flex flex-wrap gap-2">
								{primaryOperatingMode ? (
									<Badge>{formatMode(primaryOperatingMode)}</Badge>
								) : null}
								{operatingModes
									.filter((mode: string) => mode !== primaryOperatingMode)
									.map((mode: string) => (
										<Badge key={mode} variant="outline">
											{formatMode(mode)}
										</Badge>
									))}
							</div>
							<div className="text-sm text-muted-foreground">
								{modeGuidance?.description}
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
						<div className="grid gap-3 sm:grid-cols-2">
							<QuotaTile
								label="Max resource class"
								value={policy.quota.maxResourceClass || "small"}
							/>
							<QuotaTile
								label="Max persistent hours"
								value={formatCount(policy.quota.maxPersistentHours)}
							/>
						</div>
						<div className="space-y-2">
							<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Capabilities
							</div>
							<div className="flex flex-wrap gap-2">
								{policy.capabilities.map((capability) => (
									<Badge key={capability}>{titleize(capability)}</Badge>
								))}
							</div>
						</div>
					</>
				) : (
					<div className="text-sm text-muted-foreground">
						Policy is still loading.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
