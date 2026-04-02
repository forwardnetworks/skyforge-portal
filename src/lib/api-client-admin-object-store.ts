import { apiFetch } from "./http";

export type AdminObjectStoreBucket = {
	name: string;
	label: string;
	description?: string;
	readOnly: boolean;
};

export type AdminObjectStoreBucketsResponse = {
	buckets: AdminObjectStoreBucket[];
};

export type AdminObjectStoreObjectSummary = {
	key: string;
	size: number;
	lastModified?: string;
	contentType?: string;
};

export type AdminObjectStoreObjectsResponse = {
	bucket: string;
	prefix: string;
	items: AdminObjectStoreObjectSummary[];
};

export type AdminObjectStoreObjectResponse = {
	bucket: string;
	key: string;
	size: number;
	lastModified?: string;
	contentType?: string;
	fileData: string;
	truncated?: boolean;
};

export async function listAdminObjectStoreBuckets(): Promise<AdminObjectStoreBucketsResponse> {
	return apiFetch<AdminObjectStoreBucketsResponse>("/api/admin/object-store/buckets");
}

export async function listAdminObjectStoreObjects(params: {
	bucket: string;
	prefix?: string;
	limit?: string;
}): Promise<AdminObjectStoreObjectsResponse> {
	const qs = new URLSearchParams();
	qs.set("bucket", params.bucket);
	if (params.prefix) qs.set("prefix", params.prefix);
	if (params.limit) qs.set("limit", params.limit);
	return apiFetch<AdminObjectStoreObjectsResponse>(
		`/api/admin/object-store/objects?${qs.toString()}`,
	);
}

export async function getAdminObjectStoreObject(params: {
	bucket: string;
	key: string;
	maxBytes?: string;
}): Promise<AdminObjectStoreObjectResponse> {
	const qs = new URLSearchParams();
	qs.set("bucket", params.bucket);
	qs.set("key", params.key);
	if (params.maxBytes) qs.set("maxBytes", params.maxBytes);
	return apiFetch<AdminObjectStoreObjectResponse>(
		`/api/admin/object-store/object?${qs.toString()}`,
	);
}

