import type { QueryClient } from "@tanstack/react-query";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { createRootRouteWithContext } from "@tanstack/react-router";
import { RootErrorContent } from "../components/root-error-content";
import { RootLayoutShell } from "../components/root-layout-shell";
import { RootNotFound } from "../components/root-not-found";
import { useRootLayout } from "../hooks/use-root-layout";

export type RouterContext = {
	queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
	errorComponent: RootError,
	notFoundComponent: RootNotFound,
});

function RootLayout() {
	const page = useRootLayout();
	return <RootLayoutShell page={page} />;
}

function RootError(props: ErrorComponentProps) {
	return <RootErrorContent {...props} />;
}
