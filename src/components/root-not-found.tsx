import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function RootNotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
			<Card variant="glass" className="max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Page not found</CardTitle>
					<CardDescription>
						This route hasn’t been migrated yet (or the URL is incorrect).
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap justify-center gap-3">
					<Button variant="default" asChild>
						<Link to="/dashboard/deployments">Go to deployments</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/dashboard">Dashboard</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
