import { fmtSpeedMbps } from "@/components/capacity/forward-network-capacity-utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ForwardNetworkCapacityPageState } from "@/hooks/use-forward-network-capacity-page";

export function ForwardNetworkCapacityPickInterfaceDialog({
	page,
}: {
	page: ForwardNetworkCapacityPageState;
}) {
	return (
		<Dialog
			open={page.pickIfaceOpen}
			onOpenChange={(v) => !v && page.setPickIfaceOpen(false)}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-base">Pick Interface</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Input
						placeholder="Search device/interface…"
						value={page.pickIfaceQuery}
						onChange={(e) => page.setPickIfaceQuery(e.target.value)}
					/>
					<div className="max-h-[55vh] overflow-auto rounded-md border">
						{(() => {
							const all = page.inventory.data?.interfaces ?? [];
							const q = page.pickIfaceQuery.trim().toLowerCase();
							const filtered = q
								? all.filter((r) => {
										const dn = String(r.deviceName ?? "").toLowerCase();
										const iname = String(r.interfaceName ?? "").toLowerCase();
										return dn.includes(q) || iname.includes(q);
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
										const iname = String(r.interfaceName ?? "");
										const speed = fmtSpeedMbps(r.speedMbps ?? null);
										return (
											<button
												type="button"
												key={`${dn}:${iname}`}
												className="w-full px-3 py-2 text-left hover:bg-muted/40"
												onClick={() => {
													page.setSelectedIface({
														id: `${dn}:${iname}:INGRESS:pick`,
														device: dn,
														iface: iname,
														dir: "INGRESS",
														speedMbps: r.speedMbps ?? null,
														admin: r.adminStatus ?? undefined,
														oper: r.operStatus ?? undefined,
														samples: 0,
													});
													page.setPickIfaceOpen(false);
												}}
											>
												<div className="flex items-center justify-between gap-3">
													<div className="font-mono text-xs">
														{dn} {iname}
													</div>
													<div className="text-xs text-muted-foreground">
														{speed}
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
						Loads a trend directly from Forward perf history (not limited to the
						top-50 rollups).
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
