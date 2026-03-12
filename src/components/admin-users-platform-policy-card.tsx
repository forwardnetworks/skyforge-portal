import type { AdminUsersTabProps } from "./admin-settings-tab-types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AdminUsersPlatformPolicyEffectivePolicy } from "./admin-users-platform-policy-effective-policy";
import { AdminUsersPlatformPolicyProfilesCard } from "./admin-users-platform-policy-profiles-card";
import { AdminUsersPlatformPolicyQuotaCard } from "./admin-users-platform-policy-quota-card";
import { AdminUsersPlatformPolicyUserSelector } from "./admin-users-platform-policy-user-selector";

export function AdminUsersPlatformPolicyCard(props: AdminUsersTabProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Platform Policy</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<AdminUsersPlatformPolicyUserSelector {...props} />
				{props.platformPolicyLoading ? (
					<div className="text-sm text-muted-foreground">
						Loading platform policy…
					</div>
				) : !props.platformPolicyTargetUser ? (
					<div className="text-sm text-muted-foreground">
						Select a user to inspect policy.
					</div>
				) : (
					<div className="space-y-6">
						<AdminUsersPlatformPolicyEffectivePolicy
							platformPolicyProfiles={props.platformPolicyProfiles}
							platformPolicyOperatingModes={props.platformPolicyOperatingModes}
							platformPolicyPrimaryOperatingMode={
								props.platformPolicyPrimaryOperatingMode
							}
							platformPolicyCapabilities={props.platformPolicyCapabilities}
							platformPolicyQuota={props.platformPolicyQuota}
						/>
						<div className="grid gap-6 xl:grid-cols-2">
							<AdminUsersPlatformPolicyProfilesCard
								platformProfileDraft={props.platformProfileDraft}
								platformPolicyDerivedCapabilities={
									props.platformPolicyDerivedCapabilities
								}
								onPlatformProfileToggle={props.onPlatformProfileToggle}
								onSavePlatformProfiles={props.onSavePlatformProfiles}
								savePlatformProfilesPending={props.savePlatformProfilesPending}
								platformPolicyTargetUser={props.platformPolicyTargetUser}
							/>
							<AdminUsersPlatformPolicyQuotaCard
								platformQuotaDraft={props.platformQuotaDraft}
								platformQuotaValidationErrors={
									props.platformQuotaValidationErrors
								}
								platformQuotaHasErrors={props.platformQuotaHasErrors}
								savePlatformQuotaPending={props.savePlatformQuotaPending}
								platformPolicyTargetUser={props.platformPolicyTargetUser}
								onPlatformQuotaDraftChange={props.onPlatformQuotaDraftChange}
								onSavePlatformQuota={props.onSavePlatformQuota}
							/>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
