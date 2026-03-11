import "@xyflow/react/dist/style.css";
import { LabDesignerImportDialog } from "@/components/lab-designer-import-dialog";
import { LabDesignerQuickstartDialog } from "@/components/lab-designer-quickstart-dialog";
import { LabDesignerSidebar } from "@/components/lab-designer-sidebar";
import type { LabDesignerSearch } from "@/components/lab-designer-types";
import { LabDesignerWorkspace } from "@/components/lab-designer-workspace";
import { Button } from "@/components/ui/button";
import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";
import { Download, FolderOpen, Save, Waypoints } from "lucide-react";
import { toast } from "sonner";

export function LabDesignerPage({ search }: { search: LabDesignerSearch }) {
	const page = useLabDesignerPage(search);

	return (
		<div className="h-full w-full p-4 flex flex-col gap-4 min-h-0">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1">
					<div className="text-2xl font-bold tracking-tight">
						Lab Designer (Containerlab)
					</div>
					<div className="text-sm text-muted-foreground">
						Drag nodes, wire links, generate Containerlab YAML, and deploy.
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => page.setQuickstartOpen(true)}
					>
						<Waypoints className="mr-2 h-4 w-4" />
						Get started
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => page.setImportOpen(true)}
						disabled={!page.userId}
					>
						<FolderOpen className="mr-2 h-4 w-4" />
						Import template
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
						onClick={() => page.saveConfig.mutate()}
						disabled={page.saveConfig.isPending}
					>
						<Save className="mr-2 h-4 w-4" />
						Save config
					</Button>
					<Button variant="outline" size="sm" onClick={page.exportYaml}>
						<Download className="mr-2 h-4 w-4" />
						Download YAML
					</Button>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-[1fr_420px] flex-1 min-h-0">
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
				<LabDesignerSidebar
					labName={page.labName}
					onLabNameChange={page.setLabName}
					userId={page.userId}
					onUserIdChange={page.setUserScopeId}
					userScopeOptions={page.userScopeOptions}
					userScopesLoading={page.userScopesQ.isLoading}
					runtime={page.runtime}
					onRuntimeChange={page.setRuntime}
					templatesDir={page.templatesDir}
					onTemplatesDirChange={page.setTemplatesDir}
					templateFile={page.templateFile}
					onTemplateFileChange={page.setTemplateFile}
					effectiveTemplatesDir={page.effectiveTemplatesDir}
					effectiveTemplateFile={page.effectiveTemplateFile}
					onCopyRepoPath={() => {
						void navigator.clipboard?.writeText(
							`${page.effectiveTemplatesDir}/${page.effectiveTemplateFile}`,
						);
						toast.success("Copied path");
					}}
					onOpenMap={page.openMapInNewTab}
					lastSaved={page.lastSaved}
					useSavedConfig={page.useSavedConfig}
					onUseSavedConfigChange={page.setUseSavedConfig}
					containerlabServer={page.containerlabServer}
					onContainerlabServerChange={page.setContainerlabServer}
					containerlabServerOptions={page.containerlabServerOptions}
					containerlabServersLoading={page.containerlabServersQ.isLoading}
					onCreateDeployment={() => page.createDeployment.mutate()}
					createDeploymentPending={page.createDeployment.isPending}
					openDeploymentOnCreate={page.openDeploymentOnCreate}
					onOpenDeploymentOnCreateChange={page.setOpenDeploymentOnCreate}
					selectedNode={page.selectedNode}
					onSelectedNodeLabelChange={(value) => {
						if (!page.selectedNode) return;
						page.markWarningsVisible();
						page.setNodes((current) =>
							current.map((node) =>
								node.id === page.selectedNode?.id
									? { ...node, data: { ...node.data, label: value } }
									: node,
							),
						);
					}}
					onSelectedNodeKindChange={(value) => {
						if (!page.selectedNode) return;
						page.setNodes((current) =>
							current.map((node) =>
								node.id === page.selectedNode?.id
									? { ...node, data: { ...node.data, kind: value } }
									: node,
							),
						);
					}}
					onSelectedNodeImageChange={(image) => {
						if (!page.selectedNode) return;
						page.markWarningsVisible();
						page.setNodes((current) =>
							current.map((node) =>
								node.id === page.selectedNode?.id
									? { ...node, data: { ...node.data, image } }
									: node,
							),
						);
					}}
					yamlMode={page.yamlMode}
					onYamlModeChange={(value) => {
						page.setYamlMode(value);
						if (value === "custom" && !page.customYaml.trim()) {
							page.setCustomYaml(page.effectiveYaml);
						}
					}}
					yaml={page.yaml}
					effectiveYaml={page.effectiveYaml}
					customYaml={page.customYaml}
					onCustomYamlChange={page.setCustomYaml}
					otherWarnings={page.otherWarnings}
					showWarnings={page.showWarnings}
					missingImageWarnings={page.missingImageWarnings}
					onCopyYaml={() => {
						void navigator.clipboard?.writeText(page.effectiveYaml);
						toast.success("Copied YAML");
					}}
				/>
			</div>

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
