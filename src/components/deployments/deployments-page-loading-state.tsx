import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function DeploymentsPageLoadingState({
	state,
}: {
	state: Pick<
		DeploymentsPageState,
		"handleLogin" | "isPageLoading" | "loadErrorMessage" | "loginHref"
	>;
}) {
	if (!state.isPageLoading && state.loadErrorMessage) {
		return (
			<Card className="border-dashed border-destructive/40">
				<CardContent className="pt-6">
					<div className="flex flex-col items-center justify-center space-y-3 py-8 text-center">
						<div className="text-sm font-medium">Could not load deployments.</div>
						<div className="max-w-xl text-sm text-muted-foreground">
							{state.loadErrorMessage}
						</div>
						<div className="text-xs text-muted-foreground">
							If you are logged out,{" "}
							<a
								className="text-primary underline hover:no-underline"
								href={state.loginHref}
								onClick={(event) => {
									event.preventDefault();
									void state.handleLogin();
								}}
							>
								login
							</a>
							.
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="border-dashed">
			<CardContent className="pt-6">
				<div className="flex flex-col items-center justify-center space-y-4 py-8">
					<Skeleton className="h-4 w-64" />
					<div className="text-center text-muted-foreground">
						Loading deployments…
						<div className="mt-2 text-xs">
							If you are logged out,{" "}
							<a
								className="text-primary underline hover:no-underline"
								href={state.loginHref}
								onClick={(event) => {
									event.preventDefault();
									void state.handleLogin();
								}}
							>
								login
							</a>
							.
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
