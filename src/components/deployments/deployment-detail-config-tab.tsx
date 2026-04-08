import { Badge } from "@/components/ui/badge";
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
import { useMemo, useState } from "react";
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
		forwardTopologySourceUserId,
		forwardTopologySourceDeploymentId,
		setForwardTopologySourceUserId,
		setForwardTopologySourceDeploymentId,
		updateForward,
		forwardCollectorsQ,
		forwardCollectors,
		deploymentSourceSharesQ,
		deploymentSourceShares,
		sharedDeploymentSourcesQ,
		sharedDeploymentSources,
		assignableUsersQ,
		grantDeploymentSourceShare,
		revokeDeploymentSourceShare,
		syncForward,
		downloadDeploymentConfig,
	} = page;
	const [selectedShareUsername, setSelectedShareUsername] = useState("");
	if (!deployment) return null;

	const selfSourceValue = "__self__";
	const currentSourceValue =
		forwardTopologySourceUserId && forwardTopologySourceDeploymentId
			? `${forwardTopologySourceUserId}:${forwardTopologySourceDeploymentId}`
			: selfSourceValue;
	const assignableUsers = assignableUsersQ.data?.users ?? [];
	const currentSharedSource = sharedDeploymentSources.find(
		(source) =>
			source.sourceUserId === forwardTopologySourceUserId &&
			source.sourceDeploymentId === forwardTopologySourceDeploymentId,
	);
	const sharedSourceOptions = useMemo(
		() =>
			sharedDeploymentSources
				.filter(
					(source) =>
						!(
							source.sourceUserId === deployment.userId &&
							source.sourceDeploymentId === deployment.id
						),
				)
				.map((source) => ({
					value: `${source.sourceUserId}:${source.sourceDeploymentId}`,
					label:
						source.sourceDeploymentName ||
						`${source.sourceUserId}/${source.sourceDeploymentId.slice(0, 8)}`,
					description: `${source.sourceUserId} · ${source.access}`,
				})),
		[deployment.id, deployment.userId, sharedDeploymentSources],
	);

	const persistForwardSettings = (next: {
		enabled: boolean;
		collectorConfigId?: string;
		autoSyncOnBringUp?: boolean;
		topologySourceUserId?: string;
		topologySourceDeploymentId?: string;
	}) => {
		updateForward.mutate(next);
	};
	const formatMaybeDateTime = (raw?: string) => {
		const value = String(raw ?? "").trim();
		if (!value) return "";
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return value;
		return parsed.toLocaleString();
	};

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
								persistForwardSettings({
									enabled: checked,
									collectorConfigId: nextCollector || undefined,
									autoSyncOnBringUp: forwardAutoSyncOnBringUp,
									topologySourceUserId:
										forwardTopologySourceUserId || deployment.userId,
									topologySourceDeploymentId:
										forwardTopologySourceDeploymentId || deployment.id,
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
								persistForwardSettings({
									enabled: forwardEnabled,
									collectorConfigId: forwardCollector || undefined,
									autoSyncOnBringUp: checked,
									topologySourceUserId:
										forwardTopologySourceUserId || deployment.userId,
									topologySourceDeploymentId:
										forwardTopologySourceDeploymentId || deployment.id,
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
										persistForwardSettings({
											enabled: true,
											collectorConfigId: val,
											autoSyncOnBringUp: forwardAutoSyncOnBringUp,
											topologySourceUserId:
												forwardTopologySourceUserId || deployment.userId,
											topologySourceDeploymentId:
												forwardTopologySourceDeploymentId || deployment.id,
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
							<div className="space-y-2">
								<div className="flex items-center gap-2 text-sm font-medium">
									<span>Topology source</span>
									{currentSharedSource ? (
										<Badge variant="outline">Read-only</Badge>
									) : null}
								</div>
								<Select
									value={currentSourceValue}
									onValueChange={(value) => {
										if (value === selfSourceValue) {
											setForwardTopologySourceUserId("");
											setForwardTopologySourceDeploymentId("");
											persistForwardSettings({
												enabled: forwardEnabled,
												collectorConfigId: forwardCollector || undefined,
												autoSyncOnBringUp: forwardAutoSyncOnBringUp,
												topologySourceUserId: deployment.userId,
												topologySourceDeploymentId: deployment.id,
											});
											return;
										}
										const [userId, deploymentId] = value.split(":");
										setForwardTopologySourceUserId(userId ?? "");
										setForwardTopologySourceDeploymentId(deploymentId ?? "");
										persistForwardSettings({
											enabled: forwardEnabled,
											collectorConfigId: forwardCollector || undefined,
											autoSyncOnBringUp: forwardAutoSyncOnBringUp,
											topologySourceUserId: userId,
											topologySourceDeploymentId: deploymentId,
										});
									}}
									disabled={
										sharedDeploymentSourcesQ.isLoading ||
										updateForward.isPending
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select topology source…" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={selfSourceValue}>
											This deployment
										</SelectItem>
										{sharedSourceOptions.map((source) => (
											<SelectItem key={source.value} value={source.value}>
												{source.label} ({source.description})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<div className="text-xs text-muted-foreground">
									{currentSharedSource
										? `Using ${currentSharedSource.sourceDeploymentName || currentSharedSource.sourceDeploymentId} from ${currentSharedSource.sourceUserId}.`
										: "Default: use this deployment as both the topology source and sync destination."}
								</div>
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
					<CardTitle>Shared Forward Sources</CardTitle>
					<CardDescription>
						Grant other users read-only access to use this deployment as a
						Forward sync topology source.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
						<div className="space-y-2">
							<div className="text-sm font-medium">Grant access</div>
							<Select
								value={selectedShareUsername}
								onValueChange={setSelectedShareUsername}
								disabled={
									assignableUsersQ.isLoading ||
									grantDeploymentSourceShare.isPending
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select user…" />
								</SelectTrigger>
								<SelectContent>
									{assignableUsers
										.filter((user) => user.username !== deployment.userId)
										.map((user) => (
											<SelectItem key={user.id} value={user.username}>
												{user.display || user.username}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-end">
							<Button
								variant="outline"
								disabled={
									!selectedShareUsername || grantDeploymentSourceShare.isPending
								}
								onClick={() => {
									const username = selectedShareUsername.trim();
									if (!username) return;
									grantDeploymentSourceShare.mutate(
										{ username, access: "read" },
										{
											onSuccess: () => setSelectedShareUsername(""),
										},
									);
								}}
							>
								{grantDeploymentSourceShare.isPending
									? "Granting…"
									: "Grant read access"}
							</Button>
						</div>
					</div>
					{deploymentSourceSharesQ.isError ? (
						<div className="rounded-md border p-3 text-xs text-muted-foreground">
							Source-share management is available to the deployment owner or
							admins.
						</div>
					) : deploymentSourceShares.length ? (
						<div className="space-y-2">
							{deploymentSourceShares.map((share) => (
								<div
									key={share.username}
									className="flex items-center justify-between rounded-md border p-3"
								>
									<div className="space-y-1">
										<div className="text-sm font-medium">{share.username}</div>
										<div className="text-xs text-muted-foreground">
											Granted {share.access} access
										</div>
										<div className="text-xs text-muted-foreground">
											Granted by {share.createdBy || "unknown"}
											{share.createdAt
												? ` · ${formatMaybeDateTime(share.createdAt)}`
												: ""}
										</div>
										<div className="text-xs text-muted-foreground">
											Last updated{" "}
											{share.updatedAt
												? formatMaybeDateTime(share.updatedAt)
												: "unknown"}
										</div>
									</div>
									<Button
										size="sm"
										variant="outline"
										disabled={revokeDeploymentSourceShare.isPending}
										onClick={() =>
											revokeDeploymentSourceShare.mutate(share.username)
										}
									>
										Remove
									</Button>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-md border p-3 text-xs text-muted-foreground">
							No users currently have access to this deployment as a shared
							Forward source.
						</div>
					)}
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
					<pre className="bg-muted max-h-[500px] overflow-auto rounded-lg p-4 font-mono text-xs">
						{JSON.stringify(deployment.config, null, 2)}
					</pre>
				</CardContent>
			</Card>
		</TabsContent>
	);
}
