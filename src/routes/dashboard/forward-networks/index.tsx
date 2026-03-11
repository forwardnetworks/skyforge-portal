import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ForwardNetworksPageContent } from "../../../components/forward-networks-page-content";
import { useForwardNetworksPage } from "../../../hooks/use-forward-networks-page";
import { listUserScopes } from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/forward-networks/")({
	validateSearch: (search) => searchSchema.parse(search),
	loaderDeps: ({ search: { userId } }) => ({ userId }),
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData({
			queryKey: queryKeys.userScopes(),
			queryFn: listUserScopes,
			staleTime: 30_000,
		});
	},
	component: ForwardNetworksPage,
});

function ForwardNetworksPage() {
	const { userId } = Route.useSearch();
	const page = useForwardNetworksPage({ userId });
	return <ForwardNetworksPageContent page={page} />;
}
