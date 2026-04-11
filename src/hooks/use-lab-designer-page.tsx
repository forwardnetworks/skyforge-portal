import type { LabDesignerSearch } from "@/components/lab-designer-types";
import { useLabDesignerData } from "@/hooks/use-lab-designer-data";
import { useLabDesignerDerived } from "@/hooks/use-lab-designer-derived";
import {
	useLabDesignerEscapeKeyEffect,
	useLabDesignerImportPrefsEffect,
	useLabDesignerImportedDeploymentSyncEffect,
} from "@/hooks/use-lab-designer-effects";
import { useLabDesignerPageModel } from "@/hooks/use-lab-designer-page-model";
import { useLabDesignerPageState } from "@/hooks/use-lab-designer-page-state";
import { useEffect } from "react";
import { createLabDesignerActions } from "./use-lab-designer-actions";

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
		kneServer: state.kneServer,
		labName: state.labName,
		defaultKind: state.defaultKind,
		nodes: state.nodes,
		edges: state.edges,
		annotations: state.annotations,
		groups: state.groups,
		effectiveYaml: model.effectiveYaml,
		effectiveTemplatesDir: model.effectiveTemplatesDir,
		effectiveTemplateFile: model.effectiveTemplateFile,
		useSavedConfig: state.useSavedConfig,
		lastSaved: state.lastSaved,
		rfInstance: state.rfInstance,
		openDeploymentOnCreate: state.openDeploymentOnCreate,
		setLastSaved: state.setLastSaved,
		setYamlMode: state.setYamlMode,
		setCustomYaml: state.setCustomYaml,
		setImportOpen: state.setImportOpen,
		setLabName: state.setLabName,
		setDefaultKind: state.setDefaultKind,
		setNodes: state.setNodes,
		setEdges: state.setEdges,
		setAnnotations: state.setAnnotations,
		setGroups: state.setGroups,
		setSelectedNodeId: state.setSelectedNodeId,
		setUseSavedConfig: state.setUseSavedConfig,
	});

	const derived = useLabDesignerDerived({
		nodes: state.nodes,
		edges: state.edges,
		labName: state.labName,
		defaultKind: state.defaultKind,
		selectedNodeId: state.selectedNodeId,
		selectedEdgeId: state.selectedEdgeId,
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
		registryCatalogImages: Array.isArray(data.registryCatalogQ.data?.images)
			? data.registryCatalogQ.data.images
			: [],
		registryError: data.registryReposQ.isError
			? (data.registryReposQ.error as Error)
			: null,
		userScopes: data.userScopesQ.data ?? [],
		kneServers: data.kneServersQ.data?.servers ?? [],
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
		quickstartImageByKind: derived.quickstartImageByKind,
		selectedNodeId: state.selectedNodeId,
		selectedEdgeId: state.selectedEdgeId,
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
		setSelectedEdgeId: state.setSelectedEdgeId,
		setYamlMode: state.setYamlMode,
		setCustomYaml: state.setCustomYaml,
		setQuickstartOpen: state.setQuickstartOpen,
		setNodeMenu: state.setNodeMenu,
		setEdgeMenu: state.setEdgeMenu,
		setCanvasMenu: state.setCanvasMenu,
		setInspectorTab: state.setInspectorTab,
		setUseSavedConfig: state.setUseSavedConfig,
		setLastSaved: state.setLastSaved,
		setUserScopeId: state.setUserScopeId,
		setKNEServer: state.setKNEServer,
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

	useEffect(() => {
		if (state.userId) return;
		const scopes = data.userScopesQ.data ?? [];
		if (!Array.isArray(scopes) || scopes.length === 0) return;
		const firstScope = scopes[0];
		const nextUserID = String(firstScope?.id ?? "").trim();
		if (!nextUserID) return;
		state.setUserScopeId(nextUserID);
	}, [data.userScopesQ.data, state.userId, state.setUserScopeId]);

	return {
		...state,
		...derived,
		...data,
		...actions,
		importDeploymentId,
	};
}
