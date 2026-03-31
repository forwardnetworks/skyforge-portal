import type { CreateDeploymentPageState } from "../../hooks/use-create-deployment-page";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Form } from "../ui/form";
import { CreateDeploymentBasicsSection } from "./create-deployment-basics-section";
import { CreateDeploymentEnvironmentSection } from "./create-deployment-environment-section";

type Props = {
	page: CreateDeploymentPageState;
};

export function CreateDeploymentFormCard({ page }: Props) {
	const {
		navigate,
		form,
		onSubmit,
		watchUserScopeId,
		watchKind,
		watchTemplate,
		terraformProviderFilter,
		awsSsoStatusQ,
		mutation,
	} = page;
	const selectedTerraformProvider = String(
		watchTemplate?.split("/")[0] ||
			(terraformProviderFilter !== "all" ? terraformProviderFilter : ""),
	)
		.trim()
		.toLowerCase();
	const showAwsSsoWarning =
		watchKind === "terraform" &&
		selectedTerraformProvider === "aws" &&
		Boolean(awsSsoStatusQ.data?.reauthRequired);

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{showAwsSsoWarning ? (
							<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900">
								AWS SSO reauthentication is required before this AWS Terraform
								deployment can mint credentials. Reconnect in{" "}
								<code className="font-mono">My Settings → Cloud Credentials → AWS</code>
								, then retry create.
							</div>
						) : null}
						<CreateDeploymentBasicsSection page={page} />
						<CreateDeploymentEnvironmentSection page={page} />
						{mutation.isError && (
							<div className="rounded-md border border-destructive/20 bg-destructive/15 p-3 text-sm text-destructive">
								{(mutation.error as Error)?.message || "Create failed."}
							</div>
						)}

						<div className="flex gap-3">
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending ? "Creating…" : "Create Deployment"}
							</Button>
							<Button
								type="button"
								variant="secondary"
								onClick={() => {
									navigate({
										to: "/dashboard/deployments",
										search: { userId: watchUserScopeId },
									});
								}}
								disabled={mutation.isPending}
							>
								Back
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
