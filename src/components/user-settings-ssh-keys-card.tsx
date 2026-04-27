import { Copy, KeyRound, Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import type { UserSettingsPageState } from "./user-settings-types";

export function UserSettingsSshKeysCard(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;
	const deployKey = page.userGitCredentialsQ.data?.sshPublicKey?.trim() ?? "";
	const authorizedKeyFromServer =
		page.userGitCredentialsQ.data?.authorizedSshPublicKey?.trim() ?? "";
	const keyDirty =
		page.authorizedSshPublicKey.trim() !== authorizedKeyFromServer;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="h-5 w-5" />
					SSH Keys
				</CardTitle>
				<CardDescription>
					One place for the public keys used by Git and native lab-management
					SSH access.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor="authorized-ssh-public-key">
							Your SSH public key
						</Label>
						<p className="text-sm text-muted-foreground">
							Paste your workstation public key, for example{" "}
							<code className="font-mono">~/.ssh/id_ed25519.pub</code>. Skyforge
							uses this key for native SSH access to lab management targets; use
							the same public key for your Gitea account SSH access.
						</p>
					</div>
					<Textarea
						id="authorized-ssh-public-key"
						className="min-h-24 font-mono text-xs"
						placeholder="ssh-ed25519 AAAA... user@example.com"
						value={page.authorizedSshPublicKey}
						onChange={(event) =>
							page.setAuthorizedSshPublicKey(event.target.value)
						}
					/>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							type="button"
							onClick={() => page.saveAuthorizedSshKeyM.mutate()}
							disabled={!keyDirty || page.saveAuthorizedSshKeyM.isPending}
						>
							{page.saveAuthorizedSshKeyM.isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Saving…
								</>
							) : (
								<>
									<Save className="h-4 w-4" />
									Save public key
								</>
							)}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => page.setAuthorizedSshPublicKey("")}
							disabled={!page.authorizedSshPublicKey.trim()}
						>
							<Trash2 className="h-4 w-4" />
							Clear
						</Button>
						{page.userGitCredentialsQ.isLoading ? (
							<span className="text-sm text-muted-foreground">
								Loading SSH keys…
							</span>
						) : page.userGitCredentialsQ.isError ? (
							<span className="text-sm text-destructive">
								Failed to load SSH keys.
							</span>
						) : page.userGitCredentialsQ.data?.hasAuthorizedSshKey ? (
							<span className="text-sm text-muted-foreground">
								Personal key saved.
							</span>
						) : (
							<span className="text-sm text-muted-foreground">
								No personal SSH key saved yet.
							</span>
						)}
					</div>
				</div>

				<div className="rounded-lg border bg-muted/30 p-4">
					<div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
						<div className="space-y-1">
							<div className="text-sm font-medium">
								Skyforge deploy public key
							</div>
							<p className="text-sm text-muted-foreground">
								This generated keypair is separate from your login key. Skyforge
								uses its private half when it needs to clone SSH template repos.
							</p>
						</div>
						<div className="flex shrink-0 flex-wrap gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={page.copyGitDeployKey}
								disabled={!deployKey}
							>
								<Copy className="h-4 w-4" />
								Copy
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => page.rotateGitDeployKeyM.mutate()}
								disabled={page.rotateGitDeployKeyM.isPending}
							>
								{page.rotateGitDeployKeyM.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<RotateCcw className="h-4 w-4" />
								)}
								Rotate
							</Button>
						</div>
					</div>
					{deployKey ? (
						<pre className="mt-3 overflow-x-auto rounded-md bg-background p-3 font-mono text-xs text-muted-foreground">
							{deployKey}
						</pre>
					) : (
						<div className="mt-3 rounded-md bg-background p-3 text-sm text-muted-foreground">
							No deploy key has been generated yet.
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
