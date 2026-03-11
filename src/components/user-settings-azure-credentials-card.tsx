import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsAzureCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<div className="rounded border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">Azure</div>
				<div className="text-xs text-muted-foreground">
					{page.azureQ.data?.configured ? "Configured" : "Not configured"}
				</div>
			</div>
			<Input
				placeholder="Tenant ID"
				value={page.azureTenantId}
				onChange={(e) => page.setAzureTenantId(e.target.value)}
			/>
			<Input
				placeholder="Client ID"
				value={page.azureClientId}
				onChange={(e) => page.setAzureClientId(e.target.value)}
			/>
			<Input
				placeholder="Client secret"
				type="password"
				value={page.azureClientSecret}
				onChange={(e) => page.setAzureClientSecret(e.target.value)}
			/>
			<Input
				placeholder="Subscription ID (optional)"
				value={page.azureSubscriptionId}
				onChange={(e) => page.setAzureSubscriptionId(e.target.value)}
			/>
			<div className="flex gap-2">
				<Button
					type="button"
					onClick={() => page.saveAzureM.mutate()}
					disabled={page.saveAzureM.isPending}
				>
					Save
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => page.deleteAzureM.mutate()}
					disabled={page.deleteAzureM.isPending}
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
