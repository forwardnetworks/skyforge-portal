import { apiFetch } from "./http";

export type ToolAction = {
	label: string;
	method: string;
	path: string;
	payload?: Record<string, string>;
	requiredCapabilities?: string[];
	allowed?: boolean;
	disabledReason?: string;
};

export type ManagedIntegrationStatus = {
	id: string;
	label: string;
	kind?: string;
	status: string;
	detail?: string;
	launchMode?: string;
	authMode?: string;
	supportsWake?: boolean;
	requiredCapabilities?: string[];
	wakeAction?: ToolAction | null;
	desiredReplicas?: number;
	availableReplicas?: number;
	runStrategy?: string;
	printableStatus?: string;
	ready?: boolean;
};

export type ManagedIntegrationsStatusResponse = {
	checkedAt?: string;
	integrations?: ManagedIntegrationStatus[];
};

export async function getManagedIntegrationsStatus(): Promise<ManagedIntegrationsStatusResponse> {
	return apiFetch<ManagedIntegrationsStatusResponse>(
		"/api/platform/integrations/status",
	);
}

export async function runManagedIntegrationAction(
	action: ToolAction,
): Promise<unknown> {
	const method =
		String(action.method ?? "POST")
			.trim()
			.toUpperCase() || "POST";
	const payload = action.payload ?? {};
	return apiFetch(action.path, {
		method,
		body:
			method === "GET" || method === "HEAD"
				? undefined
				: JSON.stringify(payload),
	});
}
