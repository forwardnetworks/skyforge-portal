import { apiFetch } from "./http";

export type ManagedIntegrationStatus = {
	id: string;
	label: string;
	kind?: string;
	status: string;
	detail?: string;
	launchMode?: string;
	authMode?: string;
	supportsWake?: boolean;
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
