import { useLabDesignerPageModel } from "@/hooks/use-lab-designer-page-model";
import { useLabDesignerPageState } from "@/hooks/use-lab-designer-page-state";
import { useLabDesignerData } from "@/hooks/use-lab-designer-data";
import { useLabDesignerDerived } from "@/hooks/use-lab-designer-derived";
import {
	useLabDesignerEscapeKeyEffect,
	useLabDesignerImportPrefsEffect,
	useLabDesignerImportedDeploymentSyncEffect,
} from "@/hooks/use-lab-designer-effects";
import { createLabDesignerActions } from "./use-lab-designer-actions";
import type { LabDesignerSearch } from "@/components/lab-designer-types";

export function useLabDesignerPage(search: LabDesignerSearch) {
	const state = useLabDesignerPageState();
	const importDeploymentId = String(search.importDeploymentId ?? "").trim();

	const model = useLabDesignerPageModel({
		nodes: state.nodes,
		edges: state.edges,
		labName: state.labName,
		defaultKind: state.defaultKind,
		yamlMode: state.yamlMode,
		customYaml: state.customYaml,
		templatesDir: state.templatesDir,
		templateFile: state.templateFile,
	});

	const data = useLabDesignerData({
		queryClient: state.queryClient,
		userId: state.userId,
		runtime: state.runtime,
		importOpen: state.importOpen,
		importSource: state.importSource,
		importDir: state.importDir,
		importFile: state.importFile,
		containerlabServer: state.containerlabServer,
		labName: state.labName,
		effectiveYaml: model.effectiveYaml,
		effectiveTemplatesDir: model.effectiveTemplatesDir,
		effectiveTemplateFile: model.effectiveTemplateFile,
		useSavedConfig: state.useSavedConfig,
		lastSaved: state.lastSaved,
		openDeploymentOnCreate: state.openDeploymentOnCreate,
		setLastSaved: state.setLastSaved,
		setYamlMode: state.setYamlMode,
		setCustomYaml: state.setCustomYaml,
		setImportOpen: state.setImportOpen,
		setLabName: state.setLabName,
		setDefaultKind: state.setDefaultKind,
		setNodes: state.setNodes,
		setEdges: state.setEdges,
		setSelectedNodeId: state.setSelectedNodeId,
		setUseSavedConfig: state.setUseSavedConfig,
	});

	const derived = useLabDesignerDerived({
		nodes: state.nodes,
		edges: state.edges,
		labName: state.labName,
		defaultKind: state.defaultKind,
		selectedNodeId: state.selectedNodeId,
		yamlMode: state.yamlMode,
		customYaml: state.customYaml,
		templatesDir: state.templatesDir,
		templateFile: state.templateFile,
		paletteSearch: state.paletteSearch,
		paletteVendor: state.paletteVendor,
		paletteRole: state.paletteRole,
		registryRepos: Array.isArray(data.registryReposQ.data?.repositories)
			? data.registryReposQ.data.repositories
			: [],
		registryError: data.registryReposQ.isError
			? (data.registryReposQ.error as Error)
			: null,
		userScopes: data.userScopesQ.data ?? [],
		containerlabServers: data.containerlabServersQ.data?.servers ?? [],
	});

	const actions = createLabDesignerActions({
		queryClient: state.queryClient,
		rfRef: state.rfRef,
		rfInstance: state.rfInstance,
		nodes: state.nodes,
		edges: state.edges,
		labName: state.labName,
		defaultKind: state.defaultKind,
		qsName: state.qsName,
		qsSpines: state.qsSpines,
		qsLeaves: state.qsLeaves,
		qsHostsPerLeaf: state.qsHostsPerLeaf,
		qsSwitchKind: state.qsSwitchKind,
		qsSwitchImage: state.qsSwitchImage,
		qsHostKind: state.qsHostKind,
		qsHostImage: state.qsHostImage,
		selectedNodeId: state.selectedNodeId,
		importDeploymentId,
		userId: state.userId,
		effectiveYaml: model.effectiveYaml,
		effectiveTemplatesDir: model.effectiveTemplatesDir,
		effectiveTemplateFile: model.effectiveTemplateFile,
		lastSaved: state.lastSaved,
		setLabName: state.setLabName,
		setDefaultKind: state.setDefaultKind,
		setNodes: state.setNodes,
		setEdges: state.setEdges,
		setSelectedNodeId: state.setSelectedNodeId,
		setYamlMode: state.setYamlMode,
		setCustomYaml: state.setCustomYaml,
		setQuickstartOpen: state.setQuickstartOpen,
		setNodeMenu: state.setNodeMenu,
		setEdgeMenu: state.setEdgeMenu,
		setCanvasMenu: state.setCanvasMenu,
		setUseSavedConfig: state.setUseSavedConfig,
		setLastSaved: state.setLastSaved,
		setUserScopeId: state.setUserScopeId,
		setContainerlabServer: state.setContainerlabServer,
		setRuntime: state.setRuntime,
		markWarningsVisible: state.markWarningsVisible,
	});

	useLabDesignerImportPrefsEffect({
		importOpen: state.importOpen,
		userId: state.userId,
		importSource: state.importSource,
		importDir: state.importDir,
		setImportSource: state.setImportSource,
		setImportDir: state.setImportDir,
		userRepoSource: state.USER_REPO_SOURCE,
	});

	useLabDesignerEscapeKeyEffect(actions.closeMenus);

	useLabDesignerImportedDeploymentSyncEffect({
		search,
		syncImportedDeployment: actions.syncImportedDeployment,
	});

	return {
		...state,
		...derived,
		...data,
		...actions,
		importDeploymentId,
	};
}
