import type { SavedConfigRef } from "@/components/lab-designer-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Rocket } from "lucide-react";

type Option = {
	value: string;
	label: string;
};

type LabDesignerSidebarMetadataSectionProps = {
	labName: string;
	onLabNameChange: (value: string) => void;
	userId: string;
	onUserIdChange: (value: string) => void;
	userScopeOptions: Option[];
	userScopesLoading: boolean;
	runtime: "clabernetes" | "containerlab";
	onRuntimeChange: (value: "clabernetes" | "containerlab") => void;
	templatesDir: string;
	onTemplatesDirChange: (value: string) => void;
	templateFile: string;
	onTemplateFileChange: (value: string) => void;
	effectiveTemplatesDir: string;
	effectiveTemplateFile: string;
	onCopyRepoPath: () => void;
	onOpenMap: () => void;
	lastSaved: SavedConfigRef | null;
	useSavedConfig: boolean;
	onUseSavedConfigChange: (value: boolean) => void;
	containerlabServer: string;
	onContainerlabServerChange: (value: string) => void;
	containerlabServerOptions: Option[];
	containerlabServersLoading: boolean;
	onCreateDeployment: () => void;
	createDeploymentPending: boolean;
	openDeploymentOnCreate: boolean;
	onOpenDeploymentOnCreateChange: (value: boolean) => void;
};

export function LabDesignerSidebarMetadataSection(
	props: LabDesignerSidebarMetadataSectionProps,
) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Lab</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="space-y-1">
					<Label>Lab name</Label>
					<Input
						value={props.labName}
						onChange={(e) => props.onLabNameChange(e.target.value)}
					/>
				</div>
				<div className="space-y-1">
					<Label>User</Label>
					<Select value={props.userId} onValueChange={props.onUserIdChange}>
						<SelectTrigger>
							<SelectValue
								placeholder={
									props.userScopesLoading ? "Loading…" : "Select user…"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{props.userScopeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label>Runtime</Label>
					<Select
						value={props.runtime}
						onValueChange={(value) =>
							props.onRuntimeChange(value as "clabernetes" | "containerlab")
						}
						disabled={!props.userId}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={
									!props.userId ? "Select user first…" : "Select runtime…"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="clabernetes">
								Clabernetes (in-cluster)
							</SelectItem>
							<SelectItem value="containerlab">Containerlab (BYOS)</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label>Repo path</Label>
					<div className="grid grid-cols-2 gap-2">
						<Input
							value={props.templatesDir}
							onChange={(e) => props.onTemplatesDirChange(e.target.value)}
							placeholder="containerlab/designer"
						/>
						<Input
							value={props.templateFile}
							onChange={(e) => props.onTemplateFileChange(e.target.value)}
							placeholder={`${props.labName || "lab"}.clab.yml`}
						/>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={props.onCopyRepoPath}
							disabled={!props.userId}
						>
							Copy path
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={props.onOpenMap}
							disabled={!props.userId}
						>
							<ExternalLink className="mr-2 h-4 w-4" />
							Open map
						</Button>
					</div>
					<div className="text-xs text-muted-foreground font-mono truncate">
						{props.effectiveTemplatesDir}/{props.effectiveTemplateFile}
					</div>
				</div>
				<div className="flex items-center justify-between gap-3 rounded-lg border p-3">
					<div className="min-w-0">
						<div className="text-sm font-medium">Use saved config</div>
						<div className="text-xs text-muted-foreground truncate">
							{props.lastSaved?.userId === props.userId
								? `${props.lastSaved.filePath} (${props.lastSaved.branch})`
								: "Auto-saves before deploy"}
						</div>
					</div>
					<Switch
						checked={props.useSavedConfig}
						onCheckedChange={(value) =>
							props.onUseSavedConfigChange(Boolean(value))
						}
					/>
				</div>
				<div className="space-y-1">
					<Label>Containerlab server</Label>
					<Select
						value={props.containerlabServer}
						onValueChange={props.onContainerlabServerChange}
						disabled={!props.userId || props.runtime !== "containerlab"}
					>
						<SelectTrigger>
							<SelectValue
								placeholder={
									props.runtime !== "containerlab"
										? "Not required for clabernetes…"
										: !props.userId
											? "Select user first…"
											: props.containerlabServersLoading
												? "Loading…"
												: "Select server…"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{props.containerlabServerOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<div className="text-xs text-muted-foreground">
						Only required for Containerlab (BYOS). Configure in My Settings,
						then go to BYOL Servers.
					</div>
				</div>
				<div>
					<Button
						className="w-full"
						disabled={props.createDeploymentPending}
						onClick={props.onCreateDeployment}
					>
						<Rocket className="mr-2 h-4 w-4" />
						{props.createDeploymentPending
							? "Creating…"
							: "Create deployment + deploy"}
					</Button>
				</div>
				<div className="flex items-center justify-between rounded-lg border px-3 py-2">
					<div className="min-w-0">
						<div className="text-sm font-medium">Open deployment on create</div>
						<div className="text-xs text-muted-foreground">
							Keeps the Designer open in this tab.
						</div>
					</div>
					<Switch
						checked={props.openDeploymentOnCreate}
						onCheckedChange={(value) =>
							props.onOpenDeploymentOnCreateChange(Boolean(value))
						}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
