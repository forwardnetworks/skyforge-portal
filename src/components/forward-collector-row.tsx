import type { ForwardCollectorsPageState } from "@/hooks/use-forward-collectors-page";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

type Collector = ForwardCollectorsPageState["collectors"][number];

export function ForwardCollectorRow(props: {
	page: ForwardCollectorsPageState;
	collector: Collector;
}) {
	const { page, collector } = props;
	const ready = Boolean(collector.runtime?.ready);
	const connected =
		typeof collector.forwardCollector?.connected === "boolean"
			? collector.forwardCollector.connected
			: undefined;

	return (
		<div key={collector.id} className="rounded-md border p-3 space-y-2">
			<div className="flex items-center justify-between gap-2">
				<div className="min-w-0">
					<div className="flex items-center gap-2 min-w-0">
						<div className="font-medium truncate">{collector.name}</div>
						{collector.isDefault ? (
							<Badge variant="secondary">default</Badge>
						) : null}
						{collector.decryptionFailed ? (
							<Badge variant="destructive">re-save creds</Badge>
						) : null}
					</div>
					<div className="text-xs text-muted-foreground font-mono truncate">
						{collector.id}
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() =>
							page.setShowLogsId((prev) =>
								prev === collector.id ? "" : collector.id,
							)
						}
					>
						{page.showLogsId === collector.id ? "Hide logs" : "Logs"}
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => page.restartMutation.mutate(collector.id)}
						disabled={page.restartMutation.isPending}
					>
						Restart
					</Button>
					<Button
						variant={collector.runtime?.updateAvailable ? "default" : "outline"}
						size="sm"
						onClick={() => page.upgradeMutation.mutate(collector.id)}
						disabled={page.upgradeMutation.isPending}
					>
						Upgrade
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onClick={() => {
							if (!confirm(`Delete collector "${collector.name}"?`)) {
								return;
							}
							page.deleteMutation.mutate(collector.id);
						}}
						disabled={page.deleteMutation.isPending}
					>
						Delete
					</Button>
				</div>
			</div>

			<div className="text-sm">
				Status:{" "}
				<span className={ready ? "text-emerald-600" : "text-muted-foreground"}>
					{ready ? "Running" : "Starting…"}
				</span>
			</div>
			<div className="text-sm">
				Forward:{" "}
				{typeof connected === "boolean" ? (
					<span
						className={connected ? "text-emerald-600" : "text-muted-foreground"}
					>
						{connected ? "Connected" : "Not connected"}
					</span>
				) : (
					<span className="text-muted-foreground">Unknown</span>
				)}
			</div>

			{collector.forwardCollector?.version ? (
				<div className="text-xs text-muted-foreground">
					Version:{" "}
					<span className="font-mono">
						{String(collector.forwardCollector.version)}
					</span>
				</div>
			) : null}
			{collector.forwardCollector?.updateStatus ? (
				<div className="text-xs text-muted-foreground">
					Update:{" "}
					<span className="font-mono">
						{String(collector.forwardCollector.updateStatus)}
					</span>
				</div>
			) : null}
			{collector.forwardCollector?.externalIp ? (
				<div className="text-xs text-muted-foreground">
					External IP:{" "}
					<span className="font-mono">
						{String(collector.forwardCollector.externalIp)}
					</span>
				</div>
			) : null}
			{Array.isArray(collector.forwardCollector?.internalIps) &&
			(collector.forwardCollector?.internalIps ?? []).length > 0 ? (
				<div className="text-xs text-muted-foreground">
					Internal IPs:{" "}
					<span className="font-mono">
						{(collector.forwardCollector?.internalIps ?? [])
							.filter(Boolean)
							.join(", ")}
					</span>
				</div>
			) : null}
			{collector.runtime?.podName ? (
				<div className="text-xs text-muted-foreground">
					Pod:{" "}
					<span className="font-mono">{String(collector.runtime.podName)}</span>{" "}
					({String(collector.runtime.podPhase ?? "")})
				</div>
			) : null}

			{page.showLogsId === collector.id ? (
				<pre className="bg-muted p-3 rounded-md overflow-auto font-mono text-xs whitespace-pre-wrap">
					{page.logsQ.isLoading
						? "Loading…"
						: (page.logsQ.data?.logs ?? "").trim() || "No logs yet."}
				</pre>
			) : null}
		</div>
	);
}
