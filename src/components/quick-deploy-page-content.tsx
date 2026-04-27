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

function formatTag(value: string | undefined): string {
	if (!value) return "unreported";
	return value.replace(/[-_]/g, " ");
}

export function QuickDeployPageContent(props: { page: QuickDeployPageState }) {
	const { page } = props;
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
					<CardTitle>Tag-driven launchpad</CardTitle>
					<CardDescription>
						Toggle one or more topology tags. With no tag selected, every tagged
						Quick Deploy lab is shown.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2">
						{page.selectedTags.length === 0 ? (
							<Badge variant="secondary">showing all tags</Badge>
						) : null}
						{page.selectedTags.map((tag) => (
							<Badge key={tag}>{formatTag(tag)}</Badge>
						))}
						{page.selectedTags.length > 0 ? (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={page.clearSelectedTags}
							>
								Clear tags
							</Button>
						) : null}
					</div>
					<div className="grid gap-3 md:grid-cols-[minmax(260px,420px)_1fr]">
						<div className="space-y-2">
							<Label>Topology tags</Label>
							<div className="flex flex-wrap gap-2">
								{page.availableTags.map((tag) => {
									const selected = page.selectedTags.includes(tag);
									return (
										<Button
											key={tag}
											type="button"
											variant={selected ? "default" : "outline"}
											size="sm"
											onClick={() => page.toggleSelectedTag(tag)}
										>
											{formatTag(tag)}
										</Button>
									);
								})}
								{page.availableTags.length === 0 ? (
									<span className="text-sm text-muted-foreground">
										No tagged Quick Deploy labs are currently published.
									</span>
								) : null}
							</div>
						</div>
						<div className="rounded-lg border border-border/60 bg-background/60 p-3 text-sm">
							<div className="font-medium">Recommended from selected tags</div>
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
										No templates are marked with the selected tags.
									</span>
								) : null}
							</div>
							{page.selectedTags.includes("training") ? (
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
						Quick Deploy only shows tagged launchers. Public Gitea templates
						become visible here after they are tagged as training or curated.
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
								{entry.tags?.map((tag) => (
									<Badge key={tag} variant="outline">
										{formatTag(tag)}
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
