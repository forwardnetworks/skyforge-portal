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
		awsTerraformReadinessQ,
		userAwsSsoQ,
		awsSsoSession,
		awsSsoPollStatus,
		startAwsSsoM,
		mutation,
	} = page;
	const selectedTerraformProvider = String(
		watchTemplate?.split("/")[0] ||
			(terraformProviderFilter !== "all" ? terraformProviderFilter : ""),
	)
		.trim()
		.toLowerCase();
	const isAwsTerraform =
		watchKind === "terraform" && selectedTerraformProvider === "aws";
	const awsTerraformReadiness = awsTerraformReadinessQ.data;
	const awsSsoStatus = awsTerraformReadiness?.status ?? awsSsoStatusQ.data?.status ?? "not_configured";
	const awsSsoStatusLabel =
		awsTerraformReadiness?.statusMessage ??
		awsSsoStatusQ.data?.statusMessage ??
		(awsSsoStatus === "connected"
			? "Connected"
			: awsSsoStatus === "reauth_required"
				? "Reauthentication required"
				: awsSsoStatus === "missing_account_role"
					? "AWS account ID and role name are required"
					: awsSsoStatus === "not_connected"
						? "Not connected"
						: "Not configured");
	const awsCreateBlocked =
		isAwsTerraform && !(awsTerraformReadiness?.ready ?? awsSsoStatus === "connected");
	const awsSsoConfig = awsTerraformReadiness ?? userAwsSsoQ.data;
	const awsBlockedMessage =
		awsSsoStatus === "missing_account_role"
			? "AWS Terraform create is blocked until AWS account ID and role name are saved in Cloud Credentials. Validation is blocked for the same reason."
			: "AWS Terraform create is blocked until the current user can mint AWS SSO credentials. Validation is blocked for the same reason.";

	return (
		<Card>
			<CardContent className="pt-6">
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						{isAwsTerraform ? (
							<div className="rounded-md border p-3 space-y-3 text-sm">
								<div className="flex items-center justify-between gap-3">
									<div className="font-medium">AWS SSO status</div>
								<div
									className={
										awsSsoStatus === "connected"
											? "text-emerald-700"
											: awsSsoStatus === "reauth_required" ||
												  awsSsoStatus === "missing_account_role"
												? "text-amber-700"
												: "text-muted-foreground"
									}
									>
										{awsSsoStatusLabel}
									</div>
								</div>
								{awsSsoStatusQ.data?.lastAuthenticatedAt ? (
									<div className="text-xs text-muted-foreground">
										Last authenticated:{" "}
										<span className="font-mono">
											{awsSsoStatusQ.data.lastAuthenticatedAt}
										</span>
									</div>
								) : null}
								{awsSsoStatusQ.data?.expiresAt ? (
									<div className="text-xs text-muted-foreground">
										Expires:{" "}
										<span className="font-mono">
											{awsSsoStatusQ.data.expiresAt}
										</span>
									</div>
								) : null}
								<div className="grid gap-1 text-xs text-muted-foreground">
									{awsSsoStatusQ.data?.user ? (
										<div>
											User:{" "}
											<span className="font-mono">
												{awsSsoStatusQ.data.user}
											</span>
										</div>
									) : null}
									{awsSsoConfig?.accountId ? (
										<div>
											Account:{" "}
											<span className="font-mono">
												{awsSsoConfig.accountId}
											</span>
										</div>
									) : null}
									{awsSsoConfig?.roleName ? (
										<div>
											Role:{" "}
											<span className="font-mono">
												{awsSsoConfig.roleName}
											</span>
										</div>
									) : null}
								</div>
								{awsCreateBlocked ? (
									<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900">
										{awsBlockedMessage}
									</div>
								) : null}
								{awsSsoSession ? (
									<div className="rounded border bg-muted/30 p-3 text-xs space-y-1">
										<div className="font-medium">Complete sign-in</div>
										<div>
											Code:{" "}
											<span className="font-mono">
												{awsSsoSession.userCode}
											</span>
										</div>
										<div className="text-muted-foreground">
											Open:{" "}
											<span className="font-mono break-all">
												{awsSsoSession.verificationUriComplete}
											</span>
										</div>
										{awsSsoPollStatus ? (
											<div className="text-muted-foreground">
												Status: {awsSsoPollStatus}
											</div>
										) : null}
									</div>
								) : null}
								<div className="flex flex-wrap gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={() => startAwsSsoM.mutate()}
										disabled={
											startAwsSsoM.isPending || Boolean(awsSsoSession)
										}
									>
										{awsSsoStatus === "connected" ||
										awsSsoStatus === "reauth_required"
											? "Reauthenticate AWS"
											: "Authenticate AWS"}
									</Button>
									<Button
										type="button"
										variant="secondary"
										onClick={() => navigate({ to: "/settings" })}
									>
										Open Cloud Credentials
									</Button>
								</div>
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
							<Button
								type="submit"
								disabled={mutation.isPending || awsCreateBlocked}
							>
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
