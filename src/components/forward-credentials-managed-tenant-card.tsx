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
type ManagedTenantKey = "demo" | "primary";

function tenantCopy(tenant: ManagedTenantKey) {
	if (tenant === "demo") {
		return {
			title: "Demo Org Credential",
			description:
				"Curated Forward demo org used by the default Forward launch path.",
			resetLabel: "Reset demo credential",
		};
	}
	return {
		title: "Deployment Org Credential",
		description:
			"Managed Forward org used for deployment sync and in-cluster collector flows.",
		resetLabel: "Reset deployment credential",
	};
}

export function ForwardCredentialsManagedTenantCard(props: {
	page: ForwardCredentialsPageState;
	tenant: ManagedTenantKey;
}) {
	const { page, tenant } = props;
	const state = page.tenants[tenant];
	const copy = tenantCopy(tenant);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{copy.title}</CardTitle>
				<CardDescription>{copy.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{state.credentialQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading…</div>
				) : null}
				{state.credentialQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load managed credential.
					</div>
				) : null}
				{state.credentialQ.data && !state.credentialQ.data.configured ? (
					<div className="text-sm text-muted-foreground">
						Managed credential is not configured yet.
					</div>
				) : null}
				{state.credentialQ.data?.configured ? (
					<div className="space-y-2">
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">
									Forward username
								</div>
								<div className="break-all font-mono text-sm">
									{state.credentialQ.data.username || "—"}
								</div>
							</div>
							<div className="space-y-1">
								<div className="text-xs text-muted-foreground">
									Forward password
								</div>
								<div className="break-all font-mono text-sm">
									{state.revealedPassword
										? state.revealedPassword
										: "••••••••••••••••"}
								</div>
							</div>
						</div>
						<div className="text-xs text-muted-foreground">
							Org:{" "}
							{state.credentialQ.data.orgName ||
								state.credentialQ.data.orgId ||
								"—"}
						</div>
						<div className="flex flex-wrap gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={
									!state.credentialQ.data.hasPassword ||
									page.revealTenantCredentialMutation.isPending
								}
								onClick={() => page.revealTenantCredentialMutation.mutate(tenant)}
							>
								{page.revealTenantCredentialMutation.isPending
									? "Revealing…"
									: "Reveal password"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									const value = state.credentialQ.data?.username?.trim();
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
									const value = state.revealedPassword.trim();
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
								onClick={() => page.resetTenantCredentialMutation.mutate(tenant)}
							>
								{page.resetTenantCredentialMutation.isPending
									? "Resetting…"
									: copy.resetLabel}
							</Button>
						</div>
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
