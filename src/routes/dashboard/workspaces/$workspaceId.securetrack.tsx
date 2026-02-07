import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Play, RefreshCw, Shield } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "../../../components/ui/badge";
import { Button, buttonVariants } from "../../../components/ui/button";
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
import { Input } from "../../../components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../../../components/ui/tabs";
import { Textarea } from "../../../components/ui/textarea";
import { queryKeys } from "../../../lib/query-keys";
import {
	type SecureTrackCatalogCheck,
	type SecureTrackNQEResponse,
	type SecureTrackPack,
	getWorkspaceSecureTrackCheck,
	getWorkspaceSecureTrackChecks,
	getWorkspaceSecureTrackPacks,
	getWorkspaceSecureTrackSnapshots,
	runWorkspaceSecureTrackCheck,
	runWorkspaceSecureTrackPack,
} from "../../../lib/skyforge-api";

export const Route = createFileRoute(
	"/dashboard/workspaces/$workspaceId/securetrack",
)({
	component: SecureTrackPage,
});

function jsonPretty(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

function severityVariant(
	sev: string | undefined,
): "default" | "destructive" | "secondary" {
	const v = String(sev ?? "").toLowerCase();
	if (v === "high" || v === "critical") return "destructive";
	if (v === "medium") return "default";
	return "secondary";
}

function SecureTrackPage() {
	const { workspaceId } = Route.useParams();

	const [networkId, setNetworkId] = useState("");
	const [snapshotId, setSnapshotId] = useState<string>("");

	const [activeTab, setActiveTab] = useState<"checks" | "packs">("checks");
	const [resultsByCheck, setResultsByCheck] = useState<
		Record<string, SecureTrackNQEResponse>
	>({});

	const [openCheckId, setOpenCheckId] = useState<string>("");

	const checks = useQuery({
		queryKey: queryKeys.secureTrackChecks(workspaceId),
		queryFn: () => getWorkspaceSecureTrackChecks(workspaceId),
		staleTime: 60_000,
	});

	const packs = useQuery({
		queryKey: queryKeys.secureTrackPacks(workspaceId),
		queryFn: () => getWorkspaceSecureTrackPacks(workspaceId),
		staleTime: 60_000,
	});

	const snapshots = useQuery({
		queryKey: queryKeys.secureTrackSnapshots(workspaceId, networkId.trim()),
		queryFn: async () => {
			return getWorkspaceSecureTrackSnapshots(
				workspaceId,
				networkId.trim(),
				25,
			);
		},
		enabled: networkId.trim().length > 0,
		retry: false,
		staleTime: 10_000,
	});

	const snapshotItems = useMemo(() => {
		const body = snapshots.data?.body as any;
		const list = body?.snapshots ?? body?.items ?? [];
		if (!Array.isArray(list)) return [];
		return list
			.map((s: any) => ({
				id: String(s?.id ?? ""),
				createdAt: String(s?.createdAt ?? s?.timestamp ?? ""),
			}))
			.filter((s: any) => s.id);
	}, [snapshots.data]);

	const openCheck = useMutation({
		mutationFn: async (id: string) => {
			return getWorkspaceSecureTrackCheck(workspaceId, id);
		},
		onError: (e) =>
			toast.error("Failed to load check", {
				description: (e as Error).message,
			}),
	});

	const runCheck = useMutation({
		mutationFn: async (checkId: string) => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return runWorkspaceSecureTrackCheck(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				checkId,
			});
		},
		onSuccess: (resp, checkId) => {
			setResultsByCheck((prev) => ({ ...prev, [checkId]: resp }));
			toast.success("Check completed", { description: checkId });
		},
		onError: (e) =>
			toast.error("Check failed", { description: (e as Error).message }),
	});

	const runPack = useMutation({
		mutationFn: async (packId: string) => {
			const net = networkId.trim();
			if (!net) throw new Error("Network ID is required");
			return runWorkspaceSecureTrackPack(workspaceId, {
				networkId: net,
				snapshotId: snapshotId.trim() || undefined,
				packId,
			});
		},
		onSuccess: (resp) => {
			setResultsByCheck((prev) => ({ ...prev, ...resp.results }));
			toast.success("Pack completed", { description: resp.packId });
		},
		onError: (e) =>
			toast.error("Pack failed", { description: (e as Error).message }),
	});

	const checksList: SecureTrackCatalogCheck[] = checks.data?.checks ?? [];
	const packsList: SecureTrackPack[] = packs.data?.packs ?? [];

	return (
		<div className="space-y-6 p-6">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b pb-6">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<Shield className="h-5 w-5 text-muted-foreground" />
						<h1 className="text-2xl font-bold tracking-tight">SecureTrack</h1>
						<Badge variant="secondary">Demo</Badge>
					</div>
					<p className="text-muted-foreground text-sm">
						Run parameterized NQE checks against a Forward network and snapshot.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Link
						to="/dashboard/workspaces/$workspaceId"
						params={{ workspaceId }}
						className={buttonVariants({ variant: "outline" })}
					>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Workspace
					</Link>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Target</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<div className="text-sm font-medium">Forward Network ID</div>
						<Input
							value={networkId}
							onChange={(e) => setNetworkId(e.target.value)}
							placeholder="e.g. 235216"
						/>
						<p className="text-xs text-muted-foreground">
							This is the Forward network id (not the name). SecureTrack uses
							the workspace Forward credentials on the server.
						</p>
					</div>
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<div className="text-sm font-medium">Snapshot</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => snapshots.refetch()}
								disabled={!networkId.trim() || snapshots.isFetching}
							>
								<RefreshCw className="mr-2 h-4 w-4" />
								Refresh
							</Button>
						</div>
						<Select value={snapshotId} onValueChange={(v) => setSnapshotId(v)}>
							<SelectTrigger>
								<SelectValue placeholder="Latest or choose one" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">(Let Forward choose)</SelectItem>
								{snapshotItems.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.id}
										{s.createdAt ? ` (${s.createdAt})` : ""}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{snapshots.isError ? (
							<p className="text-xs text-destructive">
								Failed to load snapshots: {(snapshots.error as Error).message}
							</p>
						) : null}
					</div>
				</CardContent>
			</Card>

			<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
				<TabsList>
					<TabsTrigger value="checks">Checks</TabsTrigger>
					<TabsTrigger value="packs">Packs</TabsTrigger>
				</TabsList>

				<TabsContent value="checks" className="space-y-4">
					{checks.isLoading ? (
						<Card>
							<CardContent className="p-6 text-sm text-muted-foreground">
								Loading checks…
							</CardContent>
						</Card>
					) : null}

					{checks.isError ? (
						<Card>
							<CardContent className="p-6 text-sm text-destructive">
								Failed to load checks: {(checks.error as Error).message}
							</CardContent>
						</Card>
					) : null}

					{checksList.map((c) => {
						const id = c.id;
						const result = resultsByCheck[id];
						return (
							<Card key={id}>
								<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<CardTitle className="text-base">
												{c.title ?? id}
											</CardTitle>
											{c.severity ? (
												<Badge variant={severityVariant(c.severity)}>
													{c.severity}
												</Badge>
											) : null}
											{c.category ? (
												<Badge variant="secondary">{c.category}</Badge>
											) : null}
										</div>
										{c.description ? (
											<p className="text-sm text-muted-foreground">
												{c.description}
											</p>
										) : null}
										<p className="text-xs text-muted-foreground">{id}</p>
									</div>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											onClick={async () => {
												setOpenCheckId(id);
												await openCheck.mutateAsync(id);
											}}
										>
											View query
										</Button>
										<Button
											onClick={() => runCheck.mutate(id)}
											disabled={runCheck.isPending}
										>
											<Play className="mr-2 h-4 w-4" />
											Run
										</Button>
									</div>
								</CardHeader>
								{result ? (
									<CardContent className="space-y-3">
										<div className="grid gap-3 md:grid-cols-2">
											<div className="text-sm">
												<div className="text-muted-foreground">Total</div>
												<div className="font-medium">{result.total}</div>
											</div>
											<div className="text-sm">
												<div className="text-muted-foreground">Snapshot</div>
												<div className="font-medium">
													{result.snapshotId ?? "(unknown)"}
												</div>
											</div>
										</div>
										<Textarea
											readOnly
											className="font-mono text-xs"
											rows={10}
											value={jsonPretty(result.results)}
										/>
									</CardContent>
								) : null}
							</Card>
						);
					})}
				</TabsContent>

				<TabsContent value="packs" className="space-y-4">
					{packs.isLoading ? (
						<Card>
							<CardContent className="p-6 text-sm text-muted-foreground">
								Loading packs…
							</CardContent>
						</Card>
					) : null}

					{packs.isError ? (
						<Card>
							<CardContent className="p-6 text-sm text-destructive">
								Failed to load packs: {(packs.error as Error).message}
							</CardContent>
						</Card>
					) : null}

					{packsList.map((p) => (
						<Card key={p.id}>
							<CardHeader className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
								<div className="space-y-1">
									<CardTitle className="text-base">{p.title ?? p.id}</CardTitle>
									{p.description ? (
										<p className="text-sm text-muted-foreground">
											{p.description}
										</p>
									) : null}
									<p className="text-xs text-muted-foreground">
										{(p.checks ?? []).length} checks
									</p>
								</div>
								<Button
									onClick={() => runPack.mutate(p.id)}
									disabled={runPack.isPending}
								>
									<Play className="mr-2 h-4 w-4" />
									Run pack
								</Button>
							</CardHeader>
						</Card>
					))}
				</TabsContent>
			</Tabs>

			<Dialog
				open={!!openCheckId}
				onOpenChange={(v) => {
					if (!v) setOpenCheckId("");
				}}
			>
				<DialogContent className="max-w-3xl">
					<DialogHeader>
						<DialogTitle>Check Query</DialogTitle>
						<DialogDescription>{openCheckId}</DialogDescription>
					</DialogHeader>
					<Textarea
						readOnly
						className="font-mono text-xs"
						rows={18}
						value={
							openCheck.data?.content ?? (openCheck.isPending ? "Loading…" : "")
						}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}
