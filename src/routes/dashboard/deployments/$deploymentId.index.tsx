import { getDeploymentInfoById } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/deployments/$deploymentId/")({
	validateSearch: (search: Record<string, unknown>) => {
		const out: { action?: string; node?: string; tab?: string } = {};
		if (typeof search.action === "string" && search.action.trim())
			out.action = search.action.trim();
		if (typeof search.node === "string" && search.node.trim())
			out.node = search.node.trim();
		if (typeof search.tab === "string" && search.tab.trim())
			out.tab = search.tab.trim();
		return out;
	},
	loader: async ({ context: { queryClient }, params: { deploymentId } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.deploymentDetail(deploymentId),
			queryFn: () => getDeploymentInfoById(deploymentId),
			retry: false,
			staleTime: 30_000,
		});
	},
});
