import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";

type DocPage = {
	slug: string;
	title: string;
	content: ReactNode;
};

const DOC_PAGES: DocPage[] = [
	{
		slug: "getting-started",
		title: "Getting started",
		content: (
			<div className="space-y-4 text-sm">
				<p>
					Skyforge is optimized for a “happy path” workflow. You can still run
					tools manually, but the goal is to make repeatable automation the
					default.
				</p>
				<ol className="list-decimal pl-5 space-y-2">
					<li>
						Go to{" "}
						<Link className="underline" to="/dashboard/settings">
							My Settings
						</Link>{" "}
						and configure:
						<ul className="list-disc pl-5 mt-2 space-y-1">
							<li>External template repos (optional)</li>
							<li>BYOL servers (optional)</li>
							<li>Collector + integrations (optional)</li>
						</ul>
					</li>
					<li>
						Create a deployment from{" "}
						<Link className="underline" to="/dashboard/deployments/new">
							Create deployment
						</Link>
						.
					</li>
					<li>
						Use <span className="font-mono">Validate</span> before starting,
						especially when overriding env vars.
					</li>
				</ol>
			</div>
		),
	},
	{
		slug: "my-settings",
		title: "My Settings",
		content: (
			<div className="space-y-4 text-sm">
				<p>
					The current model is{" "}
					<strong>per-user settings applied to deployments</strong> with a
					personal account.
				</p>
				<ul className="list-disc pl-5 space-y-2">
					<li>
						<strong>Defaults</strong>: environment variables applied to new
						deployments.
					</li>
					<li>
						<strong>External Template Repos</strong>: add Git repos once and
						reuse them across deployments.
					</li>
					<li>
						<strong>BYOL Servers</strong>: register Netlab / Containerlab /
						EVE-NG servers (using <span className="font-mono">user:</span>{" "}
						refs).
					</li>
					<li>
						<strong>Cloud credentials</strong>: stored per-user; UI only shows
						configured status.
					</li>
				</ul>
			</div>
		),
	},
	{
		slug: "deployments",
		title: "Deployments",
		content: (
			<div className="space-y-4 text-sm">
				<p>
					Deployments are created from templates and then executed as runs.
					Template validation should use the same env overrides you’ll apply at
					runtime.
				</p>
				<ul className="list-disc pl-5 space-y-2">
					<li>
						Use the <span className="font-mono">View</span> button to inspect a
						selected template.
					</li>
					<li>
						Use <span className="font-mono">Validate</span> to catch obvious
						netlab errors early.
					</li>
				</ul>
			</div>
		),
	},
	{
		slug: "servicenow",
		title: "ServiceNow demo workflow",
		content: (
			<div className="space-y-4 text-sm">
				<p>
					This workflow installs a demo app into a ServiceNow PDI. The demo app
					calls Forward SaaS directly; Skyforge only installs/configures
					ServiceNow resources.
				</p>
				<ol className="list-decimal pl-5 space-y-2">
					<li>Create (and wake) a PDI from ServiceNow developer portal.</li>
					<li>
						In Skyforge, open{" "}
						<Link className="underline" to="/dashboard/servicenow">
							ServiceNow
						</Link>{" "}
						and save your instance URL + admin credentials.
					</li>
					<li>
						Click <strong>Install demo app</strong>.
					</li>
					<li>
						If schema setup is required, create the required tables in
						ServiceNow Studio (first time per PDI), then re-run install.
					</li>
				</ol>
				<div className="rounded-md border p-3 text-xs text-muted-foreground">
					<div className="font-medium text-foreground">
						Where to find the demo
					</div>
					<ul className="mt-2 list-disc space-y-1 pl-5">
						<li>
							In ServiceNow App Navigator, search for{" "}
							<span className="font-mono">Forward Connectivity Ticket</span>.
						</li>
						<li>
							Portal page:{" "}
							<span className="font-mono">/sp?id=connectivity_ticket</span>
						</li>
						<li>
							Widget name:{" "}
							<span className="font-mono">Connectivity Ticket Analyzer</span>
						</li>
					</ul>
				</div>
				<div className="rounded-md border p-3 text-xs text-muted-foreground">
					<div className="font-medium text-foreground">Schema (tables)</div>
					<p className="mt-2">
						Skyforge prefers the simplest global table names. Create these two
						tables (once per PDI) and then re-run install:
					</p>
					<ul className="mt-2 list-disc space-y-1 pl-5">
						<li>
							<span className="font-mono">u_forward_connectivity_ticket</span>
						</li>
						<li>
							<span className="font-mono">u_forward_connectivity_hop</span>
						</li>
					</ul>
					<p className="mt-2">To create the tables in ServiceNow:</p>
					<ol className="mt-2 list-decimal space-y-1 pl-5">
						<li>
							Open <span className="font-medium">App Navigator</span> and search
							for <span className="font-mono">Tables</span> (System Definition).
						</li>
						<li>
							Click <span className="font-medium">New</span>.
						</li>
						<li>
							For the ticket table, set the{" "}
							<span className="font-medium">Label</span> to{" "}
							<span className="font-mono">Forward Connectivity Ticket</span>{" "}
							(leave the <span className="font-medium">Name</span> blank so
							ServiceNow derives{" "}
							<span className="font-mono">u_forward_connectivity_ticket</span>
							). Set <span className="font-medium">Extends table</span> to{" "}
							<span className="font-mono">task</span>.
						</li>
						<li>
							For the hop table, set the{" "}
							<span className="font-medium">Label</span> to{" "}
							<span className="font-mono">Forward Connectivity Hop</span> (leave
							Name blank so it becomes{" "}
							<span className="font-mono">u_forward_connectivity_hop</span>).
						</li>
					</ol>
					<p className="mt-2">
						After the tables exist, Skyforge auto-creates required fields and
						choice lists via Table API.
					</p>
				</div>
			</div>
		),
	},
];

export const Route = createFileRoute("/dashboard/docs/$slug")({
	component: DocPage,
});

function DocPage() {
	const { slug } = Route.useParams();
	const page = DOC_PAGES.find((p) => p.slug === slug);

	return (
		<div className="space-y-6 p-6">
			<div className="flex items-center gap-3">
				<Link
					to="/dashboard/docs"
					className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Docs
				</Link>
			</div>

			<Card variant="glass">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BookOpen className="h-5 w-5" />
						{page?.title ?? "Page not found"}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{page ? (
						page.content
					) : (
						<div className="text-sm text-muted-foreground">
							This doc page doesn’t exist.
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
