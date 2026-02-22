export const queryKeys = {
	session: () => ["session"] as const,
	uiConfig: () => ["uiConfig"] as const,
	dashboardSnapshot: () => ["dashboardSnapshot"] as const,
	statusSummary: () => ["statusSummary"] as const,
	runLogs: (runId: string) => ["runLogs", runId] as const,
	deploymentTopology: (userId: string, deploymentId: string) =>
		["deploymentTopology", userId, deploymentId] as const,
	deploymentUIEvents: (userId: string, deploymentId: string) =>
		["deploymentUIEvents", userId, deploymentId] as const,
	deploymentCapacitySummary: (userId: string, deploymentId: string) =>
		["deploymentCapacitySummary", userId, deploymentId] as const,
	deploymentCapacityInventory: (userId: string, deploymentId: string) =>
		["deploymentCapacityInventory", userId, deploymentId] as const,
	deploymentCapacityGrowth: (
		userId: string,
		deploymentId: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"deploymentCapacityGrowth",
			userId,
			deploymentId,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	workspaceForwardNetworks: (userId: string) =>
		["workspaceForwardNetworks", userId] as const,
	forwardNetworkCapacitySummary: (userId: string, networkRef: string) =>
		["forwardNetworkCapacitySummary", userId, networkRef] as const,
	forwardNetworkCapacityInventory: (userId: string, networkRef: string) =>
		["forwardNetworkCapacityInventory", userId, networkRef] as const,
	forwardNetworkCapacityCoverage: (userId: string, networkRef: string) =>
		["forwardNetworkCapacityCoverage", userId, networkRef] as const,
	forwardNetworkCapacitySnapshotDelta: (
		userId: string,
		networkRef: string,
	) =>
		["forwardNetworkCapacitySnapshotDelta", userId, networkRef] as const,
	forwardNetworkCapacityUpgradeCandidates: (
		userId: string,
		networkRef: string,
		window: string,
	) =>
		[
			"forwardNetworkCapacityUpgradeCandidates",
			userId,
			networkRef,
			window,
		] as const,
	workspaceForwardNetworkCapacityPortfolio: (userId: string) =>
		["workspaceForwardNetworkCapacityPortfolio", userId] as const,
	forwardNetworkCapacityGrowth: (
		userId: string,
		networkRef: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"forwardNetworkCapacityGrowth",
			userId,
			networkRef,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	workspaces: () => ["workspaces"] as const,
	workspaceForwardConfig: (userId: string) =>
		["workspaceForwardConfig", userId] as const,
	workspaceForwardCollectors: (userId: string) =>
		["workspaceForwardCollectors", userId] as const,
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
	storageFiles: () => ["storageFiles"] as const,
	workspaceArtifacts: (userId: string) =>
		["workspaceArtifacts", userId] as const,
	workspaceEveServers: (userId: string) =>
		["workspaceEveServers", userId] as const,
	workspaceEveLabs: (
		userId: string,
		server: string,
		path: string,
		recursive: boolean,
	) =>
		[
			"workspaceEveLabs",
			userId,
			server,
			path,
			recursive ? "1" : "0",
		] as const,
	workspaceNetlabServers: (userId: string) =>
		["workspaceNetlabServers", userId] as const,
	notifications: (includeRead?: boolean, limit?: string) =>
		["notifications", includeRead ? "1" : "0", limit ?? ""] as const,
	syslogEvents: (limit?: string) => ["syslogEvents", limit ?? ""] as const,
	snmpTrapEvents: (limit?: string) => ["snmpTrapEvents", limit ?? ""] as const,
	workspaceTemplates: (
		userId: string,
		kind: string,
		source: string,
		repo?: string,
		dir?: string,
	) =>
		[
			"workspaceTemplates",
			userId,
			kind,
			source,
			repo ?? "",
			dir ?? "",
		] as const,
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
	policyReportsChecks: (userId: string) =>
		["policyReportsChecks", userId] as const,
	policyReportsPacks: (userId: string) =>
		["policyReportsPacks", userId] as const,
	policyReportsSnapshots: (userId: string, networkId: string) =>
		["policyReportsSnapshots", userId, networkId] as const,
	policyReportsRecertCampaigns: (userId: string, status?: string) =>
		["policyReportsRecertCampaigns", userId, status ?? ""] as const,
	policyReportsRecertCampaign: (userId: string, campaignId: string) =>
		["policyReportsRecertCampaign", userId, campaignId] as const,
	policyReportsRecertAssignments: (
		userId: string,
		campaignId?: string,
		status?: string,
		assignee?: string,
	) =>
		[
			"policyReportsRecertAssignments",
			userId,
			campaignId ?? "",
			status ?? "",
			assignee ?? "",
		] as const,
	policyReportsExceptions: (
		userId: string,
		forwardNetworkId?: string,
		status?: string,
	) =>
		[
			"policyReportsExceptions",
			userId,
			forwardNetworkId ?? "",
			status ?? "",
		] as const,
	policyReportsZones: (userId: string, forwardNetworkId: string) =>
		["policyReportsZones", userId, forwardNetworkId] as const,
	policyReportsRuns: (
		userId: string,
		forwardNetworkId?: string,
		packId?: string,
		status?: string,
	) =>
		[
			"policyReportsRuns",
			userId,
			forwardNetworkId ?? "",
			packId ?? "",
			status ?? "",
		] as const,
	policyReportsRun: (userId: string, runId: string) =>
		["policyReportsRun", userId, runId] as const,
	policyReportsRunFindings: (
		userId: string,
		runId: string,
		checkId?: string,
	) => ["policyReportsRunFindings", userId, runId, checkId ?? ""] as const,
	policyReportsFindings: (
		userId: string,
		forwardNetworkId?: string,
		checkId?: string,
		status?: string,
	) =>
		[
			"policyReportsFindings",
			userId,
			forwardNetworkId ?? "",
			checkId ?? "",
			status ?? "",
		] as const,
};
