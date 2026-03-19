import type { DashboardPageState } from "@/hooks/use-dashboard-page";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function DashboardNextStepsCard(props: { page: DashboardPageState }) {
	const entries = props.page.dashboardNextSteps;
	return (
		<Card>
			<CardHeader>
				<CardTitle>Next steps</CardTitle>
				<CardDescription>
					Use quotas and availability together before reserving or launching
					heavy labs.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2 text-sm text-muted-foreground">
				{entries.map((entry) => (
					<p key={entry.id}>{entry.text}</p>
				))}
			</CardContent>
		</Card>
	);
}
