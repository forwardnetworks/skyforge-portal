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
import { useCatalogRouteAccess } from "../hooks/use-catalog-route-access";
import type { DashboardPageState } from "../hooks/use-dashboard-page";
import { formatMode } from "./dashboard-shared";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";

const launchpadItems = [
	{
		title: "Launch Lab",
		description:
			"Launch curated GTM and training topologies from the platform catalog.",
		to: "/dashboard/deployments/quick" as const,
		icon: PlayCircle,
	},
	{
		title: "Designer",
		description:
			"Build containerlab labs visually, validate them, and deploy from the same workbench.",
		to: "/dashboard/labs/designer" as const,
		icon: LayoutDashboard,
		experience: "advanced",
	},
	{
		title: "Reservations",
		description:
			"Reserve future capacity and monitor approved versus requested platform time.",
		to: "/dashboard/reservations" as const,
		icon: Boxes,
	},
	{
		title: "Forward",
		description:
			"Check tenant credentials, collector state, and analytics workflows.",
		to: "/dashboard/forward/credentials" as const,
		icon: Network,
	},
	{
		title: "Observability",
		description:
			"Inspect live system health, queue pressure, and Forward observability signals.",
		to: "/dashboard/observability" as const,
		icon: Activity,
		experience: "advanced",
	},
	{
		title: "Platform",
		description:
			"Open capacity, reservation, and hybrid placement views for operator workflows.",
		to: "/dashboard/platform" as const,
		icon: Shield,
		experience: "advanced",
	},
];

export function DashboardLaunchpadCard(props: { page: DashboardPageState }) {
	const primaryOperatingMode =
		props.page.platformAvailability?.policy?.primaryOperatingMode;
	const simpleMode = props.page.uiExperienceMode === "simple";
	const routeAccess = useCatalogRouteAccess({
		session: props.page.session,
		mode: props.page.uiExperienceMode,
		enabled: props.page.session?.authenticated === true,
	});

	return (
		<Card className="overflow-hidden border-border/70 bg-[linear-gradient(145deg,rgba(2,6,23,0.96),rgba(17,24,39,0.97)_52%,rgba(34,197,94,0.10))] text-white shadow-2xl shadow-black/15">
			<CardHeader className="space-y-4">
				<div className="text-[11px] uppercase tracking-[0.32em] text-slate-300">
					{simpleMode ? "Guided launchpad" : "Operator launchpad"}
				</div>
				<div className="space-y-2">
					<CardTitle className="font-serif text-3xl text-white">
						{simpleMode ? "Choose a path" : "Dashboard"}
					</CardTitle>
					<CardDescription className="max-w-2xl text-slate-300">
						{simpleMode
							? "The core workflows stay visible here. Advanced mode adds the broader operator and integration surface."
							: "Launch demos, check platform readiness, and move directly into the workflows that matter for the current environment."}
					</CardDescription>
				</div>
				<div className="flex flex-wrap gap-3">
					<Button
						asChild
						className="bg-white text-slate-950 hover:bg-slate-100"
					>
						<Link to="/dashboard/deployments/quick">Launch lab</Link>
					</Button>
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
					<Button
						asChild
						variant="ghost"
						className="text-white hover:bg-white/10 hover:text-white"
					>
						<Link to="/settings">
							{simpleMode ? "Profile & settings" : "Settings"}
						</Link>
					</Button>
				</div>
			</CardHeader>
			<CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{launchpadItems
					.filter((item) => routeAccess.canAccessRoute(item.to))
					.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								key={item.title}
								to={item.to}
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
