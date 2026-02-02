import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { EmptyState } from "../../../components/ui/empty-state";
import { Input } from "../../../components/ui/input";
import { queryKeys } from "../../../lib/query-keys";
import { createWorkspace, getWorkspaces } from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/workspaces/")({
	component: WorkspacesIndexPage,
});

function WorkspacesIndexPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [createOpen, setCreateOpen] = useState(false);
	const [createName, setCreateName] = useState("");
	const [createSlug, setCreateSlug] = useState("");

	const ws = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
	});

	const workspaces = ws.data?.workspaces ?? [];

	const create = useMutation({
		mutationFn: async () => {
			const name = String(createName ?? "").trim();
			if (!name) throw new Error("Workspace name is required");
			return createWorkspace({
				name,
				slug: String(createSlug ?? "").trim() || undefined,
			} as any);
		},
		onSuccess: async (created) => {
			toast.success("Workspace created");
			setCreateOpen(false);
			setCreateName("");
			setCreateSlug("");
			await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
			if (created?.id) {
				navigate({
					to: "/dashboard/workspaces/$workspaceId",
					params: { workspaceId: created.id },
				});
			}
		},
		onError: (e) =>
			toast.error("Failed to create workspace", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center justify-between border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
					<p className="text-muted-foreground text-sm">
						Manage workspace access (owners/editors/viewers).
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)} size="sm">
					Add workspace
				</Button>
			</div>

			{workspaces.length === 0 ? (
				<EmptyState
					title="No workspaces"
					description="Create a deployment to generate a workspace, or ask an admin to add you."
					icon={Users}
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
									to="/dashboard/workspaces/$workspaceId"
									params={{ workspaceId: w.id }}
									className="text-sm text-primary underline hover:no-underline"
								>
									Manage access
								</Link>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Create workspace</DialogTitle>
						<DialogDescription>
							Create a new workspace and its backing Git repo.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="space-y-1.5">
							<div className="text-sm font-medium">Name</div>
							<Input
								value={createName}
								onChange={(e) => setCreateName(e.target.value)}
								placeholder="Customer demo"
							/>
						</div>
						<div className="space-y-1.5">
							<div className="text-sm font-medium">Slug (optional)</div>
							<Input
								value={createSlug}
								onChange={(e) => setCreateSlug(e.target.value)}
								placeholder="customer-demo"
							/>
							<p className="text-xs text-muted-foreground">
								Leave blank to auto-generate from name.
							</p>
						</div>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setCreateOpen(false)}
								disabled={create.isPending}
							>
								Cancel
							</Button>
							<Button
								onClick={() => create.mutate()}
								disabled={create.isPending}
							>
								{create.isPending ? "Creating…" : "Create"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
