import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { requireCatalogRouteAccess } from "../../../lib/ui-experience-route";

const searchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute(
	"/dashboard/forward-analytics/$networkRef/capacity",
)({
	validateSearch: (search) => searchSchema.parse(search),
	beforeLoad: async ({ context, params, search }) => {
		await requireCatalogRouteAccess(
			context,
			"/dashboard/forward-analytics/$networkRef/capacity",
		);
		throw redirect({
			to: "/dashboard/forward-analytics/$networkRef/insights",
			params,
			search,
		});
	},
});
