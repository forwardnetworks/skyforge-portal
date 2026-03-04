import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
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
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import {
	getDeploymentLifetimePolicy,
	getSession,
	getUserScopeNetlabTemplate,
	getQuickDeployCatalog,
	listUserScopes,
	type ResourceEstimateSummary,
	type SkyforgeUserScope,
	runQuickDeploy,
} from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";

const FORWARD_IN_APP_URL = "https://skyforge-fwd.local.forwardnetworks.com";
const FORWARD_NETWORK_POLL_INTERVAL_MS = 2_000;
const FORWARD_NETWORK_POLL_TIMEOUT_MS = 600_000;

export const Route = createFileRoute("/dashboard/deployments/quick")({
	component: QuickDeployPage,
});

function formatEstimate(estimate?: ResourceEstimateSummary): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	const vcpu = Number(estimate.vcpu ?? 0);
	const ramGiB = Number(estimate.ramGiB ?? 0);
	if (!Number.isFinite(vcpu) || !Number.isFinite(ramGiB)) {
		return "Resource estimate unavailable";
	}
	if (vcpu <= 0 && ramGiB <= 0) {
		return "Resource estimate unavailable";
	}
	const cpu = vcpu.toFixed(1);
	const ram = ramGiB.toFixed(1);
	return `${cpu} vCPU • ${ram} GiB RAM`;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDeploymentForwardNetworkId(
	userId: string,
	deploymentId: string,
): Promise<string> {
	const resp = await fetch(
		`/api/users/${encodeURIComponent(userId)}/deployments/${encodeURIComponent(deploymentId)}/info`,
		{
			method: "GET",
			credentials: "include",
			headers: { Accept: "application/json" },
		},
	);
	if (!resp.ok) {
		throw new Error(`deployment info failed (${resp.status})`);
	}
	const data = (await resp.json()) as { forwardNetworkId?: string };
	return String(data.forwardNetworkId ?? "").trim();
}

async function waitForForwardNetworkId(
	userId: string,
	deploymentId: string,
): Promise<string> {
	const deadline = Date.now() + FORWARD_NETWORK_POLL_TIMEOUT_MS;
	while (Date.now() < deadline) {
		try {
			const networkId = await getDeploymentForwardNetworkId(userId, deploymentId);
			if (networkId) return networkId;
		} catch {
			// Keep polling; deployment info can be briefly unavailable during bring-up.
		}
		await sleep(FORWARD_NETWORK_POLL_INTERVAL_MS);
	}
	return "";
}

function QuickDeployPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const pendingForwardTabRef = useRef<Window | null>(null);
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState("");
	const catalogQ = useQuery({
		queryKey: ["quick-deploy", "catalog"],
		queryFn: getQuickDeployCatalog,
		staleTime: 60_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		staleTime: 60_000,
		retry: false,
	});
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const userScopesQ = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
		retry: false,
	});

	const [leaseHours, setLeaseHours] = useState("24");

	useEffect(() => {
		const fallback = String(
			lifetimePolicyQ.data?.defaultHours ??
				catalogQ.data?.defaultLeaseHours ??
				24,
		);
		setLeaseHours((current) => current || fallback);
	}, [catalogQ.data?.defaultLeaseHours, lifetimePolicyQ.data?.defaultHours]);

	const deployMutation = useMutation({
		mutationFn: async (template: string) =>
			runQuickDeploy({
				template,
				leaseHours: Number.parseInt(leaseHours, 10) || 4,
			}),
		onSuccess: async (result) => {
			const pendingForwardTab = pendingForwardTabRef.current;
			pendingForwardTabRef.current = null;
			if (result.noOp) {
				toast.message("Deployment already in desired state", {
					description: result.deploymentName,
				});
			} else {
				toast.success("Quick deployment queued", {
					description: result.deploymentName,
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});

			await navigate({
				to: "/dashboard/deployments/$deploymentId",
				params: { deploymentId: result.deploymentId },
				search: { tab: "logs" } as any,
			});

			if (typeof window !== "undefined") {
				void (async () => {
					const forwardNetworkId = await waitForForwardNetworkId(
						result.userId,
						result.deploymentId,
					);
					if (!forwardNetworkId) {
						if (pendingForwardTab && !pendingForwardTab.closed) {
							pendingForwardTab.close();
						}
						toast.error("Forward sync did not publish a network ID", {
							description:
								"Forward network ID was not resolved within the wait window.",
						});
						return;
					}
					const forwardUrl = `${FORWARD_IN_APP_URL}/?/search?networkId=${encodeURIComponent(forwardNetworkId)}`;
					if (pendingForwardTab && !pendingForwardTab.closed) {
						pendingForwardTab.location.href = forwardUrl;
						return;
					}
					const openedTab = window.open(forwardUrl, "_blank");
					if (!openedTab) {
						toast.message("Forward window blocked", {
							description:
								"Allow popups for this site to open the synced Forward network tab automatically.",
						});
					}
				})();
			}
		},
		onError: (err) => {
			const pendingForwardTab = pendingForwardTabRef.current;
			pendingForwardTabRef.current = null;
			if (pendingForwardTab && !pendingForwardTab.closed) {
				pendingForwardTab.close();
			}
			toast.error("Quick deploy failed", {
				description: err instanceof Error ? err.message : String(err),
			});
		},
	});

	const templates = catalogQ.data?.templates ?? [];
	const leaseOptions =
		lifetimePolicyQ.data?.allowedHours &&
		lifetimePolicyQ.data.allowedHours.length > 0
			? lifetimePolicyQ.data.allowedHours
			: catalogQ.data?.leaseOptions && catalogQ.data.leaseOptions.length > 0
				? catalogQ.data.leaseOptions
				: [4, 8, 24, 72];
	const loadError =
		catalogQ.error instanceof Error
			? catalogQ.error.message
			: catalogQ.error
				? String(catalogQ.error)
				: "";
	const previewUserScopeId = useMemo(() => {
		const scopes = (userScopesQ.data ?? []) as SkyforgeUserScope[];
		const username = String(sessionQ.data?.username ?? "").trim();
		if (scopes.length === 0) return "";
		if (!username) return scopes[0]?.id ?? "";
		const mine = scopes.filter((w) => {
			if (String(w.createdBy ?? "").trim() === username) return true;
			if ((w.owners ?? []).includes(username)) return true;
			if (String(w.slug ?? "").trim() === username) return true;
			return false;
		});
		return (mine[0] ?? scopes[0])?.id ?? "";
	}, [sessionQ.data?.username, userScopesQ.data]);
	const previewQ = useQuery({
		queryKey: [
			"quick-deploy",
			"template-preview",
			previewUserScopeId,
			previewTemplate,
		],
		queryFn: async () => {
			if (!previewUserScopeId) {
				throw new Error("No user scope available for preview.");
			}
			if (!previewTemplate) throw new Error("Template is required.");
			return getUserScopeNetlabTemplate(previewUserScopeId, {
				source: "blueprints",
				template: previewTemplate,
			});
		},
		enabled: previewOpen && Boolean(previewTemplate) && Boolean(previewUserScopeId),
		retry: false,
		staleTime: 30_000,
	});

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Quick Deploy</h1>
				<p className="text-sm text-muted-foreground">
					One-click curated labs using the in-app Forward cluster and managed
					credentials. Deploy opens the deployment logs first, then opens
					Forward to the synced network once the network ID is available.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lease Duration</CardTitle>
					<CardDescription>
						Labs are automatically lease-bound and can be extended later from
						the Deployments page.
					</CardDescription>
				</CardHeader>
				<CardContent className="max-w-xs">
					<div className="space-y-2">
						<Label>Duration</Label>
						<Select value={leaseHours} onValueChange={setLeaseHours}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{leaseOptions.map((hours) => (
									<SelectItem key={String(hours)} value={String(hours)}>
										{hours} hours
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{catalogQ.isError ? (
					<Card className="md:col-span-2 xl:col-span-3">
						<CardHeader>
							<CardTitle>Quick Deploy Unavailable</CardTitle>
							<CardDescription>
								{loadError ||
									"Quick Deploy is not enabled for this environment."}
							</CardDescription>
						</CardHeader>
					</Card>
				) : null}
				{templates.map((entry) => (
					<Card key={entry.id} className="flex h-full flex-col">
						<CardHeader>
							<CardTitle>{entry.name}</CardTitle>
							<CardDescription>{entry.description}</CardDescription>
						</CardHeader>
						<CardContent className="mt-auto space-y-3">
							<div className="text-xs">
								<div className="font-medium text-foreground">
									{formatEstimate(entry.estimate)}
								</div>
								{entry.estimate?.reason ? (
									<div className="text-muted-foreground">
										{entry.estimate.reason}
									</div>
								) : null}
							</div>
							<p className="text-xs text-muted-foreground">{entry.template}</p>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => {
										if (!previewUserScopeId) {
											toast.error("Template preview unavailable", {
												description:
													"No user scope is available yet for template rendering.",
											});
											return;
										}
										setPreviewTemplate(entry.template);
										setPreviewOpen(true);
									}}
									disabled={catalogQ.isLoading || deployMutation.isPending}
								>
									View
								</Button>
								<Button
									className="flex-1"
									onClick={() => {
										const openedTab =
											typeof window !== "undefined"
												? window.open("about:blank", "_blank")
												: null;
										pendingForwardTabRef.current = openedTab;
										if (typeof window !== "undefined" && !openedTab) {
											toast.message("Forward window blocked", {
												description:
													"Allow popups for this site to open the synced Forward network tab automatically.",
											});
										}
										deployMutation.mutate(entry.template);
									}}
									disabled={catalogQ.isLoading || deployMutation.isPending}
								>
									{deployMutation.isPending ? "Deploying..." : "Deploy"}
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
				<DialogContent className="max-w-5xl">
					<DialogHeader>
						<DialogTitle>Template Preview</DialogTitle>
						<DialogDescription>{previewTemplate || "No template selected"}</DialogDescription>
					</DialogHeader>
					{previewQ.isPending ? (
						<div className="text-sm text-muted-foreground">Loading template…</div>
					) : previewQ.isError ? (
						<div className="text-sm text-destructive">
							{previewQ.error instanceof Error
								? previewQ.error.message
								: "Failed to load template preview."}
						</div>
					) : (
						<Textarea
							readOnly
							value={previewQ.data?.yaml ?? ""}
							className="font-mono text-xs min-h-[55vh]"
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
