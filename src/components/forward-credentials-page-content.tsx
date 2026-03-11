import type { useForwardCredentialsPage } from "@/hooks/use-forward-credentials-page";
import {
	isInClusterCollectorBaseURL,
	stripForwardCredentialProtocol,
} from "@/hooks/use-forward-credentials-page";
import { toast } from "sonner";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type ForwardCredentialsPageState = ReturnType<typeof useForwardCredentialsPage>;

export function ForwardCredentialsPageContent(props: {
	page: ForwardCredentialsPageState;
}) {
	const { page } = props;
	return (
		<div className="w-full space-y-6 p-4 sm:p-6 xl:p-8">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">
					Forward Credentials
				</h1>
				<p className="text-sm text-muted-foreground">
					In-cluster Forward credentials are managed automatically. Add custom
					on-prem credential sets here when needed.
				</p>
			</div>

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
										{page.showTenantPassword
											? page.tenantCredentialQ.data.password || "—"
											: "••••••••••••••••"}
									</div>
								</div>
							</div>
							<div className="text-xs text-muted-foreground">
								Org:{" "}
								{page.tenantCredentialQ.data.orgName ||
									page.tenantCredentialQ.data.orgId ||
									"—"}
							</div>
							<div className="flex flex-wrap gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => page.setShowTenantPassword((v) => !v)}
								>
									{page.showTenantPassword ? "Hide password" : "Show password"}
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
										const value = page.tenantCredentialQ.data?.password?.trim();
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

			<Card>
				<CardHeader>
					<CardTitle>Add Credential Set</CardTitle>
					<CardDescription>
						Choose the target host, provide username/password, and save.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2 md:col-span-2">
							<Label>Host</Label>
							<Input
								value={page.customHost}
								onChange={(e) => page.setCustomHost(e.target.value)}
								placeholder="https://forward.example.com"
							/>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<Checkbox
							checked={page.effectiveSkipTlsVerify}
							onCheckedChange={(v) => page.setSkipTlsVerify(Boolean(v))}
							disabled={page.tlsCheckboxDisabled}
						/>
						<Label className="text-sm">Disable TLS verification</Label>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Username</Label>
							<Input
								value={page.username}
								onChange={(e) => page.setUsername(e.target.value)}
								placeholder="you@example.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>Password</Label>
							<Input
								type="password"
								value={page.password}
								onChange={(e) => page.setPassword(e.target.value)}
								placeholder="••••••••"
							/>
						</div>
					</div>

					<Button
						onClick={() => page.createMutation.mutate()}
						disabled={page.createMutation.isPending}
					>
						{page.createMutation.isPending ? "Saving…" : "Save credential set"}
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Saved Credential Sets</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{page.collectorsQ.isLoading ? (
						<div className="text-sm text-muted-foreground">Loading…</div>
					) : null}
					{page.collectorsQ.isError ? (
						<div className="text-sm text-destructive">
							Failed to load credential sets.
						</div>
					) : null}
					{!page.collectorsQ.isLoading && page.credentialSets.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No credential sets saved.
						</div>
					) : null}

					{page.credentialSets.map((credential) => {
						const inClusterManaged = isInClusterCollectorBaseURL(
							(credential.baseUrl || "").trim(),
						);
						const key =
							`${(credential.username || "").trim()}@${stripForwardCredentialProtocol((credential.baseUrl || "").trim())}`.replace(
								/@$/,
								"",
							);
						return (
							<div
								key={credential.id}
								className="flex items-center justify-between gap-3 rounded border p-3"
							>
								<div className="min-w-0">
									<div className="truncate text-sm font-medium">
										{key || credential.name || credential.id}
									</div>
									<div className="truncate font-mono text-xs text-muted-foreground">
										{credential.baseUrl}
									</div>
									{inClusterManaged ? (
										<div className="text-xs text-muted-foreground">
											Managed automatically from your Forward tenant API token.
										</div>
									) : null}
								</div>
								<Button
									variant="destructive"
									size="sm"
									onClick={() =>
										page.deleteMutation.mutate(String(credential.id))
									}
									disabled={page.deleteMutation.isPending || inClusterManaged}
								>
									{inClusterManaged ? "Managed" : "Delete"}
								</Button>
							</div>
						);
					})}
				</CardContent>
			</Card>
		</div>
	);
}
