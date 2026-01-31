import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/$slug")({
	beforeLoad: ({ params }) => {
		const raw = String(params.slug ?? "");
		const slug = raw.endsWith(".html") ? raw.slice(0, -".html".length) : raw;
		throw redirect({ to: "/dashboard/docs/$slug", params: { slug } });
	},
});
