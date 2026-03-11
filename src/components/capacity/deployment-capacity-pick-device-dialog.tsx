import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityPickDeviceDialog(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;

	return (
		<Dialog
			open={page.pickDeviceOpen}
			onOpenChange={(open) => !open && page.setPickDeviceOpen(false)}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-base">Pick Device</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Input
						placeholder="Search device…"
						value={page.pickDeviceQuery}
						onChange={(event) => page.setPickDeviceQuery(event.target.value)}
					/>
					<div className="max-h-[55vh] overflow-auto rounded-md border">
						{(() => {
							const all = page.inventory.data?.devices ?? [];
							const query = page.pickDeviceQuery.trim().toLowerCase();
							const filtered = query
								? all.filter((row) => {
										const deviceName = String(
											row.deviceName ?? "",
										).toLowerCase();
										const vendor = String(row.vendor ?? "").toLowerCase();
										const os = String(row.os ?? "").toLowerCase();
										return (
											deviceName.includes(query) ||
											vendor.includes(query) ||
											os.includes(query)
										);
									})
								: all;
							const limited = filtered.slice(0, 200);
							if (!limited.length) {
								return (
									<div className="p-4 text-sm text-muted-foreground">
										No matches.
									</div>
								);
							}
							return (
								<div className="divide-y">
									{limited.map((row) => {
										const deviceName = String(row.deviceName ?? "");
										return (
											<button
												type="button"
												key={deviceName}
												className="w-full px-3 py-2 text-left hover:bg-muted/40"
												onClick={() => {
													page.setSelectedDevice({
														id: `${deviceName}:pick`,
														device: deviceName,
														metric: page.deviceMetric,
														vendor: row.vendor ?? undefined,
														os: row.os ?? undefined,
														model: row.model ?? undefined,
														samples: 0,
													});
													page.setPickDeviceOpen(false);
												}}
											>
												<div className="flex items-center justify-between gap-3">
													<div className="font-mono text-xs">{deviceName}</div>
													<div className="text-xs text-muted-foreground">
														{[row.vendor ?? "", row.os ?? ""]
															.filter(Boolean)
															.join(" • ") || "—"}
													</div>
												</div>
											</button>
										);
									})}
								</div>
							);
						})()}
					</div>
					<div className="text-xs text-muted-foreground">
						Loads a trend directly from Forward perf history.
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
