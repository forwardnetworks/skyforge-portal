import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { formatCurrencyFromCents } from "./platform-capacity-formatting";

export function PlatformCapacitySummaryCards(props: {
	page: PlatformCapacityPageState;
}) {
	const { page } = props;
	const overview = page.overviewQ.data;
	const hasCapacityPools = page.capacityPools.length > 0;

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			<Card>
				<CardHeader>
					<CardTitle>Capacity pools</CardTitle>
					<CardDescription>
						Active pools detected for platform capacity calculations.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{hasCapacityPools ? page.capacityPools.length : "—"}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Total reservations</CardTitle>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{overview?.reservationCount ?? 0}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Quota overrides</CardTitle>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{overview?.quotaOverrideCount ?? 0}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Forward reset runs</CardTitle>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{overview?.forwardResetRunCount ?? 0}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Curated/demo reservations</CardTitle>
					<CardDescription>Reserved for curated workflows</CardDescription>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{page.curatedDemoReservations}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Admin override reservations</CardTitle>
					<CardDescription>Reservations with admin priority overrides</CardDescription>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{page.adminOverrideReservations}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Reserved curated blocks</CardTitle>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{Object.values(overview?.reservedBlocksByClass ?? {}).reduce(
						(sum, value) => sum + value,
						0,
					)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Baseline cost</CardTitle>
					<CardDescription>Estimated monthly node spend</CardDescription>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{overview?.baselineMonthlyCostCents
						? formatCurrencyFromCents(overview.baselineMonthlyCostCents)
						: "$0.00"}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Baseline monthly cost</CardTitle>
					<CardDescription>
						Derived from current ready nodes with cost-labeled pools.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-3xl font-semibold">
					{formatCurrencyFromCents(page.baselineMonthlyCostCents)}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Generated</CardTitle>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					{overview?.generatedAt ?? "Loading..."}
				</CardContent>
			</Card>
		</div>
	);
}
