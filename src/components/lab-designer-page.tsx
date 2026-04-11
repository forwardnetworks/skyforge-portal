import "@xyflow/react/dist/style.css";
import { LabDesignerCommandBar } from "@/components/lab-designer-command-bar";
import { LabDesignerImportDialog } from "@/components/lab-designer-import-dialog";
import { LabDesignerInspectorTabs } from "@/components/lab-designer-inspector-tabs";
import { LabDesignerQuickstartDialog } from "@/components/lab-designer-quickstart-dialog";
import { LabDesignerStatusRail } from "@/components/lab-designer-status-rail";
import type { LabDesignerSearch } from "@/components/lab-designer-types";
import { LabDesignerWorkspace } from "@/components/lab-designer-workspace";
import { Card, CardContent } from "@/components/ui/card";
import { useLabDesignerPage } from "@/hooks/use-lab-designer-page";

function validationTone(page: ReturnType<typeof useLabDesignerPage>) {
	if (page.validateTopology.isPending) {
		return {
			label: "Validating",
			className:
				"border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100",
		};
	}
	if (page.lastValidation?.valid === false) {
		return {
			label: "Needs fixes",
			className:
				"border-red-500/40 bg-red-500/10 text-red-950 dark:text-red-100",
		};
	}
	if (page.lastValidation?.valid) {
		return {
			label: "Validated",
			className:
				"border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
		};
	}
	return {
		label: "Draft",
		className: "border-border bg-muted/60 text-foreground",
	};
}

export function LabDesignerPage({ search }: { search: LabDesignerSearch }) {
	const page = useLabDesignerPage(search);
	const selectedEdge = page.selectedEdge;
	const validation = validationTone(page);
	const isFocusMode =
		!page.showCommandBar && !page.showPalette && !page.showInspector;

	return (
		<div className="flex h-full min-h-0 w-full flex-col gap-4 bg-[radial-gradient(circle_at_top_left,rgba(15,118,110,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_24%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_top_right,rgba(250,204,21,0.08),transparent_24%)]">
			<Card className="overflow-hidden border-border/70 bg-card/90 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:bg-card/95">
				<CardContent className="flex flex-col gap-4 p-4">
					{page.showCommandBar ? (
						<LabDesignerCommandBar page={page} validation={validation} />
					) : null}

					<div
						className={`grid gap-3 rounded-2xl border border-border/70 bg-muted/30 p-3 dark:bg-muted/20 ${
							page.showInspector
								? "lg:grid-cols-[minmax(0,1fr)_380px]"
								: "lg:grid-cols-1"
						}`}
					>
						<LabDesignerWorkspace
							showPalette={page.showPalette}
							onTogglePalette={() => page.setShowPalette((current) => !current)}
							showInspector={page.showInspector}
							onToggleInspector={() =>
								page.setShowInspector((current) => !current)
							}
							showCommandBar={page.showCommandBar}
							onToggleCommandBar={() =>
								page.setShowCommandBar((current) => !current)
							}
							isFocusMode={isFocusMode}
							onToggleFocusMode={() => {
								const enableFocus =
									page.showCommandBar || page.showPalette || page.showInspector;
								page.setShowCommandBar(!enableFocus);
								page.setShowPalette(!enableFocus);
								page.setShowInspector(!enableFocus);
							}}
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
							onAddPaletteItem={(item) => {
								void page.addNodeFromPalette(item);
							}}
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
							annotations={page.annotations}
							groups={page.groups}
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
							selectedEdgeId={page.selectedEdgeId}
							setSelectedEdgeId={page.setSelectedEdgeId}
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
							setInspectorTab={page.setInspectorTab}
							ensureInspectorVisible={() => {
								if (!page.showInspector) page.setShowInspector(true);
							}}
						/>

						{page.showInspector ? (
							<Card className="min-h-0 border-border/70 bg-card/85 dark:bg-card/95">
								<CardContent className="flex h-full min-h-0 flex-col p-3">
									<LabDesignerInspectorTabs
										page={page}
										selectedEdge={selectedEdge}
									/>
								</CardContent>
							</Card>
						) : null}
					</div>

					<LabDesignerStatusRail page={page} selectedEdge={selectedEdge} />
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
						value === page.USER_REPO_SOURCE ? "kne/designer" : "kne",
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
				importTopologyPending={page.importTopology.isPending}
				lastImportResult={page.lastImportResult}
				onImport={() => page.importTemplate.mutate()}
				onImportTopology={(args) =>
					page.importTopology.mutate({
						source: args.source,
						topologyYAML: args.yaml,
					})
				}
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
