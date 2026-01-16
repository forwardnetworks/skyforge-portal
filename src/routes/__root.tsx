import { createRootRouteWithContext, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, type QueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { buildLoginUrl, getSession, logout } from "../lib/skyforge-api";
import { SideNav } from "../components/side-nav";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound
});

function RootLayout() {
  const location = useRouterState({ select: (s) => s.location });
  const [loggingOut, setLoggingOut] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);

  const session = useQuery({
    queryKey: ["session"],
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

  useEffect(() => {
    const protectedPrefixes = ["/dashboard", "/admin", "/webhooks"];
    if (!protectedPrefixes.some((p) => location.pathname.startsWith(p))) return;
    if (session.isLoading) return;
    if (session.data?.authenticated) return;
    window.location.href = loginHref;
  }, [location.pathname, loginHref, session.data?.authenticated, session.isLoading]);

  const who = session.data?.displayName || session.data?.username || "";
  const isAdmin = !!session.data?.isAdmin;

  return (
    <div className="min-h-full">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Skyforge Automation Platform</div>
            <div className="text-lg font-semibold">Skyforge</div>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <Link to="/dashboard/deployments" className="text-zinc-200 hover:text-white">
              Dashboard
            </Link>
            <Link to="/status" className="text-zinc-200 hover:text-white">
              Status
            </Link>
            <a
              className="text-zinc-200 hover:text-white"
              href="/git/skyforge/skyforge/issues/new"
              target="_blank"
              rel="noreferrer"
            >
              File an issue
            </a>
            <div className="mx-2 hidden h-4 w-px bg-border sm:block" />
            {session.data?.authenticated ? (
              <>
                <span className="text-xs text-muted-foreground">Signed in as</span>
                <span className="text-xs text-foreground">{who}</span>
                <button
                  className="rounded-md border bg-background px-2 py-1 text-xs text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
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
                </button>
              </>
            ) : (
              <a className="rounded-md border bg-background px-2 py-1 text-xs text-foreground hover:bg-accent" href={loginHref}>
                Login
              </a>
            )}
          </nav>
        </div>
      </header>
      <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl">
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
                "absolute -right-3 top-4 flex h-7 w-7 items-center justify-center rounded-full border bg-background text-foreground",
                "hover:bg-accent"
              )}
              onClick={() => setNavCollapsed((v) => !v)}
              aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
            >
              {navCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
        </aside>
        <main className="flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="text-lg font-semibold">Page not found</div>
        <div className="mt-1 text-sm text-zinc-400">
          This route hasn’t been migrated yet (or the URL is incorrect).
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/dashboard/deployments"
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white"
          >
            Go to dashboard
          </Link>
          <Link
            to="/status"
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white"
          >
            Platform status
          </Link>
        </div>
      </div>
    </div>
  );
}
