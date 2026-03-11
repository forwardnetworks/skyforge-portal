import {
	type ResourceEstimateSummary,
	type SkyforgeUserScope,
	getDeploymentLifetimePolicy,
	getQuickDeployCatalog,
	getSession,
	getUserScopeNetlabTemplate,
	listUserScopes,
	runQuickDeploy,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const FORWARD_NETWORK_POLL_INTERVAL_MS = 2_000;
const FORWARD_NETWORK_POLL_TIMEOUT_MS = 600_000;

type DeploymentForwardInfoResponse = {
	forwardNetworkId?: string;
	forwardSnapshotUrl?: string;
	deployment?: {
		syncState?: string;
		lastSyncAt?: string;
		lastSyncStatus?: string;
		lastSyncError?: string;
	};
};

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatQuickDeployEstimate(
	estimate?: ResourceEstimateSummary,
): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	const vcpu = Number(estimate.vcpu ?? 0);
	const ramGiB = Number(estimate.ramGiB ?? 0);
	if (!Number.isFinite(vcpu) || !Number.isFinite(ramGiB)) {
		return "Resource estimate unavailable";
	}
	if (vcpu <= 0 && ramGiB <= 0) {
		return "Resource estimate unavailable";
	}
	return `${vcpu.toFixed(1)} vCPU • ${ramGiB.toFixed(1)} GiB RAM`;
}

async function getDeploymentForwardInfo(
	userId: string,
	deploymentId: string,
): Promise<DeploymentForwardInfoResponse> {
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
	return (await resp.json()) as DeploymentForwardInfoResponse;
}

async function waitForForwardSyncAndNetwork(
	userId: string,
	deploymentId: string,
): Promise<string> {
	const deadline = Date.now() + FORWARD_NETWORK_POLL_TIMEOUT_MS;
	while (Date.now() < deadline) {
		try {
			const info = await getDeploymentForwardInfo(userId, deploymentId);
			const networkId = String(info.forwardNetworkId ?? "").trim();
			const snapshotURL = String(info.forwardSnapshotUrl ?? "").trim();
			const syncState = String(info.deployment?.syncState ?? "")
				.trim()
				.toLowerCase();
			const lastSyncAt = String(info.deployment?.lastSyncAt ?? "").trim();
			const syncError = String(info.deployment?.lastSyncError ?? "").trim();

			if (syncState === "sync_failed") {
				throw new Error(syncError || "Forward sync failed");
			}
			if (networkId && lastSyncAt && (syncState === "synced" || snapshotURL)) {
				return networkId;
			}
		} catch {
			// Keep polling while deployment + sync are in progress.
		}
		await sleep(FORWARD_NETWORK_POLL_INTERVAL_MS);
	}
	throw new Error("Forward sync did not complete within the wait window.");
}

function hardRefreshToDeploymentTopology(deploymentId: string): void {
	if (typeof window === "undefined") return;
	const topologyUrl = `/dashboard/deployments/${encodeURIComponent(deploymentId)}?tab=topology&refresh=${Date.now()}`;
	window.location.assign(topologyUrl);
}

export function useQuickDeployPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const [previewOpen, setPreviewOpen] = useState(false);
	const [previewTemplate, setPreviewTemplate] = useState("");
	const [leaseHours, setLeaseHours] = useState("24");

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
				search: { tab: "topology" } as any,
			});

			if (typeof window !== "undefined") {
				void (async () => {
					try {
						await waitForForwardSyncAndNetwork(
							result.userId,
							result.deploymentId,
						);
						toast.success("Forward sync completed", {
							description:
								"Use the deployment page buttons to open the network in Forward.",
						});
						hardRefreshToDeploymentTopology(result.deploymentId);
					} catch (error) {
						toast.error("Forward sync did not complete", {
							description:
								error instanceof Error ? error.message : String(error),
						});
					}
				})();
			}
		},
		onError: (err) => {
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
		enabled:
			previewOpen && Boolean(previewTemplate) && Boolean(previewUserScopeId),
		retry: false,
		staleTime: 30_000,
	});

	return {
		catalogQ,
		lifetimePolicyQ,
		previewOpen,
		setPreviewOpen,
		previewTemplate,
		setPreviewTemplate,
		leaseHours,
		setLeaseHours,
		deployMutation,
		templates,
		leaseOptions,
		loadError,
		previewUserScopeId,
		previewQ,
	};
}
