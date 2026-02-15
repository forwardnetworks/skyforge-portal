import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
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
	type ForwardCredentialSetSummary,
	PERSONAL_SCOPE_ID,
	type PolicyReportForwardNetwork,
	applyWorkspaceForwardCredentialSet,
	createWorkspaceForwardNetwork,
	deleteWorkspaceForwardConfig,
	deleteWorkspaceForwardNetwork,
	getWorkspaceForwardConfig,
	listForwardNetworks,
	listUserForwardCollectorConfigs,
	listUserForwardCredentialSets,
	listWorkspaceForwardNetworks,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute("/dashboard/forward-networks/")({
	component: ForwardNetworksPage,
});

function ForwardNetworksPage() {
	const qc = useQueryClient();
	const selectedWorkspaceId = PERSONAL_SCOPE_ID;

	const workspaceNetworksQ = useQuery({
		queryKey: queryKeys.workspaceForwardNetworks(selectedWorkspaceId),
		queryFn: () => listWorkspaceForwardNetworks(selectedWorkspaceId),
		enabled: Boolean(selectedWorkspaceId),
		staleTime: 10_000,
		retry: false,
	});

	const workspaceNetworks = useMemo(
		() =>
			(workspaceNetworksQ.data?.networks ?? []) as PolicyReportForwardNetwork[],
		[workspaceNetworksQ.data?.networks],
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

	const availableForwardNetworksQ = useQuery({
		queryKey: ["forwardNetworksAvailable"],
		queryFn: () => listForwardNetworks(),
		staleTime: 30_000,
		retry: false,
	});
	const availableForwardNetworks = useMemo(
		() => (availableForwardNetworksQ.data?.networks ?? []) as any[],
		[availableForwardNetworksQ.data?.networks],
	);

	const workspaceForwardConfigQ = useQuery({
		queryKey: queryKeys.workspaceForwardConfig(selectedWorkspaceId),
		queryFn: () => getWorkspaceForwardConfig(selectedWorkspaceId),
		enabled: Boolean(selectedWorkspaceId),
		staleTime: 10_000,
		retry: false,
	});

	const credentialSetsQ = useQuery({
		queryKey: queryKeys.userForwardCredentialSets(),
		queryFn: listUserForwardCredentialSets,
		staleTime: 30_000,
		retry: false,
	});
	const credentialSets = useMemo(
		() =>
			(credentialSetsQ.data?.credentialSets ??
				[]) as ForwardCredentialSetSummary[],
		[credentialSetsQ.data?.credentialSets],
	);

	const [name, setName] = useState("");
	const [forwardNetworkId, setForwardNetworkId] = useState("");
	const [description, setDescription] = useState("");
	const [collectorConfigId, setCollectorConfigId] =
		useState<string>("__default__");
	const [credentialSetId, setCredentialSetId] = useState<string>("");

	const canOpenNetworkViews = Boolean(String(selectedWorkspaceId ?? "").trim());

	const forwardNetworkSelectValue = useMemo(() => {
		const id = forwardNetworkId.trim();
		if (!id) return "__none__";
		if (
			availableForwardNetworks.some(
				(n: any) => String(n.id ?? "").trim() === id,
			)
		) {
			return id;
		}
		return "__custom__";
	}, [forwardNetworkId, availableForwardNetworks]);

	const createM = useMutation({
		mutationFn: async () => {
			const n = name.trim();
			const fid = forwardNetworkId.trim();
			if (!n) throw new Error("Name is required");
			if (!fid) throw new Error("Forward Network ID is required");
			const body = {
				name: n,
				forwardNetworkId: fid,
				description: description.trim() || undefined,
				collectorConfigId:
					collectorConfigId && collectorConfigId !== "__default__"
						? collectorConfigId
						: undefined,
			};
			return createWorkspaceForwardNetwork(selectedWorkspaceId, body);
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
			return deleteWorkspaceForwardNetwork(selectedWorkspaceId, networkRef);
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

	useEffect(() => {
		if (credentialSetId) return;
		if (credentialSets.length === 0) return;
		setCredentialSetId(String(credentialSets[0]?.id ?? ""));
	}, [credentialSetId, credentialSets]);

	const applyCredSetM = useMutation({
		mutationFn: async () => {
			const id = credentialSetId.trim();
			if (!id) throw new Error("Select a credential set");
			return applyWorkspaceForwardCredentialSet(selectedWorkspaceId, {
				credentialId: id,
			});
		},
		onSuccess: async () => {
			toast.success("Forward credentials applied");
			await qc.invalidateQueries({
				queryKey: queryKeys.workspaceForwardConfig(selectedWorkspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to apply credential set", {
				description: (e as Error).message,
			}),
	});

	const clearCredSetM = useMutation({
		mutationFn: async () => {
			return deleteWorkspaceForwardConfig(selectedWorkspaceId);
		},
		onSuccess: async () => {
			toast.success("Forward credentials cleared");
			await qc.invalidateQueries({
				queryKey: queryKeys.workspaceForwardConfig(selectedWorkspaceId),
			});
		},
		onError: (e) =>
			toast.error("Failed to clear credentials", {
				description: (e as Error).message,
			}),
	});

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-4 border-b pb-6">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Forward Networks
					</h1>
					<p className="text-muted-foreground text-sm">
						Manage Forward credentials, save Forward network IDs, and launch the
						Assurance Hub for routing, capacity, and security checks.
					</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Forward credentials</CardTitle>
					<CardDescription>
						Apply a credential set used to query Forward data for Assurance
						Studio and NQE execution.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-md border p-3">
						<div className="text-sm font-medium">Forward status</div>
						<div className="mt-1 text-sm text-muted-foreground">
							{workspaceForwardConfigQ.isLoading
								? "Loading…"
								: workspaceForwardConfigQ.isError
									? "Failed to load Forward config"
									: workspaceForwardConfigQ.data?.configured
										? `Configured for ${workspaceForwardConfigQ.data?.username ?? ""}`
										: "Not configured"}
						</div>
					</div>
					<div className="space-y-2">
						<Label>Apply credential set</Label>
						<Select
							value={credentialSetId || "__none__"}
							onValueChange={(v) =>
								setCredentialSetId(v === "__none__" ? "" : v)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a credential set" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="__none__">(Select)</SelectItem>
								{credentialSets.map((cs) => (
									<SelectItem key={cs.id} value={cs.id}>
										{cs.name}
										{cs.username ? ` (${cs.username})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="text-xs text-muted-foreground">
							Manage credential sets in{" "}
							<Link
								className="underline"
								to="/dashboard/settings"
								hash="forward-account"
							>
								Settings
							</Link>
							.
						</div>
						{credentialSetsQ.isError ? (
							<div className="text-xs text-destructive">
								Failed to load credential sets:{" "}
								{(credentialSetsQ.error as Error).message}
							</div>
						) : null}
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => applyCredSetM.mutate()}
							disabled={applyCredSetM.isPending || !credentialSetId.trim()}
						>
							{applyCredSetM.isPending ? "Applying…" : "Apply"}
						</Button>
						<Button
							variant="outline"
							onClick={() => clearCredSetM.mutate()}
							disabled={clearCredSetM.isPending}
						>
							{clearCredSetM.isPending ? "Clearing…" : "Clear"}
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Add Forward network</CardTitle>
					<CardDescription>
						Save a Forward network ID, associate it with credentials, then open
						Assurance Hub to run preset checks.
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
							<div className="flex items-center justify-between gap-3">
								<Select
									value={forwardNetworkSelectValue}
									onValueChange={(v) => {
										if (v === "__none__") {
											setForwardNetworkId("");
											return;
										}
										if (v === "__custom__") {
											// Keep current value (if any) and allow manual entry below.
											return;
										}
										setForwardNetworkId(v);
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select a network" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="__none__">(Select)</SelectItem>
										{availableForwardNetworks.map((n: any) => (
											<SelectItem key={String(n.id)} value={String(n.id)}>
												{n.name
													? `${String(n.name)} (${String(n.id)})`
													: String(n.id)}
											</SelectItem>
										))}
										<SelectItem value="__custom__">
											Custom network id…
										</SelectItem>
									</SelectContent>
								</Select>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => void availableForwardNetworksQ.refetch()}
									disabled={availableForwardNetworksQ.isFetching}
								>
									{availableForwardNetworksQ.isFetching
										? "Refreshing…"
										: "Refresh"}
								</Button>
							</div>
							{forwardNetworkSelectValue === "__custom__" ? (
								<Input
									value={forwardNetworkId}
									onChange={(e) => setForwardNetworkId(e.target.value)}
									placeholder="abc123..."
								/>
							) : null}
							{availableForwardNetworksQ.isError ? (
								<div className="text-xs text-destructive">
									Failed to load Forward networks:{" "}
									{(availableForwardNetworksQ.error as Error).message}
								</div>
							) : null}
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
							disabled={createM.isPending}
						>
							<Plus className="h-4 w-4 mr-2" />
							Save network
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Forward networks</CardTitle>
					<CardDescription>
						These networks are the Assurance Hub scope.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{workspaceNetworks.length === 0 ? (
						<div className="text-sm text-muted-foreground">
							No saved networks yet.
						</div>
					) : null}
					{workspaceNetworks.map((n) => (
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
								{canOpenNetworkViews ? (
									<>
										<Button asChild variant="outline" size="sm">
											<Link
												to="/dashboard/forward-networks/$networkRef/hub"
												params={{ networkRef: n.id }}
											>
												Open Hub
											</Link>
										</Button>
										<Button asChild variant="ghost" size="sm">
											<Link
												to="/dashboard/forward-networks/$networkRef/assurance-studio"
												params={{ networkRef: n.id }}
											>
												Advanced
											</Link>
										</Button>
									</>
								) : (
									<Button variant="outline" size="sm" disabled>
										Open Hub
									</Button>
								)}
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
