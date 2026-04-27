import type { useQuickDeployPage } from "@/hooks/use-quick-deploy-page";
import { formatQuickDeployEstimate } from "@/hooks/use-quick-deploy-page";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

type QuickDeployPageState = ReturnType<typeof useQuickDeployPage>;

function formatMode(value: string | undefined): string {
	if (!value) return "unreported";
	return value.replace(/[-_]/g, " ");
}

function describeMode(value: string | undefined): string {
	switch (value) {
		case "training":
			return "Training mode prioritizes repeatable labs and reserved capacity for enablement sessions.";
		case "sandbox":
			return "Sandbox mode keeps curated labs available while allowing broader experimentation elsewhere in the platform.";
		case "persistent-integration":
			return "Persistent integration mode emphasizes labs that pair with Forward and external integrations over longer workflows.";
		case "admin-advanced":
			return "Admin mode includes curated launchers plus the platform controls needed to support other users.";
		default:
			return "Curated demo mode keeps the catalog focused on repeatable GTM launchers with known-good reset behavior.";
	}
}

export function QuickDeployPageContent(props: { page: QuickDeployPageState }) {
	const { page } = props;
	const modeOptions = [
		"all",
		"curated-demo",
		"training",
		"sandbox",
		"persistent-integration",
		"admin-advanced",
	];
	return (
		<div className="w-full space-y-5 p-4 lg:p-5">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Launch Lab</h1>
				<p className="text-sm text-muted-foreground">
					One-click curated labs using the in-app Forward cluster and managed
					credentials. Deploy opens the deployment topology first, then opens
					Forward only after post-deploy sync completes.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Mode-aware launchpad</CardTitle>
					<CardDescription>
						Curated launchers adapt to your current operating mode and template
						intent.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						<Badge>
							{formatMode(page.primaryOperatingMode || page.selectedMode)}
						</Badge>
						{page.primaryOperatingMode &&
						page.selectedMode !== page.primaryOperatingMode ? (
							<Badge variant="outline">
								filtered to {formatMode(page.selectedMode)}
							</Badge>
						) : null}
					</div>
					<p className="text-sm text-muted-foreground">
						{describeMode(page.primaryOperatingMode || page.selectedMode)}
					</p>
					<div className="grid gap-3 md:grid-cols-[240px_1fr]">
						<div className="space-y-2">
							<Label>Launch mode</Label>
							<Select
								value={page.selectedMode}
								onValueChange={page.setSelectedMode}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{modeOptions.map((mode) => (
										<SelectItem key={mode} value={mode}>
											{formatMode(mode)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Label>Topology tag</Label>
							<Select
								value={page.selectedTag}
								onValueChange={page.setSelectedTag}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">all tags</SelectItem>
									{page.availableTags.map((tag) => (
										<SelectItem key={tag} value={tag}>
											{tag}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
							<div className="font-medium">Recommended for this mode</div>
							<div className="mt-2 flex flex-wrap gap-2">
								{page.recommendedTemplates.slice(0, 4).map((entry) => (
									<Button
										key={entry.id}
										type="button"
										variant="outline"
										size="sm"
										onClick={() =>
											page.deployMutation.mutate({
												template: entry.template,
												templateSource: entry.templateSource || "blueprints",
												templateRepo: entry.templateRepo,
												templatesDir: entry.templatesDir,
											})
										}
										disabled={
											page.catalogQ.isLoading || page.deployMutation.isPending
										}
									>
										{entry.name}
									</Button>
								))}
								{page.recommendedTemplates.length === 0 ? (
									<span className="text-muted-foreground">
										No templates are marked for the current operating mode.
									</span>
								) : null}
							</div>
							{page.primaryOperatingMode === "training" ? (
								<div className="mt-3 text-xs text-muted-foreground">
									Training users should pair these launchers with reservations
									for scheduled sessions.
									<Link className="ml-1 underline" to="/dashboard/reservations">
										Open reservations
									</Link>
								</div>
							) : null}
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Lease Duration</CardTitle>
					<CardDescription>
						Labs are automatically lease-bound and can be extended later from
						the Deployments page.
					</CardDescription>
				</CardHeader>
				<CardContent className="w-full sm:max-w-sm">
					<div className="space-y-2">
						<Label>Duration</Label>
						<Select value={page.leaseHours} onValueChange={page.setLeaseHours}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{page.leaseOptions.map((hours) => (
									<SelectItem key={String(hours)} value={String(hours)}>
										{hours} hours
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Tag-Driven Catalog</CardTitle>
					<CardDescription>
						Quick Deploy is driven by topology tags and operating mode. Public
						Gitea templates appear here automatically when compatible.
					</CardDescription>
				</CardHeader>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
				{page.catalogQ.isError ? (
					<Card className="md:col-span-2 xl:col-span-3">
						<CardHeader>
							<CardTitle>Launch Lab Unavailable</CardTitle>
							<CardDescription>
								{page.loadError ||
									"Launch Lab is not enabled for this environment."}
							</CardDescription>
						</CardHeader>
					</Card>
				) : null}
				{page.templates.map((entry) => (
					<Card key={entry.id} className="flex h-full flex-col">
						<CardHeader>
							<div className="flex items-center justify-between gap-2">
								<CardTitle>{entry.name}</CardTitle>
								<Badge variant="outline">{entry.resourceClass}</Badge>
							</div>
							<CardDescription>{entry.description}</CardDescription>
							<div className="flex flex-wrap gap-2 pt-2">
								{entry.operatingModes?.map((mode) => (
									<Badge key={mode} variant="secondary">
										{formatMode(mode)}
									</Badge>
								))}
								{entry.tags?.map((tag) => (
									<Badge key={tag} variant="outline">
										{tag}
									</Badge>
								))}
								{entry.owner ? (
									<Badge variant="outline">{entry.owner}</Badge>
								) : null}
							</div>
						</CardHeader>
						<CardContent className="mt-auto space-y-3">
							<div className="text-xs">
								<div className="font-medium text-foreground">
									{formatQuickDeployEstimate(entry.estimate)}
								</div>
								{entry.estimate?.reason ? (
									<div className="text-muted-foreground">
										{entry.estimate.reason}
									</div>
								) : null}
							</div>
							<p className="text-xs text-muted-foreground">{entry.template}</p>
							{entry.integrationDependencies?.length ? (
								<div className="text-xs text-muted-foreground">
									Requires: {entry.integrationDependencies.join(", ")}
								</div>
							) : null}
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => {
										if (!page.previewUserScopeId) {
											toast.error("Template preview unavailable", {
												description:
													"No user scope is available yet for template rendering.",
											});
											return;
										}
										page.setPreviewTemplate(entry.template);
										page.setPreviewSource(
											entry.templateSource &&
												entry.templateSource !== "blueprints"
												? "custom"
												: "blueprints",
										);
										page.setPreviewRepo(entry.templateRepo ?? "");
										page.setPreviewDir(entry.templatesDir ?? "");
										page.setPreviewOpen(true);
									}}
									disabled={
										page.catalogQ.isLoading || page.deployMutation.isPending
									}
								>
									View
								</Button>
								<Button
									className="flex-1"
									onClick={() =>
										page.deployMutation.mutate({
											template: entry.template,
											templateSource: entry.templateSource || "blueprints",
											templateRepo: entry.templateRepo,
											templatesDir: entry.templatesDir,
										})
									}
									disabled={
										page.catalogQ.isLoading || page.deployMutation.isPending
									}
								>
									{page.deployMutation.isPending ? "Deploying..." : "Deploy"}
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
			<Dialog open={page.previewOpen} onOpenChange={page.setPreviewOpen}>
				<DialogContent className="max-w-5xl">
					<DialogHeader>
						<DialogTitle>Template Preview</DialogTitle>
						<DialogDescription>
							{page.previewTemplate || "No template selected"}
						</DialogDescription>
					</DialogHeader>
					{page.previewQ.isPending ? (
						<div className="text-sm text-muted-foreground">
							Loading template…
						</div>
					) : page.previewQ.isError ? (
						<div className="text-sm text-destructive">
							{page.previewQ.error instanceof Error
								? page.previewQ.error.message
								: "Failed to load template preview."}
						</div>
					) : (
						<Textarea
							readOnly
							value={page.previewQ.data?.yaml ?? ""}
							className="min-h-[55vh] font-mono text-xs"
						/>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
