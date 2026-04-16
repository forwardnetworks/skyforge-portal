import * as React from "react";
import { Loader2, Upload } from "lucide-react";
import {
	type CreateDeploymentPageState,
	formatResourceEstimate,
} from "../../hooks/use-create-deployment-page";
import type { NetlabValidationDiagnostic } from "../../lib/api-client-deployments-actions-estimates";
import { Button } from "../ui/button";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

type Props = { page: CreateDeploymentPageState };

export function CreateDeploymentTemplatePickerSection({ page }: Props) {
	const uploadInputRef = React.useRef<HTMLInputElement | null>(null);
	const {
		form,
		watchKind,
		watchTemplate,
		templates,
		templatesQ,
		terraformProviders,
		terraformProviderFilter,
		setTerraformProviderFilter,
		setTemplatePreviewOpen,
		selectedTemplateEstimate,
		templateEstimatePending,
		validateTemplate,
		uploadNetlabTemplate,
		effectiveSource,
		netlabValidationResult,
		awsSsoStatusQ,
		awsTerraformReadinessQ,
	} = page;
	const showTemplateUpload = watchKind === "netlab" || watchKind === "kne_netlab";
	const selectedTerraformProvider = String(
		watchTemplate?.split("/")[0] ||
			(terraformProviderFilter !== "all" ? terraformProviderFilter : ""),
	)
		.trim()
		.toLowerCase();
	const awsTerraformReadiness = awsTerraformReadinessQ.data;
	const awsReadinessStatus =
		awsTerraformReadiness?.status ?? awsSsoStatusQ.data?.status ?? "not_configured";
	const awsValidateBlocked =
		watchKind === "terraform" &&
		selectedTerraformProvider === "aws" &&
		!(awsTerraformReadiness?.ready ?? awsReadinessStatus === "connected");
	const awsStatusLabel =
		awsTerraformReadiness?.statusMessage ??
		awsSsoStatusQ.data?.statusMessage ??
		(awsReadinessStatus === "reauth_required"
			? "Reauthentication required"
			: awsReadinessStatus === "missing_account_role"
				? "AWS account ID and role name are required"
				: awsReadinessStatus === "not_connected"
				? "Not connected"
				: "Not configured");
	const awsValidateBlockedMessage =
		awsReadinessStatus === "missing_account_role"
			? "AWS Terraform validate runs a real Terraform plan and is blocked until AWS account ID and role name are saved."
			: "AWS Terraform validate runs a real Terraform plan and is blocked until AWS SSO is connected.";

	return (
		<>
			<FormField
				control={form.control}
				name="template"
				render={({ field }) => (
					<FormItem>
						<div className="flex items-center justify-between gap-3">
							<FormLabel>Template</FormLabel>
							{(watchKind === "netlab" ||
								watchKind === "kne_netlab" ||
								watchKind === "kne_raw" ||
								watchKind === "terraform" ||
								watchKind === "kne") && (
								<div className="flex items-center gap-2">
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={!watchTemplate}
										onClick={() => setTemplatePreviewOpen(true)}
									>
										View
									</Button>
									{watchKind === "netlab" ||
									watchKind === "kne_netlab" ||
									watchKind === "terraform" ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={
												!watchTemplate ||
												validateTemplate.isPending ||
												awsValidateBlocked
											}
											onClick={() => validateTemplate.mutate()}
										>
											{validateTemplate.isPending ? (
												<>
													<Loader2 className="mr-2 h-3 w-3 animate-spin" />{" "}
													{watchKind === "terraform"
														? "Planning…"
														: "Validating…"}
												</>
											) : (
												"Validate"
											)}
										</Button>
									) : null}
									{showTemplateUpload ? (
										<>
											<input
												ref={uploadInputRef}
												type="file"
												accept=".zip,.yml,.yaml,application/zip"
												className="hidden"
												onChange={(event) => {
													const file = event.target.files?.[0];
													if (file) {
														uploadNetlabTemplate.mutate(file);
													}
													event.currentTarget.value = "";
												}}
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												disabled={uploadNetlabTemplate.isPending}
												onClick={() => uploadInputRef.current?.click()}
											>
												{uploadNetlabTemplate.isPending ? (
													<>
														<Loader2 className="mr-2 h-3 w-3 animate-spin" />
														Uploading…
													</>
												) : (
													<>
														<Upload className="mr-2 h-3 w-3" />
														Upload YAML/ZIP
													</>
												)}
											</Button>
										</>
									) : null}
								</div>
							)}
						</div>
						{watchKind === "terraform" ? (
							<div className="grid gap-2 rounded-md border p-3">
								<div className="text-xs text-muted-foreground">
									Terraform templates are grouped by provider (folder name).
									Select a provider to filter the template list.
								</div>
								{selectedTerraformProvider === "aws" ? (
									<div className="text-xs text-muted-foreground">
										AWS SSO:{" "}
										<span
											className={
												awsValidateBlocked
													? "text-amber-700 font-medium"
													: "text-emerald-700 font-medium"
											}
										>
											{awsStatusLabel}
										</span>
									</div>
								) : null}
								{awsValidateBlocked ? (
									<div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-900">
										{awsValidateBlockedMessage}
									</div>
								) : null}
								<Select
									value={terraformProviderFilter}
									onValueChange={(v) => setTerraformProviderFilter(v)}
									disabled={
										templatesQ.isLoading ||
										(terraformProviders.length === 0 && templates.length === 0)
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Provider filter" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All providers</SelectItem>
										{terraformProviders.map((p) => (
											<SelectItem key={p} value={p}>
												{p}
											</SelectItem>
										))}
										<SelectItem value="ibm" disabled>
											ibm (coming soon)
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						) : null}
						<Select
							onValueChange={(value) => {
								field.onChange(value);
							}}
							value={field.value ?? ""}
							disabled={templatesQ.isLoading || templates.length === 0}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue
										placeholder={
											templatesQ.isLoading
												? "Loading…"
												: templates.length
													? "Select template…"
													: "No templates"
										}
									/>
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{templates.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{templatesQ.isError && (
							<div className="text-xs text-destructive">
								Failed to load templates.
							</div>
						)}
						{showTemplateUpload ? (
							<div className="text-xs text-muted-foreground">
								Upload a single `topology.yml`/`topology.yaml` file or a ZIP of the template folder. Skyforge commits it into the user repo, switches the source to `User repo`, and blocks launch until validation passes.
							</div>
						) : null}
						{netlabValidationResult ? (
							<div className={
								netlabValidationResult.valid
									? "rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs space-y-2"
									: "rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs space-y-2"
							}>
								<div className="font-medium">
									{netlabValidationResult.valid
										? netlabValidationResult.summary || "Validation passed"
										: netlabValidationResult.summary || "Validation failed"}
								</div>
								{(netlabValidationResult.diagnostics ?? [])
									.slice(0, 4)
									.map((diagnostic: NetlabValidationDiagnostic) => (
										<div
											key={`${diagnostic.code}-${diagnostic.message}`}
											className="space-y-1"
										>
											<div>{diagnostic.message}</div>
											{diagnostic.suggestion ? (
												<div className="text-muted-foreground">
													Suggestion: {diagnostic.suggestion}
												</div>
											) : null}
										</div>
									))}
							</div>
						) : null}

						{watchTemplate ? (
							<div className="rounded-md border p-3 text-xs space-y-1">
								<div className="font-medium text-foreground">
									{templateEstimatePending
										? "Estimating resources…"
										: formatResourceEstimate(selectedTemplateEstimate)}
								</div>
								{selectedTemplateEstimate?.reason ? (
									<div className="text-muted-foreground">
										{selectedTemplateEstimate.reason}
									</div>
								) : null}
							</div>
						) : null}
						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Deployment name</FormLabel>
						<FormControl>
							<Input placeholder="My Deployment" {...field} />
						</FormControl>
						<FormDescription>
							Custom name for this specific deployment instance.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
