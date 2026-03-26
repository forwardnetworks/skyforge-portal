import { Loader2 } from "lucide-react";
import {
	type CreateDeploymentPageState,
	formatResourceEstimate,
} from "../../hooks/use-create-deployment-page";
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
		validateNetlabTemplate,
	} = page;

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
								watchKind === "containerlab") && (
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
									{watchKind === "netlab" || watchKind === "kne_netlab" ? (
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={
												!watchTemplate || validateNetlabTemplate.isPending
											}
											onClick={() => validateNetlabTemplate.mutate()}
										>
											{validateNetlabTemplate.isPending ? (
												<>
													<Loader2 className="mr-2 h-3 w-3 animate-spin" />{" "}
													Validating…
												</>
											) : (
												"Validate"
											)}
										</Button>
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
							defaultValue={field.value}
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
