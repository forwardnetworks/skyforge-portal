import type { PlatformReservationsPageState } from "@/hooks/use-platform-reservations-page";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { formatCount } from "./platform-reservations-shared";

export function PlatformReservationsPreflightCard(props: {
	page: PlatformReservationsPageState;
}) {
	const { page } = props;
	const preflight = page.preflightQ.data;

	if (!page.preflightEnabled) {
		return (
			<div className="text-sm text-muted-foreground">
				Enter a valid reservation start and end time to evaluate admission.
			</div>
		);
	}

	return (
		<Card className="border-dashed">
			<CardHeader className="pb-3">
				<CardTitle className="text-base">Reservation preflight</CardTitle>
				<CardDescription>
					This uses the same admission rules as reservation create.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				{page.preflightQ.isLoading ? (
					<div className="text-muted-foreground">
						Evaluating reservation window...
					</div>
				) : page.preflightQ.isError ? (
					<div className="text-destructive">
						{page.preflightQ.error instanceof Error
							? page.preflightQ.error.message
							: "Failed to evaluate reservation preflight"}
					</div>
				) : preflight ? (
					<>
						<div>
							<span className="font-semibold">
								{preflight.allowed ? "Admissible" : "Blocked"}
							</span>
							{preflight.reason ? `: ${preflight.reason}` : null}
						</div>
						<div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
							<div>
								Priority:{" "}
								<span className="font-medium text-foreground">
									{preflight.priorityTier || "standard"}
								</span>
							</div>
							<div>
								Overlap count:{" "}
								<span className="font-medium text-foreground">
									{formatCount(preflight.overlappingReservations)}
								</span>
							</div>
							<div>
								Persistent count:{" "}
								<span className="font-medium text-foreground">
									{formatCount(preflight.persistentReservations)}
								</span>
							</div>
							<div>
								Protected curated blocks:{" "}
								<span className="font-medium text-foreground">
									{formatCount(preflight.protectedCuratedBlocks)}
								</span>
							</div>
						</div>
						<div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2 xl:grid-cols-4">
							<div>
								Max class:{" "}
								<span className="font-medium text-foreground">
									{preflight.quota?.maxResourceClass || "-"}
								</span>
							</div>
							<div>
								Max concurrent labs:{" "}
								<span className="font-medium text-foreground">
									{formatCount(preflight.quota?.maxConcurrentLabs)}
								</span>
							</div>
							<div>
								Max persistent labs:{" "}
								<span className="font-medium text-foreground">
									{formatCount(preflight.quota?.maxPersistentLabs)}
								</span>
							</div>
							<div>
								Max persistent hours:{" "}
								<span className="font-medium text-foreground">
									{formatCount(preflight.quota?.maxPersistentHours)}
								</span>
							</div>
						</div>
						{preflight.warnings?.length ? (
							<ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
								{preflight.warnings.map((warning: string) => (
									<li key={warning}>{warning}</li>
								))}
							</ul>
						) : null}
					</>
				) : (
					<div className="text-muted-foreground">No preflight result yet.</div>
				)}
			</CardContent>
		</Card>
	);
}
