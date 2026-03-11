import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsGcpCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<div className="rounded border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">GCP</div>
				<div className="text-xs text-muted-foreground">
					{page.gcpQ.data?.configured ? "Configured" : "Not configured"}
				</div>
			</div>
			<Input
				placeholder="GCP ID"
				value={page.gcpProjectId}
				onChange={(e) => page.setGcpProjectId(e.target.value)}
			/>
			<Textarea
				placeholder="Service identity JSON"
				className="min-h-[140px] font-mono text-xs"
				value={page.gcpServiceAccountJson}
				onChange={(e) => page.setGcpServiceAccountJson(e.target.value)}
			/>
			<div className="flex gap-2">
				<Button
					type="button"
					onClick={() => page.saveGcpM.mutate()}
					disabled={page.saveGcpM.isPending}
				>
					Save
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => page.deleteGcpM.mutate()}
					disabled={page.deleteGcpM.isPending}
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
