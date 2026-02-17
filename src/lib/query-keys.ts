export const queryKeys = {
	session: () => ["session"] as const,
	uiConfig: () => ["uiConfig"] as const,
	dashboardSnapshot: () => ["dashboardSnapshot"] as const,
	statusSummary: () => ["statusSummary"] as const,
	runLogs: (runId: string) => ["runLogs", runId] as const,
	deploymentTopology: (userContextId: string, deploymentId: string) =>
		["deploymentTopology", userContextId, deploymentId] as const,
	deploymentUIEvents: (userContextId: string, deploymentId: string) =>
		["deploymentUIEvents", userContextId, deploymentId] as const,
	deploymentCapacitySummary: (userContextId: string, deploymentId: string) =>
		["deploymentCapacitySummary", userContextId, deploymentId] as const,
	deploymentCapacityInventory: (userContextId: string, deploymentId: string) =>
		["deploymentCapacityInventory", userContextId, deploymentId] as const,
	deploymentCapacityGrowth: (
		userContextId: string,
		deploymentId: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"deploymentCapacityGrowth",
			userContextId,
			deploymentId,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	userForwardNetworks: () => ["userForwardNetworks"] as const,
	userContextForwardNetworks: (userContextId: string) =>
		["userContextForwardNetworks", userContextId] as const,
	assuranceStudioScenarios: (userContextId: string, networkRef: string) =>
		["assuranceStudioScenarios", userContextId, networkRef] as const,
	assuranceStudioScenario: (
		userContextId: string,
		networkRef: string,
		scenarioId: string,
	) =>
		["assuranceStudioScenario", userContextId, networkRef, scenarioId] as const,
	assuranceStudioRuns: (userContextId: string, networkRef: string) =>
		["assuranceStudioRuns", userContextId, networkRef] as const,
	assuranceStudioRun: (
		userContextId: string,
		networkRef: string,
		runId: string,
	) => ["assuranceStudioRun", userContextId, networkRef, runId] as const,
	forwardNetworkAssuranceSummary: (userContextId: string, networkRef: string) =>
		["forwardNetworkAssuranceSummary", userContextId, networkRef] as const,
	forwardNetworkAssuranceHistory: (
		userContextId: string,
		networkRef: string,
		limit?: string,
	) =>
		[
			"forwardNetworkAssuranceHistory",
			userContextId,
			networkRef,
			limit ?? "",
		] as const,
	forwardNetworkCapacitySummary: (userContextId: string, networkRef: string) =>
		["forwardNetworkCapacitySummary", userContextId, networkRef] as const,
	forwardNetworkCapacityInventory: (
		userContextId: string,
		networkRef: string,
	) => ["forwardNetworkCapacityInventory", userContextId, networkRef] as const,
	forwardNetworkCapacityCoverage: (userContextId: string, networkRef: string) =>
		["forwardNetworkCapacityCoverage", userContextId, networkRef] as const,
	forwardNetworkCapacitySnapshotDelta: (
		userContextId: string,
		networkRef: string,
	) =>
		["forwardNetworkCapacitySnapshotDelta", userContextId, networkRef] as const,
	forwardNetworkCapacityUpgradeCandidates: (
		userContextId: string,
		networkRef: string,
		window: string,
	) =>
		[
			"forwardNetworkCapacityUpgradeCandidates",
			userContextId,
			networkRef,
			window,
		] as const,
	userContextForwardNetworkCapacityPortfolio: (userContextId: string) =>
		["userContextForwardNetworkCapacityPortfolio", userContextId] as const,
	forwardNetworkCapacityGrowth: (
		userContextId: string,
		networkRef: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"forwardNetworkCapacityGrowth",
			userContextId,
			networkRef,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	userContexts: () => ["userContexts"] as const,
	userContextForwardConfig: (userContextId: string) =>
		["userContextForwardConfig", userContextId] as const,
	userContextForwardCollectors: (userContextId: string) =>
		["userContextForwardCollectors", userContextId] as const,
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
	userContextArtifacts: (userContextId: string) =>
		["userContextArtifacts", userContextId] as const,
	userContextEveServers: (userContextId: string) =>
		["userContextEveServers", userContextId] as const,
	userContextEveLabs: (
		userContextId: string,
		server: string,
		path: string,
		recursive: boolean,
	) =>
		[
			"userContextEveLabs",
			userContextId,
			server,
			path,
			recursive ? "1" : "0",
		] as const,
	userContextNetlabServers: (userContextId: string) =>
		["userContextNetlabServers", userContextId] as const,
	notifications: (includeRead?: boolean, limit?: string) =>
		["notifications", includeRead ? "1" : "0", limit ?? ""] as const,
	syslogEvents: (limit?: string) => ["syslogEvents", limit ?? ""] as const,
	snmpTrapEvents: (limit?: string) => ["snmpTrapEvents", limit ?? ""] as const,
	userContextTemplates: (
		userContextId: string,
		kind: string,
		source: string,
		repo?: string,
		dir?: string,
	) =>
		[
			"userContextTemplates",
			userContextId,
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
	policyReportsChecks: (userContextId: string) =>
		["policyReportsChecks", userContextId] as const,
	policyReportsPacks: (userContextId: string) =>
		["policyReportsPacks", userContextId] as const,
	policyReportsSnapshots: (userContextId: string, networkId: string) =>
		["policyReportsSnapshots", userContextId, networkId] as const,
	policyReportsRecertCampaigns: (userContextId: string, status?: string) =>
		["policyReportsRecertCampaigns", userContextId, status ?? ""] as const,
	policyReportsRecertCampaign: (userContextId: string, campaignId: string) =>
		["policyReportsRecertCampaign", userContextId, campaignId] as const,
	policyReportsRecertAssignments: (
		userContextId: string,
		campaignId?: string,
		status?: string,
		assignee?: string,
	) =>
		[
			"policyReportsRecertAssignments",
			userContextId,
			campaignId ?? "",
			status ?? "",
			assignee ?? "",
		] as const,
	policyReportsExceptions: (
		userContextId: string,
		forwardNetworkId?: string,
		status?: string,
	) =>
		[
			"policyReportsExceptions",
			userContextId,
			forwardNetworkId ?? "",
			status ?? "",
		] as const,
	policyReportsZones: (userContextId: string, forwardNetworkId: string) =>
		["policyReportsZones", userContextId, forwardNetworkId] as const,
	policyReportsRuns: (
		userContextId: string,
		forwardNetworkId?: string,
		packId?: string,
		status?: string,
	) =>
		[
			"policyReportsRuns",
			userContextId,
			forwardNetworkId ?? "",
			packId ?? "",
			status ?? "",
		] as const,
	policyReportsRun: (userContextId: string, runId: string) =>
		["policyReportsRun", userContextId, runId] as const,
	policyReportsRunFindings: (
		userContextId: string,
		runId: string,
		checkId?: string,
	) =>
		["policyReportsRunFindings", userContextId, runId, checkId ?? ""] as const,
	policyReportsFindings: (
		userContextId: string,
		forwardNetworkId?: string,
		checkId?: string,
		status?: string,
	) =>
		[
			"policyReportsFindings",
			userContextId,
			forwardNetworkId ?? "",
			checkId ?? "",
			status ?? "",
		] as const,
};
