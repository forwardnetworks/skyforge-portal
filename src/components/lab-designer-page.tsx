import "@xyflow/react/dist/style.css";
import { LabDesignerImportDialog } from "@/components/lab-designer-import-dialog";
import { LabDesignerQuickstartDialog } from "@/components/lab-designer-quickstart-dialog";
import type {
	DesignNode,
	DesignNodeData,
	LabDesignerSearch,
	LabNodeInterface,
} from "@/components/lab-designer-types";
import { LabDesignerWorkspace } from "@/components/lab-designer-workspace";
import { RegistryImagePicker } from "@/components/registry-image-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";
import {
	AlertTriangle,
	CheckCircle2,
	Copy,
	Download,
	FolderOpen,
	GitBranch,
	Link2,
	Rocket,
	Save,
	Sparkles,
	Waypoints,
} from "lucide-react";
import { toast } from "sonner";

function updateSelectedNode(
	page: ReturnType<typeof useLabDesignerPage>,
	updater: (data: DesignNodeData) => DesignNodeData,
) {
	if (!page.selectedNode) return;
	page.markWarningsVisible();
	page.setNodes((current) =>
		current.map((node) =>
			node.id === page.selectedNode?.id
				? { ...node, data: updater(node.data) }
				: node,
		),
	);
}

function formatEnv(env?: Record<string, string>) {
	return Object.entries(env ?? {})
		.map(([key, value]) => `${key}=${value}`)
		.join("\n");
}

function parseEnv(raw: string): Record<string, string> | undefined {
	const out: Record<string, string> = {};
	for (const line of raw.split("\n")) {
		const trimmed = line.trim();
		if (!trimmed) continue;
		const idx = trimmed.indexOf("=");
		if (idx <= 0) continue;
		out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
	}
	return Object.keys(out).length ? out : undefined;
}

function formatInterfaces(interfaces?: LabNodeInterface[]) {
	return (interfaces ?? []).map((item) => item.name).join("\n");
}

function parseInterfaces(raw: string): LabNodeInterface[] | undefined {
	const seen = new Set<string>();
	const items = raw
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean)
		.filter((name) => {
			if (seen.has(name)) return false;
			seen.add(name);
			return true;
		})
		.map((name) => ({ id: name, name }));
	return items.length ? items : undefined;
}

function validationTone(page: ReturnType<typeof useLabDesignerPage>) {
	if (page.validateTopology.isPending) {
		return {
			label: "Validating",
			className: "border-amber-500/40 bg-amber-500/10 text-amber-950",
		};
	}
	if (page.lastValidation?.valid === false) {
		return {
			label: "Needs fixes",
			className: "border-red-500/40 bg-red-500/10 text-red-950",
		};
	}
	if (page.lastValidation?.valid) {
		return {
			label: "Validated",
			className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-950",
		};
	}
	return {
		label: "Draft",
		className: "border-slate-400/30 bg-slate-500/10 text-slate-900",
	};
}

export function LabDesignerPage({ search }: { search: LabDesignerSearch }) {
	const page = useLabDesignerPage(search);
	const selectedEdge = page.selectedEdge;
	const validation = validationTone(page);

	return (
		<div className="flex h-full min-h-0 w-full flex-col gap-4 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_24%)] p-4">
			<Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
				<CardContent className="flex flex-col gap-4 p-4">
					<div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
						<div className="space-y-2">
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline" className={validation.className}>
									{validation.label}
								</Badge>
								<Badge variant="outline" className="bg-slate-500/5">
									Containerlab workbench
								</Badge>
								<Badge variant="outline" className="bg-slate-500/5">
									{page.runtime === "clabernetes"
										? "In-cluster runtime"
										: "BYOS containerlab"}
								</Badge>
							</div>
							<div>
								<div className="font-serif text-3xl tracking-tight text-slate-950">
									Lab Designer
								</div>
								<div className="max-w-3xl text-sm text-slate-600">
									Graph-first containerlab editing with one validation contract for
									preview, save, and deploy. YAML remains available, but it is no
									longer the primary editing surface.
								</div>
							</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => page.setQuickstartOpen(true)}
							>
								<Waypoints className="mr-2 h-4 w-4" />
								Quickstart
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => page.setImportOpen(true)}
								disabled={!page.userId}
							>
								<FolderOpen className="mr-2 h-4 w-4" />
								Import
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => page.loadDraft(page.storageKey)}
							>
								Load draft
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() =>
									page.saveDraft(
										page.storageKey,
										page.runtime,
										page.containerlabServer,
										page.useSavedConfig,
									)
								}
							>
								Save draft
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => page.validateTopology.mutate()}
								disabled={!page.userId || page.validateTopology.isPending}
							>
								<Sparkles className="mr-2 h-4 w-4" />
								{page.validateTopology.isPending ? "Validating…" : "Validate"}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => page.saveConfig.mutate()}
								disabled={page.saveConfig.isPending || !page.userId}
							>
								<Save className="mr-2 h-4 w-4" />
								{page.saveConfig.isPending ? "Saving…" : "Save"}
							</Button>
							<Button variant="outline" size="sm" onClick={page.exportYaml}>
								<Download className="mr-2 h-4 w-4" />
								Export YAML
							</Button>
							<Button
								size="sm"
								onClick={() => page.createDeployment.mutate()}
								disabled={page.createDeployment.isPending || !page.userId}
							>
								<Rocket className="mr-2 h-4 w-4" />
								{page.createDeployment.isPending ? "Deploying…" : "Deploy"}
							</Button>
						</div>
					</div>

					<div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-950/[0.02] p-3 lg:grid-cols-[minmax(0,1fr)_380px]">
						<LabDesignerWorkspace
							snapToGrid={page.snapToGrid}
							onSnapToGridChange={page.setSnapToGrid}
							linkMode={page.linkMode}
							onLinkModeToggle={() => {
								page.setLinkMode((current) => {
									const next = !current;
									if (!next) page.setPendingLinkSource("");
									return next;
								});
							}}
							pendingLinkSource={page.pendingLinkSource}
							autoLayout={page.autoLayout}
							addNode={page.addNode}
							paletteSearch={page.paletteSearch}
							onPaletteSearchChange={page.setPaletteSearch}
							paletteVendor={page.paletteVendor}
							onPaletteVendorChange={page.setPaletteVendor}
							paletteRole={page.paletteRole}
							onPaletteRoleChange={page.setPaletteRole}
							paletteVendors={page.paletteVendors}
							paletteItems={page.paletteItems}
							registryReposLoading={page.registryReposQ.isLoading}
							registryReposError={page.registryReposQ.isError}
							registryError={page.registryError}
							paletteIsFilteredEmpty={page.paletteIsFilteredEmpty}
							nodes={page.nodes}
							edges={page.edges}
							rfRef={page.rfRef}
							onDrop={page.onDrop}
							onDragOver={page.onDragOver}
							onCanvasKeyDown={page.onCanvasKeyDown}
							closeMenus={page.closeMenus}
							onNodesChangeWithWarnings={page.onNodesChangeWithWarnings}
							onEdgesChangeWithWarnings={page.onEdgesChangeWithWarnings}
							nodeTypes={page.nodeTypes}
							setRfInstance={page.setRfInstance}
							setSelectedNodeId={page.setSelectedNodeId}
							setNodeMenu={page.setNodeMenu}
							setEdgeMenu={page.setEdgeMenu}
							setCanvasMenu={page.setCanvasMenu}
							nodeMenu={page.nodeMenu}
							edgeMenu={page.edgeMenu}
							canvasMenu={page.canvasMenu}
							importDeploymentId={page.importDeploymentId}
							openImportedTool={page.openImportedTool}
							renameNode={page.renameNode}
							selectedNodeId={page.selectedNodeId}
							setNodes={page.setNodes}
							setEdges={page.setEdges}
							setLinkMode={page.setLinkMode}
							setPendingLinkSource={page.setPendingLinkSource}
							rfInstance={page.rfInstance}
						/>

						<Card className="min-h-0 border-slate-200/70 bg-white/85">
							<CardContent className="flex h-full min-h-0 flex-col p-3">
								<Tabs defaultValue="lab" className="flex h-full min-h-0 flex-col">
									<TabsList className="grid w-full grid-cols-4 bg-slate-100">
										<TabsTrigger value="lab">Lab</TabsTrigger>
										<TabsTrigger value="node">Node</TabsTrigger>
										<TabsTrigger value="link">Link</TabsTrigger>
										<TabsTrigger value="yaml">YAML</TabsTrigger>
									</TabsList>

									<TabsContent value="lab" className="min-h-0 flex-1 overflow-auto">
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
												<div className="text-xs text-slate-500">
													Writes `topology.defaults.kind` so you do not have to
													repeat the same kind on every node.
												</div>
											</div>

											<div className="grid gap-3 sm:grid-cols-2">
												<div className="space-y-1">
													<Label>User</Label>
													<Select
														value={page.userId}
														onValueChange={page.setUserScopeId}
													>
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
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
												<div className="space-y-1">
													<Label>Runtime</Label>
													<Select
														value={page.runtime}
														onValueChange={(value) =>
															page.setRuntime(
																value as "clabernetes" | "containerlab",
															)
														}
														disabled={!page.userId}
													>
														<SelectTrigger>
															<SelectValue placeholder="Select runtime…" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="clabernetes">
																Clabernetes
															</SelectItem>
															<SelectItem value="containerlab">
																Containerlab BYOS
															</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>

											<div className="space-y-1">
												<Label>Repo path</Label>
												<div className="grid gap-2 sm:grid-cols-2">
													<Input
														value={page.templatesDir}
														onChange={(e) =>
															page.setTemplatesDir(e.target.value)
														}
														placeholder="containerlab/designer"
													/>
													<Input
														value={page.templateFile}
														onChange={(e) =>
															page.setTemplateFile(e.target.value)
														}
														placeholder={`${page.labName || "lab"}.clab.yml`}
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
												<div className="font-mono text-xs text-slate-500">
													{page.effectiveTemplatesDir}/
													{page.effectiveTemplateFile}
												</div>
											</div>

											{page.runtime === "containerlab" ? (
												<div className="space-y-1">
													<Label>Containerlab server</Label>
													<Select
														value={page.containerlabServer}
														onValueChange={page.setContainerlabServer}
														disabled={!page.userId}
													>
														<SelectTrigger>
															<SelectValue
																placeholder={
																	page.containerlabServersQ.isLoading
																		? "Loading…"
																		: "Select server…"
																}
															/>
														</SelectTrigger>
														<SelectContent>
															{page.containerlabServerOptions.map((option) => (
																<SelectItem
																	key={option.value}
																	value={option.value}
																>
																	{option.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											) : null}

											<div className="space-y-3 rounded-2xl border border-slate-200 p-3">
												<div className="flex items-center justify-between gap-3">
													<div>
														<div className="text-sm font-medium">
															Deployment behavior
														</div>
														<div className="text-xs text-slate-500">
															Same validated topology drives save and deploy.
														</div>
													</div>
												</div>
												<div className="flex items-center justify-between gap-3">
													<div className="min-w-0">
														<div className="text-sm font-medium">
															Use saved config
														</div>
														<div className="truncate text-xs text-slate-500">
															{page.lastSaved?.userId === page.userId
																? `${page.lastSaved.filePath} (${page.lastSaved.branch})`
																: "Validate and save before deploy"}
														</div>
													</div>
													<Switch
														checked={page.useSavedConfig}
														onCheckedChange={(value) =>
															page.setUseSavedConfig(Boolean(value))
														}
													/>
												</div>
												<div className="flex items-center justify-between gap-3">
													<div className="min-w-0">
														<div className="text-sm font-medium">
															Open deployment on create
														</div>
														<div className="text-xs text-slate-500">
															Keep the designer open in this tab.
														</div>
													</div>
													<Switch
														checked={page.openDeploymentOnCreate}
														onCheckedChange={(value) =>
															page.setOpenDeploymentOnCreate(Boolean(value))
														}
													/>
												</div>
											</div>
										</div>
									</TabsContent>

									<TabsContent value="node" className="min-h-0 flex-1 overflow-auto">
										<div className="space-y-4 pt-3">
											{!page.selectedNode ? (
												<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
													Select a node on the canvas to edit kind, image, mgmt
													address, startup config, interfaces, and environment.
												</div>
											) : (
												<>
													<div className="flex items-center justify-between gap-3">
														<div>
															<div className="text-sm font-semibold text-slate-900">
																{String(
																	page.selectedNode.data?.label ??
																		page.selectedNode.id,
																)}
															</div>
															<div className="text-xs text-slate-500">
																Graph node editor
															</div>
														</div>
														{page.selectedNode.data?.status ? (
															<Badge variant="outline">
																{page.selectedNode.data.status}
															</Badge>
														) : null}
													</div>

													<div className="space-y-1">
														<Label>Name</Label>
														<Input
															value={String(
																page.selectedNode.data?.label ??
																	page.selectedNode.id,
															)}
															onChange={(e) =>
																updateSelectedNode(page, (data) => ({
																	...data,
																	label: e.target.value,
																}))
															}
														/>
													</div>

													<div className="grid gap-3 sm:grid-cols-2">
														<div className="space-y-1">
															<Label>Kind</Label>
															<Input
																value={String(
																	page.selectedNode.data?.kind ?? "",
																)}
																onChange={(e) =>
																	updateSelectedNode(page, (data) => ({
																		...data,
																		kind: e.target.value,
																	}))
																}
																placeholder="ceos, linux, ..."
															/>
														</div>
														<div className="space-y-1">
															<Label>Mgmt IPv4</Label>
															<Input
																value={String(
																	page.selectedNode.data?.mgmtIpv4 ?? "",
																)}
																onChange={(e) =>
																	updateSelectedNode(page, (data) => ({
																		...data,
																		mgmtIpv4: e.target.value || undefined,
																	}))
																}
																placeholder="172.20.20.10"
															/>
														</div>
													</div>

													<div className="space-y-1">
														<Label>Image</Label>
														<RegistryImagePicker
															value={String(page.selectedNode.data?.image ?? "")}
															onChange={(value) =>
																updateSelectedNode(page, (data) => ({
																	...data,
																	image: value,
																}))
															}
														/>
													</div>

													<div className="space-y-1">
														<Label>Startup config</Label>
														<Input
															value={String(
																page.selectedNode.data?.startupConfig ?? "",
															)}
															onChange={(e) =>
																updateSelectedNode(page, (data) => ({
																	...data,
																	startupConfig:
																		e.target.value || undefined,
																}))
															}
															placeholder="configs/r1.cfg"
														/>
													</div>

													<div className="grid gap-3">
														<div className="space-y-1">
															<Label>Interfaces</Label>
															<Textarea
																value={formatInterfaces(
																	page.selectedNode.data?.interfaces,
																)}
																onChange={(e) =>
																	updateSelectedNode(page, (data) => ({
																		...data,
																		interfaces: parseInterfaces(
																			e.target.value,
																		),
																	}))
																}
																className="min-h-[120px] font-mono text-xs"
																placeholder={"eth1\neth2\neth3"}
															/>
														</div>
														<div className="space-y-1">
															<Label>Environment</Label>
															<Textarea
																value={formatEnv(page.selectedNode.data?.env)}
																onChange={(e) =>
																	updateSelectedNode(page, (data) => ({
																		...data,
																		env: parseEnv(e.target.value),
																	}))
																}
																className="min-h-[120px] font-mono text-xs"
																placeholder={"USERNAME=admin\nPASSWORD=admin"}
															/>
														</div>
													</div>

													<div className="space-y-1">
														<Label>Notes</Label>
														<Textarea
															value={String(
																page.selectedNode.data?.notes ?? "",
															)}
															onChange={(e) =>
																updateSelectedNode(page, (data) => ({
																	...data,
																	notes: e.target.value || undefined,
																}))
															}
															className="min-h-[100px] text-xs"
															placeholder="Operator notes, bootstrap assumptions, quirks..."
														/>
													</div>
												</>
											)}
										</div>
									</TabsContent>

									<TabsContent value="link" className="min-h-0 flex-1 overflow-auto">
										<div className="space-y-4 pt-3">
											{!selectedEdge ? (
												<div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
													Select a link on the canvas to edit source and target
													interfaces, label, MTU, and notes.
												</div>
											) : (
												<>
													<div className="flex items-center justify-between gap-3">
														<div>
															<div className="text-sm font-semibold text-slate-900">
																{selectedEdge.data?.label ||
																	selectedEdge.label ||
																	selectedEdge.id}
															</div>
															<div className="text-xs text-slate-500">
																{selectedEdge.source} ↔ {selectedEdge.target}
															</div>
														</div>
														<Badge variant="outline">
															<Link2 className="mr-1 h-3.5 w-3.5" />
															Link
														</Badge>
													</div>

													<div className="grid gap-3 sm:grid-cols-2">
														<div className="space-y-1">
															<Label>Source interface</Label>
															<Input
																value={String(
																	selectedEdge.data?.sourceIf ?? "",
																)}
																onChange={(e) =>
																	page.setEdges((current) =>
																		current.map((edge) =>
																			edge.id === selectedEdge.id
																				? {
																						...edge,
																						data: {
																							...edge.data,
																							sourceIf:
																								e.target.value ||
																								undefined,
																						},
																					}
																				: edge,
																		),
																	)
																}
															/>
														</div>
														<div className="space-y-1">
															<Label>Target interface</Label>
															<Input
																value={String(
																	selectedEdge.data?.targetIf ?? "",
																)}
																onChange={(e) =>
																	page.setEdges((current) =>
																		current.map((edge) =>
																			edge.id === selectedEdge.id
																				? {
																						...edge,
																						data: {
																							...edge.data,
																							targetIf:
																								e.target.value ||
																								undefined,
																						},
																					}
																				: edge,
																		),
																	)
																}
															/>
														</div>
													</div>

													<div className="grid gap-3 sm:grid-cols-2">
														<div className="space-y-1">
															<Label>Label</Label>
															<Input
																value={String(selectedEdge.data?.label ?? "")}
																onChange={(e) =>
																	page.setEdges((current) =>
																		current.map((edge) =>
																			edge.id === selectedEdge.id
																				? {
																						...edge,
																						label: e.target.value,
																						data: {
																							...edge.data,
																							label:
																								e.target.value ||
																								undefined,
																						},
																					}
																				: edge,
																		),
																	)
																}
																placeholder="leaf1:eth1 ↔ spine1:eth1"
															/>
														</div>
														<div className="space-y-1">
															<Label>MTU</Label>
															<Input
																type="number"
																value={String(selectedEdge.data?.mtu ?? "")}
																onChange={(e) =>
																	page.setEdges((current) =>
																		current.map((edge) =>
																			edge.id === selectedEdge.id
																				? {
																						...edge,
																						data: {
																							...edge.data,
																							mtu: e.target.value
																								? Number(
																										e.target.value,
																									)
																								: undefined,
																						},
																					}
																				: edge,
																		),
																	)
																}
															/>
														</div>
													</div>

													<div className="space-y-1">
														<Label>Notes</Label>
														<Textarea
															value={String(selectedEdge.data?.notes ?? "")}
															onChange={(e) =>
																page.setEdges((current) =>
																	current.map((edge) =>
																		edge.id === selectedEdge.id
																			? {
																					...edge,
																					data: {
																						...edge.data,
																						notes:
																							e.target.value ||
																							undefined,
																					},
																				}
																			: edge,
																	),
																)
															}
															className="min-h-[120px] text-xs"
															placeholder="Optional link metadata or operator notes"
														/>
													</div>
												</>
											)}
										</div>
									</TabsContent>

									<TabsContent value="yaml" className="min-h-0 flex-1 overflow-auto">
										<div className="space-y-4 pt-3">
											<div className="flex items-center justify-between gap-3">
												<div>
													<div className="text-sm font-semibold text-slate-900">
														Normalized topology
													</div>
													<div className="text-xs text-slate-500">
														Save and deploy use this same normalized path.
													</div>
												</div>
												<div className="flex items-center gap-2">
													<Button
														size="sm"
														variant={
															page.yamlMode === "generated"
																? "default"
																: "outline"
														}
														onClick={() => page.setYamlMode("generated")}
													>
														Generated
													</Button>
													<Button
														size="sm"
														variant={
															page.yamlMode === "custom"
																? "default"
																: "outline"
														}
														onClick={() => {
															page.setYamlMode("custom");
															if (!page.customYaml.trim()) {
																page.setCustomYaml(page.effectiveYaml);
															}
														}}
													>
														Custom
													</Button>
													<Button
														size="sm"
														variant="outline"
														onClick={() => {
															void navigator.clipboard?.writeText(
																page.effectiveYaml,
															);
															toast.success("Copied YAML");
														}}
													>
														<Copy className="mr-2 h-4 w-4" />
														Copy
													</Button>
												</div>
											</div>

											{page.lastValidation?.warnings?.length ? (
												<div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-950">
													<div className="mb-2 flex items-center gap-2 font-medium">
														<AlertTriangle className="h-4 w-4" />
														Validation warnings
													</div>
													<div className="space-y-1">
														{page.lastValidation.warnings.map((warning) => (
															<div key={warning}>{warning}</div>
														))}
													</div>
												</div>
											) : null}
											{page.lastValidation?.errors?.length ? (
												<div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-950">
													<div className="mb-2 flex items-center gap-2 font-medium">
														<AlertTriangle className="h-4 w-4" />
														Blocking errors
													</div>
													<div className="space-y-1">
														{page.lastValidation.errors.map((error) => (
															<div key={error}>{error}</div>
														))}
													</div>
												</div>
											) : null}
											{page.showWarnings &&
											page.missingImageWarnings.length > 0 ? (
												<div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-950">
													<div className="mb-2 flex items-center gap-2 font-medium">
														<AlertTriangle className="h-4 w-4" />
														Designer warnings
													</div>
													<div className="space-y-1">
														{page.missingImageWarnings.map((warning) => (
															<div key={warning}>{warning}</div>
														))}
														{page.otherWarnings.map((warning) => (
															<div key={warning}>{warning}</div>
														))}
													</div>
												</div>
											) : null}

											<Textarea
												value={
													page.yamlMode === "custom"
														? page.customYaml
														: page.lastValidation?.normalizedYAML ||
															page.yaml
												}
												onChange={(e) => page.setCustomYaml(e.target.value)}
												readOnly={page.yamlMode !== "custom"}
												className="min-h-[420px] font-mono text-xs"
											/>
										</div>
									</TabsContent>
								</Tabs>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
						<div className="space-y-1">
							<div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
								Status
							</div>
							<div className="flex items-center gap-2 text-sm text-slate-900">
								{page.lastValidation?.valid ? (
									<CheckCircle2 className="h-4 w-4 text-emerald-600" />
								) : (
									<AlertTriangle className="h-4 w-4 text-amber-600" />
								)}
								{page.lastValidation?.valid
									? "Topology validated against the shared contract"
									: "Draft topology has not passed validation yet"}
							</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
								Selection
							</div>
							<div className="text-sm text-slate-900">
								{page.selectedNode
									? `Node ${String(page.selectedNode.data?.label ?? page.selectedNode.id)}`
									: selectedEdge
										? `Link ${selectedEdge.id}`
										: "Lab metadata"}
							</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
								Warnings
							</div>
							<div className="text-sm text-slate-900">
								{(page.lastValidation?.warnings?.length ?? 0) +
									page.missingImageWarnings.length +
									page.otherWarnings.length}
							</div>
						</div>
						<div className="space-y-1">
							<div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
								Deploy target
							</div>
							<div className="text-sm text-slate-900">
								{page.runtime === "clabernetes"
									? "Clabernetes in-cluster"
									: page.containerlabServer || "Containerlab server required"}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<LabDesignerImportDialog
				open={page.importOpen}
				onOpenChange={page.setImportOpen}
				userId={page.userId}
				importSource={page.importSource}
				onImportSourceChange={(value) => {
					page.setImportSource(value);
					page.setImportDir(
						value === page.USER_REPO_SOURCE
							? "containerlab/designer"
							: "containerlab",
					);
					page.setImportFile("");
				}}
				importDir={page.importDir}
				onImportDirChange={page.setImportDir}
				importFile={page.importFile}
				onImportFileChange={page.setImportFile}
				templates={page.templatesQ.data?.templates ?? []}
				templatesLoading={page.templatesQ.isLoading}
				templatesError={page.templatesQ.isError}
				templatePreview={page.templatePreviewQ.data?.yaml ?? ""}
				templatePreviewLoading={page.templatePreviewQ.isLoading}
				importPending={page.importTemplate.isPending}
				onImport={() => page.importTemplate.mutate()}
			/>
			<LabDesignerQuickstartDialog
				open={page.quickstartOpen}
				onOpenChange={page.setQuickstartOpen}
				qsName={page.qsName}
				onQsNameChange={page.setQsName}
				qsSpines={page.qsSpines}
				onQsSpinesChange={page.setQsSpines}
				qsLeaves={page.qsLeaves}
				onQsLeavesChange={page.setQsLeaves}
				qsHostsPerLeaf={page.qsHostsPerLeaf}
				onQsHostsPerLeafChange={page.setQsHostsPerLeaf}
				qsSwitchKind={page.qsSwitchKind}
				onQsSwitchKindChange={page.setQsSwitchKind}
				qsSwitchImage={page.qsSwitchImage}
				onQsSwitchImageChange={page.setQsSwitchImage}
				qsHostKind={page.qsHostKind}
				onQsHostKindChange={page.setQsHostKind}
				qsHostImage={page.qsHostImage}
				onQsHostImageChange={page.setQsHostImage}
				onGenerate={page.applyQuickstartClos}
			/>
		</div>
	);
}
