import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	listUserContainerlabServers,
	listUserNetlabServers,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import {
	type DeploymentKind,
	hostLabelFromURL,
} from "./create-deployment-shared";

export function useCreateDeploymentImportOptions(args: {
	watchKind: DeploymentKind;
}) {
	const { watchKind } = args;

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

	const userNetlabOptions = userNetlabServersQ.data?.servers ?? [];
	const userContainerlabOptions = userContainerlabServersQ.data?.servers ?? [];
	const byosNetlabEnabled = userNetlabOptions.length > 0;
	const byosContainerlabEnabled = userContainerlabOptions.length > 0;

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
	const byosServerRefs =
		watchKind === "netlab"
			? byosNetlabServerRefs
			: watchKind === "containerlab"
				? byosContainerlabServerRefs
				: [];

	return {
		userNetlabServersQ,
		userContainerlabServersQ,
		byosNetlabEnabled,
		byosContainerlabEnabled,
		byosNetlabServerRefs,
		byosContainerlabServerRefs,
		byosServerRefs,
	};
}
