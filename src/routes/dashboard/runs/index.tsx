import { getRecentRuns } from "../../../lib/api-client";
import { createFileRoute } from "@tanstack/react-router";
import { queryKeys } from "../../../lib/query-keys";

export const Route = createFileRoute("/dashboard/runs/")({
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.recentRuns(50),
			queryFn: () => getRecentRuns(50),
			retry: false,
			staleTime: 60_000,
		});
	},
});
