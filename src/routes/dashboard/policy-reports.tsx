import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { queryKeys } from "../../lib/query-keys";
import { getWorkspaces } from "../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/policy-reports")({
	component: PolicyReportsIndexPage,
});

function PolicyReportsIndexPage() {
	const ws = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
	});

	const workspaces = ws.data?.workspaces ?? [];

	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1 border-b pb-6">
				<h1 className="text-2xl font-bold tracking-tight">
					Policy &amp; Compliance
				</h1>
				<p className="text-muted-foreground text-sm">
					Run security and compliance checks against a Forward snapshot, per
					workspace.
				</p>
			</div>

			{workspaces.length === 0 ? (
				<EmptyState
					title="No workspaces"
					description="Create a workspace first, then run policy and compliance checks inside it."
					icon={ShieldCheck}
				/>
			) : (
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{workspaces.map((w) => (
						<Card
							key={w.id}
							className="hover:border-foreground/20 transition-colors"
						>
							<CardHeader className="pb-3">
								<CardTitle className="flex items-center justify-between gap-2 text-base">
									<span className="truncate">{w.name}</span>
									<span className="text-xs text-muted-foreground">
										{w.slug}
									</span>
								</CardTitle>
							</CardHeader>
							<CardContent className="pt-0">
								<Link
									to="/dashboard/workspaces/$workspaceId/policy-reports"
									params={{ workspaceId: w.id }}
									className="text-sm text-primary underline hover:no-underline"
								>
									Open policy &amp; compliance
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
