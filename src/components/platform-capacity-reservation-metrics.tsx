import type { PlatformCapacityPageState } from "@/hooks/use-platform-capacity-page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { renderCountMap } from "./platform-capacity-formatting";

type ReservationMetricsProps = {
	overview?: PlatformCapacityPageState["overviewQ"]["data"];
	reservationsByPriority: PlatformCapacityPageState["reservationsByPriority"];
};

export function PlatformCapacityReservationMetrics({ overview, reservationsByPriority }: ReservationMetricsProps) {
	return (
		<div className="grid gap-4 xl:grid-cols-3">
			<Card>
				<CardHeader>
					<CardTitle>Reserved blocks by class</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderCountMap(overview?.reservedBlocksByClass).map(([key, value]) => (
						<div key={key} className="flex items-center justify-between">
							<span className="text-muted-foreground">{key}</span>
							<span className="font-medium">{value}</span>
						</div>
						))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Reservations by priority</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderCountMap(reservationsByPriority).map(([key, value]) => (
						<div key={key} className="flex items-center justify-between">
							<span className="text-muted-foreground">{key}</span>
							<span className="font-medium">{value}</span>
						</div>
						))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Reservations by status</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderCountMap(overview?.reservationsByStatus).map(([key, value]) => (
						<div key={key} className="flex items-center justify-between">
							<span className="text-muted-foreground">{key}</span>
							<span className="font-medium">{value}</span>
						</div>
						))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Reservations by class</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderCountMap(overview?.reservationsByClass).map(([key, value]) => (
						<div key={key} className="flex items-center justify-between">
							<span className="text-muted-foreground">{key}</span>
							<span className="font-medium">{value}</span>
						</div>
						))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>User profiles</CardTitle>
					<CardDescription>Effective platform-profile assignments.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-2 text-sm">
					{renderCountMap(overview?.userProfilesByName).map(([key, value]) => (
						<div key={key} className="flex items-center justify-between">
							<span className="text-muted-foreground">{key}</span>
							<span className="font-medium">{value}</span>
						</div>
						))}
				</CardContent>
			</Card>
		</div>
	);
}
