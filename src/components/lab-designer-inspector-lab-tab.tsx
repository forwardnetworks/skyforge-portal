import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Copy, GitBranch, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LabDesignerInspectorLabTabProps } from "@/components/lab-designer-inspector-tab-types";

export function LabDesignerLabTab({ page }: LabDesignerInspectorLabTabProps) {
	return (
		<div className="space-y-5 pt-3">
			<div className="space-y-1">
				<Label>Lab name</Label>
				<Input
					value={page.labName}
					onChange={(e) => page.setLabName(e.target.value)}
				/>
			</div>
			<div className="space-y-1">
				<Label>Default kind</Label>
				<Input
					value={page.defaultKind}
					onChange={(e) => page.setDefaultKind(e.target.value)}
					placeholder="ceos, linux, n9kv..."
				/>
				<div className="text-xs text-muted-foreground">
					Used as fallback node `device` when a node does not set one
					explicitly.
				</div>
			</div>

			<div className="space-y-1">
				<div className="space-y-1">
					<Label>User</Label>
					<Select value={page.userId} onValueChange={page.setUserScopeId}>
						<SelectTrigger>
							<SelectValue
							placeholder={
								page.userScopesQ.isLoading
									? "Loading…"
									: "Select user…"
							}
						/>
						</SelectTrigger>
						<SelectContent>
							{page.userScopeOptions.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			<div className="space-y-1">
				<Label>Repo path</Label>
				<div className="grid gap-2 sm:grid-cols-2">
					<Input
						value={page.templatesDir}
						onChange={(e) => page.setTemplatesDir(e.target.value)}
						placeholder="kne/designer"
					/>
					<Input
						value={page.templateFile}
						onChange={(e) => page.setTemplateFile(e.target.value)}
						placeholder={`${page.labName || "lab"}.kne.yml`}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-2 pt-1">
					<Button
						size="sm"
						variant="outline"
						onClick={() => {
							void navigator.clipboard?.writeText(
								`${page.effectiveTemplatesDir}/${page.effectiveTemplateFile}`,
							);
							toast.success("Copied repo path");
						}}
					>
						<Copy className="mr-2 h-4 w-4" />
						Copy path
					</Button>
					<Button
						size="sm"
						variant="outline"
						onClick={page.openMapInNewTab}
						disabled={!page.userId}
					>
						<GitBranch className="mr-2 h-4 w-4" />
						Open map
					</Button>
				</div>
				<div className="font-mono text-xs text-muted-foreground">
					{page.effectiveTemplatesDir}/{page.effectiveTemplateFile}
				</div>
			</div>

			<div className="space-y-3 rounded-2xl border border-border p-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="text-sm font-medium">Deployment behavior</div>
						<div className="text-xs text-muted-foreground">
							Same validated topology drives save and deploy.
						</div>
					</div>
				</div>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<div className="text-sm font-medium">Use saved config</div>
						<div className="truncate text-xs text-muted-foreground">
							{page.lastSaved?.userId === page.userId
								? `${page.lastSaved.filePath} (${page.lastSaved.branch})`
								: "Validate and save before deploy"}
						</div>
					</div>
					<Switch
						checked={page.useSavedConfig}
						onCheckedChange={(value) => page.setUseSavedConfig(Boolean(value))}
					/>
				</div>
				<div className="flex items-center justify-between gap-3">
					<div className="min-w-0">
						<div className="text-sm font-medium">
							Open deployment on create
						</div>
						<div className="text-xs text-muted-foreground">Keep the designer open in this tab.</div>
					</div>
					<Switch
						checked={page.openDeploymentOnCreate}
						onCheckedChange={(value) =>
							page.setOpenDeploymentOnCreate(Boolean(value))
						}
					/>
				</div>
			</div>

			<div className="space-y-3 rounded-2xl border border-border p-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="text-sm font-medium">Annotations</div>
						<div className="text-xs text-muted-foreground">
							Canvas notes saved in designer sidecar metadata.
						</div>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() =>
							page.setAnnotations((prev) => [
								...prev,
								{
									id: `ann-${Date.now().toString(36)}`,
									title: "",
									text: "",
									x: 120,
									y: 120,
								},
							])
						}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add
					</Button>
				</div>
				<div className="space-y-3">
					{page.annotations.length === 0 ? (
						<div className="text-xs text-muted-foreground">No annotations yet.</div>
					) : (
						page.annotations.map((annotation, index) => (
							<div key={annotation.id} className="space-y-2 rounded-lg border p-2">
								<div className="grid gap-2 sm:grid-cols-2">
									<Input
										value={annotation.title}
										onChange={(e) =>
											page.setAnnotations((prev) =>
												prev.map((row, rowIndex) =>
													rowIndex === index
														? { ...row, title: e.target.value }
														: row,
												),
											)
										}
										placeholder="Title"
									/>
									<div className="grid grid-cols-2 gap-2">
										<Input
											type="number"
											value={annotation.x}
											onChange={(e) =>
												page.setAnnotations((prev) =>
													prev.map((row, rowIndex) =>
														rowIndex === index
															? { ...row, x: Number(e.target.value || 0) }
															: row,
													),
												)
											}
											placeholder="x"
										/>
										<Input
											type="number"
											value={annotation.y}
											onChange={(e) =>
												page.setAnnotations((prev) =>
													prev.map((row, rowIndex) =>
														rowIndex === index
															? { ...row, y: Number(e.target.value || 0) }
															: row,
													),
												)
											}
											placeholder="y"
										/>
									</div>
								</div>
								<Textarea
									value={annotation.text}
									onChange={(e) =>
										page.setAnnotations((prev) =>
											prev.map((row, rowIndex) =>
												rowIndex === index
													? { ...row, text: e.target.value }
													: row,
											),
										)
									}
									placeholder="Annotation text"
									rows={2}
								/>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										page.setAnnotations((prev) =>
											prev.filter((_, rowIndex) => rowIndex !== index),
										)
									}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Remove
								</Button>
							</div>
						))
					)}
				</div>
			</div>

			<div className="space-y-3 rounded-2xl border border-border p-3">
				<div className="flex items-center justify-between gap-3">
					<div>
						<div className="text-sm font-medium">Groups</div>
						<div className="text-xs text-muted-foreground">
							Logical node groups saved in designer sidecar metadata.
						</div>
					</div>
					<Button
						size="sm"
						variant="outline"
						onClick={() =>
							page.setGroups((prev) => [
								...prev,
								{
									id: `grp-${Date.now().toString(36)}`,
									label: "",
									nodeIds: [],
								},
							])
						}
					>
						<Plus className="mr-2 h-4 w-4" />
						Add
					</Button>
				</div>
				<div className="space-y-3">
					{page.groups.length === 0 ? (
						<div className="text-xs text-muted-foreground">No groups yet.</div>
					) : (
						page.groups.map((group, index) => (
							<div key={group.id} className="space-y-2 rounded-lg border p-2">
								<Input
									value={group.label}
									onChange={(e) =>
										page.setGroups((prev) =>
											prev.map((row, rowIndex) =>
												rowIndex === index
													? { ...row, label: e.target.value }
													: row,
											),
										)
									}
									placeholder="Group label"
								/>
								<Input
									value={group.nodeIds.join(",")}
									onChange={(e) =>
										page.setGroups((prev) =>
											prev.map((row, rowIndex) =>
												rowIndex === index
													? {
															...row,
															nodeIds: e.target.value
																.split(/[,\s]+/)
																.map((value) => value.trim())
																.filter(Boolean),
													  }
													: row,
											),
										)
									}
									placeholder="Node IDs (comma-separated)"
								/>
								<div className="text-xs text-muted-foreground">
									Available nodes: {page.nodes.map((node) => node.id).join(", ") || "none"}
								</div>
								<Button
									size="sm"
									variant="ghost"
									onClick={() =>
										page.setGroups((prev) =>
											prev.filter((_, rowIndex) => rowIndex !== index),
										)
									}
								>
									<Trash2 className="mr-2 h-4 w-4" />
									Remove
								</Button>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}
