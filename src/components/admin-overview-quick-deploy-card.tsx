import { Plus, Trash2 } from "lucide-react";
import type { AdminForwardSectionProps } from "./settings-section-types";
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

const platformProfileOptions = [
	"viewer",
	"demo-user",
	"sandbox-user",
	"trainer",
	"integration-user",
	"admin",
] as const;

export function AdminOverviewQuickDeployCard(props: AdminForwardSectionProps) {
	const { onAllowedProfilesChange } = props;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Quick Deploy Catalog</CardTitle>
				<CardDescription>
					Curate the one-click Quick Deploy cards shown to users. Focus these
					entries on stable, high-value demo topologies.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="text-xs text-muted-foreground">
					Source: {props.quickDeploySource ?? "default"}
				</div>
				<div className="text-xs text-muted-foreground">
					Blueprint repo: {props.quickDeployRepo ?? "skyforge/blueprints"} @{" "}
					{props.quickDeployBranch ?? "main"} (dir:{" "}
					{props.quickDeployDir ?? "netlab"})
				</div>
				<div className="grid gap-2 md:grid-cols-[1fr_auto]">
					<Select
						value={props.selectedQuickDeployOption}
						onValueChange={props.onSelectedQuickDeployOptionChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Pick a blueprint template from index…" />
						</SelectTrigger>
						<SelectContent>
							{props.availableQuickDeployTemplates.map((path) => (
								<SelectItem key={path} value={path}>
									{path}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						variant="outline"
						onClick={props.onAddQuickDeployTemplateFromOption}
						disabled={
							props.saveQuickDeployCatalogPending ||
							!props.selectedQuickDeployOption.trim()
						}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add from index
					</Button>
				</div>
				{props.quickDeployLookupFailed ? (
					<div className="text-xs text-amber-600">
						Template index lookup failed. Save will still validate paths
						server-side.
					</div>
				) : null}
				<div className="space-y-3">
					{props.quickDeployTemplates.map((item, index) => {
						const currentTemplate = item.template.trim();
						const templateOptions =
							currentTemplate.length > 0 &&
							!props.availableQuickDeployTemplates.includes(currentTemplate)
								? [currentTemplate, ...props.availableQuickDeployTemplates]
								: props.availableQuickDeployTemplates;
						return (
							<div
								key={`${item.id}-${item.template}-${index}`}
								className="rounded-md border p-3"
							>
								<div className="grid gap-2 md:grid-cols-2">
									<Input
										placeholder="Card name"
										value={item.name}
										onChange={(e) =>
											props.onQuickDeployTemplateFieldChange(
												index,
												"name",
												e.target.value,
											)
										}
									/>
									<Input
										placeholder="ID (optional)"
										value={item.id ?? ""}
										onChange={(e) =>
											props.onQuickDeployTemplateFieldChange(
												index,
												"id",
												e.target.value,
											)
										}
									/>
								</div>
								<div className="mt-2 grid gap-2 md:grid-cols-2">
									<Input
										placeholder="Catalog owner"
										value={item.owner ?? ""}
										onChange={(e) =>
											props.onQuickDeployTemplateFieldChange(
												index,
												"owner",
												e.target.value,
											)
										}
									/>
									<Input
										placeholder="Operating modes"
										value={(item.operatingModes ?? []).join(", ")}
										onChange={(e) =>
											props.onQuickDeployTemplateFieldChange(
												index,
												"operatingModes",
												e.target.value,
											)
										}
									/>
								</div>
								<Select
									value={item.template}
									onValueChange={(value) =>
										props.onQuickDeployTemplateFieldChange(
											index,
											"template",
											value,
										)
									}
								>
									<SelectTrigger className="mt-2">
										<SelectValue placeholder="Template path (for example: EVPN/ebgp/topology.yml)" />
									</SelectTrigger>
									<SelectContent>
										{templateOptions.map((path) => (
											<SelectItem key={path} value={path}>
												{path}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Input
									className="mt-2"
									placeholder="Description"
									value={item.description ?? ""}
									onChange={(e) =>
										props.onQuickDeployTemplateFieldChange(
											index,
											"description",
											e.target.value,
										)
									}
								/>
								<Select
									value={item.resourceClass}
									onValueChange={(value) =>
										props.onQuickDeployTemplateFieldChange(
											index,
											"resourceClass",
											value,
										)
									}
								>
									<SelectTrigger className="mt-2">
										<SelectValue placeholder="Resource class" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="small">small</SelectItem>
										<SelectItem value="standard">standard</SelectItem>
										<SelectItem value="heavy">heavy</SelectItem>
										<SelectItem value="demo-foundry">demo-foundry</SelectItem>
									</SelectContent>
								</Select>
								<Select
									value={item.resetBaselineMode || "curated-reset"}
									onValueChange={(value) =>
										props.onQuickDeployTemplateFieldChange(
											index,
											"resetBaselineMode",
											value,
										)
									}
								>
									<SelectTrigger className="mt-2">
										<SelectValue placeholder="Reset baseline mode" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="soft-reset">soft-reset</SelectItem>
										<SelectItem value="hard-reset">hard-reset</SelectItem>
										<SelectItem value="curated-reset">curated-reset</SelectItem>
									</SelectContent>
								</Select>
								<div className="mt-2 space-y-1">
									<Label>Integration dependencies</Label>
									<Input
										value={(item.integrationDependencies ?? []).join(", ")}
										onChange={(event) =>
											props.onQuickDeployTemplateFieldChange(
												index,
												"integrationDependencies",
												event.target.value,
											)
										}
										placeholder="ServiceNow, NetBox"
									/>
									<div className="text-xs text-muted-foreground">
										Comma-separated list of required integrations, for example
										`forward, managed-collector`.
									</div>
								</div>
								<div className="mt-2 space-y-1">
									<Label>Placement hints</Label>
									<Input
										value={(item.placementHints ?? []).join(", ")}
										onChange={(event) =>
											props.onQuickDeployTemplateFieldChange(
												index,
												"placementHints",
												event.target.value,
											)
										}
										placeholder="lab-pool, burst"
									/>
									<div className="text-xs text-muted-foreground">
										Comma-separated scheduler hints, for example `lab`,
										`burst`, or `onprem-lab`.
									</div>
								</div>
								<div className="mt-2 space-y-1">
									<Label>Allowed profiles</Label>
									<Input
										value={(item.allowedProfiles ?? []).join(", ")}
										onChange={(event) =>
											onAllowedProfilesChange(index, event.target.value)
										}
										placeholder="demo-user, trainer, admin"
									/>
									<div className="text-xs text-muted-foreground">
										Leave blank for the default launch-capable profiles.
										Available: {platformProfileOptions.join(", ")}.
									</div>
								</div>
								<div className="mt-2 flex justify-end">
									<Button
										size="sm"
										variant="outline"
										onClick={() => props.onRemoveQuickDeployTemplate(index)}
										disabled={props.saveQuickDeployCatalogPending}
									>
										<Trash2 className="mr-2 h-4 w-4" />
										Remove
									</Button>
								</div>
							</div>
						);
					})}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						onClick={props.onAddQuickDeployTemplate}
						disabled={props.saveQuickDeployCatalogPending}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add entry
					</Button>
					<Button
						onClick={props.onSaveQuickDeployCatalog}
						disabled={
							props.saveQuickDeployCatalogPending ||
							props.quickDeployCatalogLoading ||
							!props.hasQuickDeployTemplateRows
						}
					>
						{props.saveQuickDeployCatalogPending ? "Saving…" : "Save catalog"}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
