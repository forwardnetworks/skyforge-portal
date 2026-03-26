import * as z from "zod";
import type {
	CreateUserScopeDeploymentRequest,
	DeploymentLifetimePolicyResponse,
	ExternalTemplateRepo,
	ResourceEstimateSummary,
} from "../lib/api-client";

export type DeploymentKind =
	| "kne_netlab"
	| "kne_raw"
	| "netlab"
	| "containerlab"
	| "terraform";
export type TemplateSource = "user" | "blueprints" | "external" | "custom";
export type DeploymentMode = "in_cluster" | "byos";

export function deploymentKindToSpec(kind: DeploymentKind): {
	family: CreateUserScopeDeploymentRequest["family"];
	engine: CreateUserScopeDeploymentRequest["engine"];
} {
	switch (kind) {
		case "kne_netlab":
			return { family: "kne", engine: "netlab" };
		case "kne_raw":
			return { family: "kne", engine: "containerlab" };
		case "netlab":
			return { family: "byos", engine: "netlab" };
		case "containerlab":
			return { family: "byos", engine: "containerlab" };
		default:
			return { family: "terraform", engine: "terraform" };
	}
}

export function deploymentModeFromKind(kind: DeploymentKind): DeploymentMode {
	switch (kind) {
		case "netlab":
		case "containerlab":
			return "byos";
		default:
			return "in_cluster";
	}
}

export function applyDeploymentModeToKind(
	kind: DeploymentKind,
	mode: DeploymentMode,
): DeploymentKind {
	switch (kind) {
		case "netlab":
		case "kne_netlab":
			return mode === "byos" ? "netlab" : "kne_netlab";
		case "containerlab":
			return mode === "byos" ? "containerlab" : "kne_raw";
		case "kne_raw":
			return mode === "byos" ? "containerlab" : "kne_raw";
		default:
			return kind;
	}
}

export const fallbackManagedFamilies = ["kne", "byos", "terraform"];
export const fallbackAllowedHours = [4, 8, 24, 72];
export const USER_REPO_SOURCE = "user" as const;
export const toAPITemplateSource = (source: TemplateSource): string =>
	source === USER_REPO_SOURCE ? "user" : source;
export const NETLAB_DEVICE_ENV_KEY = "NETLAB_DEVICE";
export const CUSTOM_ENV_KEY_VALUE = "__custom_env_key__";
export const CUSTOM_ENV_VALUE = "__custom_env_value__";
const FORWARD_NETWORK_POLL_INTERVAL_MS = 2_000;
const FORWARD_NETWORK_POLL_TIMEOUT_MS = 600_000;
export const supportedEnvKeys = [
	{
		key: NETLAB_DEVICE_ENV_KEY,
		label: "NETLAB_DEVICE",
		description: "Override defaults.device for netlab runs",
	},
];

export const formSchema = z.object({
	userId: z.string().min(1, "User is required"),
	name: z.string().min(1, "Deployment name is required").max(100),
	kind: z.enum([
		"kne_netlab",
		"kne_raw",
		"netlab",
		"containerlab",
		"terraform",
	]),
	source: z.enum([USER_REPO_SOURCE, "blueprints", "external", "custom"]),
	templateRepoId: z.string().optional(),
	template: z.string().min(1, "Template is required"),
	netlabServer: z.string().optional(),
	forwardCollectorId: z.string().optional(),
	deploymentMode: z.enum(["in_cluster", "byos"]).optional(),
	labLifetime: z.string().optional(),
	netlabInitialDebug: z.string().optional(),
	variableGroupId: z.string().optional(),
	env: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

export function hostLabelFromURL(raw: string): string {
	const s = String(raw ?? "").trim();
	if (!s) return "";
	try {
		const u = new URL(s);
		return u.hostname || s;
	} catch {
		return s.replace(/^https?:\/\//, "").split("/")[0] ?? s;
	}
}

export function formatResourceEstimate(
	estimate?: ResourceEstimateSummary,
): string {
	if (!estimate || !estimate.supported) return "Resource estimate unavailable";
	if ((estimate.vcpu ?? 0) <= 0 && (estimate.ramGiB ?? 0) <= 0) {
		return "Resource estimate unavailable";
	}
	const cpu = Number.isFinite(estimate.vcpu) ? estimate.vcpu.toFixed(1) : "0.0";
	const ram = Number.isFinite(estimate.ramGiB)
		? estimate.ramGiB.toFixed(1)
		: "0.0";
	const storage = Number.isFinite(estimate.storageGiB)
		? estimate.storageGiB.toFixed(1)
		: "0.0";
	return `${cpu} vCPU • ${ram} GiB RAM • ${storage} GiB storage`;
}

export function parsePositiveInt(value: unknown, fallback: number): number {
	const parsed = Number.parseInt(String(value ?? ""), 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resourceEstimateFallbackReason(err: unknown): string {
	const msg = String((err as Error)?.message ?? "").trim();
	if (!msg) return "Resource estimate unavailable";
	if (msg.toLowerCase().includes("timed out")) {
		return "Resource estimate timed out; deployment can still be created";
	}
	return "Resource estimate unavailable";
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

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

export type ExternalRepos = ExternalTemplateRepo[];
export type LifetimePolicy = DeploymentLifetimePolicyResponse;
