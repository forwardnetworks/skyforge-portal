import { Loader2, Save, Trash2 } from "lucide-react";
import type { UserSettingsFormValues } from "../hooks/use-user-settings-page";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import type { UserSettingsPageState } from "./user-settings-types";
import { UserVariableGroups } from "./user-variable-groups";

export function UserSettingsTemplateReposForm(props: {
	page: UserSettingsPageState;
}) {
	const { page } = props;

	return (
		<>
			<Form {...page.form}>
				<form
					onSubmit={page.form.handleSubmit((values: UserSettingsFormValues) =>
						page.settingsMutation.mutate(values),
					)}
					className="space-y-6"
				>
					<Card>
						<CardHeader>
							<CardTitle>External Template Repos</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center justify-between gap-4">
								<div className="text-sm text-muted-foreground">
									IDs referenced when selecting template source = External.
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										page.reposArray.append({
											name: "",
											repo: "",
											defaultBranch: "",
										})
									}
								>
									Add repo
								</Button>
							</div>

							{page.reposArray.fields.length === 0 ? (
								<div className="rounded border p-4 text-sm text-muted-foreground">
									No external repos configured.
								</div>
							) : (
								<div className="space-y-3">
									{page.reposArray.fields.map((fieldEntry, idx) => {
										const idPath = `externalTemplateRepos.${idx}.id` as const;
										const namePath =
											`externalTemplateRepos.${idx}.name` as const;
										const repoPath =
											`externalTemplateRepos.${idx}.repo` as const;
										const branchPath =
											`externalTemplateRepos.${idx}.defaultBranch` as const;
										const currentId =
											page.form.watch(idPath) || fieldEntry.id || "";
										return (
											<div
												key={fieldEntry.id}
												className="grid gap-2 rounded border p-3"
											>
												<div className="flex items-center justify-between gap-2">
													<div className="text-xs text-muted-foreground">
														ID:{" "}
														<span className="font-mono">
															{currentId || "(new)"}
														</span>
													</div>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => page.reposArray.remove(idx)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>

												<FormField
													control={page.form.control}
													name={idPath}
													render={({ field }) => (
														<FormItem className="hidden">
															<FormLabel className="sr-only">ID</FormLabel>
															<Input {...field} />
														</FormItem>
													)}
												/>

												<FormField
													control={page.form.control}
													name={namePath}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Name (optional)</FormLabel>
															<Input {...field} placeholder="My repo" />
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={page.form.control}
													name={repoPath}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Repo</FormLabel>
															<Input
																{...field}
																placeholder="owner/repo or git URL"
															/>
															<FormMessage />
														</FormItem>
													)}
												/>

												<FormField
													control={page.form.control}
													name={branchPath}
													render={({ field }) => (
														<FormItem>
															<FormLabel>Default branch (optional)</FormLabel>
															<Input {...field} placeholder="main" />
															<FormMessage />
														</FormItem>
													)}
												/>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>

					<div className="flex items-center justify-end gap-2">
						<Button
							type="submit"
							disabled={page.busy || !page.form.formState.isDirty}
						>
							{page.settingsMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Saving…
								</>
							) : (
								<>
									<Save className="mr-2 h-4 w-4" />
									Save
								</>
							)}
						</Button>
					</div>
				</form>
			</Form>

			<UserVariableGroups allowEdit={true} />
		</>
	);
}
