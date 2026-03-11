import { runDeploymentAction } from "./api-client";

export type DeploymentActionKind = "create" | "start" | "stop" | "destroy";

export type DeploymentActionMeta = {
	noOp: boolean;
	reason: string;
};

export type DeploymentActionQueueMeta = {
	queueDepth: number;
	position: number;
	nextRetryAt: string;
	expiresAt: string;
};

export function readDeploymentActionMeta(resp: {
	noOp?: unknown;
	reason?: unknown;
}): DeploymentActionMeta {
	return {
		noOp: Boolean(resp.noOp),
		reason: String(resp.reason ?? "").trim(),
	};
}

export function noOpMessageForDeploymentAction(
	action: DeploymentActionKind,
	reason: string,
): string {
	if (reason === "in_flight_duplicate") return "Action already in progress";
	if (reason === "cooldown_suppressed")
		return "Action suppressed briefly to prevent duplicate jobs";
	if (
		(action === "create" || action === "start") &&
		reason === "already_present"
	)
		return "Deployment is already active";
	if (
		(action === "stop" || action === "destroy") &&
		reason === "already_absent"
	)
		return "Deployment is already stopped";
	return "No action required";
}

export type DeploymentActionRunResult = {
	response: Record<string, unknown>;
	meta: DeploymentActionMeta;
	queued: boolean;
	queue?: DeploymentActionQueueMeta;
};

export async function runDeploymentActionWithRetry(
	userId: string,
	deploymentId: string,
	action: DeploymentActionKind,
): Promise<DeploymentActionRunResult> {
	const retryableNoOpReasons = new Set([
		"in_flight_duplicate",
		"cooldown_suppressed",
	]);
	let lastError: Error | null = null;
	let lastResponse: Record<string, unknown> = {};
	let lastMeta: DeploymentActionMeta = { noOp: false, reason: "" };
	for (let attempt = 1; attempt <= 3; attempt++) {
		try {
			const response = (await runDeploymentAction(
				userId,
				deploymentId,
				action,
			)) as Record<string, unknown>;
			const meta = readDeploymentActionMeta(response);
			lastResponse = response;
			lastMeta = meta;
			if (!meta.noOp) {
				return {
					response,
					meta,
					queued: true,
					queue: readDeploymentActionQueue(response),
				};
			}
			if (!retryableNoOpReasons.has(meta.reason)) {
				return {
					response,
					meta,
					queued: false,
					queue: readDeploymentActionQueue(response),
				};
			}
		} catch (err) {
			lastError = err as Error;
			if (attempt === 3) {
				throw lastError;
			}
		}
		if (attempt < 3) {
			await new Promise((resolve) => setTimeout(resolve, attempt * 300));
		}
	}
	if (lastError) {
		throw lastError;
	}
	return {
		response: lastResponse,
		meta: lastMeta,
		queued: false,
		queue: readDeploymentActionQueue(lastResponse),
	};
}

export function deploymentActionQueueDescription(
	queue: DeploymentActionQueueMeta | undefined,
	fallback: string,
): string {
	if (!queue) return fallback;
	const parts: string[] = [];
	if (queue.position > 0) {
		parts.push(`queue position ${queue.position}`);
	}
	if (queue.queueDepth > 0) {
		parts.push(`depth ${queue.queueDepth}`);
	}
	if (queue.nextRetryAt) {
		parts.push(`next retry ${queue.nextRetryAt}`);
	}
	if (queue.expiresAt) {
		parts.push(`expires ${queue.expiresAt}`);
	}
	if (parts.length === 0) return fallback;
	return `${fallback} (${parts.join(", ")})`;
}

function readDeploymentActionQueue(
	resp: Record<string, unknown>,
): DeploymentActionQueueMeta | undefined {
	const raw = asRecord(resp.queue);
	if (!raw) return undefined;
	const queueDepth = numberFromUnknown(raw.queueDepth);
	const position = numberFromUnknown(raw.position);
	const nextRetryAt = String(raw.nextRetryAt ?? "").trim();
	const expiresAt = String(raw.expiresAt ?? "").trim();
	if (
		queueDepth <= 0 &&
		position <= 0 &&
		nextRetryAt === "" &&
		expiresAt === ""
	) {
		return undefined;
	}
	return { queueDepth, position, nextRetryAt, expiresAt };
}

function asRecord(raw: unknown): Record<string, unknown> | undefined {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
	return raw as Record<string, unknown>;
}

function numberFromUnknown(raw: unknown): number {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		return raw;
	}
	const parsed = Number.parseInt(String(raw ?? "").trim(), 10);
	return Number.isFinite(parsed) ? parsed : 0;
}
