import { toast } from "sonner";
import type { AdminForwardSectionProps } from "./settings-section-types";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function AdminOverviewForwardSupportCard(props: AdminForwardSectionProps) {
	const revealedPassword = props.adminForwardSupportPassword.trim();
	const maskedPassword = "••••••••••••••••";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Forward Support Credential</CardTitle>
				<CardDescription>
					Platform support credential used for managed Forward tenant
					provisioning and resets.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{props.adminForwardSupportCredentialLoading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : null}
				{!props.adminForwardSupportCredentialLoading &&
				!props.adminForwardSupportCredentialConfigured ? (
					<div className="text-sm text-muted-foreground">
						Support credential is not configured.
					</div>
				) : null}
				{props.adminForwardSupportCredentialConfigured ? (
					<div className="space-y-3">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">Username</div>
								<div className="break-all font-mono text-sm">
									{props.adminForwardSupportUsername || "—"}
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">Password</div>
								<div className="break-all font-mono text-sm">
									{revealedPassword || maskedPassword}
								</div>
							</div>
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={
									!props.adminForwardSupportHasPassword ||
									props.revealAdminForwardSupportCredentialPending
								}
								onClick={props.onRevealAdminForwardSupportCredentialPassword}
							>
								{props.revealAdminForwardSupportCredentialPending
									? "Revealing…"
									: "Reveal password"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={!props.adminForwardSupportUsername.trim()}
								onClick={() => {
									const value = props.adminForwardSupportUsername.trim();
									if (!value) return;
									void navigator.clipboard?.writeText(value);
									toast.success("Support username copied");
								}}
							>
								Copy username
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={!revealedPassword}
								onClick={() => {
									if (!revealedPassword) return;
									void navigator.clipboard?.writeText(revealedPassword);
									toast.success("Support password copied");
								}}
							>
								Copy password
							</Button>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
