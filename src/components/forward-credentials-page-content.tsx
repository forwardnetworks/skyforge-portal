import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { ForwardCredentialsAddCard } from "./forward-credentials-add-card";
import { ForwardCredentialsManagedTenantCard } from "./forward-credentials-managed-tenant-card";
import { ForwardCredentialsSavedCard } from "./forward-credentials-saved-card";
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
					Manage your deployment and demo Forward orgs, experimental
					deployment-org feature flags, and any additional on-prem
					credential sets.
				</p>
			</div>

			<ForwardCredentialsManagedTenantCard page={page} tenant="demo" />
			<ForwardTenantRebuildCard page={page} tenant="demo" />
			<ForwardTenantPerformanceCard page={page} tenant="demo" />

			<ForwardCredentialsManagedTenantCard page={page} tenant="primary" />
			<ForwardTenantFeaturesCard page={page} />
			<ForwardTenantPerformanceCard page={page} tenant="primary" />
			<ForwardTenantRebuildCard page={page} tenant="primary" />
			<ForwardCredentialsAddCard page={page} />
			<ForwardCredentialsSavedCard page={page} />
		</div>
	);
}
