import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Checkbox } from "../../../components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { queryKeys } from "../../../lib/query-keys";
import {
	type UpdateWorkspaceMembersRequest,
	deleteWorkspace,
	getWorkspaces,
	updateWorkspaceMembers,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId")({
	component: WorkspaceAccessPage,
});

function normalizeList(raw: string): string[] {
	return raw
		.split(/[\n,]+/g)
		.map((s) => s.trim())
		.filter(Boolean);
}

function WorkspaceAccessPage() {
	const { workspaceId } = Route.useParams();
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteConfirm, setDeleteConfirm] = useState("");

	const ws = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
	});

	const workspace = useMemo(() => {
		return ws.data?.workspaces?.find((w) => w.id === workspaceId);
	}, [ws.data, workspaceId]);

	const [isPublic, setIsPublic] = useState<boolean>(
		workspace?.isPublic ?? false,
	);
	const [ownersRaw, setOwnersRaw] = useState<string>(
		(workspace?.owners ?? []).join("\n"),
	);
	const [editorsRaw, setEditorsRaw] = useState<string>(
		(workspace?.editors ?? []).join("\n"),
	);
	const [viewersRaw, setViewersRaw] = useState<string>(
		(workspace?.viewers ?? []).join("\n"),
	);
	const [ownerGroupsRaw, setOwnerGroupsRaw] = useState<string>(
		(workspace?.ownerGroups ?? []).join("\n"),
	);
	const [editorGroupsRaw, setEditorGroupsRaw] = useState<string>(
		(workspace?.editorGroups ?? []).join("\n"),
	);
	const [viewerGroupsRaw, setViewerGroupsRaw] = useState<string>(
		(workspace?.viewerGroups ?? []).join("\n"),
	);

	// Keep state in sync once the query resolves.
	// (We intentionally don't update on every render to avoid clobbering edits.)
	const hydratedKey = useMemo(() => {
		if (!workspace) return "";
		return `${workspace.id}:${workspace.isPublic}:${workspace.owners?.length ?? 0}:${
			workspace.editors?.length ?? 0
		}:${workspace.viewers?.length ?? 0}`;
	}, [workspace]);
	const [lastHydratedKey, setLastHydratedKey] = useState<string>("");
	if (workspace && hydratedKey !== lastHydratedKey) {
		setLastHydratedKey(hydratedKey);
		setIsPublic(workspace.isPublic);
		setOwnersRaw((workspace.owners ?? []).join("\n"));
		setEditorsRaw((workspace.editors ?? []).join("\n"));
		setViewersRaw((workspace.viewers ?? []).join("\n"));
		setOwnerGroupsRaw((workspace.ownerGroups ?? []).join("\n"));
		setEditorGroupsRaw((workspace.editorGroups ?? []).join("\n"));
		setViewerGroupsRaw((workspace.viewerGroups ?? []).join("\n"));
	}

	const save = useMutation({
		mutationFn: async () => {
			const req: UpdateWorkspaceMembersRequest = {
				isPublic,
				owners: normalizeList(ownersRaw),
				editors: normalizeList(editorsRaw),
				viewers: normalizeList(viewersRaw),
				ownerGroups: normalizeList(ownerGroupsRaw),
				editorGroups: normalizeList(editorGroupsRaw),
				viewerGroups: normalizeList(viewerGroupsRaw),
			};
			return updateWorkspaceMembers(workspaceId, req);
		},
		onSuccess: async () => {
			toast.success("Workspace updated");
			await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
		},
		onError: (e) =>
			toast.error("Failed to update workspace", {
				description: (e as Error).message,
			}),
	});

	const del = useMutation({
		mutationFn: async () => {
			const confirm = String(deleteConfirm ?? "").trim();
			if (!confirm) {
				throw new Error(
					`Type the workspace slug (“${workspace?.slug ?? ""}”) to confirm`,
				);
			}
			return deleteWorkspace(workspaceId, { confirm });
		},
		onSuccess: async () => {
			toast.success("Workspace deleted");
			setDeleteOpen(false);
			setDeleteConfirm("");
			await queryClient.invalidateQueries({ queryKey: queryKeys.workspaces() });
			navigate({ to: "/dashboard/deployments" });
		},
		onError: (e) =>
			toast.error("Failed to delete workspace", {
				description: (e as Error).message,
			}),
	});

	if (ws.isLoading) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Users className="h-4 w-4" />
					Loading workspace…
				</div>
			</div>
		);
	}

	if (!workspace) {
		return (
			<div className="space-y-6 p-6">
				<div className="flex items-center justify-between border-b pb-6">
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Workspace</h1>
						<p className="text-muted-foreground text-sm">
							Workspace not found.
						</p>
					</div>
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/dashboard/workspaces" })}
					>
						Back
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{workspace.name}
					</h1>
					<p className="text-muted-foreground text-sm">{workspace.slug}</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						onClick={() => navigate({ to: "/dashboard/deployments" })}
					>
						Back to deployments
					</Button>
					<Button
						variant="outline"
						onClick={() =>
							navigate({
								to: "/dashboard/workspaces/$workspaceId/policy-reports",
								params: { workspaceId },
							})
						}
					>
						Policy Reports
					</Button>
					<Button
						variant="outline"
						onClick={() =>
							navigate({
								to: "/dashboard/workspaces/$workspaceId/integrations",
								params: { workspaceId },
							})
						}
					>
						Integrations
					</Button>
					<Button
						variant="destructive"
						onClick={() => setDeleteOpen(true)}
						disabled={save.isPending || del.isPending}
					>
						Delete workspace
					</Button>
					<Button onClick={() => save.mutate()} disabled={save.isPending}>
						Save
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Visibility</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="flex items-center gap-2 text-sm">
						<Checkbox
							checked={isPublic}
							onCheckedChange={(v) => setIsPublic(Boolean(v))}
						/>
						<span>Public workspace (any authenticated user can view)</span>
					</div>
					<p className="text-xs text-muted-foreground">
						Use this for demo workspaces. For customer demos, keep it private
						and add specific users/groups.
					</p>
				</CardContent>
			</Card>

			<div className="grid gap-4 lg:grid-cols-2">
				<RoleCard
					title="Owners"
					description="Full control: can manage access and delete resources."
					value={ownersRaw}
					onChange={setOwnersRaw}
					placeholder={"user1@forwardnetworks.com\nuser2@forwardnetworks.com"}
				/>
				<RoleCard
					title="Owner Groups"
					description="Group identities that should be owners."
					value={ownerGroupsRaw}
					onChange={setOwnerGroupsRaw}
					placeholder={
						"forwardnetworks.com:team-platform\nforwardnetworks.com:team-se"
					}
				/>
				<RoleCard
					title="Editors"
					description="Can create, start, and stop deployments."
					value={editorsRaw}
					onChange={setEditorsRaw}
					placeholder={"user1@forwardnetworks.com\nuser2@forwardnetworks.com"}
				/>
				<RoleCard
					title="Editor Groups"
					description="Group identities that should be editors."
					value={editorGroupsRaw}
					onChange={setEditorGroupsRaw}
					placeholder={"forwardnetworks.com:team-se"}
				/>
				<RoleCard
					title="Viewers"
					description="Read-only access to deployments and runs."
					value={viewersRaw}
					onChange={setViewersRaw}
					placeholder={"user1@forwardnetworks.com\nuser2@forwardnetworks.com"}
				/>
				<RoleCard
					title="Viewer Groups"
					description="Group identities that should be viewers."
					value={viewerGroupsRaw}
					onChange={setViewerGroupsRaw}
					placeholder={"forwardnetworks.com:all"}
				/>
			</div>

			<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Delete workspace</DialogTitle>
						<DialogDescription>
							This deletes the workspace and its backing resources (Git repo,
							artifacts, and state). This cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-sm">
							Type{" "}
							<span className="font-mono font-semibold">{workspace.slug}</span>{" "}
							to confirm.
						</div>
						<Input
							value={deleteConfirm}
							onChange={(e) => setDeleteConfirm(e.target.value)}
							placeholder={workspace.slug}
							className="font-mono"
						/>
						<div className="flex items-center justify-end gap-2 pt-2">
							<Button
								variant="outline"
								onClick={() => setDeleteOpen(false)}
								disabled={del.isPending}
							>
								Cancel
							</Button>
							<Button
								variant="destructive"
								onClick={() => del.mutate()}
								disabled={del.isPending}
							>
								{del.isPending ? "Deleting…" : "Delete"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

function RoleCard(props: {
	title: string;
	description: string;
	value: string;
	onChange: (v: string) => void;
	placeholder: string;
}) {
	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-base">{props.title}</CardTitle>
				<p className="text-xs text-muted-foreground">{props.description}</p>
			</CardHeader>
			<CardContent className="pt-0">
				<Textarea
					value={props.value}
					onChange={(e) => props.onChange(e.target.value)}
					placeholder={props.placeholder}
					className="min-h-[140px] whitespace-pre-wrap font-mono text-xs"
				/>
				<p className="mt-2 text-xs text-muted-foreground">
					One per line (or comma-separated).
				</p>
			</CardContent>
		</Card>
	);
}
