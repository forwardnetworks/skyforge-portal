import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsAwsStaticCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<div className="rounded border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">AWS (static)</div>
				<div className="text-xs text-muted-foreground">
					{page.awsStaticQ.data?.configured
						? `Configured (…${page.awsStaticQ.data?.accessKeyLast4 ?? ""})`
						: "Not configured"}
				</div>
			</div>
			<Input
				placeholder="Access key id"
				value={page.awsAccessKeyId}
				onChange={(e) => page.setAwsAccessKeyId(e.target.value)}
			/>
			<Input
				placeholder="Secret access key"
				type="password"
				value={page.awsSecretAccessKey}
				onChange={(e) => page.setAwsSecretAccessKey(e.target.value)}
			/>
			<div className="flex gap-2">
				<Button
					type="button"
					onClick={() => page.saveAwsStaticM.mutate()}
					disabled={page.saveAwsStaticM.isPending}
				>
					Save
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => page.deleteAwsStaticM.mutate()}
					disabled={page.deleteAwsStaticM.isPending}
				>
					Delete
				</Button>
			</div>
		</div>
	);
}
