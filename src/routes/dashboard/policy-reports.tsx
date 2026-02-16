import { Link, createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";

export const Route = createFileRoute("/dashboard/policy-reports")({
	component: PolicyReportsIndexPage,
});

function PolicyReportsIndexPage() {
	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1 border-b pb-6">
				<h1 className="text-2xl font-bold tracking-tight">
					Policy &amp; Compliance
				</h1>
				<p className="text-muted-foreground text-sm">
					Policy workflows are per-user. Select a Forward network in Assurance
					Hub to run checks.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Assurance Hub</CardTitle>
					<CardDescription>
						Configure Forward credentials and network bindings, then launch
						assurance/capacity/compliance flows.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Link
						to="/dashboard/fwd"
						className="text-sm text-primary underline hover:no-underline"
					>
						Open Assurance Hub
					</Link>
				</CardContent>
			</Card>

			<EmptyState
				title="Shared model removed"
				description="Policy and compliance now run directly from your personal account and selected Forward network."
				icon={ShieldCheck}
			/>
		</div>
	);
}
