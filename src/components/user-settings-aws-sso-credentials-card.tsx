import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsAwsSsoCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<div className="rounded border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">AWS (SSO)</div>
				<div className="text-xs text-muted-foreground">
					{page.userAwsSsoQ.data?.configured ||
					page.awsSsoConfigQ.data?.configured
						? page.awsSsoStatusQ.data?.connected
							? "Connected"
							: "Not connected"
						: "Not configured"}
				</div>
			</div>
			<Input
				placeholder="Start URL"
				value={page.awsSsoStartUrl}
				onChange={(e) => page.setAwsSsoStartUrl(e.target.value)}
			/>
			<Input
				placeholder="Region"
				value={page.awsSsoRegion}
				onChange={(e) => page.setAwsSsoRegion(e.target.value)}
			/>
			{page.awsSsoStatusQ.data?.lastAuthenticatedAt ? (
				<div className="text-xs text-muted-foreground">
					Last authenticated:{" "}
					<span className="font-mono">
						{page.awsSsoStatusQ.data.lastAuthenticatedAt}
					</span>
				</div>
			) : null}
			{page.awsSsoStatusQ.data?.expiresAt ? (
				<div className="text-xs text-muted-foreground">
					Expires:{" "}
					<span className="font-mono">{page.awsSsoStatusQ.data.expiresAt}</span>
				</div>
			) : null}
			{page.awsSsoSession ? (
				<div className="rounded border bg-muted/30 p-3 text-xs space-y-1">
					<div className="font-medium">Complete sign-in</div>
					<div>
						Code:{" "}
						<span className="font-mono">{page.awsSsoSession.userCode}</span>
					</div>
					<div className="text-muted-foreground">
						Open:{" "}
						<span className="font-mono break-all">
							{page.awsSsoSession.verificationUriComplete}
						</span>
					</div>
					{page.awsSsoPollStatus ? (
						<div className="text-muted-foreground">
							Status: {page.awsSsoPollStatus}
						</div>
					) : null}
				</div>
			) : null}
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={() => page.saveAwsSsoConfigM.mutate()}
					disabled={
						page.saveAwsSsoConfigM.isPending ||
						!page.awsSsoStartUrl.trim() ||
						!page.awsSsoRegion.trim()
					}
				>
					Save settings
				</Button>
				<Button
					type="button"
					onClick={() => page.startAwsSsoM.mutate()}
					disabled={
						!page.awsSsoConfigQ.data?.configured ||
						page.startAwsSsoM.isPending ||
						!!page.awsSsoSession
					}
				>
					Connect
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => page.logoutAwsSsoM.mutate()}
					disabled={
						!page.awsSsoStatusQ.data?.connected || page.logoutAwsSsoM.isPending
					}
				>
					Disconnect
				</Button>
			</div>
		</div>
	);
}
