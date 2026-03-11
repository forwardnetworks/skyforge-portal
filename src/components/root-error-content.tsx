import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function RootErrorContent(props: ErrorComponentProps) {
	const message =
		props.error instanceof Error
			? props.error.message
			: typeof props.error === "string"
				? props.error
				: "Unknown error";

	return (
		<div className="space-y-6">
			<Card variant="danger">
				<CardHeader>
					<CardTitle>Application error</CardTitle>
					<CardDescription className="text-red-200/80">
						{message}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					<Button
						variant="outline"
						className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-100"
						onClick={() => props.reset()}
					>
						Try again
					</Button>
					<Button variant="secondary" asChild>
						<Link to="/dashboard/deployments">Go to deployments</Link>
					</Button>
				</CardContent>
			</Card>

			{props.error instanceof Error && props.error.stack ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Error Stack Trace</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="overflow-auto whitespace-pre-wrap text-xs text-muted-foreground p-4 rounded-md bg-muted">
							{props.error.stack}
						</pre>
					</CardContent>
				</Card>
			) : null}
		</div>
	);
}
