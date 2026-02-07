import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Settings, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../../../components/ui/button";
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
	type PolicyReportForwardNetwork,
	type SkyforgeWorkspace,
	createWorkspaceForwardNetwork,
	deleteWorkspaceForwardNetwork,
	getWorkspaces,
	listUserForwardCollectorConfigs,
	listWorkspaceForwardNetworks,
} from "../../../lib/skyforge-api";

const searchSchema = z.object({
	workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/forward-networks/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search: { workspace } }) => ({ workspace }),
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.workspaces(),
			queryFn: getWorkspaces,
			staleTime: 30_000,
		});
	},
	component: ForwardNetworksPage,
});

function ForwardNetworksPage() {
	const navigate = useNavigate();
	const qc = useQueryClient();
	const { workspace } = Route.useSearch();

	const workspacesQ = useQuery({
		queryKey: queryKeys.workspaces(),
		queryFn: getWorkspaces,
		staleTime: 30_000,
		retry: false,
	});
	const workspaces = useMemo(
		() => (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[],
		[workspacesQ.data?.workspaces],
	);

	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(
		String(workspace ?? ""),
	);

	useEffect(() => {
		if (selectedWorkspaceId) return;
		if (workspaces.length === 0) return;
		setSelectedWorkspaceId(String(workspaces[0]?.id ?? ""));
	}, [selectedWorkspaceId, workspaces]);

	useEffect(() => {
		const w = String(workspace ?? "");
		if (w === selectedWorkspaceId) return;
		setSelectedWorkspaceId(w);
	}, [workspace, selectedWorkspaceId]);

	const handleWorkspaceChange = (id: string) => {
		void navigate({
			search: { workspace: id === "__none__" ? "" : id } as any,
			replace: true,
		});
	};

	const networksQ = useQuery({
		queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
		queryFn: () => listWorkspaceForwardNetworks(selectedWorkspaceId),
		enabled: Boolean(selectedWorkspaceId),
		staleTime: 10_000,
		retry: false,
	});

	const networks = useMemo(
		() => (networksQ.data?.networks ?? []) as PolicyReportForwardNetwork[],
		[networksQ.data?.networks],
	);

	const collectorsQ = useQuery({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		staleTime: 30_000,
		retry: false,
	});
	const collectors = useMemo(
		() => (collectorsQ.data?.collectors ?? []) as any[],
		[collectorsQ.data?.collectors],
	);

	const [name, setName] = useState("");
	const [forwardNetworkId, setForwardNetworkId] = useState("");
	const [description, setDescription] = useState("");
	const [collectorConfigId, setCollectorConfigId] =
		useState<string>("__default__");

	const createM = useMutation({
		mutationFn: async () => {
			const ws = selectedWorkspaceId.trim();
			if (!ws) throw new Error("Select a workspace");
			const n = name.trim();
			const fid = forwardNetworkId.trim();
			if (!n) throw new Error("Name is required");
			if (!fid) throw new Error("Forward Network ID is required");
			return createWorkspaceForwardNetwork(ws, {
				name: n,
				forwardNetworkId: fid,
				description: description.trim() || undefined,
				collectorConfigId:
					collectorConfigId && collectorConfigId !== "__default__"
						? collectorConfigId
						: undefined,
			});
		},
		onSuccess: async () => {
			toast.success("Forward network saved");
			setName("");
			setForwardNetworkId("");
			setDescription("");
			setCollectorConfigId("__default__");
			await qc.invalidateQueries({
				queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to save network", {
				description: (e as Error).message,
			}),
	});

	const deleteM = useMutation({
		mutationFn: async (networkRef: string) => {
			const ws = selectedWorkspaceId.trim();
			if (!ws) throw new Error("Select a workspace");
			return deleteWorkspaceForwardNetwork(ws, networkRef);
		},
		onSuccess: async () => {
			toast.success("Forward network deleted");
			await qc.invalidateQueries({
				queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to delete network", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Forward Networks
					</h1>
					<p className="text-muted-foreground text-sm">
						Save one or more Forward Network IDs per workspace, then open
						Capacity views against them.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border">
						<Select
							value={selectedWorkspaceId || "__none__"}
							onValueChange={handleWorkspaceChange}
						>
							<SelectTrigger className="w-[240px] h-8 bg-transparent border-0 focus:ring-0 shadow-none">
								<SelectValue placeholder="Select workspace" />
							</SelectTrigger>
							<SelectContent>
								{workspaces.map((w: SkyforgeWorkspace) => (
									<SelectItem key={w.id} value={w.id}>
										{w.name} ({w.slug})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button
						variant="outline"
						size="icon"
						className="h-8 w-8"
						disabled={!selectedWorkspaceId}
						onClick={() => {
							if (!selectedWorkspaceId) return;
							navigate({
								to: "/dashboard/workspaces/$workspaceId",
								params: { workspaceId: selectedWorkspaceId },
							});
						}}
					>
						<Settings className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Add Forward network</CardTitle>
					<CardDescription>
						These networks are used as the scope for capacity rollups and live
						perf drilldowns.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="prod-edge"
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward Network ID</Label>
							<Input
								value={forwardNetworkId}
								onChange={(e) => setForwardNetworkId(e.target.value)}
								placeholder="abc123..."
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label>Description (optional)</Label>
						<Input
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Notes for humans"
						/>
					</div>
					<div className="space-y-2">
						<Label>Forward collector config (optional)</Label>
						<Select
							value={collectorConfigId}
							onValueChange={(v) => setCollectorConfigId(v)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Use my default Forward config" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__default__">Use my default</SelectItem>
								{collectors.map((c: any) => (
									<SelectItem key={String(c.id)} value={String(c.id)}>
										{String(c.name ?? c.id)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => createM.mutate()}
							disabled={!selectedWorkspaceId || createM.isPending}
						>
							<Plus className="h-4 w-4 mr-2" />
							Save network
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Saved networks</CardTitle>
					<CardDescription>
						Open Capacity to compute rollups and explore inventory/perf data.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{networks.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No saved networks yet.
						</div>
					) : null}
					{networks.map((n) => (
						<div
							key={n.id}
							className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-lg border p-3"
						>
							<div className="min-w-0">
								<div className="font-medium truncate">{n.name}</div>
								<div className="text-sm text-muted-foreground truncate">
									<span className="font-mono">{n.forwardNetworkId}</span>
									{n.description ? ` · ${n.description}` : ""}
								</div>
							</div>
							<div className="flex items-center gap-2">
								<Button asChild variant="outline" size="sm">
									<Link
										to="/dashboard/forward-networks/$networkRef/capacity"
										params={{ networkRef: n.id }}
										search={{ workspace: selectedWorkspaceId } as any}
									>
										Capacity
									</Link>
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => deleteM.mutate(n.id)}
									disabled={deleteM.isPending}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</Button>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
