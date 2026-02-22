import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { EmptyState } from "../../components/ui/empty-state";

export const Route = createFileRoute("/dashboard/policy-reports")({
	component: PolicyReportsIndexPage,
});

function PolicyReportsIndexPage() {
	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1 border-b pb-6">
				<h1 className="text-2xl font-bold tracking-tight">Policy Reports</h1>
				<p className="text-muted-foreground text-sm">
					Policy reports are consolidated under Forward Analytics.
				</p>
			</div>

			<EmptyState
				title="Open Forward Analytics"
				description="Use Forward Analytics for security, routing, cloud, and capacity report workflows."
				icon={ShieldCheck}
				action={{
					label: "Open Forward Analytics",
					onClick: () => {
						window.location.assign("/dashboard/forward");
					},
				}}
			/>
		</div>
	);
}
