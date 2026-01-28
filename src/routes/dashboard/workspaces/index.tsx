import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/workspaces/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard/deployments" });
  },
});

