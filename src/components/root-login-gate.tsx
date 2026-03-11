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
		<div className="mx-auto max-w-xl">
			<Card>
				<CardHeader>
					<CardTitle>Login Required</CardTitle>
					<CardDescription>Sign in to access this page.</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
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
					{page.breakGlassEnabled && page.authMode === "oidc" ? (
						<a
							className="text-sm text-muted-foreground underline"
							href={page.localLoginHref}
						>
							{page.breakGlassLabel}
						</a>
					) : null}
					<a
						className="text-sm text-muted-foreground underline"
						href={page.loginHref}
					>
						Login with redirect instead
					</a>
				</CardContent>
			</Card>
		</div>
	);
}
