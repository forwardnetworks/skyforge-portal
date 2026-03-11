import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
	type ListUserForwardCollectorConfigsResponse,
	type UserForwardCollectorConfigSummary,
	type UserVariableGroup,
	listUserForwardCollectorConfigs,
	listUserVariableGroups,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import type { DeploymentKind } from "./create-deployment-shared";

const collectorKinds: DeploymentKind[] = [
	"c9s_netlab",
	"c9s_containerlab",
	"terraform",
];

function isSelectableCollector(
	collector: UserForwardCollectorConfigSummary | undefined,
): collector is UserForwardCollectorConfigSummary {
	return Boolean(
		collector &&
			typeof collector.id === "string" &&
			typeof collector.name === "string" &&
			!collector.decryptionFailed,
	);
}

export function useCreateDeploymentTemplateCatalogCollectors(args: {
	defaultForwardCollectorConfigId?: string;
	setValue: (name: "forwardCollectorId", value: string) => void;
	watchForwardCollectorId?: string;
	watchKind: DeploymentKind;
}) {
	const {
		defaultForwardCollectorConfigId,
		setValue,
		watchForwardCollectorId,
		watchKind,
	} = args;

	const variableGroupsQ = useQuery({
		queryKey: queryKeys.userVariableGroups(),
		queryFn: listUserVariableGroups,
		staleTime: 30_000,
	});
	const variableGroups = (variableGroupsQ.data?.groups ??
		[]) as UserVariableGroup[];

	const forwardCollectorsQ = useQuery<ListUserForwardCollectorConfigsResponse>({
		queryKey: queryKeys.userForwardCollectorConfigs(),
		queryFn: listUserForwardCollectorConfigs,
		enabled: collectorKinds.includes(watchKind),
		staleTime: 30_000,
		retry: false,
	});
	const selectableCollectors = useMemo(
		() =>
			(forwardCollectorsQ.data?.collectors ?? []).filter(isSelectableCollector),
		[forwardCollectorsQ.data?.collectors],
	);

	useEffect(() => {
		if (!collectorKinds.includes(watchKind)) {
			if ((watchForwardCollectorId ?? "none") !== "none") {
				setValue("forwardCollectorId", "none");
			}
			return;
		}
		if ((watchForwardCollectorId ?? "none") !== "none") return;
		const preferred = String(defaultForwardCollectorConfigId ?? "").trim();
		const defaultCollector =
			(preferred
				? selectableCollectors.find((collector) => collector.id === preferred)
				: null) ??
			selectableCollectors.find((collector) => collector.isDefault) ??
			selectableCollectors[0];
		if (defaultCollector?.id) {
			setValue("forwardCollectorId", String(defaultCollector.id));
		}
	}, [
		defaultForwardCollectorConfigId,
		selectableCollectors,
		setValue,
		watchForwardCollectorId,
		watchKind,
	]);

	return {
		forwardCollectorsQ,
		selectableCollectors,
		variableGroups,
	};
}
