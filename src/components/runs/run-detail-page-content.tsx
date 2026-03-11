import { DeploymentRunOutput } from "@/components/deployments/deployment-run-output";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { RunDetailPageState } from "@/hooks/use-run-detail-page";
import { Link } from "@tanstack/react-router";

export function RunDetailPageContent(props: {
	page: RunDetailPageState;
}) {
	const {
		canCancel,
		deployFailureCategories,
		handleCancel,
		handleClear,
		handleLogin,
		lifecycle,
		lifecycleRecent,
		logs,
		loginHref,
		nodeSample,
		provenance,
		run,
		runId,
		snap,
	} = props.page;

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Run {runId}</CardTitle>
						</div>
						<div className="flex items-center gap-2">
							<Link
								className={buttonVariants({ variant: "outline", size: "sm" })}
								to="/dashboard/deployments"
							>
								Back
							</Link>
							<Button
								variant="destructive"
								size="sm"
								disabled={!run || !canCancel}
								onClick={() => {
									void handleCancel();
								}}
							>
								Cancel
							</Button>
							<Button variant="outline" size="sm" onClick={handleClear}>
								Clear
							</Button>
						</div>
					</div>
				</CardHeader>
			</Card>

			{!snap.data && (
				<Card className="border-dashed">
					<CardContent className="pt-6 text-center text-muted-foreground">
						Loading dashboard…
						<div className="mt-2 text-xs">
							If you are logged out,{" "}
							<a
								className="text-primary underline hover:no-underline"
								href={loginHref}
								onClick={(event) => {
									event.preventDefault();
									void handleLogin();
								}}
							>
								login
							</a>
							.
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Metadata</CardTitle>
						<div className="text-xs text-muted-foreground">
							Cursor: {String(logs.data?.cursor ?? 0)}
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Meta label="Type" value={String(run?.tpl_alias ?? "")} />
						<Meta label="Status" value={String(run?.status ?? "")} />
						<Meta
							label="User"
							value={String(
								(run as { userId?: unknown } | undefined)?.userId ?? "",
							)}
						/>
						<Meta label="Created" value={String(run?.created ?? "")} />
						<Meta label="Started" value={String(run?.start ?? "")} />
						<Meta label="Finished" value={String(run?.end ?? "")} />
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Source Of Truth</CardTitle>
					<CardDescription>
						Netlab catalog {"->"} node resolution {"->"} clabernetes apply
						policy
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<Meta label="Source Chain" value={provenance.sourceOfTruth} />
						<Meta label="Catalog Source" value={provenance.catalogSource} />
						<Meta
							label="Catalog Device Count"
							value={String(provenance.catalogDeviceCount)}
						/>
						<Meta label="Netlab Contract" value={provenance.contractVersion} />
						<Meta
							label="Netlab Runtime Version"
							value={provenance.runtimeVersion}
						/>
						<Meta
							label="Resolved Nodes"
							value={`${provenance.resolvedNodes}/${provenance.totalNodes}`}
						/>
						<Meta
							label="Unresolved Nodes"
							value={String(provenance.unresolvedNodes)}
						/>
						<Meta label="Connectivity Mode" value={provenance.connectivity} />
						<Meta label="Expose Type" value={provenance.exposeType} />
						<Meta
							label="Files From ConfigMap Nodes"
							value={String(provenance.filesFromConfigMapNodeCount)}
						/>
						<Meta
							label="Deploy Payload SHA256"
							value={provenance.payloadSha256}
						/>
						<Meta label="Bundle SHA256" value={provenance.bundleSha256} />
					</div>
					{nodeSample.length > 0 && (
						<div className="space-y-2">
							<div className="font-medium text-sm">Node Resolution Sample</div>
							<div className="overflow-auto rounded-md border">
								<table className="w-full text-sm">
									<thead className="bg-muted/60">
										<tr>
											<th className="px-3 py-2 text-left font-medium">Node</th>
											<th className="px-3 py-2 text-left font-medium">Kind</th>
											<th className="px-3 py-2 text-left font-medium">
												Device
											</th>
											<th className="px-3 py-2 text-left font-medium">
												Source
											</th>
											<th className="px-3 py-2 text-left font-medium">
												Resolved
											</th>
										</tr>
									</thead>
									<tbody>
										{nodeSample.map((row, index) => (
											<tr key={`${row.node}-${index}`} className="border-t">
												<td className="px-3 py-2">{row.node || "—"}</td>
												<td className="px-3 py-2">{row.kind || "—"}</td>
												<td className="px-3 py-2">{row.device || "—"}</td>
												<td className="px-3 py-2">{row.source || "—"}</td>
												<td className="px-3 py-2">
													<Badge
														variant={row.resolved ? "default" : "secondary"}
													>
														{row.resolved ? "yes" : "no"}
													</Badge>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Lifecycle Events</CardTitle>
						<div className="text-xs text-muted-foreground">
							Cursor: {String(lifecycle.data?.cursor ?? 0)}
						</div>
					</div>
					<CardDescription>
						Structured task events emitted by native engine phases.
					</CardDescription>
					{deployFailureCategories.length > 0 && (
						<div className="flex flex-wrap gap-2 pt-2">
							{deployFailureCategories.map((item) => (
								<Badge key={item.category} variant="outline">
									{item.category}: {item.count}
								</Badge>
							))}
						</div>
					)}
				</CardHeader>
				<CardContent>
					{lifecycleRecent.length === 0 ? (
						<div className="text-muted-foreground text-sm">
							Waiting for lifecycle events…
						</div>
					) : (
						<div className="space-y-2">
							{lifecycleRecent.map((entry, index) => (
								<div
									key={`${entry.time}-${entry.type}-${index}`}
									className="rounded-md border p-3"
								>
									<div className="mb-1 flex items-center gap-2">
										<Badge variant="outline">{entry.type || "event"}</Badge>
										<span className="text-muted-foreground text-xs">
											{entry.time || ""}
										</span>
									</div>
									<pre className="overflow-auto whitespace-pre-wrap break-all rounded bg-muted/40 p-2 text-[11px]">
										{prettyJson(entry.payload)}
									</pre>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Output</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100">
						<DeploymentRunOutput entries={logs.data?.entries ?? []} />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function Meta(props: { label: string; value: string }) {
	return (
		<div className="space-y-1">
			<div className="text-[11px] uppercase tracking-wide text-muted-foreground">
				{props.label}
			</div>
			<div className="break-all font-medium text-sm">{props.value || "—"}</div>
		</div>
	);
}

function prettyJson(value: unknown): string {
	if (value === null || value === undefined) return "{}";
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return "{}";
	}
}
