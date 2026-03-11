import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { DeploymentsPageContent } from "../../../components/deployments/deployments-page-content";
import { useDeploymentsPage } from "../../../hooks/use-deployments-page";
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
	component: DeploymentsPage,
});

function DeploymentsPage() {
	const { userId } = Route.useSearch();
	const state = useDeploymentsPage(userId);
	return <DeploymentsPageContent state={state} />;
}
