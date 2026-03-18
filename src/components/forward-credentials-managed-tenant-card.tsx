import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

export function ForwardCredentialsManagedTenantCard(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Managed In-Cluster Credential</CardTitle>
				<CardDescription>
					Auto-provisioned tenant credential used for in-cluster Forward
					flows.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{page.tenantCredentialQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : null}
				{page.tenantCredentialQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load managed credential.
					</div>
				) : null}
				{page.tenantCredentialQ.data &&
				!page.tenantCredentialQ.data.configured ? (
					<div className="text-sm text-muted-foreground">
						Managed credential is not configured yet.
					</div>
				) : null}
				{page.tenantCredentialQ.data?.configured ? (
					<div className="space-y-2">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">
									Forward username
								</div>
								<div className="break-all font-mono text-sm">
									{page.tenantCredentialQ.data.username || "—"}
								</div>
							</div>
								<div className="space-y-1">
									<div className="text-xs text-muted-foreground">
										Forward password
									</div>
									<div className="break-all font-mono text-sm">
										{page.revealedTenantPassword
											? page.revealedTenantPassword
											: "••••••••••••••••"}
									</div>
								</div>
							</div>
						<div className="text-xs text-muted-foreground">
							Org: {" "}
							{page.tenantCredentialQ.data.orgName ||
								page.tenantCredentialQ.data.orgId ||
								"—"}
						</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={
										!page.tenantCredentialQ.data.hasPassword ||
										page.revealTenantCredentialMutation.isPending
									}
									onClick={() => page.revealTenantCredentialMutation.mutate()}
								>
									{page.revealTenantCredentialMutation.isPending
										? "Revealing…"
										: "Reveal password"}
								</Button>
								<Button
									variant="outline"
								size="sm"
								onClick={() => {
									const value = page.tenantCredentialQ.data?.username?.trim();
									if (!value) return;
									void navigator.clipboard?.writeText(value);
									toast.success("Forward username copied");
								}}
							>
								Copy username
							</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										const value = page.revealedTenantPassword.trim();
										if (!value) return;
										void navigator.clipboard?.writeText(value);
										toast.success("Forward password copied");
								}}
							>
								Copy password
							</Button>
							<Button
								variant="destructive"
								size="sm"
								disabled={page.resetTenantCredentialMutation.isPending}
								onClick={() => page.resetTenantCredentialMutation.mutate()}
							>
									{page.resetTenantCredentialMutation.isPending
										? "Resetting…"
										: "Reset managed credential"}
								</Button>
							</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
