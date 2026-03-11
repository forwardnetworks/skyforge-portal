import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityPickDeviceDialog({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Dialog
			open={page.pickDeviceOpen}
			onOpenChange={(v) => !v && page.setPickDeviceOpen(false)}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-base">Pick Device</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Input
						placeholder="Search device…"
						value={page.pickDeviceQuery}
						onChange={(e) => page.setPickDeviceQuery(e.target.value)}
					/>
					<div className="max-h-[55vh] overflow-auto rounded-md border">
						{(() => {
							const all = page.inventory.data?.devices ?? [];
							const q = page.pickDeviceQuery.trim().toLowerCase();
							const filtered = q
								? all.filter((r) => {
										const dn = String(r.deviceName ?? "").toLowerCase();
										const vendor = String(r.vendor ?? "").toLowerCase();
										const os = String(r.os ?? "").toLowerCase();
										return (
											dn.includes(q) || vendor.includes(q) || os.includes(q)
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
									{limited.map((r) => {
										const dn = String(r.deviceName ?? "");
										return (
											<button
												type="button"
												key={dn}
												className="w-full px-3 py-2 text-left hover:bg-muted/40"
												onClick={() => {
													page.setSelectedDevice({
														id: `${dn}:pick`,
														device: dn,
														metric: page.deviceMetric,
														vendor: r.vendor ?? undefined,
														os: r.os ?? undefined,
														model: r.model ?? undefined,
														samples: 0,
													});
													page.setPickDeviceOpen(false);
												}}
											>
												<div className="flex items-center justify-between gap-3">
													<div className="font-mono text-xs">{dn}</div>
													<div className="text-xs text-muted-foreground">
														{[r.vendor ?? "", r.os ?? ""]
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
