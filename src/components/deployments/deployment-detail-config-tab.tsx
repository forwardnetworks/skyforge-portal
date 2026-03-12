import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TabsContent } from "@/components/ui/tabs";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

export function DeploymentDetailConfigTab({
	page,
}: { page: DeploymentDetailPageState }) {
	const {
		deployment,
		forwardEnabled,
		setForwardEnabled,
		forwardCollector,
		setForwardCollector,
		forwardAutoSyncOnBringUp,
		setForwardAutoSyncOnBringUp,
		updateForward,
		forwardCollectorsQ,
		forwardCollectors,
		syncForward,
		downloadDeploymentConfig,
	} = page;
	if (!deployment) return null;
	return (
		<TabsContent value="config" className="space-y-6 animate-in fade-in-50">
			<Card>
				<CardHeader>
					<CardTitle>Forward Analytics</CardTitle>
					<CardDescription>
						Optional: sync device IPs into Forward for collection.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<div className="text-sm font-medium">
								Enable Forward collection
							</div>
							<div className="text-xs text-muted-foreground">
								Requires configuring your Collector first.
							</div>
						</div>
						<Switch
							checked={forwardEnabled}
							disabled={updateForward.isPending}
							onCheckedChange={(checked) => {
								setForwardEnabled(checked);
								const nextCollector = checked ? forwardCollector.trim() : "";
								updateForward.mutate({
									enabled: checked,
									collectorConfigId: nextCollector || undefined,
									autoSyncOnBringUp: forwardAutoSyncOnBringUp,
								});
							}}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<div className="text-sm font-medium">
								Auto-sync after bring-up
							</div>
							<div className="text-xs text-muted-foreground">
								Queue Forward sync automatically after successful bring-up.
							</div>
						</div>
						<Switch
							checked={forwardAutoSyncOnBringUp}
							disabled={!forwardEnabled || updateForward.isPending}
							onCheckedChange={(checked) => {
								setForwardAutoSyncOnBringUp(checked);
								updateForward.mutate({
									enabled: forwardEnabled,
									collectorConfigId: forwardCollector || undefined,
									autoSyncOnBringUp: checked,
								});
							}}
						/>
					</div>
					{forwardEnabled ? (
						<div className="grid gap-3 md:grid-cols-2">
							<div className="space-y-2">
								<div className="text-sm font-medium">Collector</div>
								<Select
									value={forwardCollector}
									onValueChange={(val) => {
										setForwardCollector(val);
										updateForward.mutate({
											enabled: true,
											collectorConfigId: val,
											autoSyncOnBringUp: forwardAutoSyncOnBringUp,
										});
									}}
									disabled={
										forwardCollectorsQ.isLoading ||
										forwardCollectorsQ.isError ||
										updateForward.isPending
									}
								>
									<SelectTrigger>
										<SelectValue
											placeholder={
												forwardCollectorsQ.isLoading
													? "Loading…"
													: forwardCollectorsQ.isError
														? "Configure Collector first"
														: "Select collector…"
											}
										/>
									</SelectTrigger>
									<SelectContent>
										{forwardCollectors.map((c) => (
											<SelectItem key={c.id} value={c.id}>
												{c.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-end gap-2">
								<Button
									variant="outline"
									onClick={() => syncForward.mutate()}
									disabled={
										!forwardCollector.trim() ||
										syncForward.isPending ||
										updateForward.isPending
									}
								>
									{syncForward.isPending ? "Queueing…" : "Sync now"}
								</Button>
							</div>
						</div>
					) : null}
					<div className="rounded-md border p-3 text-xs">
						<div className="font-medium text-foreground">
							Sync status:{" "}
							<span className="capitalize">
								{String(deployment.syncState ?? "idle").replaceAll("_", " ")}
							</span>
						</div>
						{deployment.lastSyncAt ? (
							<div className="text-muted-foreground mt-1">
								Last sync: {new Date(deployment.lastSyncAt).toLocaleString()}
								{deployment.lastSyncStatus
									? ` (${deployment.lastSyncStatus})`
									: ""}
							</div>
						) : (
							<div className="text-muted-foreground mt-1">
								No sync run recorded yet.
							</div>
						)}
						{deployment.lastSyncError ? (
							<div className="text-destructive mt-1">
								{deployment.lastSyncError}
							</div>
						) : null}
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-3">
						<div>
							<CardTitle>Configuration</CardTitle>
							<CardDescription>
								Read-only view of the deployment parameters.
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									void navigator.clipboard?.writeText(
										JSON.stringify(deployment.config ?? {}, null, 2),
									);
									toast.success("Copied config JSON");
								}}
							>
								<Copy className="mr-2 h-4 w-4" />
								Copy
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={downloadDeploymentConfig}
							>
								<Download className="mr-2 h-4 w-4" />
								Download
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<pre className="bg-muted p-4 rounded-lg overflow-auto font-mono text-xs max-h-[500px]">
						{JSON.stringify(deployment.config, null, 2)}
					</pre>
				</CardContent>
			</Card>
		</TabsContent>
	);
}
