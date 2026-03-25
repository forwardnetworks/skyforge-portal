import { AdminOverviewAuthCard } from "./admin-overview-auth-card";
import { AdminOverviewConfigCard } from "./admin-overview-config-card";
import { AdminOverviewForwardDemoSeedsCard } from "./admin-overview-forward-demo-seeds-card";
import { AdminOverviewForwardSupportCard } from "./admin-overview-forward-support-card";
import { AdminOverviewImpersonationCard } from "./admin-overview-impersonation-card";
import { AdminOverviewOIDCCard } from "./admin-overview-oidc-card";
import { AdminOverviewQuickDeployCard } from "./admin-overview-quick-deploy-card";
import { AdminOverviewRuntimePressureCard } from "./admin-overview-runtime-pressure-card";
import { AdminOverviewServiceNowCard } from "./admin-overview-servicenow-card";
import { AdminOverviewTeamsCard } from "./admin-overview-teams-card";
import type { AdminOverviewTabProps } from "./admin-settings-tab-types";
import { TabsContent } from "./ui/tabs";

export function AdminOverviewTab(props: AdminOverviewTabProps) {
	return (
		<TabsContent value="overview" className="space-y-6">
			<AdminOverviewAuthCard {...props} />
			<AdminOverviewOIDCCard {...props} />
			<AdminOverviewServiceNowCard {...props} />
			<AdminOverviewTeamsCard {...props} />
			<AdminOverviewForwardSupportCard {...props} />
			<AdminOverviewRuntimePressureCard {...props} />
			<AdminOverviewForwardDemoSeedsCard {...props} />
			<AdminOverviewConfigCard {...props} />
			<AdminOverviewImpersonationCard {...props} />
			<AdminOverviewQuickDeployCard {...props} />
		</TabsContent>
	);
}
