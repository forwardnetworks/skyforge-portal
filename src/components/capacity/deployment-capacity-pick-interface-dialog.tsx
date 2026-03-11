import { fmtSpeedMbps } from "@/components/capacity/deployment-capacity-utils";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { DeploymentCapacityPageState } from "@/hooks/use-deployment-capacity-page";

export function DeploymentCapacityPickInterfaceDialog(props: {
	page: DeploymentCapacityPageState;
}) {
	const { page } = props;

	return (
		<Dialog
			open={page.pickIfaceOpen}
			onOpenChange={(open) => !open && page.setPickIfaceOpen(false)}
		>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="text-base">Pick Interface</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Input
						placeholder="Search device/interface…"
						value={page.pickIfaceQuery}
						onChange={(event) => page.setPickIfaceQuery(event.target.value)}
					/>
					<div className="max-h-[55vh] overflow-auto rounded-md border">
						{(() => {
							const all = page.inventory.data?.interfaces ?? [];
							const query = page.pickIfaceQuery.trim().toLowerCase();
							const filtered = query
								? all.filter((row) => {
										const deviceName = String(
											row.deviceName ?? "",
										).toLowerCase();
										const interfaceName = String(
											row.interfaceName ?? "",
										).toLowerCase();
										return (
											deviceName.includes(query) ||
											interfaceName.includes(query)
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
										const interfaceName = String(row.interfaceName ?? "");
										return (
											<button
												type="button"
												key={`${deviceName}:${interfaceName}`}
												className="w-full px-3 py-2 text-left hover:bg-muted/40"
												onClick={() => {
													page.setSelectedIface({
														id: `${deviceName}:${interfaceName}:INGRESS:pick`,
														device: deviceName,
														iface: interfaceName,
														dir: "INGRESS",
														speedMbps: row.speedMbps ?? null,
														admin: row.adminStatus ?? undefined,
														oper: row.operStatus ?? undefined,
														samples: 0,
													});
													page.setPickIfaceOpen(false);
												}}
											>
												<div className="flex items-center justify-between gap-3">
													<div className="font-mono text-xs">
														{deviceName} {interfaceName}
													</div>
													<div className="text-xs text-muted-foreground">
														{fmtSpeedMbps(row.speedMbps ?? null)}
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
