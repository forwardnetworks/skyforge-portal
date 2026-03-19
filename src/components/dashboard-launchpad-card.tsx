import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	Activity,
	ArrowRight,
	Boxes,
	LayoutDashboard,
	Network,
	PlayCircle,
	Shield,
} from "lucide-react";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { getToolCatalog } from "../lib/api-client-tool-catalog";
import { queryKeys } from "../lib/query-keys";
import type {
	ToolCatalogActionEntry,
	ToolCatalogContentEntry,
	ToolLaunchpadEntry,
} from "../lib/tool-launches";
import { formatMode } from "./dashboard-shared";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

function launchpadIcon(icon: string) {
	switch (String(icon).trim().toLowerCase()) {
		case "activity":
			return Activity;
		case "boxes":
			return Boxes;
		case "layout-dashboard":
			return LayoutDashboard;
		case "network":
			return Network;
		case "play-circle":
			return PlayCircle;
		case "shield":
			return Shield;
		default:
			return PlayCircle;
	}
}

function launchpadActionClass(variant: string | undefined): string {
	switch (
		String(variant ?? "")
			.trim()
			.toLowerCase()
	) {
		case "outline":
			return "border-white/20 bg-white/5 text-white hover:bg-white/10";
		case "ghost":
			return "text-white hover:bg-white/10 hover:text-white";
		default:
			return "bg-white text-slate-950 hover:bg-slate-100";
	}
}

function contentForMode(
	entries: ToolCatalogContentEntry[] | undefined,
	mode: string,
): ToolCatalogContentEntry | null {
	return (
		(entries ?? [])
			.filter(
				(entry) =>
					entry.allowed !== false &&
					entry.surface === "header" &&
					entry.mode === mode,
			)
			.sort(
				(left, right) => Number(left.order ?? 0) - Number(right.order ?? 0),
			)[0] ?? null
	);
}

function launchpadActionsForMode(
	actions: ToolCatalogActionEntry[] | undefined,
	mode: string,
): ToolCatalogActionEntry[] {
	return (actions ?? [])
		.filter((entry) => {
			if (entry.allowed === false) return false;
			const entryMode = String(entry.mode ?? "both")
				.trim()
				.toLowerCase();
			return entryMode === "both" || entryMode === mode;
		})
		.sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));
}

export function DashboardLaunchpadCard(props: { page: DashboardPageState }) {
	const primaryOperatingMode =
		props.page.platformAvailability?.policy?.primaryOperatingMode;
	const simpleMode = props.page.uiExperienceMode === "simple";
	const mode = simpleMode ? "simple" : "advanced";
	const toolCatalogQ = useQuery({
		queryKey: queryKeys.toolCatalog(),
		queryFn: getToolCatalog,
		enabled: props.page.session?.authenticated === true,
		retry: false,
		staleTime: 5 * 60_000,
	});
	const header = contentForMode(toolCatalogQ.data?.launchpadContent, mode);
	const launchpadActions = launchpadActionsForMode(
		toolCatalogQ.data?.launchpadActions,
		mode,
	);
	const launchpadItems = (toolCatalogQ.data?.launchpad ?? [])
		.filter((item) => item.allowed !== false)
		.sort((left, right) => Number(left.order ?? 0) - Number(right.order ?? 0));

	return (
		<Card className="overflow-hidden border-border/70 bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(17,24,39,0.97)_52%,rgba(34,197,94,0.10))] text-white shadow-2xl shadow-black/15">
			<CardHeader className="space-y-4">
				{header?.eyebrow ? (
					<div className="text-[11px] uppercase tracking-[0.32em] text-slate-300">
						{header.eyebrow}
					</div>
				) : null}
				<div className="space-y-2">
					<CardTitle className="font-serif text-3xl text-white">
						{header?.title ?? "Dashboard"}
					</CardTitle>
					{header?.description ? (
						<CardDescription className="max-w-2xl text-slate-300">
							{header.description}
						</CardDescription>
					) : null}
				</div>
				<div className="flex flex-wrap gap-3">
					{launchpadActions.map((action) => (
						<Button
							key={action.id}
							asChild
							className={launchpadActionClass(action.variant)}
						>
							<Link to={action.href}>{action.label}</Link>
						</Button>
					))}
					{primaryOperatingMode ? (
						<Button
							asChild
							variant="outline"
							className="border-white/20 bg-white/5 text-white hover:bg-white/10"
						>
							<Link
								to="/dashboard/deployments/quick"
								search={{ mode: primaryOperatingMode } as any}
							>
								Launch {formatMode(primaryOperatingMode)}
							</Link>
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{launchpadItems.map((item: ToolLaunchpadEntry) => {
					const Icon = launchpadIcon(item.icon);
					return (
						<Link
							key={item.id}
							to={item.href}
							className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
									<Icon className="h-5 w-5" />
								</div>
								<ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-white" />
							</div>
							<div className="mt-4 text-base font-semibold text-white">
								{item.title}
							</div>
							<div className="mt-1 text-sm leading-6 text-slate-300">
								{item.description}
							</div>
						</Link>
					);
				})}
			</CardContent>
		</Card>
	);
}
