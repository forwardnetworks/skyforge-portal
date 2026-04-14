import type { AdminIntegrationsSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function AdminOverviewRegistryCatalogCard(
	props: AdminIntegrationsSectionProps,
) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Registry & NOS Catalog</CardTitle>
				<CardDescription>
					Define the shared registry endpoint, credentials, and curated NOS images
					used by Designer and containerlab import. For GHCR, use your GitHub
					username and a PAT in the password field.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 md:grid-cols-2">
					<div className="space-y-1">
						<Label>Registry URL</Label>
						<Input
							placeholder="https://ghcr.io"
							value={props.registryBaseURLDraft}
							onChange={(e) => props.onRegistryBaseURLChange(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label>Repo prefixes (comma-separated)</Label>
						<Input
							placeholder="forwardnetworks/kne, forwardnetworks/kubevirt"
							value={props.registryRepoPrefixesDraft}
							onChange={(e) => props.onRegistryRepoPrefixesChange(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label>Username</Label>
						<Input
							placeholder="captainpacket"
							value={props.registryUsernameDraft}
							onChange={(e) => props.onRegistryUsernameChange(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label>Password or PAT</Label>
						<Input
							type="password"
							placeholder={
								props.adminRegistryCatalog?.hasPassword
									? "Stored PAT or password (leave blank to keep)"
									: "Optional PAT or password"
							}
							value={props.registryPasswordDraft}
							onChange={(e) => props.onRegistryPasswordChange(e.target.value)}
						/>
					</div>
				</div>
				<div className="text-xs text-muted-foreground">
					GHCR authentication uses your GitHub username plus a Personal Access
					Token. Account password auth is not recommended.
				</div>

				<div className="flex flex-wrap items-center gap-4 rounded-md border p-3">
					<label className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={props.registrySkipTLSVerifyDraft}
							onCheckedChange={(checked) =>
								props.onRegistrySkipTLSVerifyChange(Boolean(checked))
							}
						/>
						Skip TLS verify
					</label>
					<label className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={props.registryPrepullWorkerNodesDraft}
							onCheckedChange={(checked) =>
								props.onRegistryPrepullWorkerNodesChange(Boolean(checked))
							}
						/>
						Enable worker image pre-pull
					</label>
					<Badge variant="outline">
						source: {props.adminRegistryCatalog?.source ?? "unknown"}
					</Badge>
					<Badge variant="outline">
						images: {props.registryCatalogImagesDraft.length}
					</Badge>
				</div>
				<div className="space-y-2 rounded-md border p-3">
					<div className="text-sm font-medium">Catalog coverage</div>
					<div className="flex flex-wrap gap-2 text-xs">
						<Badge variant="outline">
							discovered: {props.registryDiscoveredRepoCount}
						</Badge>
						<Badge variant="outline">catalog rows: {props.registryCatalogRepoCount}</Badge>
						<Badge
							variant={
								props.registryMissingCatalogRepos.length > 0
									? "destructive"
									: "secondary"
							}
						>
							missing in catalog: {props.registryMissingCatalogRepos.length}
						</Badge>
						<Badge
							variant={
								props.registryDisabledDiscoveredRepos.length > 0
									? "destructive"
									: "secondary"
							}
						>
							disabled in catalog: {props.registryDisabledDiscoveredRepos.length}
						</Badge>
					</div>
					{props.registryDiscoveredReposLoading ? (
						<div className="text-xs text-muted-foreground">
							Loading discovered repositories…
						</div>
					) : props.registryDiscoveredReposError ? (
						<div className="text-xs text-muted-foreground">
							Could not load discovered repositories from registry.
						</div>
					) : null}
					{props.registryMissingCatalogRepos.length > 0 ? (
						<div className="space-y-2">
							<div className="max-h-24 overflow-auto rounded-md border bg-muted/20 p-2 text-xs font-mono">
								{props.registryMissingCatalogRepos.slice(0, 12).map((repo) => (
									<div key={repo}>{repo}</div>
								))}
								{props.registryMissingCatalogRepos.length > 12 ? (
									<div className="text-muted-foreground">
										+{props.registryMissingCatalogRepos.length - 12} more
									</div>
								) : null}
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={props.onAddMissingRegistryReposToCatalog}
							>
								Add missing discovered repos to catalog draft
							</Button>
						</div>
					) : (
						<div className="text-xs text-muted-foreground">
							All discovered repositories are represented in catalog rows.
						</div>
					)}
				</div>

				<div className="space-y-2 rounded-md border p-3">
					<div className="text-sm font-medium">Catalog images</div>
					<div className="space-y-2">
						{props.registryCatalogImagesDraft.map((row, index) => (
							<div key={`registry-image-${index}`} className="grid gap-2 md:grid-cols-12">
								<Input
									className="md:col-span-3"
									placeholder="repository/path"
									value={row.repository ?? ""}
									onChange={(e) =>
										props.onRegistryCatalogImageFieldChange(
											index,
											"repository",
											e.target.value,
										)
									}
								/>
								<Input
									className="md:col-span-2"
									placeholder="kind"
									value={row.kind ?? ""}
									onChange={(e) =>
										props.onRegistryCatalogImageFieldChange(index, "kind", e.target.value)
									}
								/>
								<Input
									className="md:col-span-2"
									placeholder="role"
									value={row.role ?? "other"}
									onChange={(e) =>
										props.onRegistryCatalogImageFieldChange(index, "role", e.target.value)
									}
								/>
								<Input
									className="md:col-span-2"
									placeholder="default tag"
									value={row.defaultTag ?? ""}
									onChange={(e) =>
										props.onRegistryCatalogImageFieldChange(
											index,
											"defaultTag",
											e.target.value,
										)
									}
								/>
								<label className="md:col-span-1 flex items-center gap-2 text-xs">
									<Checkbox
										checked={Boolean(row.enabled)}
										onCheckedChange={(checked) =>
											props.onRegistryCatalogImageFieldChange(
												index,
												"enabled",
												Boolean(checked),
											)
										}
									/>
									on
								</label>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="md:col-span-2"
									onClick={() => props.onRemoveRegistryCatalogImage(index)}
								>
									Remove
								</Button>
							</div>
						))}
					</div>
					<Button type="button" variant="outline" size="sm" onClick={props.onAddRegistryCatalogImage}>
						Add image
					</Button>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button onClick={props.onSaveRegistryCatalog} disabled={props.saveRegistryCatalogPending}>
						{props.saveRegistryCatalogPending ? "Saving…" : "Save registry catalog"}
					</Button>
					<Button
						variant="outline"
						onClick={props.onTriggerRegistryCatalogPrepull}
						disabled={
							props.triggerRegistryCatalogPrepullPending ||
							!props.registryPrepullWorkerNodesDraft
						}
					>
						{props.triggerRegistryCatalogPrepullPending
							? "Starting pre-pull…"
							: "Run worker pre-pull now"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
