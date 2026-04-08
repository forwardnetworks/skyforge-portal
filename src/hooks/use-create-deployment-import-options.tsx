import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	listUserKNEServers,
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
	const userKNEServersQ = useQuery({
		queryKey: queryKeys.userKNEServers(),
		queryFn: listUserKNEServers,
		staleTime: 30_000,
		retry: false,
	});

	const userNetlabOptions = userNetlabServersQ.data?.servers ?? [];
	const userKNEOptions = userKNEServersQ.data?.servers ?? [];
	const byosNetlabEnabled = userNetlabOptions.length > 0;
	const byosKNEEnabled = userKNEOptions.length > 0;

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
	const byosKNEServerRefs = useMemo(
		() =>
			userKNEOptions
				.filter((s) => !!s?.id)
				.map((s) => ({
					value: `user:${s.id}`,
					label: hostLabelFromURL(s.apiUrl) || s.name,
				})),
		[userKNEOptions],
	);
	const byosServerRefs =
		watchKind === "netlab"
			? byosNetlabServerRefs
			: watchKind === "kne"
				? byosKNEServerRefs
				: [];

	return {
		userNetlabServersQ,
		userKNEServersQ,
		byosNetlabEnabled,
		byosKNEEnabled,
		byosNetlabServerRefs,
		byosKNEServerRefs,
		byosServerRefs,
	};
}
