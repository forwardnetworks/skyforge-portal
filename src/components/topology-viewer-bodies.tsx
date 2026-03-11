import { Button } from "@/components/ui/button";
import type {
	DeploymentNodeInterfacesResponse,
	DeploymentNodeRunningConfigResponse,
} from "@/lib/api-client";
import { toast } from "sonner";
import { formatBytes } from "./topology-viewer-utils";

export function InterfacesBody(props: {
	node: string;
	data?: DeploymentNodeInterfacesResponse;
	loading: boolean;
	error: string;
	autoRefresh: boolean;
	onToggleAutoRefresh: () => void;
}) {
	if (props.loading)
		return <div className="text-sm text-muted-foreground">Loading…</div>;
	if (props.error)
		return <div className="text-sm text-destructive">{props.error}</div>;
	const rows = props.data?.interfaces ?? [];
	if (!rows.length)
		return (
			<div className="text-sm text-muted-foreground">No interfaces found.</div>
		);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div className="text-xs text-muted-foreground font-mono truncate">
					{props.node}
				</div>
				<Button
					size="sm"
					variant={props.autoRefresh ? "default" : "outline"}
					onClick={props.onToggleAutoRefresh}
				>
					{props.autoRefresh ? "Auto refresh: on" : "Auto refresh: off"}
				</Button>
			</div>
			<div className="rounded-md border overflow-auto max-h-[60vh]">
				<table className="w-full text-xs">
					<thead className="bg-muted/50 sticky top-0">
						<tr>
							<th className="text-left p-2">Interface</th>
							<th className="text-left p-2">Peer</th>
							<th className="text-left p-2">State</th>
							<th className="text-right p-2">RX</th>
							<th className="text-right p-2">TX</th>
							<th className="text-right p-2">Drops</th>
						</tr>
					</thead>
					<tbody>
						{rows.map((r) => (
							<tr key={r.ifName} className="border-t">
								<td className="p-2 font-mono">{r.ifName}</td>
								<td className="p-2 font-mono text-muted-foreground">
									{r.peerNode ? `${r.peerNode}:${r.peerIf ?? ""}` : "—"}
								</td>
								<td className="p-2">{r.operState ?? "—"}</td>
								<td className="p-2 text-right font-mono">
									{formatBytes(Number(r.rxBytes ?? 0))}
								</td>
								<td className="p-2 text-right font-mono">
									{formatBytes(Number(r.txBytes ?? 0))}
								</td>
								<td className="p-2 text-right font-mono">
									{Number(r.rxDropped ?? 0) + Number(r.txDropped ?? 0)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}

export function RunningConfigBody(props: {
	node: string;
	data?: DeploymentNodeRunningConfigResponse;
	loading: boolean;
	error: string;
}) {
	if (props.loading)
		return <div className="text-sm text-muted-foreground">Loading…</div>;
	if (props.error)
		return <div className="text-sm text-destructive">{props.error}</div>;
	if (props.data?.skipped) {
		return (
			<div className="text-sm text-muted-foreground">
				{props.data.message || "Skipped"}
			</div>
		);
	}
	const cfg = String(props.data?.stdout ?? "");
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<div className="text-xs text-muted-foreground font-mono truncate">
					{props.node}
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={() => {
						void navigator.clipboard?.writeText(cfg);
						toast.success("Copied running config");
					}}
					disabled={!cfg}
				>
					Copy
				</Button>
			</div>
			<pre className="max-h-[65vh] overflow-auto rounded-md border bg-zinc-950 p-4 font-mono text-xs text-zinc-100 whitespace-pre-wrap">
				{cfg || "No output"}
			</pre>
			{props.data?.stderr ? (
				<div className="text-xs text-muted-foreground whitespace-pre-wrap">
					{props.data.stderr}
				</div>
			) : null}
		</div>
	);
}
