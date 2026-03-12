export const FORWARD_NETWORK_POLL_INTERVAL_MS = 2_000;
export const FORWARD_NETWORK_POLL_TIMEOUT_MS = 600_000;

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

export async function waitForForwardSyncAndNetwork(
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

export function hardRefreshToDeploymentTopology(deploymentId: string): void {
	if (typeof window === "undefined") return;
	const topologyUrl = `/dashboard/deployments/${encodeURIComponent(deploymentId)}?tab=topology&refresh=${Date.now()}`;
	window.location.assign(topologyUrl);
}
