import { apiFetch } from "./http";
import type {
	GetUserScopesResponse,
	ISO8601,
	JSONMap,
	SkyforgeUserScope,
	UserScopeDeployment,
} from "./api-client-user-shared";

// Dashboard snapshot is delivered via SSE (`/api/dashboard/events`) and is not described in OpenAPI.
export type DashboardSnapshot = {
	refreshedAt: ISO8601;
	userScopes: SkyforgeUserScope[];
	deployments: UserScopeDeployment[];
	runs: JSONMap[];
	templatesIndexUpdatedAt?: ISO8601;
	awsSsoStatus?: {
		configured: boolean;
		connected: boolean;
		expiresAt?: ISO8601;
		lastAuthenticatedAt?: ISO8601;
	};
};

export async function getUserScopes(): Promise<GetUserScopesResponse> {
	return apiFetch<GetUserScopesResponse>("/api/users");
}

export async function listUserScopes(): Promise<SkyforgeUserScope[]> {
	const resp = await getUserScopes();
	const payload = resp as unknown as {
		userScopes?: SkyforgeUserScope[];
	};
	const userScopes = payload.userScopes;
	if (Array.isArray(userScopes)) return userScopes;
	return [];
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
	return apiFetch<DashboardSnapshot>("/api/dashboard/snapshot");
}
