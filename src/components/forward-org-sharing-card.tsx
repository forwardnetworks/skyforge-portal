import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import type { ForwardOrgShareTenantKind } from "@/lib/api-client-forward-org-shares";
import { forwardSharedOrgSessionHref } from "@/lib/tool-launches";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "./ui/badge";
import { Button, buttonVariants } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

const noUserSelected = "__none__";

function tenantTitle(tenant: ForwardOrgShareTenantKind): string {
	return tenant === "customer"
		? "Customer Org Sharing"
		: "Deployment Org Sharing";
}

function tenantLabel(tenant: ForwardOrgShareTenantKind): string {
	return tenant === "customer" ? "customer org" : "deployment org";
}

export function ForwardOrgSharingCard(props: {
	page: ForwardCredentialsPageState;
	tenant: ForwardOrgShareTenantKind;
}) {
	const { page, tenant } = props;
	const [selectedUser, setSelectedUser] = useState(noUserSelected);
	const outgoing = useMemo(
		() =>
			(page.forwardOrgSharesQ.data?.shares ?? []).filter(
				(share) => share.tenantKind === tenant,
			),
		[page.forwardOrgSharesQ.data?.shares, tenant],
	);
	const sharedWithMe = useMemo(
		() =>
			(page.forwardOrgSharesQ.data?.sharedWithMe ?? []).filter(
				(share) => share.tenantKind === tenant,
			),
		[page.forwardOrgSharesQ.data?.sharedWithMe, tenant],
	);
	const users = page.assignableUsersQ.data?.users ?? [];
	const pending =
		page.grantForwardOrgShareMutation.isPending ||
		page.revokeForwardOrgShareMutation.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{tenantTitle(tenant)}</CardTitle>
				<CardDescription>
					Share your {tenantLabel(tenant)} with another SE. Skyforge opens the
					org through the Forward support user and impersonates your managed
					Forward user; passwords are never shared.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="rounded-lg border bg-muted/20 p-3">
					<div className="mb-3 text-sm font-medium">Grant access</div>
					<div className="flex flex-col gap-2 sm:flex-row">
						<Select value={selectedUser} onValueChange={setSelectedUser}>
							<SelectTrigger className="sm:flex-1">
								<SelectValue placeholder="Select an SE" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={noUserSelected}>Select an SE</SelectItem>
								{users.map((user) => (
									<SelectItem key={user.username} value={user.username}>
										{user.display || user.username}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							disabled={pending || selectedUser === noUserSelected}
							onClick={() => {
								if (selectedUser === noUserSelected) return;
								page.grantForwardOrgShareMutation.mutate({
									tenantKind: tenant,
									username: selectedUser,
								});
								setSelectedUser(noUserSelected);
							}}
						>
							Grant access
						</Button>
					</div>
				</div>

				<div className="space-y-2">
					<div className="text-sm font-medium">Shared by me</div>
					{page.forwardOrgSharesQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading shares…</div>
					) : null}
					{outgoing.length === 0 && !page.forwardOrgSharesQ.isLoading ? (
						<div className="text-sm text-muted-foreground">
							No one else has access to this {tenantLabel(tenant)}.
						</div>
					) : null}
					{outgoing.map((share) => (
						<div
							key={`${share.tenantKind}-${share.granteeUsername}`}
							className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
						>
							<div>
								<div className="font-mono text-sm">{share.granteeUsername}</div>
								<div className="text-xs text-muted-foreground">
									Access: {share.access}
								</div>
							</div>
							<Button
								variant="outline"
								size="sm"
								disabled={pending}
								onClick={() =>
									page.revokeForwardOrgShareMutation.mutate({
										tenantKind: tenant,
										username: share.granteeUsername,
									})
								}
							>
								Revoke
							</Button>
						</div>
					))}
				</div>

				<div className="space-y-2">
					<div className="text-sm font-medium">Shared with me</div>
					{sharedWithMe.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No {tenantLabel(tenant)} shares are available to you.
						</div>
					) : null}
					{sharedWithMe.map((share) => {
						const href = forwardSharedOrgSessionHref({
							ownerUsername: share.ownerUsername,
							tenantKind: share.tenantKind,
							nextPath: "/",
						});
						return (
							<div
								key={`${share.ownerUsername}-${share.tenantKind}-${share.access}`}
								className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<div className="break-all font-mono text-sm">
											{share.ownerUsername}
										</div>
										{share.access === "admin" ? (
											<Badge variant="secondary" className="gap-1">
												<ShieldCheck className="h-3 w-3" />
												admin
											</Badge>
										) : null}
									</div>
									<div className="text-xs text-muted-foreground">
										Open {tenantLabel(tenant)} as the owner's managed Forward
										user.
									</div>
								</div>
								<a
									href={href}
									target="_blank"
									rel="noreferrer noopener"
									className={buttonVariants({
										variant: "outline",
										size: "sm",
									})}
								>
									<ExternalLink className="h-4 w-4" />
									Open
								</a>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
