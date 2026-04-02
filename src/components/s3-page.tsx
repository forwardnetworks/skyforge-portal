import {
	createUserScopeArtifactFolder,
	listUserScopeArtifacts,
	listUserScopes,
	putUserScopeArtifactObject,
} from "@/lib/api-client";
import {
	getAdminObjectStoreObject,
	listAdminObjectStoreBuckets,
	listAdminObjectStoreObjects,
} from "@/lib/api-client-admin-object-store";
import { queryKeys } from "@/lib/query-keys";
import type {
	BrowserSourceMode,
	PlatformBucketOption,
	PlatformBucketPreview,
	S3UserScopeOption,
} from "@/components/s3/s3-types";
import {
	openUploadFileDialog,
	promptFolderPrefix,
} from "@/components/s3/s3-object-dialogs";
import { S3Page } from "@/components/s3/s3-page";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const LAST_USER_SCOPE_STORAGE_KEY = "skyforge.lastUserScopeId.s3";
const LAST_PLATFORM_BUCKET_STORAGE_KEY = "skyforge.lastPlatformBucket.s3";
const LAST_SOURCE_MODE_STORAGE_KEY = "skyforge.lastSourceMode.s3";

function encodeBytesToBase64(bytes: Uint8Array) {
	let encoded = "";
	const chunkSize = 32 * 1024;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		const chunk = bytes.subarray(i, i + chunkSize);
		encoded += btoa(String.fromCharCode(...chunk));
	}
	return encoded;
}

export function S3Route() {
	const [sourceMode, setSourceMode] = useState<BrowserSourceMode>("user-scope");
	const [selectedUserScopeId, setSelectedUserScopeId] = useState("");
	const [selectedBucket, setSelectedBucket] = useState("");
	const [prefix, setPrefix] = useState("");

	const userScopes = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});

	const platformBuckets = useQuery({
		queryKey: queryKeys.adminObjectStoreBuckets(),
		queryFn: listAdminObjectStoreBuckets,
		retry: false,
		staleTime: 30_000,
	});

	const userScopeOptions = userScopes.data ?? [];
	const bucketOptions: PlatformBucketOption[] = platformBuckets.data?.buckets ?? [];

	useEffect(() => {
		const storedMode = window.localStorage.getItem(
			LAST_SOURCE_MODE_STORAGE_KEY,
		) as BrowserSourceMode | null;
		if (storedMode === "platform-bucket" || storedMode === "user-scope") {
			setSourceMode(storedMode);
		}
	}, []);

	useEffect(() => {
		if (userScopeOptions.length === 0) return;
		const stored =
			window.localStorage.getItem(LAST_USER_SCOPE_STORAGE_KEY) ?? "";
		const initial = userScopeOptions.some((scope) => scope.id === stored)
			? stored
			: (userScopeOptions[0]?.id ?? "");
		setSelectedUserScopeId((previous) => previous || initial);
	}, [userScopeOptions]);

	useEffect(() => {
		if (bucketOptions.length === 0) return;
		const stored =
			window.localStorage.getItem(LAST_PLATFORM_BUCKET_STORAGE_KEY) ?? "";
		const initial = bucketOptions.some((bucket) => bucket.name === stored)
			? stored
			: (bucketOptions[0]?.name ?? "");
		setSelectedBucket((previous) => previous || initial);
	}, [bucketOptions]);

	const artifacts = useQuery({
		queryKey: queryKeys.userArtifacts(selectedUserScopeId),
		queryFn: async () =>
			listUserScopeArtifacts(selectedUserScopeId, {
				prefix: prefix || undefined,
			}),
		staleTime: 10_000,
		enabled: sourceMode === "user-scope" && !!selectedUserScopeId,
	});

	const platformObjects = useQuery({
		queryKey: queryKeys.adminObjectStoreObjects(selectedBucket, prefix),
		queryFn: async () =>
			listAdminObjectStoreObjects({
				bucket: selectedBucket,
				prefix: prefix || undefined,
			}),
		staleTime: 10_000,
		retry: false,
		enabled:
			sourceMode === "platform-bucket" &&
			!!selectedBucket &&
			bucketOptions.length > 0,
	});

	const selectedBucketMeta = useMemo(
		() => bucketOptions.find((bucket) => bucket.name === selectedBucket) ?? null,
		[bucketOptions, selectedBucket],
	);

	const selectedUserScope = useMemo(
		() => userScopeOptions.find((scope) => scope.id === selectedUserScopeId) ?? null,
		[userScopeOptions, selectedUserScopeId],
	);

	const handleSourceModeChange = (mode: BrowserSourceMode) => {
		setSourceMode(mode);
		setPrefix("");
		window.localStorage.setItem(LAST_SOURCE_MODE_STORAGE_KEY, mode);
	};

	const handleSelectedUserScopeIdChange = (userScopeId: string) => {
		setSelectedUserScopeId(userScopeId);
		setPrefix("");
		window.localStorage.setItem(LAST_USER_SCOPE_STORAGE_KEY, userScopeId);
	};

	const handleSelectedBucketChange = (bucketName: string) => {
		setSelectedBucket(bucketName);
		setPrefix("");
		window.localStorage.setItem(LAST_PLATFORM_BUCKET_STORAGE_KEY, bucketName);
	};

	const handleRefresh = async () => {
		if (sourceMode === "platform-bucket") {
			await platformObjects.refetch();
			return;
		}
		await artifacts.refetch();
	};

	const handleCreateFolder = async () => {
		if (sourceMode !== "user-scope" || !selectedUserScopeId) return;
		const folderPrefix = promptFolderPrefix(prefix);
		if (!folderPrefix) return;
		try {
			await createUserScopeArtifactFolder(selectedUserScopeId, folderPrefix);
			toast.success("Folder created");
			await artifacts.refetch();
		} catch (error) {
			toast.error("Create folder failed", {
				description: (error as Error).message,
			});
		}
	};

	const handleUpload = async () => {
		if (sourceMode !== "user-scope" || !selectedUserScopeId) return;
		openUploadFileDialog((file) => {
			void (async () => {
				try {
					const bytes = new Uint8Array(await file.arrayBuffer());
					const key = (prefix || "") + file.name;
					await putUserScopeArtifactObject(selectedUserScopeId, {
						key,
						contentBase64: encodeBytesToBase64(bytes),
						contentType: file.type || "application/octet-stream",
					});
					toast.success("Uploaded", { description: key });
					await artifacts.refetch();
				} catch (error) {
					toast.error("Upload failed", {
						description: (error as Error).message,
					});
				}
			})();
		});
	};

	const handlePreviewPlatformObject = async (
		bucket: string,
		key: string,
		maxBytes?: string,
	): Promise<PlatformBucketPreview> =>
		getAdminObjectStoreObject({ bucket, key, maxBytes });

	return (
		<S3Page
			sourceMode={sourceMode}
			onSourceModeChange={handleSourceModeChange}
			userScopeOptions={userScopeOptions}
			selectedUserScopeId={selectedUserScopeId}
			selectedUserScope={selectedUserScope}
			onSelectedUserScopeIdChange={handleSelectedUserScopeIdChange}
			platformBucketOptions={bucketOptions}
			selectedBucket={selectedBucket}
			selectedBucketMeta={selectedBucketMeta}
			onSelectedBucketChange={handleSelectedBucketChange}
			prefix={prefix}
			onPrefixChange={setPrefix}
			userScopesLoading={userScopes.isLoading}
			userScopesError={userScopes.isError}
			platformBucketsLoading={platformBuckets.isLoading}
			platformBucketsError={platformBuckets.isError}
			artifactsLoading={artifacts.isLoading}
			artifactsError={artifacts.isError}
			platformObjectsLoading={platformObjects.isLoading}
			platformObjectsError={platformObjects.isError}
			userObjects={artifacts.data?.items ?? []}
			platformObjects={platformObjects.data?.items ?? []}
			onRefresh={handleRefresh}
			onCreateFolder={handleCreateFolder}
			onUpload={handleUpload}
			onObjectsChanged={handleRefresh}
			onPreviewPlatformObject={handlePreviewPlatformObject}
		/>
	);
}

