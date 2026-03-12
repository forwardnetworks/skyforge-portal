import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { formatCurrencyFromCents, formatMilliCPU, formatMode } from "./platform-capacity-formatting";

type InfraComparison = NonNullable<
	NonNullable<PlatformCapacityPageState["overviewQ"]["data"]>["infraComparison"]
>;

function ProviderSection(props: {
	label: string;
	stats: {
		nodeCount: number;
		readyNodeCount: number;
		allocatableMilliCpu: number;
		estimatedMonthlyCostCents?: number;
	};
}) {
	const { label, stats } = props;
	return (
		<div className="space-y-1">
			<div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
				{label}
			</div>
			<div className="grid gap-1 text-sm sm:grid-cols-3">
				<div>
					<div className="text-muted-foreground text-xs">Nodes</div>
					<div className="font-semibold">{stats.nodeCount}</div>
				</div>
				<div>
					<div className="text-muted-foreground text-xs">Ready</div>
					<div className="font-semibold">{stats.readyNodeCount}</div>
				</div>
				<div>
					<div className="text-muted-foreground text-xs">Allocatable vCPU</div>
					<div className="font-semibold">
						{formatMilliCPU(stats.allocatableMilliCpu) ?? "0 vCPU"}
					</div>
				</div>
				<div>
					<div className="text-muted-foreground text-xs">Monthly cost</div>
					<div className="font-semibold">
						{formatCurrencyFromCents(stats.estimatedMonthlyCostCents ?? 0)}
					</div>
				</div>
			</div>
		</div>
	);
}

export function PlatformCapacityInfraComparisonCard(props: {
	infraComparison: InfraComparison | undefined;
}) {
	const { infraComparison } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Blended infrastructure</CardTitle>
				<CardDescription>
					Cloud versus on-prem pool posture from the live cluster inventory.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				{infraComparison ? (
					<>
						<ProviderSection
							label="Cloud providers"
							stats={{
								nodeCount: infraComparison.cloud?.nodeCount ?? 0,
								readyNodeCount: infraComparison.cloud?.readyNodeCount ?? 0,
								allocatableMilliCpu:
									infraComparison.cloud?.allocatableMilliCpu ?? 0,
								estimatedMonthlyCostCents:
									infraComparison.cloud?.estimatedMonthlyCostCents ?? 0,
							}}
						/>
						<ProviderSection
							label="On-prem providers"
							stats={{
								nodeCount: infraComparison.onPrem?.nodeCount ?? 0,
								readyNodeCount: infraComparison.onPrem?.readyNodeCount ?? 0,
								allocatableMilliCpu:
									infraComparison.onPrem?.allocatableMilliCpu ?? 0,
								estimatedMonthlyCostCents:
									infraComparison.onPrem?.estimatedMonthlyCostCents ?? 0,
							}}
						/>
						<div className="rounded-lg border border-border/60 bg-background/60 p-3">
							<div className="text-xs uppercase tracking-wide text-muted-foreground">
								Recommendation
							</div>
							<div className="mt-1 font-semibold">
								{infraComparison.recommended || "n/a"}
							</div>
							<div className="mt-1 text-xs text-muted-foreground">
								{infraComparison.summary || "No blended infrastructure summary reported."}
							</div>
						</div>
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="rounded-lg border border-border/60 bg-background/60 p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									Cloud mode
								</div>
								<div className="mt-1 text-sm font-semibold">
									{formatMode(infraComparison.cloud?.mode)}
								</div>
							</div>
							<div className="rounded-lg border border-border/60 bg-background/60 p-3">
								<div className="text-xs uppercase tracking-wide text-muted-foreground">
									On-prem mode
								</div>
								<div className="mt-1 text-sm font-semibold">
									{formatMode(infraComparison.onPrem?.mode)}
								</div>
							</div>
						</div>
					</>
				) : (
					<div className="text-sm text-muted-foreground">
						No blended infrastructure comparison reported yet.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
