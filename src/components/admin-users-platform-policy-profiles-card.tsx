import type { AdminUsersSectionProps } from "./settings-section-types";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import {
	platformProfiles,
	profileDescriptions,
} from "./admin-users-platform-policy-shared";
import { Badge } from "./ui/badge";

type Props = Pick<
	AdminUsersSectionProps,
	| "platformProfileDraft"
	| "platformPolicyDerivedCapabilities"
	| "onPlatformProfileToggle"
	| "onSavePlatformProfiles"
	| "savePlatformProfilesPending"
	| "platformPolicyTargetUser"
>;

export function AdminUsersPlatformPolicyProfilesCard(props: Props) {
	return (
		<div className="space-y-4 rounded-lg border border-border/60 p-4">
			<div className="text-sm font-medium">Profiles</div>
			<div className="space-y-3">
				{platformProfiles.map((profile) => {
					const checked = props.platformProfileDraft.includes(profile);
					return (
						<label key={profile} className="flex items-start gap-3 text-sm">
							<Checkbox
								checked={checked}
								onCheckedChange={(next) =>
									props.onPlatformProfileToggle(profile, Boolean(next))
								}
							/>
							<span className="space-y-0.5">
								<span className="block">{profile}</span>
								<span className="block text-xs text-muted-foreground">
									{profileDescriptions[profile]}
								</span>
							</span>
						</label>
					);
				})}
			</div>
			<div className="space-y-2 rounded-md border border-dashed border-border/60 p-3">
				<div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
					Draft capability impact
				</div>
				<div className="flex flex-wrap gap-2">
					{props.platformPolicyDerivedCapabilities.length > 0 ? (
						props.platformPolicyDerivedCapabilities.map((capability) => (
							<Badge key={capability} variant="secondary">
								{capability}
							</Badge>
						))
					) : (
						<span className="text-sm text-muted-foreground">
							No capabilities implied by the selected profiles.
						</span>
					)}
				</div>
				<div className="text-xs text-muted-foreground">
					Effective capabilities may also include direct role grants already attached to
					this user.
				</div>
			</div>
			<Button
				onClick={props.onSavePlatformProfiles}
				disabled={
					props.savePlatformProfilesPending || !props.platformPolicyTargetUser
				}
			>
				Save profiles
			</Button>
		</div>
	);
}
