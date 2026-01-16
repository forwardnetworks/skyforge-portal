import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex
});

function DashboardIndex() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/dashboard/deployments", replace: true });
  }, [navigate]);
  return null;
}
