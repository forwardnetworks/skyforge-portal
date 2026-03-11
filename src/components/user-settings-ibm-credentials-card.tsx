import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsIbmCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<div className="rounded border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">IBM Cloud</div>
				<div className="text-xs text-muted-foreground">
					{page.ibmQ.data?.configured ? "Configured" : "Not configured"}
				</div>
			</div>
			<Input
				placeholder="Region"
				value={page.ibmRegion}
				onChange={(e) => page.setIbmRegion(e.target.value)}
			/>
			<Input
				placeholder="API key"
				type="password"
				value={page.ibmApiKey}
				onChange={(e) => page.setIbmApiKey(e.target.value)}
			/>
			<Input
				placeholder="Resource group ID (optional)"
				value={page.ibmResourceGroupId}
				onChange={(e) => page.setIbmResourceGroupId(e.target.value)}
			/>
			<div className="flex gap-2">
				<Button
					type="button"
					onClick={() => page.saveIbmM.mutate()}
					disabled={page.saveIbmM.isPending}
				>
					Save
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => page.deleteIbmM.mutate()}
					disabled={page.deleteIbmM.isPending}
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
