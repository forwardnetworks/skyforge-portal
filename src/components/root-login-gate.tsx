import type { RootLayoutState } from "@/hooks/use-root-layout";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

export function RootLoginGate(props: {
	page: Pick<
		RootLayoutState,
		| "loggingIn"
		| "uiConfig"
		| "authModeReady"
		| "startLogin"
		| "breakGlassEnabled"
		| "authMode"
		| "localLoginHref"
		| "breakGlassLabel"
		| "loginHref"
	>;
}) {
	const { page } = props;
	return (
		<div className="w-full">
			<div className="mx-auto w-full max-w-7xl px-0 sm:px-2 lg:px-4">
				<div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
					<Card className="border-border/70">
						<CardHeader>
							<CardTitle className="text-2xl">Dashboard Access Requires Login</CardTitle>
							<CardDescription>
								Authenticate to access deployments, platform operations, and tenant-scoped
								Forward workflows.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-wrap gap-3">
							<Button
								variant="default"
								disabled={
									page.loggingIn ||
									page.uiConfig.isLoading ||
									(!page.authModeReady && !page.uiConfig.isError)
								}
								onClick={() => void page.startLogin()}
							>
								{page.uiConfig.isLoading ||
								(!page.authModeReady && !page.uiConfig.isError)
									? "Loading login…"
									: page.loggingIn
										? "…"
										: "Login"}
							</Button>
							<a
								className="text-sm text-muted-foreground underline underline-offset-2"
								href={page.loginHref}
							>
								Login with redirect instead
							</a>
						</CardContent>
					</Card>

					<Card className="border-border/70">
						<CardHeader>
							<CardTitle>Access Path</CardTitle>
							<CardDescription>
								Primary auth is managed centrally. Break-glass local auth is optional.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
								Use your primary identity provider to enter Skyforge.
							</div>
							{page.breakGlassEnabled && page.authMode === "oidc" ? (
								<a
									className="inline-flex text-sm text-muted-foreground underline underline-offset-2"
									href={page.localLoginHref}
								>
									{page.breakGlassLabel}
								</a>
							) : null}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
