import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { queryKeys } from "../../../lib/query-keys";
import {
	applyWorkspaceForwardCredentialSet,
	deleteWorkspaceForwardConfig,
	getWorkspaceForwardConfig,
	getWorkspaces,
	listUserForwardCredentialSets,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/workspaces/$workspaceId/integrations")(
	{
		component: WorkspaceIntegrationsPage,
	},
);

function WorkspaceIntegrationsPage() {
	const { workspaceId } = Route.useParams();
	const queryClient = useQueryClient();

	const wsQ = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
		retry: false,
	});
	const workspace = useMemo(() => {
		return wsQ.data?.workspaces?.find((w) => w.id === workspaceId) ?? null;
	}, [wsQ.data?.workspaces, workspaceId]);

	const forwardCfgQ = useQuery({
		queryKey: queryKeys.workspaceForwardConfig(workspaceId),
		queryFn: () => getWorkspaceForwardConfig(workspaceId),
		retry: false,
		staleTime: 10_000,
	});

	const forwardCredentialSetsQ = useQuery({
		queryKey: queryKeys.userForwardCredentialSets(),
		queryFn: listUserForwardCredentialSets,
		staleTime: 30_000,
		retry: false,
	});
	const forwardCredentialSets = useMemo(
		() => forwardCredentialSetsQ.data?.credentialSets ?? [],
		[forwardCredentialSetsQ.data?.credentialSets],
	);

	const [selectedCredentialId, setSelectedCredentialId] = useState<string>("");

	const applyM = useMutation({
		mutationFn: async () => {
			const id = selectedCredentialId.trim();
			if (!id) throw new Error("Select a credential set");
			return applyWorkspaceForwardCredentialSet(workspaceId, { credentialId: id });
		},
		onSuccess: async () => {
			toast.success("Applied credential set");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaceForwardConfig(workspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to apply credential set", {
				description: (e as Error).message,
			}),
	});

	const clearM = useMutation({
		mutationFn: async () => deleteWorkspaceForwardConfig(workspaceId),
		onSuccess: async () => {
			toast.success("Forward config cleared");
			await queryClient.invalidateQueries({
				queryKey: queryKeys.workspaceForwardConfig(workspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to clear Forward config", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div className="min-w-0">
					<h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
					<p className="text-muted-foreground text-sm truncate">
						{workspace ? `${workspace.name} (${workspace.slug})` : workspaceId}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link
						to="/dashboard/workspaces/$workspaceId"
						params={{ workspaceId }}
						className={buttonVariants({ variant: "outline" })}
					>
						Back
					</Link>
					<Link
						to="/dashboard/forward"
						className={buttonVariants({ variant: "outline" })}
					>
						Manage credential sets
					</Link>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Forward</CardTitle>
					<CardDescription>
						Configure workspace-scoped Forward credentials. Recommended: apply a
						saved credential set to avoid re-entering secrets.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md border p-3">
						<div className="text-sm font-medium">Status</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{forwardCfgQ.isLoading
								? "Loading…"
								: forwardCfgQ.isError
									? "Failed to load"
									: forwardCfgQ.data?.configured
										? `configured for ${forwardCfgQ.data?.username ?? ""}`
										: "not configured"}
						</div>
					</div>

					<div className="space-y-2">
						<Label>Apply from credential set</Label>
						<Select value={selectedCredentialId} onValueChange={setSelectedCredentialId}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Select a credential set" />
							</SelectTrigger>
							<SelectContent>
								{forwardCredentialSets.map((cs) => (
									<SelectItem key={cs.id} value={cs.id}>
										{cs.name}
										{cs.username ? ` (${cs.username})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{forwardCredentialSetsQ.isError ? (
							<p className="text-xs text-destructive">
								Failed to load credential sets:{" "}
								{(forwardCredentialSetsQ.error as Error).message}
							</p>
						) : null}
					</div>

					<div className="flex items-center gap-2">
						<Button
							onClick={() => applyM.mutate()}
							disabled={applyM.isPending || !selectedCredentialId.trim()}
						>
							{applyM.isPending ? "Applying…" : "Apply"}
						</Button>
						<Button
							variant="outline"
							onClick={() => clearM.mutate()}
							disabled={clearM.isPending}
						>
							{clearM.isPending ? "Clearing…" : "Clear"}
						</Button>
					</div>

					<div className="space-y-2">
						<Label>Workspace Forward URL</Label>
						<Input
							readOnly
							value={forwardCfgQ.data?.baseUrl ?? "https://fwd.app"}
						/>
						<p className="text-xs text-muted-foreground">
							This page currently supports applying a saved credential set (copy
							semantics). Manual editing can be added if needed.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

