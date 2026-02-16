export const queryKeys = {
	session: () => ["session"] as const,
	uiConfig: () => ["uiConfig"] as const,
	dashboardSnapshot: () => ["dashboardSnapshot"] as const,
	statusSummary: () => ["statusSummary"] as const,
	runLogs: (runId: string) => ["runLogs", runId] as const,
	deploymentTopology: (deploymentId: string) =>
		["deploymentTopology", deploymentId] as const,
	deploymentUIEvents: (deploymentId: string) =>
		["deploymentUIEvents", deploymentId] as const,
	deploymentCapacitySummary: (deploymentId: string) =>
		["deploymentCapacitySummary", deploymentId] as const,
	deploymentCapacityInventory: (deploymentId: string) =>
		["deploymentCapacityInventory", deploymentId] as const,
	deploymentCapacityGrowth: (
		deploymentId: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"deploymentCapacityGrowth",
			deploymentId,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	userForwardNetworks: () => ["userForwardNetworks"] as const,
	assuranceStudioScenarios: (networkRef: string) =>
		["assuranceStudioScenarios", networkRef] as const,
	assuranceStudioScenario: (networkRef: string, scenarioId: string) =>
		["assuranceStudioScenario", networkRef, scenarioId] as const,
	assuranceStudioRuns: (networkRef: string) =>
		["assuranceStudioRuns", networkRef] as const,
	assuranceStudioRun: (networkRef: string, runId: string) =>
		["assuranceStudioRun", networkRef, runId] as const,
	forwardNetworkAssuranceSummary: (networkRef: string) =>
		["forwardNetworkAssuranceSummary", networkRef] as const,
	forwardNetworkAssuranceHistory: (networkRef: string, limit?: string) =>
		["forwardNetworkAssuranceHistory", networkRef, limit ?? ""] as const,
	forwardNetworkCapacitySummary: (networkRef: string) =>
		["forwardNetworkCapacitySummary", networkRef] as const,
	forwardNetworkCapacityInventory: (networkRef: string) =>
		["forwardNetworkCapacityInventory", networkRef] as const,
	forwardNetworkCapacityCoverage: (networkRef: string) =>
		["forwardNetworkCapacityCoverage", networkRef] as const,
	forwardNetworkCapacitySnapshotDelta: (networkRef: string) =>
		["forwardNetworkCapacitySnapshotDelta", networkRef] as const,
	forwardNetworkCapacityUpgradeCandidates: (
		networkRef: string,
		window: string,
	) => ["forwardNetworkCapacityUpgradeCandidates", networkRef, window] as const,
	forwardNetworkCapacityPortfolio: () =>
		["forwardNetworkCapacityPortfolio"] as const,
	forwardNetworkCapacityGrowth: (
		networkRef: string,
		window: string,
		metric: string,
		compareHours: number,
		objectType: string,
	) =>
		[
			"forwardNetworkCapacityGrowth",
			networkRef,
			window,
			metric,
			String(compareHours),
			objectType,
		] as const,
	users: () => ["users"] as const,
	forwardConfig: () => ["forwardConfig"] as const,
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
	userArtifacts: (ownerUsername: string) =>
		["userArtifacts", ownerUsername] as const,
	userEveLabs: (
		ownerUsername: string,
		server: string,
		path: string,
		recursive: boolean,
	) =>
		[
			"userEveLabs",
			ownerUsername,
			server,
			path,
			recursive ? "1" : "0",
		] as const,
	userNetlabServersByOwner: (ownerUsername: string) =>
		["userNetlabServersByOwner", ownerUsername] as const,
	notifications: (includeRead?: boolean, limit?: string) =>
		["notifications", includeRead ? "1" : "0", limit ?? ""] as const,
	syslogEvents: (limit?: string) => ["syslogEvents", limit ?? ""] as const,
	snmpTrapEvents: (limit?: string) => ["snmpTrapEvents", limit ?? ""] as const,
	userTemplates: (
		ownerUsername: string,
		kind: string,
		source: string,
		repo?: string,
		dir?: string,
	) =>
		[
			"userTemplates",
			ownerUsername,
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
	policyReportsChecks: () => ["policyReportsChecks"] as const,
	policyReportsPacks: () => ["policyReportsPacks"] as const,
	policyReportsSnapshots: (networkId: string) =>
		["policyReportsSnapshots", networkId] as const,
	policyReportsRecertCampaigns: (status?: string) =>
		["policyReportsRecertCampaigns", status ?? ""] as const,
	policyReportsRecertCampaign: (campaignId: string) =>
		["policyReportsRecertCampaign", campaignId] as const,
	policyReportsRecertAssignments: (
		campaignId?: string,
		status?: string,
		assignee?: string,
	) =>
		[
			"policyReportsRecertAssignments",
			campaignId ?? "",
			status ?? "",
			assignee ?? "",
		] as const,
	policyReportsExceptions: (forwardNetworkId?: string, status?: string) =>
		["policyReportsExceptions", forwardNetworkId ?? "", status ?? ""] as const,
	policyReportsZones: (forwardNetworkId: string) =>
		["policyReportsZones", forwardNetworkId] as const,
	policyReportsRuns: (
		forwardNetworkId?: string,
		packId?: string,
		status?: string,
	) =>
		[
			"policyReportsRuns",
			forwardNetworkId ?? "",
			packId ?? "",
			status ?? "",
		] as const,
	policyReportsRun: (runId: string) => ["policyReportsRun", runId] as const,
	policyReportsRunFindings: (runId: string, checkId?: string) =>
		["policyReportsRunFindings", runId, checkId ?? ""] as const,
	policyReportsFindings: (
		forwardNetworkId?: string,
		checkId?: string,
		status?: string,
	) =>
		[
			"policyReportsFindings",
			forwardNetworkId ?? "",
			checkId ?? "",
			status ?? "",
		] as const,
};
