import { createRootRouteWithContext, Link, Outlet, useRouterState, type ErrorComponentProps } from "@tanstack/react-router";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { buildLoginUrl, getSession, logout } from "../lib/skyforge-api";
import { loginWithPopup } from "../lib/auth-popup";
import { SideNav } from "../components/side-nav";
import { CommandMenu } from "../components/command-menu";
import { ChevronLeft, ChevronRight, Search, Menu, Bell } from "lucide-react";
import { cn } from "../lib/utils";
import { queryKeys } from "../lib/query-keys";
import { Toaster } from "../components/ui/sonner";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ThemeProvider } from "../components/theme-provider";
import { ModeToggle } from "../components/mode-toggle";
import { Sheet, SheetContent, SheetTrigger } from "../components/ui/sheet";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { GlobalSpinner } from "../components/global-spinner";

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  errorComponent: RootError,
  notFoundComponent: NotFound
});

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location });
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const session = useQuery({
    queryKey: queryKeys.session(),
    queryFn: getSession,
    retry: false,
    staleTime: 30_000
  });

  const next = useMemo(() => `${location.pathname}${location.searchStr ?? ""}${location.hash ?? ""}`, [
    location.pathname,
    location.searchStr,
    location.hash
  ]);
  const loginHref = useMemo(() => buildLoginUrl(next), [next]);

  const isProtectedRoute = useMemo(() => {
    const protectedPrefixes = ["/dashboard", "/admin", "/webhooks", "/syslog", "/snmp", "/notifications"];
    return protectedPrefixes.some((p) => location.pathname.startsWith(p));
  }, [location.pathname]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const who = session.data?.displayName || session.data?.username || "";
  const isAdmin = !!session.data?.isAdmin;
  const showLoginGate = isProtectedRoute && !session.isLoading && !session.data?.authenticated;

    return (
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <div className="min-h-full">
              <GlobalSpinner />
                              <header 
                                className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                                style={{
                                  backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.8), rgba(0,0,0,0.4)), url('/header-background.png')",
                                  backgroundSize: "cover",
                                  backgroundPosition: "left 35%",
                                  height: "120px"
                                }}
                              >
                                <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] p-0">
                  <div className="px-2 py-6">
                    <SideNav collapsed={false} isAdmin={isAdmin} />
                  </div>
                </SheetContent>
              </Sheet>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">Technical Services</div>
                <div className="text-lg font-bold tracking-tight">Skyforge</div>
              </div>
              <div className="h-8 w-px bg-border hidden md:block" />
              <img src="/FN-logo.svg" alt="Forward Networks" className="h-6 w-auto hidden sm:block" />
            </div>
            
            <Button
              variant="outline"
              className="hidden md:flex h-9 w-64 items-center justify-start px-3 text-sm text-muted-foreground font-normal"
              onClick={() => {
                const event = new KeyboardEvent("keydown", {
                  key: "k",
                  metaKey: true,
                  bubbles: true
                });
                document.dispatchEvent(event);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Search...</span>
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          <nav className="flex items-center gap-4 text-sm">
            <Link to="/dashboard/deployments" className="hidden sm:inline-block text-muted-foreground hover:text-foreground transition-colors">
              Deployments
            </Link>
            <Link to="/status" className="hidden sm:inline-block text-muted-foreground hover:text-foreground transition-colors">
              Status
            </Link>
            <a
              className="hidden sm:inline-block text-muted-foreground hover:text-foreground transition-colors"
              href="/git/skyforge/skyforge/issues/new"
              target="_blank"
              rel="noreferrer"
            >
              File an issue
            </a>
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
            <ModeToggle />
            {session.data?.authenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex flex-col items-end">
                  <span className="text-[10px] text-muted-foreground uppercase leading-none">Signed in as</span>
                  <span className="text-xs font-medium leading-none mt-1">{who}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loggingOut}
                  onClick={async () => {
                    try {
                      setLoggingOut(true);
                      await logout();
                      window.location.href = "/status?signin=1";
                    } finally {
                      setLoggingOut(false);
                    }
                  }}
                >
                  {loggingOut ? "…" : "Logout"}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                disabled={loggingIn}
                onClick={async () => {
                  try {
                    setLoggingIn(true);
                    const ok = await loginWithPopup({ loginHref });
                    if (!ok) {
                      window.location.href = loginHref;
                      return;
                    }
                    await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
                  } finally {
                    setLoggingIn(false);
                  }
                }}
              >
                {loggingIn ? "…" : "Login"}
              </Button>
            )}
          </nav>
        </div>
      </header>
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl">
        {session.data?.authenticated && (
          <aside
            className={cn(
              "hidden lg:block border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
              "transition-all duration-300 ease-in-out",
              navCollapsed ? "w-[64px]" : "w-[220px]"
            )}
          >
            <div className="relative h-full">
              <div className={cn("h-full px-4 py-4", navCollapsed && "px-2")}>
                <SideNav collapsed={navCollapsed} isAdmin={isAdmin} />
              </div>
              <button
                className={cn(
                  "absolute -right-3 top-4 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-foreground shadow-sm",
                  "hover:bg-accent hover:text-accent-foreground transition-colors"
                )}
                onClick={() => setNavCollapsed((v) => !v)}
                aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
              >
                {navCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>
          </aside>
        )}
        <main className="flex-1 px-4 py-6 w-full overflow-hidden">
          {showLoginGate ? (
            <div className="mx-auto max-w-xl">
              <Card>
                <CardHeader>
                  <CardTitle>Login Required</CardTitle>
                  <CardDescription>Sign in to access this page.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Button
                    variant="default"
                    disabled={loggingIn}
                    onClick={async () => {
                      try {
                        setLoggingIn(true);
                        const ok = await loginWithPopup({ loginHref });
                        if (!ok) {
                          window.location.href = loginHref;
                          return;
                        }
                        await queryClient.invalidateQueries({ queryKey: queryKeys.session() });
                      } finally {
                        setLoggingIn(false);
                      }
                    }}
                  >
                    {loggingIn ? "…" : "Login"}
                  </Button>
                  <a className="text-sm text-muted-foreground underline" href={loginHref}>
                    Login with redirect instead
                  </a>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
                        <div className="mb-6">
                          <Breadcrumb>
                            <BreadcrumbList>
                              <BreadcrumbItem>
                                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                              </BreadcrumbItem>                    {location.pathname.split("/").filter(Boolean).map((segment, index, array) => {
                      const path = `/${array.slice(0, index + 1).join("/")}`;
                      const isLast = index === array.length - 1;
                      return (
                        <React.Fragment key={path}>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage className="capitalize">{segment}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink href={path} className="capitalize">
                                {segment}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </React.Fragment>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <Outlet />
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

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
      <Card variant="glass" className="max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Page not found</CardTitle>
          <CardDescription>
            This route hasn’t been migrated yet (or the URL is incorrect).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap justify-center gap-3">
          <Button variant="default" asChild>
            <Link to="/dashboard/deployments">Go to deployments</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/status">Platform status</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RootError(props: ErrorComponentProps) {
  const message =
    props.error instanceof Error ? props.error.message : typeof props.error === "string" ? props.error : "Unknown error";

  return (
    <div className="space-y-6">
      <Card variant="danger">
        <CardHeader>
          <CardTitle>Application error</CardTitle>
          <CardDescription className="text-red-200/80">{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-100"
            onClick={() => props.reset()}
          >
            Try again
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/dashboard/deployments">Go to deployments</Link>
          </Button>
        </CardContent>
      </Card>
      
      {props.error instanceof Error && props.error.stack && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Error Stack Trace</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto whitespace-pre-wrap text-xs text-muted-foreground p-4 rounded-md bg-muted">
              {props.error.stack}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
