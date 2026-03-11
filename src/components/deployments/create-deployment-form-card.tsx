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
	const { navigate, form, onSubmit, watchUserScopeId, mutation } = page;

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
