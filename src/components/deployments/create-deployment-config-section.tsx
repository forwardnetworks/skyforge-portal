import {
	type CreateDeploymentPageState,
	type DeploymentMode,
	applyDeploymentModeToKind,
	deploymentModeFromKind,
} from "../../hooks/use-create-deployment-page";
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

type Props = { page: CreateDeploymentPageState };

export function CreateDeploymentConfigSection({ page }: Props) {
	const {
		form,
		watchKind,
		watchSpec,
		driverSummary,
		lifetimeManaged,
		lifetimeCanEdit,
		lifetimeOptions,
		expiryAction,
		lifetimeDefaultHours,
		deploymentModeOptions,
		byosNetlabEnabled,
		byosContainerlabEnabled,
		forwardCollectorsQ,
		selectableCollectors,
	} = page;

	return (
		<>
			<FormField
				control={form.control}
				name="kind"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Provider</FormLabel>
						<Select
							onValueChange={(val) => {
								field.onChange(val);
								form.setValue("template", "");
							}}
							value={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select provider" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value="c9s_netlab">Netlab</SelectItem>
								{byosNetlabEnabled && (
									<SelectItem value="netlab">Netlab (BYOS)</SelectItem>
								)}
								{byosContainerlabEnabled && (
									<SelectItem value="containerlab">
										Containerlab (BYOS)
									</SelectItem>
								)}
								<SelectItem value="c9s_containerlab">Containerlab</SelectItem>
								<SelectItem value="terraform">Terraform</SelectItem>
							</SelectContent>
						</Select>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="deploymentMode"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Deployment mode</FormLabel>
						<Select
							value={String(field.value ?? deploymentModeFromKind(watchKind))}
							onValueChange={(value) => {
								const selectedMode = value as DeploymentMode;
								field.onChange(selectedMode);
								const adjustedKind = applyDeploymentModeToKind(
									form.getValues("kind"),
									selectedMode,
								);
								if (adjustedKind !== form.getValues("kind")) {
									form.setValue("kind", adjustedKind, {
										shouldDirty: true,
										shouldTouch: true,
										shouldValidate: true,
									});
									form.setValue("template", "", {
										shouldDirty: true,
										shouldTouch: true,
										shouldValidate: true,
									});
								}
							}}
							disabled={deploymentModeOptions.length <= 1}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select mode" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{deploymentModeOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormDescription>
							{driverSummary}. Family: {watchSpec.family} • Engine:{" "}
							{watchSpec.engine}.
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="labLifetime"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Lab lifetime</FormLabel>
						<Select
							value={String(field.value ?? "")}
							onValueChange={field.onChange}
							disabled={!lifetimeManaged || !lifetimeCanEdit}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select lifetime" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{lifetimeManaged ? (
									lifetimeOptions.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))
								) : (
									<SelectItem value="not_managed">
										Not managed for this provider
									</SelectItem>
								)}
							</SelectContent>
						</Select>
						<FormDescription>
							{lifetimeManaged
								? `Expiry action: ${expiryAction}. ${
										lifetimeCanEdit
											? "Set lifetime before create."
											: `Applied by policy (${lifetimeDefaultHours}h).`
									}`
								: "Lifetime policy does not apply to this provider family."}
						</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>

			{["c9s_netlab", "c9s_containerlab", "terraform"].includes(watchKind) && (
				<FormField
					control={form.control}
					name="forwardCollectorId"
					render={({ field }) => (
						<FormItem className="rounded-md border p-3 md:col-span-2 space-y-2">
							<FormLabel>Forward collector</FormLabel>
							<FormDescription>
								Optional. Select a per-user in-cluster Collector. Configure
								collectors under{" "}
								<code className="font-mono">Dashboard → Forward</code>.
							</FormDescription>
							{forwardCollectorsQ.isError ? (
								<div className="text-xs text-destructive">
									Failed to load collectors.
								</div>
							) : null}
							{forwardCollectorsQ.data && selectableCollectors.length === 0 ? (
								<div className="text-xs text-destructive">
									No collectors configured yet.
								</div>
							) : null}
							<Select
								value={String(field.value ?? "none")}
								onValueChange={(v) => field.onChange(v)}
								disabled={forwardCollectorsQ.isLoading}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a collector (or None)" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									{selectableCollectors.map((c: any) => (
										<SelectItem key={String(c.id)} value={String(c.id)}>
											{String(c.name)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>
			)}
		</>
	);
}
