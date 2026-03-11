import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import * as z from "zod";
import { CreateDeploymentFormCard } from "../../../components/deployments/create-deployment-form-card";
import { ImportEveLabDialog } from "../../../components/deployments/import-eve-lab-dialog";
import { TemplatePreviewDialog } from "../../../components/deployments/template-preview-dialog";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { useCreateDeploymentPage } from "../../../hooks/use-create-deployment-page";

const deploymentsSearchSchema = z.object({
	userId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/new")({
	validateSearch: (search) => deploymentsSearchSchema.parse(search),
	component: CreateDeploymentPage,
});

function CreateDeploymentPage() {
	const { userId } = Route.useSearch();
	const page = useCreateDeploymentPage(userId);
	const {
		navigate,
		watchUserScopeId,
		watchKind,
		byosEveEnabled,
		setImportOpen,
		importOpen,
		importServer,
		setImportServer,
		importLabPath,
		setImportLabPath,
		importDeploymentName,
		setImportDeploymentName,
		importCreateContainerlab,
		setImportCreateContainerlab,
		importContainerlabServer,
		setImportContainerlabServer,
		eveOptions,
		eveLabsQ,
		eveLabOptions,
		byosContainerlabServerRefs,
		importEveLab,
		convertEveLab,
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

			{byosEveEnabled && watchKind === "eve_ng" && (
				<Card>
					<CardHeader>
						<CardTitle>Import from EVE-NG</CardTitle>
						<CardDescription>
							Register an existing EVE-NG lab as a deployment or convert it into
							a Containerlab template.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap items-center justify-between gap-3">
						<div className="text-sm text-muted-foreground">
							Select an EVE-NG lab and import it into Skyforge without
							rebuilding the topology.
						</div>
						<Button
							type="button"
							variant="outline"
							onClick={() => setImportOpen(true)}
						>
							<Download className="mr-2 h-4 w-4" />
							Import EVE-NG lab
						</Button>
					</CardContent>
				</Card>
			)}

			<CreateDeploymentFormCard page={page} />

			<ImportEveLabDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				importServer={importServer}
				setImportServer={setImportServer}
				importLabPath={importLabPath}
				setImportLabPath={setImportLabPath}
				importDeploymentName={importDeploymentName}
				setImportDeploymentName={setImportDeploymentName}
				importCreateContainerlab={importCreateContainerlab}
				setImportCreateContainerlab={setImportCreateContainerlab}
				importContainerlabServer={importContainerlabServer}
				setImportContainerlabServer={setImportContainerlabServer}
				eveOptions={eveOptions}
				eveLabsLoading={eveLabsQ.isLoading}
				eveLabsError={eveLabsQ.isError}
				eveLabOptions={eveLabOptions}
				byosContainerlabServerRefs={byosContainerlabServerRefs}
				importEveLab={importEveLab}
				convertEveLab={convertEveLab}
			/>

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
