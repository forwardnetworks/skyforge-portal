import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { ForwardCredentialsAddCard } from "./forward-credentials-add-card";
import { ForwardCredentialsManagedTenantCard } from "./forward-credentials-managed-tenant-card";
import { ForwardCredentialsSavedCard } from "./forward-credentials-saved-card";
import { ForwardOrgSharingCard } from "./forward-org-sharing-card";
import { ForwardTenantFeaturesCard } from "./forward-tenant-features-card";
import { ForwardTenantPerformanceCard } from "./forward-tenant-performance-card";
import { ForwardTenantRebuildCard } from "./forward-tenant-rebuild-card";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

export function ForwardCredentialsPageContent(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;

	return (
		<div className="w-full space-y-6 p-4 sm:p-6 xl:p-8">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					Forward Org Access
				</h1>
				<p className="text-sm text-muted-foreground">
					Manage your deployment, demo, and customer Forward orgs, experimental
					deployment-org feature flags, and any additional on-prem credential
					sets.
				</p>
			</div>

			<section id="demo-org" className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold tracking-tight">Demo Org</h2>
					<p className="text-sm text-muted-foreground">
						Curated demo org used by the default Forward launch path.
					</p>
				</div>
				<ForwardCredentialsManagedTenantCard page={page} tenant="demo" />
				<ForwardTenantRebuildCard page={page} tenant="demo" />
			</section>

			<section id="deployment-org" className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold tracking-tight">
						Deployment Org
					</h2>
					<p className="text-sm text-muted-foreground">
						Managed deployment-backed org used for sync and collector flows.
					</p>
				</div>
				<ForwardCredentialsManagedTenantCard page={page} tenant="primary" />
				<ForwardOrgSharingCard page={page} tenant="primary" />
				<ForwardTenantFeaturesCard page={page} />
				<ForwardTenantRebuildCard page={page} tenant="primary" />
			</section>

			<section id="customer-org" className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold tracking-tight">Customer Org</h2>
					<p className="text-sm text-muted-foreground">
						Managed customer snapshot-analysis org with a confidentiality
						banner.
					</p>
				</div>
				<ForwardCredentialsManagedTenantCard page={page} tenant="customer" />
				<ForwardOrgSharingCard page={page} tenant="customer" />
				<ForwardTenantRebuildCard page={page} tenant="customer" />
			</section>

			<section id="performance-data" className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold tracking-tight">
						Performance Data
					</h2>
					<p className="text-sm text-muted-foreground">
						Generate synthetic performance data for either managed Forward org,
						defaulting to the deployment org.
					</p>
				</div>
				<ForwardTenantPerformanceCard page={page} />
			</section>

			<ForwardCredentialsAddCard page={page} />
			<ForwardCredentialsSavedCard page={page} />
		</div>
	);
}
