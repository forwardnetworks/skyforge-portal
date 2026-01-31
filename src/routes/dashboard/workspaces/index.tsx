import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { queryKeys } from "../../../lib/query-keys";
import { getWorkspaces } from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/workspaces/")({
	component: WorkspacesIndexPage,
});

function WorkspacesIndexPage() {
	const wsQ = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
	});

	const workspaces = wsQ.data?.workspaces ?? [];
	const [filter, setFilter] = useState("");
	const filtered = useMemo(() => {
		const needle = filter.trim().toLowerCase();
		if (!needle) return workspaces;
		return workspaces.filter((ws) => {
			return (
				ws.name.toLowerCase().includes(needle) ||
				ws.slug.toLowerCase().includes(needle) ||
				(ws.description ?? "").toLowerCase().includes(needle)
			);
		});
	}, [filter, workspaces]);

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
					<p className="text-sm text-muted-foreground">
						Workspaces primarily organize shared resources and team access.
						Per-user defaults live in{" "}
						<Link className="underline" to="/dashboard/settings">
							My Settings
						</Link>
						.
					</p>
				</div>
				<Button asChild>
					<Link to="/dashboard/workspaces/new">
						<Plus className="mr-2 h-4 w-4" />
						New workspace
					</Link>
				</Button>
			</div>

			<div className="flex items-center gap-3">
				<Input
					placeholder="Filter workspaces…"
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
				<div className="text-sm text-muted-foreground">
					{filtered.length} shown
				</div>
			</div>

			{wsQ.isLoading ? (
				<Card className="border-dashed">
					<CardContent className="pt-6 text-sm text-muted-foreground">
						Loading workspaces…
					</CardContent>
				</Card>
			) : filtered.length === 0 ? (
				<Card className="border-dashed">
					<CardContent className="pt-6 text-sm text-muted-foreground">
						No workspaces match your filter.
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{filtered.map((ws) => (
						<Card key={ws.id} variant="glass">
							<CardHeader>
								<CardTitle className="truncate">{ws.name}</CardTitle>
								<CardDescription className="truncate">
									{ws.slug}
									{ws.isPublic ? " • public" : ""}
								</CardDescription>
							</CardHeader>
							<CardContent className="flex items-center justify-between gap-3">
								<div className="min-w-0 text-sm text-muted-foreground truncate">
									{ws.description || "—"}
								</div>
								<Button asChild variant="outline">
									<Link
										to="/dashboard/workspaces/$workspaceId"
										params={{ workspaceId: ws.id }}
									>
										Open
									</Link>
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
