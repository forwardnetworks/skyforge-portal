import { Plus, Trash2 } from "lucide-react";
import {
	CUSTOM_ENV_KEY_VALUE,
	CUSTOM_ENV_VALUE,
	type CreateDeploymentPageState,
	NETLAB_DEVICE_ENV_KEY,
	supportedEnvKeys,
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

type Props = {
	page: CreateDeploymentPageState;
};

export function CreateDeploymentEnvironmentSection({ page }: Props) {
	const {
		form,
		watchKind,
		watchEnv,
		variableGroups,
		fields,
		netlabDeviceOptions,
		netlabDeviceOptionsQ,
		setValue,
		append,
		remove,
	} = page;

	return (
		<div className="rounded-md border p-4 space-y-4">
			<div className="flex items-center justify-between">
				<FormLabel>Environment Variables</FormLabel>
				<div className="flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => append({ key: "", value: "" })}
					>
						<Plus className="mr-2 h-3 w-3" /> Add Variable
					</Button>
				</div>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{watchKind === "kne_netlab" && (
					<FormField
						control={form.control}
						name="netlabInitialDebug"
						render={({ field }) => (
							<FormItem>
								<FormLabel className="text-xs text-muted-foreground">
									Netlab debug flags
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Example: cli,external,template"
										className="font-mono text-xs"
									/>
								</FormControl>
								<FormDescription>
									Optional, per-deployment runtime debug for{" "}
									<code className="font-mono">netlab initial</code>. Use
									comma-separated modules.
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				<FormField
					control={form.control}
					name="variableGroupId"
					render={({ field }) => (
						<FormItem>
							<FormLabel className="text-xs text-muted-foreground">
								Variable Group
							</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value || "none"}
								value={field.value || "none"}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="None" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									{variableGroups.map((g) => (
										<SelectItem key={g.id} value={String(g.id)}>
											{g.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormItem>
					)}
				/>
			</div>

			{fields.length > 0 && (
				<div className="space-y-2">
					{fields.map((field, index) => (
						<div
							key={field.id}
							className="flex flex-col gap-2 md:flex-row md:items-start"
						>
							<FormField
								control={form.control}
								name={`env.${index}.key`}
								render={({ field: keyField }) => {
									const currentKey = String(keyField.value ?? "").trim();
									const hasPresetKey = supportedEnvKeys.some(
										(option) => option.key === currentKey,
									);
									const keySelectValue = hasPresetKey
										? currentKey
										: CUSTOM_ENV_KEY_VALUE;
									return (
										<FormItem className="flex-1">
											<FormControl>
												<div className="space-y-2">
													<Select
														value={keySelectValue}
														onValueChange={(next) => {
															if (next === CUSTOM_ENV_KEY_VALUE) {
																if (hasPresetKey) {
																	setValue(`env.${index}.key`, "", {
																		shouldDirty: true,
																		shouldTouch: true,
																		shouldValidate: true,
																	});
																}
																return;
															}
															setValue(`env.${index}.key`, next, {
																shouldDirty: true,
																shouldTouch: true,
																shouldValidate: true,
															});
															if (next === NETLAB_DEVICE_ENV_KEY) {
																const currentValue = String(
																	form.getValues(`env.${index}.value`) ?? "",
																)
																	.trim()
																	.toLowerCase();
																if (
																	currentValue &&
																	netlabDeviceOptions.includes(currentValue)
																)
																	return;
																setValue(
																	`env.${index}.value`,
																	netlabDeviceOptions[0] ?? "eos",
																	{
																		shouldDirty: true,
																		shouldTouch: true,
																		shouldValidate: true,
																	},
																);
															}
														}}
													>
														<SelectTrigger className="font-mono text-xs">
															<SelectValue placeholder="Select key" />
														</SelectTrigger>
														<SelectContent>
															{supportedEnvKeys.map((option) => (
																<SelectItem key={option.key} value={option.key}>
																	{option.label}
																</SelectItem>
															))}
															<SelectItem value={CUSTOM_ENV_KEY_VALUE}>
																Custom key
															</SelectItem>
														</SelectContent>
													</Select>
													{keySelectValue === CUSTOM_ENV_KEY_VALUE && (
														<Input
															{...keyField}
															placeholder="KEY"
															className="font-mono text-xs"
														/>
													)}
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name={`env.${index}.value`}
								render={({ field: valueField }) => {
									const currentKey = String(
										watchEnv?.[index]?.key ?? "",
									).trim();
									const currentValue = String(valueField.value ?? "");
									const normalizedValue = currentValue.trim().toLowerCase();
									const valueUsesPreset =
										currentKey === NETLAB_DEVICE_ENV_KEY &&
										netlabDeviceOptions.includes(normalizedValue);
									const valueSelectValue = valueUsesPreset
										? normalizedValue
										: CUSTOM_ENV_VALUE;
									const showCustomValueInput =
										currentKey !== NETLAB_DEVICE_ENV_KEY ||
										valueSelectValue === CUSTOM_ENV_VALUE;
									return (
										<FormItem className="flex-1">
											<FormControl>
												<div className="space-y-2">
													{currentKey === NETLAB_DEVICE_ENV_KEY && (
														<Select
															value={valueSelectValue}
															onValueChange={(next) => {
																if (next === CUSTOM_ENV_VALUE) {
																	if (valueUsesPreset) {
																		setValue(`env.${index}.value`, "", {
																			shouldDirty: true,
																			shouldTouch: true,
																			shouldValidate: true,
																		});
																	}
																	return;
																}
																setValue(`env.${index}.value`, next, {
																	shouldDirty: true,
																	shouldTouch: true,
																	shouldValidate: true,
																});
															}}
														>
															<SelectTrigger className="font-mono text-xs">
																<SelectValue placeholder="Select netlab device" />
															</SelectTrigger>
															<SelectContent>
																{netlabDeviceOptions.map((device) => (
																	<SelectItem key={device} value={device}>
																		{device}
																	</SelectItem>
																))}
																<SelectItem value={CUSTOM_ENV_VALUE}>
																	Custom value
																</SelectItem>
															</SelectContent>
														</Select>
													)}
													{showCustomValueInput && (
														<Input
															{...valueField}
															placeholder={
																currentKey === NETLAB_DEVICE_ENV_KEY
																	? "custom-device-key"
																	: "VALUE"
															}
															className="font-mono text-xs"
														/>
													)}
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => remove(index)}
								className="shrink-0"
							>
								<Trash2 className="h-4 w-4 text-muted-foreground" />
							</Button>
						</div>
					))}
				</div>
			)}
			<div className="text-xs text-muted-foreground">
				{netlabDeviceOptionsQ.isError
					? "NETLAB_DEVICE options unavailable; custom values are still allowed."
					: `NETLAB_DEVICE options sourced from netlab catalog (${netlabDeviceOptions.length} devices).`}
			</div>
		</div>
	);
}
