import type { AdminUsersSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { formatPlatformMode, PolicyStat } from "./admin-users-platform-policy-shared";

type Props = Pick<
	AdminUsersSectionProps,
	| "platformPolicyProfiles"
	| "platformPolicyOperatingModes"
	| "platformPolicyPrimaryOperatingMode"
	| "platformPolicyCapabilities"
	| "platformPolicyQuota"
>;

export function AdminUsersPlatformPolicyEffectivePolicy(props: Props) {
	return (
		<div className="space-y-3">
			<div className="text-sm font-medium">Effective policy</div>
			<div className="flex flex-wrap gap-2">
				{props.platformPolicyPrimaryOperatingMode ? (
					<Badge>{formatPlatformMode(props.platformPolicyPrimaryOperatingMode)}</Badge>
				) : null}
				{props.platformPolicyOperatingModes
					.filter((mode) => mode !== props.platformPolicyPrimaryOperatingMode)
					.map((mode) => (
						<Badge key={mode} variant="outline">
							{formatPlatformMode(mode)}
						</Badge>
					))}
				{!props.platformPolicyPrimaryOperatingMode &&
				props.platformPolicyOperatingModes.length === 0 ? (
					<span className="text-sm text-muted-foreground">
						No operating modes
					</span>
				) : null}
			</div>
			<div className="flex flex-wrap gap-2">
				{props.platformPolicyProfiles.length > 0 ? (
					props.platformPolicyProfiles.map((profile) => (
						<Badge key={profile} variant="outline">
							{profile}
						</Badge>
					))
				) : (
					<span className="text-sm text-muted-foreground">No profiles</span>
				)}
			</div>
			<div className="flex flex-wrap gap-2">
				{props.platformPolicyCapabilities.length > 0 ? (
					props.platformPolicyCapabilities.map((capability) => (
						<Badge key={capability}>{capability}</Badge>
					))
				) : (
					<span className="text-sm text-muted-foreground">No capabilities</span>
				)}
			</div>
			{props.platformPolicyQuota ? (
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<PolicyStat
						label="Max concurrent labs"
						value={props.platformPolicyQuota.maxConcurrentLabs}
					/>
					<PolicyStat
						label="Max persistent labs"
						value={props.platformPolicyQuota.maxPersistentLabs}
					/>
					<PolicyStat
						label="Max persistent hours"
						value={props.platformPolicyQuota.maxPersistentHours}
					/>
					<PolicyStat
						label="Max resource class"
						value={props.platformPolicyQuota.maxResourceClass || "small"}
					/>
				</div>
			) : null}
		</div>
	);
}
