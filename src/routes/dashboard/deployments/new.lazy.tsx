import { CreateDeploymentFormCard } from "@/components/deployments/create-deployment-form-card";
import { TemplatePreviewDialog } from "@/components/deployments/template-preview-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useCreateDeploymentPage } from "@/hooks/use-create-deployment-page";
import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/dashboard/deployments/new")({
	component: CreateDeploymentPage,
});

function CreateDeploymentPage() {
	const { userId } = Route.useSearch();
	const page = useCreateDeploymentPage(userId);
	const {
		navigate,
		watchUserScopeId,
		templatePreviewOpen,
		setTemplatePreviewOpen,
		templatePreviewQ,
		watchTemplate,
	} = page;

	return (
		<div className="space-y-5 p-4 lg:p-5">
			<Card variant="glass">
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Create deployment</CardTitle>
							<CardDescription>
								Configure and launch a new infrastructure deployment.
							</CardDescription>
						</div>
						<Button
							variant="outline"
							onClick={() =>
								navigate({
									to: "/dashboard/deployments",
									search: { userId: watchUserScopeId },
								})
							}
						>
							Cancel
						</Button>
					</div>
				</CardHeader>
			</Card>

			<CreateDeploymentFormCard page={page} />

			<TemplatePreviewDialog
				open={templatePreviewOpen}
				onOpenChange={setTemplatePreviewOpen}
				path={String((templatePreviewQ.data as any)?.path ?? watchTemplate)}
				yaml={String((templatePreviewQ.data as any)?.yaml ?? "")}
				isLoading={templatePreviewQ.isLoading}
				isError={templatePreviewQ.isError}
			/>
		</div>
	);
}
