import type { ISO8601 } from "./api-client-user-user-scope";
import { apiFetch } from "./http";

export type UserAPITokenMetadata = {
	id: string;
	name: string;
	createdAt: ISO8601;
	updatedAt: ISO8601;
	lastUsedAt?: ISO8601;
	lastUsedIp?: string;
	revokedAt?: ISO8601;
};

export type ListUserAPITokensResponse = {
	tokens: UserAPITokenMetadata[];
};

export type CreateUserAPITokenResponse = {
	token: string;
	tokenMeta: UserAPITokenMetadata;
};

export type RegenerateUserAPITokenResponse = {
	token: string;
	tokenMeta: UserAPITokenMetadata;
};

export type RevokeUserAPITokenResponse = {
	tokenId: string;
	revoked: boolean;
};

export async function listUserAPITokens(): Promise<ListUserAPITokensResponse> {
	return apiFetch<ListUserAPITokensResponse>("/api/api-tokens");
}

export async function createUserAPIToken(payload?: {
	name?: string;
}): Promise<CreateUserAPITokenResponse> {
	return apiFetch<CreateUserAPITokenResponse>("/api/api-tokens", {
		method: "POST",
		body: JSON.stringify(payload ?? {}),
	});
}

export async function regenerateUserAPIToken(
	tokenId: string,
): Promise<RegenerateUserAPITokenResponse> {
	return apiFetch<RegenerateUserAPITokenResponse>(
		`/api/api-tokens/${encodeURIComponent(tokenId)}/regenerate`,
		{
			method: "POST",
			body: "{}",
		},
	);
}

export async function revokeUserAPIToken(
	tokenId: string,
): Promise<RevokeUserAPITokenResponse> {
	return apiFetch<RevokeUserAPITokenResponse>(
		`/api/api-tokens/${encodeURIComponent(tokenId)}`,
		{
			method: "DELETE",
		},
	);
}
