import type { DeploymentsPageState } from "../../hooks/use-deployments-page";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export function DeploymentsPageLoadingState({
	state,
}: {
	state: Pick<DeploymentsPageState, "handleLogin" | "loginHref">;
}) {
	return (
		<Card className="border-dashed">
			<CardContent className="pt-6">
				<div className="flex flex-col items-center justify-center space-y-4 py-8">
					<Skeleton className="h-4 w-64" />
					<div className="text-center text-muted-foreground">
						Loading dashboard…
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
