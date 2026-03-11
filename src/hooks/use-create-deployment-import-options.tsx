import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
	listUserContainerlabServers,
	listUserEveServers,
	listUserNetlabServers,
	listUserScopeEveLabs,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	type DeploymentKind,
	hostLabelFromURL,
} from "./create-deployment-shared";

export function useCreateDeploymentImportOptions(args: {
	watchUserScopeId: string;
	watchKind: DeploymentKind;
	importOpen: boolean;
	importServer: string;
	setImportServer: (value: string) => void;
	setImportLabPath: (value: string) => void;
	importCreateContainerlab: boolean;
	importContainerlabServer: string;
	setImportContainerlabServer: (value: string) => void;
}) {
	const {
		watchUserScopeId,
		watchKind,
		importOpen,
		importServer,
		setImportServer,
		setImportLabPath,
		importCreateContainerlab,
		importContainerlabServer,
		setImportContainerlabServer,
	} = args;

	const userNetlabServersQ = useQuery({
		queryKey: queryKeys.userNetlabServers(),
		queryFn: listUserNetlabServers,
		staleTime: 30_000,
		retry: false,
	});
	const userContainerlabServersQ = useQuery({
		queryKey: queryKeys.userContainerlabServers(),
		queryFn: listUserContainerlabServers,
		staleTime: 30_000,
		retry: false,
	});
	const userEveServersQ = useQuery({
		queryKey: queryKeys.userEveServers(),
		queryFn: listUserEveServers,
		staleTime: 30_000,
		retry: false,
	});
	const eveLabsQ = useQuery({
		queryKey: queryKeys.userEveLabs(watchUserScopeId, importServer, "", true),
		queryFn: () =>
			listUserScopeEveLabs(watchUserScopeId, {
				server: importServer,
				recursive: true,
			}),
		enabled: Boolean(importOpen && watchUserScopeId && importServer),
		staleTime: 30_000,
		retry: false,
	});

	const userNetlabOptions = userNetlabServersQ.data?.servers ?? [];
	const userContainerlabOptions = userContainerlabServersQ.data?.servers ?? [];
	const eveOptions = userEveServersQ.data?.servers ?? [];
	const byosNetlabEnabled = userNetlabOptions.length > 0;
	const byosContainerlabEnabled = userContainerlabOptions.length > 0;
	const byosEveEnabled = eveOptions.length > 0;

	useEffect(() => {
		if (!importOpen) return;
		if (!importServer && eveOptions.length > 0) {
			setImportServer(`user:${eveOptions[0].id}`);
		}
	}, [importOpen, importServer, eveOptions, setImportServer]);

	useEffect(() => {
		if (!importOpen) return;
		setImportLabPath("");
	}, [importOpen, importServer, setImportLabPath]);

	useEffect(() => {
		if (!importOpen || !importCreateContainerlab) return;
		if (!importContainerlabServer && userContainerlabOptions.length > 0) {
			setImportContainerlabServer(`user:${userContainerlabOptions[0].id}`);
		}
	}, [
		importOpen,
		importCreateContainerlab,
		importContainerlabServer,
		userContainerlabOptions,
		setImportContainerlabServer,
	]);

	const byosNetlabServerRefs = useMemo(
		() =>
			userNetlabOptions
				.filter((s) => !!s?.id)
				.map((s) => ({
					value: `user:${s.id}`,
					label: hostLabelFromURL(s.apiUrl) || s.name,
				})),
		[userNetlabOptions],
	);
	const byosContainerlabServerRefs = useMemo(
		() =>
			userContainerlabOptions
				.filter((s) => !!s?.id)
				.map((s) => ({
					value: `user:${s.id}`,
					label: hostLabelFromURL(s.apiUrl) || s.name,
				})),
		[userContainerlabOptions],
	);
	const eveLabOptions = useMemo(() => {
		const labs = eveLabsQ.data?.labs ?? [];
		return labs
			.map((lab) => ({
				value: lab.path,
				label: lab.folder ? `${lab.folder}/${lab.name}` : lab.name,
			}))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [eveLabsQ.data?.labs]);
	const byosServerRefs =
		watchKind === "netlab"
			? byosNetlabServerRefs
			: watchKind === "containerlab"
				? byosContainerlabServerRefs
				: [];

	return {
		userNetlabServersQ,
		userContainerlabServersQ,
		userEveServersQ,
		eveLabsQ,
		eveOptions,
		byosNetlabEnabled,
		byosContainerlabEnabled,
		byosEveEnabled,
		byosNetlabServerRefs,
		byosContainerlabServerRefs,
		eveLabOptions,
		byosServerRefs,
	};
}
