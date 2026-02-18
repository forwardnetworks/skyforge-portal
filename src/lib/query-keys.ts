export const queryKeys = {
	session: () => ["session"] as const,
	uiConfig: () => ["uiConfig"] as const,
	dashboardSnapshot: () => ["dashboardSnapshot"] as const,
	statusSummary: () => ["statusSummary"] as const,
	runLogs: (runId: string) => ["runLogs", runId] as const,
	deploymentTopology: (accountId: string, deploymentId: string) =>
		["deploymentTopology", accountId, deploymentId] as const,
	deploymentUIEvents: (accountId: string, deploymentId: string) =>
		["deploymentUIEvents", accountId, deploymentId] as const,
	deploymentCapacitySummary: (accountId: string, deploymentId: string) =>
		["deploymentCapacitySummary", accountId, deploymentId] as const,
	deploymentCapacityInventory: (accountId: string, deploymentId: string) =>
		["deploymentCapacityInventory", accountId, deploymentId] as const,
	deploymentCapacityGrowth: (
		accountId: string,
		deploymentId: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"deploymentCapacityGrowth",
			accountId,
			deploymentId,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	accountForwardNetworks: (accountId: string) =>
		["accountForwardNetworks", accountId] as const,
	forwardNetworkCapacitySummary: (accountId: string, networkRef: string) =>
		["forwardNetworkCapacitySummary", accountId, networkRef] as const,
	forwardNetworkCapacityInventory: (accountId: string, networkRef: string) =>
		["forwardNetworkCapacityInventory", accountId, networkRef] as const,
	forwardNetworkCapacityCoverage: (accountId: string, networkRef: string) =>
		["forwardNetworkCapacityCoverage", accountId, networkRef] as const,
	forwardNetworkCapacitySnapshotDelta: (
		accountId: string,
		networkRef: string,
	) => ["forwardNetworkCapacitySnapshotDelta", accountId, networkRef] as const,
	forwardNetworkCapacityUpgradeCandidates: (
		accountId: string,
		networkRef: string,
		window: string,
	) =>
		[
			"forwardNetworkCapacityUpgradeCandidates",
			accountId,
			networkRef,
			window,
		] as const,
	accountForwardNetworkCapacityPortfolio: (accountId: string) =>
		["accountForwardNetworkCapacityPortfolio", accountId] as const,
	forwardNetworkCapacityGrowth: (
		accountId: string,
		networkRef: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"forwardNetworkCapacityGrowth",
			accountId,
			networkRef,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	accountForwardConfig: (accountId: string) =>
		["accountForwardConfig", accountId] as const,
	accountForwardCollectors: (accountId: string) =>
		["accountForwardCollectors", accountId] as const,
	forwardCollectors: () => ["forwardCollectors"] as const,
	userForwardCollector: () => ["userForwardCollector"] as const,
	userCollectorRuntime: () => ["userCollectorRuntime"] as const,
	userCollectorLogs: () => ["userCollectorLogs"] as const,
	userGitCredentials: () => ["userGitCredentials"] as const,
	userSettings: () => ["userSettings"] as const,
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
	userForwardCollectorConfigRuntime: (id: string) =>
		["userForwardCollectorConfigRuntime", id] as const,
	userForwardCollectorConfigLogs: (id: string) =>
		["userForwardCollectorConfigLogs", id] as const,
	userServiceNowConfig: () => ["userServiceNowConfig"] as const,
	userServiceNowPdiStatus: () => ["userServiceNowPdiStatus"] as const,
	userServiceNowSchemaStatus: () => ["userServiceNowSchemaStatus"] as const,
	userGeminiConfig: () => ["userGeminiConfig"] as const,
	userAIHistory: () => ["userAIHistory"] as const,
	storageFiles: () => ["storageFiles"] as const,
	accountArtifacts: (accountId: string) =>
		["accountArtifacts", accountId] as const,
	userArtifacts: (prefix: string) => ["userArtifacts", prefix] as const,
	accountEveServers: (accountId: string) =>
		["accountEveServers", accountId] as const,
	accountEveLabs: (
		accountId: string,
		server: string,
		path: string,
		recursive: boolean,
	) =>
		["accountEveLabs", accountId, server, path, recursive ? "1" : "0"] as const,
	accountNetlabServers: (accountId: string) =>
		["accountNetlabServers", accountId] as const,
	notifications: (includeRead?: boolean, limit?: string) =>
		["notifications", includeRead ? "1" : "0", limit ?? ""] as const,
	syslogEvents: (limit?: string) => ["syslogEvents", limit ?? ""] as const,
	snmpTrapEvents: (limit?: string) => ["snmpTrapEvents", limit ?? ""] as const,
	accountTemplates: (
		accountId: string,
		kind: string,
		source: string,
		repo?: string,
		dir?: string,
	) =>
		[
			"accountTemplates",
			accountId,
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
	policyReportsChecks: (accountId: string) =>
		["policyReportsChecks", accountId] as const,
	policyReportsPacks: (accountId: string) =>
		["policyReportsPacks", accountId] as const,
	policyReportsSnapshots: (accountId: string, networkId: string) =>
		["policyReportsSnapshots", accountId, networkId] as const,
	policyReportsRecertCampaigns: (accountId: string, status?: string) =>
		["policyReportsRecertCampaigns", accountId, status ?? ""] as const,
	policyReportsRecertCampaign: (accountId: string, campaignId: string) =>
		["policyReportsRecertCampaign", accountId, campaignId] as const,
	policyReportsRecertAssignments: (
		accountId: string,
		campaignId?: string,
		status?: string,
		assignee?: string,
	) =>
		[
			"policyReportsRecertAssignments",
			accountId,
			campaignId ?? "",
			status ?? "",
			assignee ?? "",
		] as const,
	policyReportsExceptions: (
		accountId: string,
		forwardNetworkId?: string,
		status?: string,
	) =>
		[
			"policyReportsExceptions",
			accountId,
			forwardNetworkId ?? "",
			status ?? "",
		] as const,
	policyReportsZones: (accountId: string, forwardNetworkId: string) =>
		["policyReportsZones", accountId, forwardNetworkId] as const,
	policyReportsRuns: (
		accountId: string,
		forwardNetworkId?: string,
		packId?: string,
		status?: string,
	) =>
		[
			"policyReportsRuns",
			accountId,
			forwardNetworkId ?? "",
			packId ?? "",
			status ?? "",
		] as const,
	policyReportsRun: (accountId: string, runId: string) =>
		["policyReportsRun", accountId, runId] as const,
	policyReportsRunFindings: (
		accountId: string,
		runId: string,
		checkId?: string,
	) => ["policyReportsRunFindings", accountId, runId, checkId ?? ""] as const,
	policyReportsFindings: (
		accountId: string,
		forwardNetworkId?: string,
		checkId?: string,
		status?: string,
	) =>
		[
			"policyReportsFindings",
			accountId,
			forwardNetworkId ?? "",
			checkId ?? "",
			status ?? "",
		] as const,
};
