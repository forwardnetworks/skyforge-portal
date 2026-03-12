import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { ForwardCredentialsAddCard } from "./forward-credentials-add-card";
import { ForwardCredentialsManagedTenantCard } from "./forward-credentials-managed-tenant-card";
import { ForwardCredentialsSavedCard } from "./forward-credentials-saved-card";
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
					Forward Credentials
				</h1>
				<p className="text-sm text-muted-foreground">
					In-cluster Forward credentials are managed automatically. Add custom
					on-prem credential sets here when needed.
				</p>
			</div>

			<ForwardCredentialsManagedTenantCard page={page} />
			<ForwardTenantRebuildCard page={page} />
			<ForwardCredentialsAddCard page={page} />
			<ForwardCredentialsSavedCard page={page} />
		</div>
	);
}
