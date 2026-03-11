import {
	openUploadFileDialog,
	promptFolderPrefix,
} from "@/components/s3/s3-object-dialogs";
import { S3Page } from "@/components/s3/s3-page";
import {
	createUserScopeArtifactFolder,
	listUserScopeArtifacts,
	listUserScopes,
	putUserScopeArtifactObject,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const LAST_USER_SCOPE_STORAGE_KEY = "skyforge.lastUserScopeId.s3";

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
	const userScopes = useQuery({
		queryKey: queryKeys.userScopes(),
		queryFn: listUserScopes,
		staleTime: 30_000,
	});

	const userScopeOptions = userScopes.data ?? [];
	const [selectedUserScopeId, setSelectedUserScopeId] = useState("");
	const [prefix, setPrefix] = useState("");

	useEffect(() => {
		if (userScopeOptions.length === 0) return;
		const stored =
			window.localStorage.getItem(LAST_USER_SCOPE_STORAGE_KEY) ?? "";
		const initial = userScopeOptions.some((scope) => scope.id === stored)
			? stored
			: (userScopeOptions[0]?.id ?? "");
		setSelectedUserScopeId((previous) => previous || initial);
	}, [userScopeOptions]);

	const artifacts = useQuery({
		queryKey: queryKeys.userArtifacts(selectedUserScopeId),
		queryFn: async () =>
			listUserScopeArtifacts(selectedUserScopeId, {
				prefix: prefix || undefined,
			}),
		staleTime: 10_000,
		enabled: !!selectedUserScopeId,
	});

	const objects = artifacts.data?.items ?? [];

	const handleSelectedUserScopeIdChange = (userScopeId: string) => {
		setSelectedUserScopeId(userScopeId);
		window.localStorage.setItem(LAST_USER_SCOPE_STORAGE_KEY, userScopeId);
	};

	const handleRefresh = async () => {
		await artifacts.refetch();
	};

	const handleCreateFolder = async () => {
		if (!selectedUserScopeId) return;
		const folderPrefix = promptFolderPrefix();
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
		if (!selectedUserScopeId) return;
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

	return (
		<S3Page
			userScopeOptions={userScopeOptions}
			selectedUserScopeId={selectedUserScopeId}
			onSelectedUserScopeIdChange={handleSelectedUserScopeIdChange}
			prefix={prefix}
			onPrefixChange={setPrefix}
			userScopesLoading={userScopes.isLoading}
			userScopesError={userScopes.isError}
			artifactsLoading={artifacts.isLoading}
			artifactsError={artifacts.isError}
			objects={objects}
			onRefresh={handleRefresh}
			onCreateFolder={handleCreateFolder}
			onUpload={handleUpload}
			onObjectsChanged={handleRefresh}
		/>
	);
}
