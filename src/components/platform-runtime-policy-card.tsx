import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

function toInt(value: string, fallback: number) {
	const parsed = Number.parseInt(value, 10);
	if (!Number.isFinite(parsed)) {
		return fallback;
	}
	return parsed;
}

export function PlatformRuntimePolicyCard(props: {
	page: PlatformCapacityPageState;
}) {
	const { page } = props;
	const current = page.runtimePolicyQ.data;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Runtime policy</CardTitle>
				<CardDescription>
					Global KNE deploy admission controls. Safe admin-tunable bounds only.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="runtime-policy-cpu-reserve">
							CPU reserve percent ({page.reserveMin}-{page.reserveMax})
						</Label>
						<Input
							id="runtime-policy-cpu-reserve"
							type="number"
							min={page.reserveMin}
							max={page.reserveMax}
							step={1}
							value={page.capacityReserveCpuPercent}
							onChange={(event) =>
								page.setCapacityReserveCpuPercent(
									toInt(event.target.value, page.capacityReserveCpuPercent),
								)
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="runtime-policy-memory-reserve">
							Memory reserve percent ({page.reserveMin}-{page.reserveMax})
						</Label>
						<Input
							id="runtime-policy-memory-reserve"
							type="number"
							min={page.reserveMin}
							max={page.reserveMax}
							step={1}
							value={page.capacityReserveMemoryPercent}
							onChange={(event) =>
								page.setCapacityReserveMemoryPercent(
									toInt(event.target.value, page.capacityReserveMemoryPercent),
								)
							}
						/>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					<div className="flex items-center justify-between rounded-md border p-3">
						<div className="space-y-1">
							<p className="text-sm font-medium">Fail on insufficient resources</p>
							<p className="text-xs text-muted-foreground">
								Reject deploy immediately if capacity preflight cannot place the
								workload.
							</p>
						</div>
						<Switch
							checked={page.failOnInsufficientResources}
							onCheckedChange={page.setFailOnInsufficientResources}
						/>
					</div>
					<div className="flex items-center justify-between rounded-md border p-3">
						<div className="space-y-1">
							<p className="text-sm font-medium">Compatibility preflight</p>
							<p className="text-xs text-muted-foreground">
								Check KNE API/controller compatibility before queueing deploy.
							</p>
						</div>
						<Switch
							checked={page.compatibilityPreflight}
							onCheckedChange={page.setCompatibilityPreflight}
						/>
					</div>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Button
						onClick={() => page.saveRuntimePolicyMutation.mutate()}
						disabled={
							page.saveRuntimePolicyMutation.isPending || page.runtimePolicyQ.isLoading
						}
					>
						{page.saveRuntimePolicyMutation.isPending
							? "Saving..."
							: "Save runtime policy"}
					</Button>
					<Button
						variant="secondary"
						onClick={page.resetRuntimePolicyFromServer}
						disabled={page.runtimePolicyQ.isLoading}
					>
						Reset form
					</Button>
				</div>

				<p className="text-xs text-muted-foreground">
					Effective now:
					{" "}
					{current
						? `cpu=${current.capacityReserveCpuPercent}% memory=${current.capacityReserveMemoryPercent}% failOnInsufficient=${current.failOnInsufficientResources} compatibility=${current.compatibilityPreflight}`
						: "loading..."}
				</p>
			</CardContent>
		</Card>
	);
}
