import { DesignSystemPage } from "@/components/design-system-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/design")({
	component: DesignSystemPage,
});
