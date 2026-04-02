import type {
	ListUserScopeArtifactsResponse,
	SkyforgeUserScope,
} from "@/lib/api-client";
import type {
	AdminObjectStoreBucket,
	AdminObjectStoreObjectResponse,
	AdminObjectStoreObjectsResponse,
} from "@/lib/api-client-admin-object-store";

export type S3ObjectRow = ListUserScopeArtifactsResponse["items"][number];
export type S3UserScopeOption = SkyforgeUserScope;
export type PlatformBucketObjectRow = AdminObjectStoreObjectsResponse["items"][number];
export type PlatformBucketPreview = AdminObjectStoreObjectResponse;
export type PlatformBucketOption = AdminObjectStoreBucket;

export type BrowserSourceMode = "user-scope" | "platform-bucket";

export type BrowserRow = {
	id: string;
	key: string;
	name: string;
	fullKey: string;
	size: number;
	lastModified?: string;
	contentType?: string;
	isDirectory: boolean;
	sourceMode: BrowserSourceMode;
};
