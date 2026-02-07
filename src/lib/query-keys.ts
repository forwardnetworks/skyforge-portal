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
	secureTrackChecks: (workspaceId: string) =>
		["secureTrackChecks", workspaceId] as const,
	secureTrackPacks: (workspaceId: string) =>
		["secureTrackPacks", workspaceId] as const,
	secureTrackSnapshots: (workspaceId: string, networkId: string) =>
		["secureTrackSnapshots", workspaceId, networkId] as const,
};
