import type { AdminUsersSectionProps } from "./settings-section-types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { EmptyState } from "./ui/empty-state";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Skeleton } from "./ui/skeleton";

export function AdminApiPermissionsCard(props: AdminUsersSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>API permission overrides</CardTitle>
				<CardDescription>
					Explicit per-user endpoint permissions layered on top of role access.
					Use allow/deny only where needed.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-2 md:grid-cols-[280px_1fr_auto]">
					<Select
						value={props.apiPermTargetUser}
						onValueChange={props.onApiPermTargetUserChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select user…" />
						</SelectTrigger>
						<SelectContent>
							{props.rbacKnownUsers.length > 0 ? (
								props.rbacKnownUsers.map((username) => (
									<SelectItem key={username} value={username}>
										{username}
									</SelectItem>
								))
							) : (
								<div className="px-2 py-1.5 text-sm text-muted-foreground">
									No users available
								</div>
							)}
						</SelectContent>
					</Select>
					<Input
						placeholder="Filter APIs by service, endpoint, path, tag…"
						value={props.apiPermFilter}
						onChange={(event) =>
							props.onApiPermFilterChange(event.target.value)
						}
					/>
					<div className="flex items-center justify-end gap-2">
						<Button
							variant="outline"
							onClick={props.onReloadUserApiPerms}
							disabled={
								props.userApiPermsLoading || !props.apiPermTargetUser.trim()
							}
						>
							Reload
						</Button>
						<Button
							onClick={props.onSaveUserApiPermissions}
							disabled={
								!props.apiPermTargetUser.trim() ||
								props.saveUserApiPermissionsPending
							}
						>
							{props.saveUserApiPermissionsPending
								? "Saving…"
								: "Save API permissions"}
						</Button>
					</div>
				</div>
				<div className="text-xs text-muted-foreground">
					Overrides for{" "}
					<span className="font-mono">{props.apiPermTargetUser || "—"}</span>:{" "}
					{props.apiDraftOverrideCount} explicit entries.
				</div>
				{props.apiCatalogLoading || props.userApiPermsLoading ? (
					<Skeleton className="h-40 w-full" />
				) : props.filteredApiCatalogEntries.length === 0 ? (
					<EmptyState
						title="No API endpoints"
						description="No catalog entries match the current filter."
					/>
				) : (
					<div className="max-h-[520px] overflow-auto rounded-md border">
						<table className="w-full text-sm">
							<thead className="sticky top-0 bg-muted/70">
								<tr>
									<th className="px-3 py-2 text-left font-medium">
										Service.Endpoint
									</th>
									<th className="px-3 py-2 text-left font-medium">Method</th>
									<th className="px-3 py-2 text-left font-medium">Path</th>
									<th className="px-3 py-2 text-left font-medium">Access</th>
								</tr>
							</thead>
							<tbody>
								{props.filteredApiCatalogEntries.map((entry) => {
									const key = props.apiPermissionKey(entry);
									const decision = props.apiPermDraft[key] ?? "inherit";
									return (
										<tr key={key} className="border-t align-top">
											<td className="px-3 py-2">
												<div className="font-mono text-xs">
													{entry.service}.{entry.endpoint}
												</div>
												{entry.summary ? (
													<div className="text-xs text-muted-foreground">
														{entry.summary}
													</div>
												) : null}
											</td>
											<td className="px-3 py-2">
												<Badge variant="outline">{entry.method}</Badge>
											</td>
											<td className="px-3 py-2 font-mono text-xs text-muted-foreground">
												{entry.path}
											</td>
											<td className="px-3 py-2">
												<select
													className="h-8 rounded-md border bg-background px-2 text-xs"
													value={decision}
													onChange={(event) =>
														props.onApiPermDraftChange(
															key,
															event.target.value as
																| "inherit"
																| "allow"
																| "deny",
														)
													}
												>
													<option value="inherit">inherit</option>
													<option value="allow">allow</option>
													<option value="deny">deny</option>
												</select>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
