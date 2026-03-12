import type { ConfigChangeRunRecord } from "../lib/api-client-config-changes";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { ConfigField } from "./config-changes-shared";

export function ConfigChangesDeviceResultsCard({
	run,
}: {
	run: ConfigChangeRunRecord;
}) {
	const deviceResults = run.executionSummary?.deviceResults ?? [];
	if (deviceResults.length === 0) return null;

	const reachableCount = deviceResults.filter(
		(device) => device.nodeStatus?.trim().toLowerCase() === "reachable",
	).length;
	const managementReadyCount = deviceResults.filter(
		(device) => Boolean(device.mgmtHost || device.mgmtIp),
	).length;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Per-Device Verification</CardTitle>
				<CardDescription>
					Operator-facing device state from the execution evidence and current
					node-status rows.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-3 md:grid-cols-3">
					<ConfigField label="Devices" value={String(deviceResults.length)} />
					<ConfigField label="Reachable" value={String(reachableCount)} />
					<ConfigField
						label="Mgmt Ready"
						value={String(managementReadyCount)}
					/>
				</div>
				<div className="space-y-2">
					{deviceResults.map((device) => {
						const reachable =
							device.nodeStatus?.trim().toLowerCase() === "reachable";
						const warnings: string[] = [];
						if (!reachable) {
							warnings.push("Node is not yet reporting reachable");
						}
						if (!device.mgmtHost && !device.mgmtIp) {
							warnings.push("Management endpoint not populated");
						}
						return (
							<div
								key={`${device.name}-${device.deviceKey ?? device.taskId ?? "device"}`}
								className="rounded-md border p-3 text-sm space-y-3"
							>
								<div className="flex items-center justify-between gap-3">
									<div>
										<div className="font-medium">{device.name}</div>
										<div className="text-xs text-muted-foreground">
											{device.kind || "device"}
											{device.image ? ` • ${device.image}` : ""}
											{device.forwardType ? ` • ${device.forwardType}` : ""}
										</div>
									</div>
									<div className="flex items-center gap-2">
										<Badge variant={reachable ? "default" : "outline"}>
											{device.nodeStatus || "unknown"}
										</Badge>
										{device.taskId ? (
											<Badge variant="outline">task {device.taskId}</Badge>
										) : null}
									</div>
								</div>
								<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
									<ConfigField
										label="Device key"
										value={device.deviceKey || "n/a"}
										mono
									/>
									<ConfigField
										label="Mgmt host"
										value={device.mgmtHost || "n/a"}
										mono
									/>
									<ConfigField
										label="Mgmt IP"
										value={device.mgmtIp || "n/a"}
										mono
									/>
									<ConfigField
										label="Ping IP"
										value={device.pingIp || "n/a"}
										mono
									/>
									<ConfigField
										label="Updated"
										value={
											device.updatedAt
												? new Date(device.updatedAt).toLocaleString()
												: "n/a"
										}
									/>
								</div>
								{warnings.length ? (
									<div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-xs space-y-1">
										<div className="font-medium">Verification hints</div>
										{warnings.map((warning) => (
											<div key={warning}>{warning}</div>
										))}
									</div>
								) : null}
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
