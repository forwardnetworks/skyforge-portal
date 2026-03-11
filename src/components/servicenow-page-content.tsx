import type { ServiceNowPageData } from "../hooks/use-servicenow-page";
import { Button } from "./ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

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
		collectorOptions,
		instanceUrl,
		setInstanceUrl,
		adminUsername,
		setAdminUsername,
		adminPassword,
		setAdminPassword,
		forwardCredentialSetId,
		setForwardCredentialSetId,
		saveMutation,
		setupMutation,
		cancelSetupMutation,
		wakeMutation,
		installMutation,
		configureMutation,
		setupStatus,
		canResume,
		isRunning,
		selectedCredential,
	} = page;

	return (
		<div className="p-6 space-y-6">
			<div>
				<h1 className="text-2xl font-bold">ServiceNow</h1>
				<p className="text-sm text-muted-foreground mt-1">
					One-click near-zero-touch setup for the Forward connectivity demo app.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Setup Workflow</CardTitle>
					<CardDescription>
						Primary path: save config, run setup, remediate only when required.
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
								setupMutation.isPending || isRunning || saveMutation.isPending
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
									{step.detail ? ` — ${step.detail}` : ""}
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

					{typeof setupQ.data?.ticketingIntegrationSupported === "boolean" ? (
						<div className="text-xs text-muted-foreground">
							Forward ticketing API:{" "}
							{setupQ.data.ticketingIntegrationSupported
								? "supported"
								: "unsupported"}
						</div>
					) : null}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Configuration</CardTitle>
					<CardDescription>
						Uses shared Forward credential sets from{" "}
						<code>/dashboard/forward/credentials</code>.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label>ServiceNow instance URL</Label>
							<Input
								value={instanceUrl}
								onChange={(e) => setInstanceUrl(e.target.value)}
								placeholder="https://dev12345.service-now.com"
							/>
						</div>
						<div className="space-y-2">
							<Label>ServiceNow admin username</Label>
							<Input
								value={adminUsername}
								onChange={(e) => setAdminUsername(e.target.value)}
								placeholder="admin"
							/>
						</div>
						<div className="space-y-2">
							<Label>ServiceNow admin password</Label>
							<Input
								type="password"
								value={adminPassword}
								onChange={(e) => setAdminPassword(e.target.value)}
								placeholder={
									cfg?.hasAdminPassword ? "(leave blank to keep stored)" : ""
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Forward credential set</Label>
							<Select
								value={forwardCredentialSetId || ""}
								onValueChange={setForwardCredentialSetId}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select saved credential set" />
								</SelectTrigger>
								<SelectContent>
									{collectorOptions.map((collector) => (
										<SelectItem key={collector.id} value={collector.id}>
											{collector.name}
											{collector.isDefault ? " (default)" : ""}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					{selectedCredential?.baseUrl ? (
						<div className="text-xs text-muted-foreground">
							Selected host: <code>{selectedCredential.baseUrl}</code>
						</div>
					) : null}
					<div className="flex items-center gap-2">
						<Button
							onClick={() => saveMutation.mutate()}
							disabled={saveMutation.isPending}
						>
							Save settings
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
						{pdiQ.data?.detail ? ` — ${pdiQ.data.detail}` : ""}
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
							disabled={wakeMutation.isPending || !cfg?.configured}
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
							disabled={schemaQ.isFetching || !cfg?.configured}
						>
							Check schema
						</Button>
						<a
							className="text-sm underline text-muted-foreground"
							href="/dashboard/docs/servicenow"
							target="_blank"
							rel="noreferrer"
						>
							Docs
						</a>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
