import {
  BookOpen,
  Bell,
  Cloud,
  FolderKanban,
  GitBranch,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Network,
  PanelTop,
  Server,
  Settings,
  ShieldCheck,
  Webhook
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "../lib/utils";
import { SKYFORGE_API } from "../lib/skyforge-api";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  external?: boolean;
  adminOnly?: boolean;
};

const items: NavItem[] = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "Dashboard", href: "/dashboard/deployments", icon: FolderKanban },
  { label: "S3", href: "/dashboard/s3", icon: Server },
  { label: "NetBox", href: "/netbox/", icon: Network, external: true },
  { label: "Nautobot", href: "/nautobot/", icon: Network, external: true },
  { label: "PKI", href: "/dashboard/pki", icon: KeyRound },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Webhooks", href: "/webhooks", icon: Webhook },
  { label: "Syslog", href: "/syslog", icon: Inbox },
  { label: "SNMP", href: "/snmp", icon: ShieldCheck },
  { label: "Git", href: "/git/", icon: GitBranch, external: true },
  { label: "DNS", href: `${SKYFORGE_API}/dns/sso?next=/dns/`, icon: Network, external: true },
  { label: "Coder", href: "/coder", icon: Cloud, external: true },
  { label: "API Testing", href: `${SKYFORGE_API}/yaade/sso`, icon: PanelTop, external: true },
  { label: "Docs", href: "/docs/", icon: BookOpen, external: true },
  { label: "Settings", href: "/admin/settings", icon: Settings, adminOnly: true },
  { label: "Governance", href: "/admin/governance", icon: ShieldCheck, adminOnly: true }
];

export function SideNav(props: { collapsed?: boolean; isAdmin?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const openExternal = (href: string) => {
    const win = window.open(href, "_blank", "noreferrer");
    if (!win) {
      window.location.href = href;
    }
  };

  const isActiveHref = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.endsWith("/")) return pathname.startsWith(href);
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="grid items-start gap-2">
      <div className="space-y-2">
        {!props.collapsed ? (
          <h4 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overview</h4>
        ) : null}
        <div className="grid gap-1">
          {items
            .filter((item) => (item.adminOnly ? !!props.isAdmin : true))
            .map((item) => {
              const active = isActiveHref(item.href);
              const Icon = item.icon;

              const baseClass = cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                active ? "bg-accent" : "transparent",
                props.collapsed && "justify-center px-2"
              );

              const iconClass = cn(
                "transition-transform duration-200 group-hover:scale-110 group-hover:text-primary",
                props.collapsed ? "h-5 w-5" : "mr-2 h-4 w-4"
              );

              if (item.external) {
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={baseClass}
                    title={props.collapsed ? item.label : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      openExternal(item.href);
                    }}
                  >
                    <Icon className={iconClass} />
                    {!props.collapsed ? <span>{item.label}</span> : null}
                  </a>
                );
              }

              return (
                <Link key={item.href} to={item.href} className={baseClass} title={props.collapsed ? item.label : undefined}>
                  <Icon className={iconClass} />
                  {!props.collapsed ? <span>{item.label}</span> : null}
                </Link>
              );
            })}
        </div>
      </div>
    </nav>
  );
}
