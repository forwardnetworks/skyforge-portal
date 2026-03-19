import { Link } from "@tanstack/react-router";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { formatMode } from "./dashboard-shared";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function DashboardHeroCard(props: { page: DashboardPageState }) {
	const { page } = props;
	const primaryOperatingMode =
		page.platformAvailability?.policy?.primaryOperatingMode;

	return (
		<Card variant="glass">
			<CardHeader>
				<CardTitle>Dashboard</CardTitle>
				<CardDescription>
					Quota, availability, and platform readiness from the live platform
					policy and capacity model.
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-wrap gap-3">
				<Button asChild>
					<Link to="/dashboard/deployments/quick">Launch lab</Link>
				</Button>
				{primaryOperatingMode ? (
					<Button asChild variant="outline">
						<Link
							to="/dashboard/deployments/quick"
							search={{ mode: primaryOperatingMode } as any}
						>
							Launch {formatMode(primaryOperatingMode)}
						</Link>
					</Button>
				) : null}
				<Button asChild variant="outline">
					<Link to="/dashboard/reservations">View reservations</Link>
				</Button>
				<Button asChild variant="outline">
					<Link to="/settings">Open settings</Link>
				</Button>
				{page.canAccessPlatformView ? (
					<Button asChild variant="outline">
						<Link to="/dashboard/platform">Open capacity view</Link>
					</Button>
				) : null}
			</CardContent>
		</Card>
	);
}
