import type { useQuickDeployPage } from "@/hooks/use-quick-deploy-page";
import { formatQuickDeployEstimate } from "@/hooks/use-quick-deploy-page";
import { toast } from "sonner";
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

export function QuickDeployPageContent(props: { page: QuickDeployPageState }) {
	const { page } = props;
	return (
		<div className="w-full space-y-5 p-4 lg:p-5">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Quick Deploy</h1>
				<p className="text-sm text-muted-foreground">
					One-click curated labs using the in-app Forward cluster and managed
					credentials. Deploy opens the deployment topology first, then opens
					Forward only after post-deploy sync completes.
				</p>
			</div>

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

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
				{page.catalogQ.isError ? (
					<Card className="md:col-span-2 xl:col-span-3">
						<CardHeader>
							<CardTitle>Quick Deploy Unavailable</CardTitle>
							<CardDescription>
								{page.loadError ||
									"Quick Deploy is not enabled for this environment."}
							</CardDescription>
						</CardHeader>
					</Card>
				) : null}
				{page.templates.map((entry) => (
					<Card key={entry.id} className="flex h-full flex-col">
						<CardHeader>
							<CardTitle>{entry.name}</CardTitle>
							<CardDescription>{entry.description}</CardDescription>
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
									onClick={() => page.deployMutation.mutate(entry.template)}
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
