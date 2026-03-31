import { Button } from "./ui/button";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsAwsSsoCredentialsCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;
	const awsSsoConfigured =
		page.userAwsSsoQ.data?.configured || page.awsSsoConfigQ.data?.configured;
	const awsSsoStatus = page.awsSsoStatusQ.data?.status ?? "not_configured";
	const awsSsoStatusLabel = awsSsoConfigured
		? page.awsSsoStatusQ.data?.statusMessage ??
			(awsSsoStatus === "connected"
				? "Connected"
				: awsSsoStatus === "reauth_required"
					? "Reauthentication required"
					: "Not connected")
		: "Not configured";
	const awsConnectLabel =
		awsSsoStatus === "connected" || awsSsoStatus === "reauth_required"
			? "Reconnect"
			: "Connect";

	return (
		<div className="rounded border p-4 space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">AWS (SSO)</div>
				<div
					className={
						awsSsoStatus === "reauth_required"
							? "text-xs text-amber-600"
							: "text-xs text-muted-foreground"
					}
				>
					{awsSsoStatusLabel}
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
			<Input
				placeholder="Account ID"
				value={page.awsSsoAccountId}
				onChange={(e) => page.setAwsSsoAccountId(e.target.value)}
			/>
			<Input
				placeholder="Role name"
				value={page.awsSsoRoleName}
				onChange={(e) => page.setAwsSsoRoleName(e.target.value)}
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
			{page.awsSsoStatusQ.data?.reauthRequired ? (
				<div className="rounded border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-800">
					The stored AWS SSO session can no longer mint credentials. Reconnect
					before launching AWS-backed automations.
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
						!page.awsSsoRegion.trim() ||
						!page.awsSsoAccountId.trim() ||
						!page.awsSsoRoleName.trim()
					}
				>
					Save settings
				</Button>
				<Button
					type="button"
					onClick={() => page.startAwsSsoM.mutate()}
					disabled={
						!awsSsoConfigured || page.startAwsSsoM.isPending || !!page.awsSsoSession
					}
				>
					{awsConnectLabel}
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
