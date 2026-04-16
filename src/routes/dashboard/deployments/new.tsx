import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { getDeploymentLifetimePolicy } from "../../../lib/api-client-admin-deployments";
import { listUserScopes } from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";
import { requireCatalogRouteAccess } from "../../../lib/ui-experience-route";

const deploymentsSearchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/new")({
	validateSearch: (search) => deploymentsSearchSchema.parse(search),
	beforeLoad: async ({ context }) =>
		requireCatalogRouteAccess(context, "/dashboard/deployments/new"),
	loader: async ({ context: { queryClient } }) => {
		await Promise.all([
			queryClient.ensureQueryData({
				queryKey: queryKeys.userScopes(),
				queryFn: listUserScopes,
				staleTime: 30_000,
			}),
			queryClient.ensureQueryData({
				queryKey: queryKeys.deploymentLifetimePolicy(),
				queryFn: getDeploymentLifetimePolicy,
				staleTime: 30_000,
				retry: false,
			}),
		]);
	},
});
