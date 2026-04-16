import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { listUserScopes } from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";

const deploymentsSearchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/")({
	validateSearch: (search) => deploymentsSearchSchema.parse(search),
	loaderDeps: ({ search: { userId } }) => ({ userId }),
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.userScopes(),
			queryFn: listUserScopes,
			staleTime: 30_000,
		});
	},
});
