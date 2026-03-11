import { AdminOverviewAuthCard } from "./admin-overview-auth-card";
import { AdminOverviewConfigCard } from "./admin-overview-config-card";
import { AdminOverviewImpersonationCard } from "./admin-overview-impersonation-card";
import { AdminOverviewOIDCCard } from "./admin-overview-oidc-card";
import { AdminOverviewQuickDeployCard } from "./admin-overview-quick-deploy-card";
import { AdminOverviewServiceNowCard } from "./admin-overview-servicenow-card";
import type { AdminOverviewTabProps } from "./admin-settings-tab-types";
import { TabsContent } from "./ui/tabs";

export function AdminOverviewTab(props: AdminOverviewTabProps) {
	return (
		<TabsContent value="overview" className="space-y-6">
			<AdminOverviewAuthCard {...props} />
			<AdminOverviewOIDCCard {...props} />
			<AdminOverviewServiceNowCard {...props} />
			<AdminOverviewConfigCard {...props} />
			<AdminOverviewImpersonationCard {...props} />
			<AdminOverviewQuickDeployCard {...props} />
		</TabsContent>
	);
}
