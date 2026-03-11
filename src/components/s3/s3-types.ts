import type {
	ListUserScopeArtifactsResponse,
	SkyforgeUserScope,
} from "@/lib/api-client";

export type S3ObjectRow = ListUserScopeArtifactsResponse["items"][number];
export type S3UserScopeOption = SkyforgeUserScope;
