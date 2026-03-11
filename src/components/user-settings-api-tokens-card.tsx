import { Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsAPITokensCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>API Tokens</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-sm text-muted-foreground">
					Create per-user API tokens for automation. Token plaintext is shown
					once at create/regenerate time.
				</div>
				<div className="flex flex-col gap-2 sm:flex-row">
					<Input
						placeholder="Token name (optional)"
						value={page.apiTokenName}
						onChange={(e) => page.setApiTokenName(e.target.value)}
					/>
					<Button
						type="button"
						onClick={() => page.createApiTokenM.mutate()}
						disabled={page.createApiTokenM.isPending}
					>
						{page.createApiTokenM.isPending ? "Creating…" : "Create token"}
					</Button>
				</div>
				{page.revealedApiToken ? (
					<div className="rounded-md border p-3 space-y-2">
						<div className="text-xs font-medium text-foreground">
							New token{" "}
							{page.revealedApiTokenID ? `(${page.revealedApiTokenID})` : ""}
						</div>
						<div className="flex flex-col gap-2 sm:flex-row">
							<Input value={page.revealedApiToken} readOnly />
							<Button
								type="button"
								variant="outline"
								onClick={page.copyRevealedApiToken}
							>
								<Copy className="mr-2 h-4 w-4" />
								Copy
							</Button>
						</div>
						<div className="text-xs text-amber-600">
							Store this token now. It will not be shown again.
						</div>
					</div>
				) : null}
				{page.apiTokensQ.isLoading ? (
					<div className="text-sm text-muted-foreground">Loading tokens…</div>
				) : page.apiTokensQ.isError ? (
					<div className="text-sm text-destructive">
						Failed to load API tokens.
					</div>
				) : page.apiTokens.length === 0 ? (
					<div className="text-sm text-muted-foreground">
						No API tokens created.
					</div>
				) : (
					<div className="space-y-3">
						{page.apiTokens.map((token) => (
							<div key={token.id} className="rounded-md border p-3 space-y-2">
								<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
									<div>
										<div className="text-sm font-medium">{token.name}</div>
										<div className="font-mono text-xs text-muted-foreground">
											{token.id}
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => page.regenerateApiTokenM.mutate(token.id)}
											disabled={
												page.regenerateApiTokenM.isPending ||
												Boolean(token.revokedAt)
											}
										>
											Regenerate
										</Button>
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => page.revokeApiTokenM.mutate(token.id)}
											disabled={
												page.revokeApiTokenM.isPending ||
												Boolean(token.revokedAt)
											}
										>
											Revoke
										</Button>
									</div>
								</div>
								<div className="grid gap-1 text-xs text-muted-foreground md:grid-cols-3">
									<div>
										Created: {page.formatMaybeDateTime(token.createdAt)}
									</div>
									<div>
										Updated: {page.formatMaybeDateTime(token.updatedAt)}
									</div>
									<div>
										Last used: {page.formatMaybeDateTime(token.lastUsedAt)}
									</div>
								</div>
								{token.revokedAt ? (
									<div className="text-xs text-amber-600">
										Revoked: {page.formatMaybeDateTime(token.revokedAt)}
									</div>
								) : null}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
