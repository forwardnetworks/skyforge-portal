import { apiFetch } from "./http";
import type { operations } from "./openapi.gen";

export type PublicStatusSummaryResponse =
	operations["GET:skyforge.StatusSummary"]["responses"][200]["content"]["application/json"] & {
		deploymentsTotal?: number;
		deploymentsActive?: number;
	};

export async function getPublicStatusSummary(): Promise<PublicStatusSummaryResponse> {
	return apiFetch<PublicStatusSummaryResponse>("/status/summary");
}
