import { getDeploymentInfoById, getRunDetail } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/runs/$runId")({
	loader: async ({ context: { queryClient }, params: { runId } }) => {
		const run = await queryClient.ensureQueryData({
			queryKey: queryKeys.runDetail(runId),
			queryFn: () => getRunDetail(runId),
			retry: false,
			staleTime: 30_000,
		});
		const deploymentId = String(run.task?.deploymentId ?? "").trim();
		if (!deploymentId) return;
		await queryClient.ensureQueryData({
			queryKey: queryKeys.deploymentDetail(deploymentId),
			queryFn: () => getDeploymentInfoById(deploymentId),
			retry: false,
			staleTime: 30_000,
		});
	},
});
