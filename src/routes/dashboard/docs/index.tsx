import { Link, createFileRoute } from "@tanstack/react-router";
import { BookOpen, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";

type DocEntry = {
	slug: string;
	title: string;
	description: string;
	tags: string[];
};

const DOCS: DocEntry[] = [
	{
		slug: "getting-started",
		title: "Getting started",
		description:
			"First-time flow: configure settings, select templates, deploy.",
		tags: ["start", "deployments", "settings"],
	},
	{
		slug: "my-settings",
		title: "My Settings",
		description:
			"Per-user defaults, external repos, BYOL servers, credentials.",
		tags: ["settings", "repos", "byol", "cloud"],
	},
	{
		slug: "deployments",
		title: "Deployments",
		description:
			"Create deployments, validate templates, and understand statuses.",
		tags: ["deployments", "templates", "validate"],
	},
	{
		slug: "servicenow",
		title: "ServiceNow demo workflow",
		description:
			"Install and configure the Forward Connectivity Ticket demo into a ServiceNow PDI.",
		tags: ["servicenow", "forward", "workflow"],
	},
];

export const Route = createFileRoute("/dashboard/docs/")({
	component: DocsIndexPage,
});

function DocsIndexPage() {
	const [q, setQ] = useState("");
	const filtered = useMemo(() => {
		const query = q.trim().toLowerCase();
		if (!query) return DOCS;
		return DOCS.filter((d) => {
			const hay =
				`${d.title} ${d.description} ${d.tags.join(" ")}`.toLowerCase();
			return hay.includes(query);
		});
	}, [q]);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5" />
						Docs & Workflows
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm text-muted-foreground">
						Practical guides for first-time users and repeatable workflows.
					</div>
					<Input
						placeholder="Search docs…"
						value={q}
						onChange={(e) => setQ(e.target.value)}
					/>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2">
				{filtered.map((d) => (
					<Link
						key={d.slug}
						to="/dashboard/docs/$slug"
						params={{ slug: d.slug }}
						className="group"
					>
						<Card className="h-full transition-colors hover:bg-accent/40">
							<CardHeader>
								<CardTitle className="flex items-center justify-between gap-2 text-base">
									<span className="truncate">{d.title}</span>
									<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="text-sm text-muted-foreground">
									{d.description}
								</div>
								<div className="flex flex-wrap gap-2">
									{d.tags.slice(0, 4).map((t) => (
										<span
											key={t}
											className="rounded border px-2 py-0.5 text-[10px] text-muted-foreground"
										>
											{t}
										</span>
									))}
								</div>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
