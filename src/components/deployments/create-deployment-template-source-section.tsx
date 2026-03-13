import { Info } from "lucide-react";
import {
	type CreateDeploymentPageState,
	USER_REPO_SOURCE,
} from "../../hooks/use-create-deployment-page";
import type { ExternalTemplateRepo } from "../../lib/api-client";
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
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "../ui/tooltip";

type Props = { page: CreateDeploymentPageState };

export function CreateDeploymentTemplateSourceSection({ page }: Props) {
	const {
		form,
		watchKind,
		effectiveSource,
		externalAllowed,
		externalRepos,
		byosServerRefs,
		userNetlabServersQ,
		userContainerlabServersQ,
	} = page;

	return (
		<>
			<FormField
				control={form.control}
				name="source"
				render={({ field }) => (
					<FormItem>
						<FormLabel className="flex items-center gap-2">
							Template source
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="h-4 w-4 text-muted-foreground" />
									</TooltipTrigger>
									<TooltipContent>
										<p>Git repository or URL containing deployment templates</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</FormLabel>
						<Select
							onValueChange={(val) => {
								field.onChange(val);
								form.setValue("templateRepoId", "");
								form.setValue("template", "");
							}}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select source" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								<SelectItem value={USER_REPO_SOURCE}>User repo</SelectItem>
								<SelectItem value="blueprints">Blueprints</SelectItem>
								<SelectItem
									value="external"
									disabled={
										!externalAllowed ||
										(watchKind !== "containerlab" &&
											watchKind !== "c9s_containerlab" &&
											watchKind !== "terraform")
									}
								>
									External repo
								</SelectItem>
								<SelectItem
									value="custom"
									disabled={
										watchKind !== "netlab" &&
										watchKind !== "c9s_netlab" &&
										watchKind !== "containerlab" &&
										watchKind !== "c9s_containerlab"
									}
								>
									One-shot repo URL
								</SelectItem>
							</SelectContent>
						</Select>
						{!externalAllowed &&
							(watchKind === "containerlab" ||
								watchKind === "c9s_containerlab" ||
								watchKind === "terraform") && (
								<FormDescription>
									No external repos configured in My Settings.
								</FormDescription>
							)}
						<FormMessage />
					</FormItem>
				)}
			/>

			{effectiveSource === "external" && (
				<FormField
					control={form.control}
					name="templateRepoId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>External repo</FormLabel>
							<Select
								onValueChange={(val) => {
									field.onChange(val);
									form.setValue("template", "");
								}}
								defaultValue={field.value}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select repo…" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{externalRepos.map((r: ExternalTemplateRepo) => (
										<SelectItem key={r.id} value={r.id}>
											{r.name} ({r.repo})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
			{effectiveSource === "custom" && (
				<FormField
					control={form.control}
					name="templateRepoId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>One-shot repo URL</FormLabel>
							<FormControl>
								<Input
									placeholder="https://github.com/org/repo.git (or owner/repo)"
									value={field.value ?? ""}
									onChange={(e) => {
										field.onChange(e.target.value);
										form.setValue("template", "");
									}}
								/>
							</FormControl>
							<FormDescription>
								Used once for this deployment flow. Not saved in My Settings.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}

			{(watchKind === "netlab" || watchKind === "containerlab") && (
				<FormField
					control={form.control}
					name="netlabServer"
					render={({ field }) => (
						<FormItem>
							<FormLabel>BYOS server</FormLabel>
							<Select
								onValueChange={field.onChange}
								defaultValue={field.value || ""}
								value={field.value || ""}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder="Select server…" />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									{byosServerRefs.map((s) => (
										<SelectItem key={s.value} value={s.value}>
											{s.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{(userNetlabServersQ.isLoading ||
								userContainerlabServersQ.isLoading) && (
								<FormDescription>Loading servers…</FormDescription>
							)}
							<FormDescription>
								Configure servers under{" "}
								<code className="font-mono">Dashboard → Settings</code>.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>
			)}
		</>
	);
}
