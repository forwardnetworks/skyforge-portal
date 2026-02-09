export const queryKeys = {
	session: () => ["session"] as const,
	uiConfig: () => ["uiConfig"] as const,
	dashboardSnapshot: () => ["dashboardSnapshot"] as const,
	statusSummary: () => ["statusSummary"] as const,
	runLogs: (runId: string) => ["runLogs", runId] as const,
	deploymentTopology: (workspaceId: string, deploymentId: string) =>
		["deploymentTopology", workspaceId, deploymentId] as const,
	deploymentUIEvents: (workspaceId: string, deploymentId: string) =>
		["deploymentUIEvents", workspaceId, deploymentId] as const,
	deploymentCapacitySummary: (workspaceId: string, deploymentId: string) =>
		["deploymentCapacitySummary", workspaceId, deploymentId] as const,
	deploymentCapacityInventory: (workspaceId: string, deploymentId: string) =>
		["deploymentCapacityInventory", workspaceId, deploymentId] as const,
	deploymentCapacityGrowth: (
		workspaceId: string,
		deploymentId: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"deploymentCapacityGrowth",
			workspaceId,
			deploymentId,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	userForwardNetworks: () => ["userForwardNetworks"] as const,
	workspaceForwardNetworks: (workspaceId: string) =>
		["workspaceForwardNetworks", workspaceId] as const,
	assuranceStudioScenarios: (workspaceId: string, networkRef: string) =>
		["assuranceStudioScenarios", workspaceId, networkRef] as const,
	assuranceStudioScenario: (
		workspaceId: string,
		networkRef: string,
		scenarioId: string,
	) =>
		["assuranceStudioScenario", workspaceId, networkRef, scenarioId] as const,
	assuranceStudioRuns: (workspaceId: string, networkRef: string) =>
		["assuranceStudioRuns", workspaceId, networkRef] as const,
	assuranceStudioRun: (
		workspaceId: string,
		networkRef: string,
		runId: string,
	) => ["assuranceStudioRun", workspaceId, networkRef, runId] as const,
	forwardNetworkAssuranceSummary: (workspaceId: string, networkRef: string) =>
		["forwardNetworkAssuranceSummary", workspaceId, networkRef] as const,
	forwardNetworkAssuranceHistory: (
		workspaceId: string,
		networkRef: string,
		limit?: string,
	) =>
		[
			"forwardNetworkAssuranceHistory",
			workspaceId,
			networkRef,
			limit ?? "",
		] as const,
	forwardNetworkCapacitySummary: (workspaceId: string, networkRef: string) =>
		["forwardNetworkCapacitySummary", workspaceId, networkRef] as const,
	forwardNetworkCapacityInventory: (workspaceId: string, networkRef: string) =>
		["forwardNetworkCapacityInventory", workspaceId, networkRef] as const,
	forwardNetworkCapacityCoverage: (workspaceId: string, networkRef: string) =>
		["forwardNetworkCapacityCoverage", workspaceId, networkRef] as const,
	forwardNetworkCapacitySnapshotDelta: (
		workspaceId: string,
		networkRef: string,
	) =>
		["forwardNetworkCapacitySnapshotDelta", workspaceId, networkRef] as const,
	forwardNetworkCapacityUpgradeCandidates: (
		workspaceId: string,
		networkRef: string,
		window: string,
	) =>
		[
			"forwardNetworkCapacityUpgradeCandidates",
			workspaceId,
			networkRef,
			window,
		] as const,
	workspaceForwardNetworkCapacityPortfolio: (workspaceId: string) =>
		["workspaceForwardNetworkCapacityPortfolio", workspaceId] as const,
	forwardNetworkCapacityGrowth: (
		workspaceId: string,
		networkRef: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"forwardNetworkCapacityGrowth",
			workspaceId,
			networkRef,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	workspaces: () => ["workspaces"] as const,
	workspaceForwardConfig: (workspaceId: string) =>
		["workspaceForwardConfig", workspaceId] as const,
	workspaceForwardCollectors: (workspaceId: string) =>
		["workspaceForwardCollectors", workspaceId] as const,
	forwardCollectors: () => ["forwardCollectors"] as const,
	userForwardCollector: () => ["userForwardCollector"] as const,
	userCollectorRuntime: () => ["userCollectorRuntime"] as const,
	userCollectorLogs: () => ["userCollectorLogs"] as const,
	userGitCredentials: () => ["userGitCredentials"] as const,
	userSettings: () => ["userSettings"] as const,
	userApiTokens: () => ["userApiTokens"] as const,
	userVariableGroups: () => ["userVariableGroups"] as const,
	userNetlabServers: () => ["userNetlabServers"] as const,
	userEveServers: () => ["userEveServers"] as const,
	userContainerlabServers: () => ["userContainerlabServers"] as const,
	userAwsStaticCredentials: () => ["userAwsStaticCredentials"] as const,
	userAwsSsoCredentials: () => ["userAwsSsoCredentials"] as const,
	awsSsoConfig: () => ["awsSsoConfig"] as const,
	awsSsoStatus: () => ["awsSsoStatus"] as const,
	userAzureCredentials: () => ["userAzureCredentials"] as const,
	userGcpCredentials: () => ["userGcpCredentials"] as const,
	userIbmCredentials: () => ["userIbmCredentials"] as const,
	userForwardCollectorConfigs: () => ["userForwardCollectorConfigs"] as const,
	userForwardCredentialSets: () => ["userForwardCredentialSets"] as const,
	userForwardCollectorConfigRuntime: (id: string) =>
		["userForwardCollectorConfigRuntime", id] as const,
	userForwardCollectorConfigLogs: (id: string) =>
		["userForwardCollectorConfigLogs", id] as const,
	userServiceNowConfig: () => ["userServiceNowConfig"] as const,
	userServiceNowPdiStatus: () => ["userServiceNowPdiStatus"] as const,
	userServiceNowSchemaStatus: () => ["userServiceNowSchemaStatus"] as const,
	userElasticConfig: () => ["userElasticConfig"] as const,
	elasticToolsStatus: () => ["elasticToolsStatus"] as const,
	storageFiles: () => ["storageFiles"] as const,
	workspaceArtifacts: (workspaceId: string) =>
		["workspaceArtifacts", workspaceId] as const,
	workspaceEveServers: (workspaceId: string) =>
		["workspaceEveServers", workspaceId] as const,
	workspaceEveLabs: (
		workspaceId: string,
		server: string,
		path: string,
		recursive: boolean,
	) =>
		[
			"workspaceEveLabs",
			workspaceId,
			server,
			path,
			recursive ? "1" : "0",
		] as const,
	workspaceNetlabServers: (workspaceId: string) =>
		["workspaceNetlabServers", workspaceId] as const,
	notifications: (includeRead?: boolean, limit?: string) =>
		["notifications", includeRead ? "1" : "0", limit ?? ""] as const,
	syslogEvents: (limit?: string) => ["syslogEvents", limit ?? ""] as const,
	snmpTrapEvents: (limit?: string) => ["snmpTrapEvents", limit ?? ""] as const,
	workspaceTemplates: (
		workspaceId: string,
		kind: string,
		source: string,
		repo?: string,
		dir?: string,
	) =>
		[
			"workspaceTemplates",
			workspaceId,
			kind,
			source,
			repo ?? "",
			dir ?? "",
		] as const,
	pkiRoot: () => ["pkiRoot"] as const,
	pkiCerts: () => ["pkiCerts"] as const,
	pkiSshRoot: () => ["pkiSshRoot"] as const,
	pkiSshCerts: () => ["pkiSshCerts"] as const,
	webhookEvents: (limit?: string) => ["webhookEvents", limit ?? ""] as const,
	notificationSettings: () => ["notificationSettings"] as const,
	governanceSummary: () => ["governanceSummary"] as const,
	governanceResources: (limit?: string) =>
		["governanceResources", limit ?? ""] as const,
	governanceCosts: (limit?: string) =>
		["governanceCosts", limit ?? ""] as const,
	governanceUsage: (limit?: string) =>
		["governanceUsage", limit ?? ""] as const,
	governancePolicy: () => ["governancePolicy"] as const,
	adminConfig: () => ["adminConfig"] as const,
	adminAudit: (limit?: string) => ["adminAudit", limit ?? ""] as const,
	adminImpersonateStatus: () => ["adminImpersonateStatus"] as const,
	registryRepos: (q: string) => ["registryRepos", q] as const,
	registryTags: (repo: string, q: string) => ["registryTags", repo, q] as const,
	policyReportsChecks: (workspaceId: string) =>
		["policyReportsChecks", workspaceId] as const,
	policyReportsPacks: (workspaceId: string) =>
		["policyReportsPacks", workspaceId] as const,
	policyReportsSnapshots: (workspaceId: string, networkId: string) =>
		["policyReportsSnapshots", workspaceId, networkId] as const,
	policyReportsRecertCampaigns: (workspaceId: string, status?: string) =>
		["policyReportsRecertCampaigns", workspaceId, status ?? ""] as const,
	policyReportsRecertCampaign: (workspaceId: string, campaignId: string) =>
		["policyReportsRecertCampaign", workspaceId, campaignId] as const,
	policyReportsRecertAssignments: (
		workspaceId: string,
		campaignId?: string,
		status?: string,
		assignee?: string,
	) =>
		[
			"policyReportsRecertAssignments",
			workspaceId,
			campaignId ?? "",
			status ?? "",
			assignee ?? "",
		] as const,
	policyReportsExceptions: (
		workspaceId: string,
		forwardNetworkId?: string,
		status?: string,
	) =>
		[
			"policyReportsExceptions",
			workspaceId,
			forwardNetworkId ?? "",
			status ?? "",
		] as const,
	policyReportsZones: (workspaceId: string, forwardNetworkId: string) =>
		["policyReportsZones", workspaceId, forwardNetworkId] as const,
	policyReportsRuns: (
		workspaceId: string,
		forwardNetworkId?: string,
		packId?: string,
		status?: string,
	) =>
		[
			"policyReportsRuns",
			workspaceId,
			forwardNetworkId ?? "",
			packId ?? "",
			status ?? "",
		] as const,
	policyReportsRun: (workspaceId: string, runId: string) =>
		["policyReportsRun", workspaceId, runId] as const,
	policyReportsRunFindings: (
		workspaceId: string,
		runId: string,
		checkId?: string,
	) => ["policyReportsRunFindings", workspaceId, runId, checkId ?? ""] as const,
	policyReportsFindings: (
		workspaceId: string,
		forwardNetworkId?: string,
		checkId?: string,
		status?: string,
	) =>
		[
			"policyReportsFindings",
			workspaceId,
			forwardNetworkId ?? "",
			checkId ?? "",
			status ?? "",
		] as const,
};
