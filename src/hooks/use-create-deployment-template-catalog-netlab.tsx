import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	type UserScopeNetlabDeviceOptionsResponse,
	getUserScopeNetlabDeviceOptions,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { fallbackNetlabDeviceOptions } from "./create-deployment-template-catalog-shared";

export function useCreateDeploymentTemplateCatalogNetlab(args: {
	scopeId: string;
}) {
	const { scopeId } = args;

	const netlabDeviceOptionsQ = useQuery<UserScopeNetlabDeviceOptionsResponse>({
		queryKey: queryKeys.userNetlabDeviceOptions(scopeId),
		queryFn: () => getUserScopeNetlabDeviceOptions(scopeId),
		enabled: Boolean(scopeId),
		staleTime: 5 * 60_000,
		retry: false,
	});

	const netlabDeviceOptions = useMemo(() => {
		const options = (netlabDeviceOptionsQ.data?.devices ?? [])
			.map((device) =>
				String(device ?? "")
					.trim()
					.toLowerCase(),
			)
			.filter(Boolean);
		const unique = Array.from(new Set(options)).sort((a, b) =>
			a.localeCompare(b),
		);
		return unique.length > 0 ? unique : fallbackNetlabDeviceOptions;
	}, [netlabDeviceOptionsQ.data?.devices]);

	return {
		netlabDeviceOptions,
		netlabDeviceOptionsQ,
	};
}
