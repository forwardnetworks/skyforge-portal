import type { RootLayoutState } from "@/hooks/use-root-layout";
import type { SkyforgeAuthMode } from "@/lib/skyforge-config";
import { cn } from "@/lib/utils";
import { Outlet } from "@tanstack/react-router";
import {
	Anvil,
	Bell,
	ChevronLeft,
	ChevronRight,
	Menu,
	Search,
	Shield,
} from "lucide-react";
import { CommandMenu } from "./command-menu";
import { GlobalSpinner } from "./global-spinner";
import { ModeToggle } from "./mode-toggle";
import { RootBreadcrumbs } from "./root-breadcrumbs";
import { RootLoginGate } from "./root-login-gate";
import { SideNav } from "./side-nav";
import { ThemeProvider } from "./theme-provider";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Toaster } from "./ui/sonner";

export function RootLayoutShell(props: { page: RootLayoutState }) {
	const { page } = props;

	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<div className="min-h-full">
				<GlobalSpinner />
				<header className="sticky top-0 z-40 border-b glass-header">
					<div className="flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-4 lg:px-6 xl:px-8">
						<div className="flex items-center gap-6">
							<div className="flex items-center gap-4">
								<Sheet
									open={page.mobileMenuOpen}
									onOpenChange={page.setMobileMenuOpen}
								>
									<SheetTrigger asChild>
										<Button variant="ghost" size="icon" className="lg:hidden">
											<Menu className="h-5 w-5" />
											<span className="sr-only">Toggle menu</span>
										</Button>
									</SheetTrigger>
									<SheetContent side="left" className="w-[240px] p-0">
										<div className="px-2 py-6">
											<SideNav
												collapsed={false}
												session={page.session.data}
												isAdmin={page.isAdmin}
												features={page.uiConfig.data?.features}
												authMode={page.authMode as SkyforgeAuthMode | null}
											/>
										</div>
									</SheetContent>
								</Sheet>
								<div>
									<div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
										{page.productSubtitle}
									</div>
									<div className="flex items-center gap-2 text-base font-semibold tracking-tight">
										<Anvil className="h-5 w-5 text-primary" />
										<span>{page.productName}</span>
									</div>
								</div>
								<div className="h-8 w-px bg-border hidden md:block" />
								<img
									src="/assets/skyforge/FN-logo.svg"
									alt="Forward Analytics"
									className="h-6 w-auto hidden sm:block"
								/>
							</div>

							<Button
								variant="outline"
								className="hidden md:flex h-9 w-64 items-center justify-start px-3 text-sm text-muted-foreground font-normal"
								onClick={page.triggerCommandMenu}
							>
								<Search className="mr-2 h-4 w-4" />
								<span>Search...</span>
								<kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
									<span className="text-xs">⌘</span>K
								</kbd>
							</Button>
						</div>

						<nav className="flex items-center gap-4 text-sm">
							<Button
								variant="ghost"
								size="icon"
								className="relative text-muted-foreground hover:text-foreground"
								aria-label="Notifications"
								onClick={() => void page.navigate({ to: "/notifications" })}
							>
								<Bell className="h-4 w-4" />
								{page.unreadCount > 0 ? (
									<span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
										{page.unreadCount > 99 ? "99+" : page.unreadCount}
									</span>
								) : null}
							</Button>
							<ModeToggle />
							{page.session.data?.authenticated ? (
								<div className="flex items-center gap-3">
									{page.sessionExpiryWarning ? (
										<span
											className="hidden sm:inline-flex items-center rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-medium text-amber-700 dark:text-amber-100"
											title={`Session expires at ${new Date(page.sessionExpiryWarning.expiresAt).toLocaleTimeString()}`}
										>
											Session expires in{" "}
											{page.sessionExpiryWarning.minutesRemaining}m
										</span>
									) : null}
									<div className="hidden md:flex flex-col items-end">
										<span className="text-[10px] text-muted-foreground uppercase leading-none">
											Signed in as
										</span>
										<span className="text-xs font-medium leading-none mt-1">
											{page.who}
										</span>
									</div>
									<Button
										variant="outline"
										size="sm"
										disabled={page.loggingOut}
										onClick={() => void page.handleLogout()}
									>
										{page.loggingOut ? "…" : "Logout"}
									</Button>
								</div>
							) : (
								<Button
									variant="outline"
									size="sm"
									disabled={
										page.loggingIn ||
										page.uiConfig.isLoading ||
										(!page.authModeReady && !page.uiConfig.isError)
									}
									onClick={() => void page.startLogin()}
								>
									{page.uiConfig.isLoading ||
									(!page.authModeReady && !page.uiConfig.isError)
										? "Loading…"
										: page.loggingIn
											? "…"
											: "Login"}
								</Button>
							)}
						</nav>
					</div>
				</header>
				{page.session.data?.authenticated && page.isImpersonating ? (
					<div className="border-b border-amber-500/40 bg-amber-500/10">
						<div className="flex w-full items-center justify-between gap-3 px-3 py-2 text-xs sm:px-4 lg:px-6 xl:px-8">
							<div className="flex items-center gap-2">
								<Shield className="h-4 w-4 text-amber-400" />
								<span className="font-medium text-amber-100">
									Impersonation active
								</span>
								<span className="text-amber-100/90">
									{page.actorUsername || "actor"} as{" "}
									{page.effectiveUsername || "user"}
								</span>
							</div>
							<Button
								size="sm"
								variant="outline"
								className="h-7 border-amber-400/50 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
								disabled={page.stopImpersonation.isPending}
								onClick={() => page.stopImpersonation.mutate()}
							>
								{page.stopImpersonation.isPending
									? "Stopping…"
									: "Stop impersonation"}
							</Button>
						</div>
					</div>
				) : null}
				<div className="flex min-h-[calc(100vh-4rem)] w-full">
					{page.session.data?.authenticated ? (
						<aside
							className={cn(
								"hidden lg:block border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
								"transition-all duration-300 ease-in-out",
								page.navCollapsed ? "w-[56px]" : "w-[224px]",
							)}
						>
							<div className="relative h-full">
								<div
									className={cn(
										"h-full px-4 py-4",
										page.navCollapsed && "px-2",
									)}
								>
									<SideNav
										collapsed={page.navCollapsed}
										session={page.session.data}
										isAdmin={page.isAdmin}
										features={page.uiConfig.data?.features}
										authMode={page.authMode as SkyforgeAuthMode | null}
									/>
								</div>
								<button
									className={cn(
										"absolute -right-3 top-4 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-foreground shadow-sm",
										"hover:bg-accent hover:text-accent-foreground transition-colors",
									)}
									onClick={() => page.setNavCollapsed((value) => !value)}
									aria-label={
										page.navCollapsed
											? "Expand navigation"
											: "Collapse navigation"
									}
								>
									{page.navCollapsed ? (
										<ChevronRight className="h-4 w-4" />
									) : (
										<ChevronLeft className="h-4 w-4" />
									)}
								</button>
							</div>
						</aside>
					) : null}
					<main
						className={cn(
							"flex-1 w-full overflow-hidden flex flex-col",
							page.isFullBleedRoute
								? "px-0 py-0"
								: "px-3 py-4 sm:px-4 sm:py-6 lg:px-6 xl:px-8 2xl:px-10",
						)}
					>
						{page.showLoginGate ? (
							<RootLoginGate page={page} />
						) : (
							<>
								{!page.isFullBleedRoute ? (
									<RootBreadcrumbs segments={page.breadcrumbSegments} />
								) : null}
								<Outlet />
								{!page.isFullBleedRoute ? (
									<footer className="mt-auto pt-12 pb-6 flex items-center justify-between text-xs text-muted-foreground border-t">
										<div className="flex gap-4">
											<span>
												Questions? Reach out at{" "}
												<span className="font-mono text-primary">
													#ask-skyforge
												</span>
											</span>
										</div>
										<a
											className="hover:text-foreground transition-colors underline hover:no-underline"
											href="/api/gitea/public?next=/skyforge/skyforge/issues/new"
											target="_blank"
											rel="noreferrer"
										>
											File an issue
										</a>
									</footer>
								) : null}
							</>
						)}
					</main>
				</div>
				<CommandMenu />
				<Toaster />
			</div>
		</ThemeProvider>
	);
}
