import type { ServiceNowPageData } from "../hooks/use-servicenow-page";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Label } from "./ui/label";

export function ServiceNowPageContent({
	page,
}: {
	page: ServiceNowPageData;
}) {
	const {
		cfg,
		cfgQ,
		setupQ,
		pdiQ,
		schemaQ,
		instanceUrl,
		saveMutation,
		rotateTenantMutation,
		setupMutation,
		cancelSetupMutation,
		wakeMutation,
		installMutation,
		configureMutation,
		setupStatus,
		canResume,
		isRunning,
	} = page;

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">ServiceNow</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Global PDI is admin-managed. This page binds your tenant identity to
					your managed Forward org credential.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Tenant Binding</CardTitle>
					<CardDescription>
						Skyforge provisions a per-user ServiceNow tenant and uses your
						managed Forward org credential for app setup and ticketing.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>Global ServiceNow instance</Label>
							<div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
								{instanceUrl || "Not configured by admin"}
							</div>
						</div>
						<div className="space-y-2">
							<Label>Tenant user mapping</Label>
							<div className="rounded-md border px-3 py-2 text-sm">
								<div className="font-mono text-xs">
									{cfg?.tenantUsername || "not assigned"}
								</div>
								<div className="text-xs text-muted-foreground">
									Provisioned: {cfg?.tenantProvisioned ? "yes" : "no"}
								</div>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Global admin status</Label>
							<div className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
								{cfg?.globalConfigured
									? "configured"
									: "not configured by admin"}
							</div>
						</div>
					</div>
					<div className="text-xs text-muted-foreground">
						Forward source: your managed in-cluster org credential.
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							onClick={() => saveMutation.mutate()}
							disabled={saveMutation.isPending}
						>
							Save tenant binding
						</Button>
						<Button
							variant="outline"
							onClick={() => rotateTenantMutation.mutate()}
							disabled={rotateTenantMutation.isPending || !cfg?.configured}
						>
							Reset tenant password
						</Button>
						<Button
							variant="outline"
							onClick={() => void cfgQ.refetch()}
							disabled={cfgQ.isFetching}
						>
							Reload
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Setup Workflow</CardTitle>
					<CardDescription>
						Primary path: save binding, run setup, remediate only when required.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm">
						Status: <span className="font-medium">{setupStatus}</span>
						{setupQ.data?.currentStep
							? ` · Step: ${setupQ.data.currentStep}`
							: ""}
					</div>
					<div className="flex items-center gap-2">
						<Button
							onClick={() => setupMutation.mutate(false)}
							disabled={
								setupMutation.isPending ||
								isRunning ||
								saveMutation.isPending ||
								!cfg?.globalConfigured
							}
						>
							Run setup
						</Button>
						<Button
							variant="secondary"
							onClick={() => setupMutation.mutate(true)}
							disabled={setupMutation.isPending || !canResume}
						>
							Resume setup
						</Button>
						<Button
							variant="outline"
							onClick={() => cancelSetupMutation.mutate()}
							disabled={cancelSetupMutation.isPending || !isRunning}
						>
							Cancel
						</Button>
						<Button
							variant="outline"
							onClick={() => void setupQ.refetch()}
							disabled={setupQ.isFetching}
						>
							Refresh
						</Button>
					</div>

					{setupQ.data?.steps?.length ? (
						<div className="rounded-md border p-3 space-y-1 text-xs">
							{setupQ.data.steps.map((step) => (
								<div key={step.step} className="font-mono">
									{step.step}: {step.status}
									{step.detail ? ` - ${step.detail}` : ""}
								</div>
							))}
						</div>
					) : null}

					{setupQ.data?.remediation?.length ? (
						<div className="rounded-md border p-3 bg-muted/30">
							<div className="text-xs font-medium mb-1">Remediation</div>
							<ul className="text-xs space-y-1 list-disc pl-4">
								{setupQ.data.remediation.map((line) => (
									<li key={line}>{line}</li>
								))}
							</ul>
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Advanced</CardTitle>
					<CardDescription>
						Manual controls for troubleshooting and verification.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="text-sm">
						PDI status:{" "}
						<span className="font-medium">
							{pdiQ.data?.status ?? "unknown"}
						</span>
						{pdiQ.data?.detail ? ` - ${pdiQ.data.detail}` : ""}
					</div>
					<div className="text-sm">
						Schema status:{" "}
						<span className="font-medium">
							{schemaQ.data?.status ?? "unknown"}
						</span>
						{schemaQ.data?.missing?.length
							? ` (${schemaQ.data.missing.length} missing)`
							: ""}
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<Button
							variant="secondary"
							onClick={() => wakeMutation.mutate()}
							disabled={wakeMutation.isPending || !cfg?.globalConfigured}
						>
							Wake PDI
						</Button>
						<Button
							variant="secondary"
							onClick={() => installMutation.mutate()}
							disabled={installMutation.isPending || !cfg?.configured}
						>
							Install demo app
						</Button>
						<Button
							variant="secondary"
							onClick={() => configureMutation.mutate()}
							disabled={configureMutation.isPending || !cfg?.configured}
						>
							Configure Forward ticketing
						</Button>
						<Button
							variant="outline"
							onClick={() => void schemaQ.refetch()}
							disabled={schemaQ.isFetching || !cfg?.globalConfigured}
						>
							Check schema
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
