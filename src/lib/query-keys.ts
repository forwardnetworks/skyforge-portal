export const queryKeys = {
	session: () => ["session"] as const,
	uiConfig: () => ["uiConfig"] as const,
	deploymentLifetimePolicy: () => ["deploymentLifetimePolicy"] as const,
	dashboardSnapshot: () => ["dashboardSnapshot"] as const,
	statusSummary: () => ["statusSummary"] as const,
	runLogs: (runId: string) => ["runLogs", runId] as const,
	runLifecycle: (runId: string) => ["runLifecycle", runId] as const,
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
	userForwardNetworks: (userId: string) =>
		["userForwardNetworks", userId] as const,
	forwardNetworkCapacitySummary: (userId: string, networkRef: string) =>
		["forwardNetworkCapacitySummary", userId, networkRef] as const,
	forwardNetworkCapacityInventory: (userId: string, networkRef: string) =>
		["forwardNetworkCapacityInventory", userId, networkRef] as const,
	forwardNetworkCapacityCoverage: (userId: string, networkRef: string) =>
		["forwardNetworkCapacityCoverage", userId, networkRef] as const,
	forwardNetworkCapacitySnapshotDelta: (userId: string, networkRef: string) =>
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
	userForwardNetworkCapacityPortfolio: (userId: string) =>
		["userForwardNetworkCapacityPortfolio", userId] as const,
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
	userScopes: () => ["userScopes"] as const,
	userPlatformReservations: () => ["userPlatformReservations"] as const,
	currentPlatformReservationLifecycle: (id: string) =>
		["currentPlatformReservationLifecycle", id] as const,
	currentPlatformReservationPreflight: (
		resourceClass: string,
		type: string,
		priorityTier: string,
		templateRef: string,
		startAt: string,
		endAt: string,
	) =>
		[
			"currentPlatformReservationPreflight",
			resourceClass,
			type,
			priorityTier,
			templateRef,
			startAt,
			endAt,
		] as const,
	currentPlatformAvailability: () => ["currentPlatformAvailability"] as const,
	configChangeRuns: () => ["configChangeRuns"] as const,
	configChangeRun: (id: string) => ["configChangeRun", id] as const,
	configChangeRunReview: (id: string) =>
		["configChangeRunReview", id] as const,
	configChangeRunLifecycle: (id: string) =>
		["configChangeRunLifecycle", id] as const,
	compositePlans: (userId: string) => ["compositePlans", userId] as const,
	compositePlanPreview: (userId: string) =>
		["compositePlanPreview", userId] as const,
	compositeRuns: (userId: string) => ["compositeRuns", userId] as const,
	userForwardConfig: (userId: string) => ["userForwardConfig", userId] as const,
	userForwardCollectors: (userId: string) =>
		["userForwardCollectors", userId] as const,
	forwardCollectors: () => ["forwardCollectors"] as const,
	userForwardCollector: () => ["userForwardCollector"] as const,
	userCollectorRuntime: () => ["userCollectorRuntime"] as const,
	userCollectorLogs: () => ["userCollectorLogs"] as const,
	userGitCredentials: () => ["userGitCredentials"] as const,
	userSettings: () => ["userSettings"] as const,
	userApiTokens: () => ["userApiTokens"] as const,
	userVariableGroups: () => ["userVariableGroups"] as const,
	userNetlabDeviceOptions: (userId: string) =>
		["userNetlabDeviceOptions", userId] as const,
	userNetlabServers: () => ["userNetlabServers"] as const,
	userContainerlabServers: () => ["userContainerlabServers"] as const,
	userFixiaServers: () => ["userFixiaServers"] as const,
	userAwsStaticCredentials: () => ["userAwsStaticCredentials"] as const,
	userAwsSsoCredentials: () => ["userAwsSsoCredentials"] as const,
	awsSsoConfig: () => ["awsSsoConfig"] as const,
	awsSsoStatus: () => ["awsSsoStatus"] as const,
	userAzureCredentials: () => ["userAzureCredentials"] as const,
	userGcpCredentials: () => ["userGcpCredentials"] as const,
	userIbmCredentials: () => ["userIbmCredentials"] as const,
	userForwardCollectorConfigs: () => ["userForwardCollectorConfigs"] as const,
	userForwardTenantRebuildRuns: () => ["userForwardTenantRebuildRuns"] as const,
	userForwardCollectorConfigRuntime: (id: string) =>
		["userForwardCollectorConfigRuntime", id] as const,
	userForwardCollectorConfigLogs: (id: string) =>
		["userForwardCollectorConfigLogs", id] as const,
	userServiceNowConfig: () => ["userServiceNowConfig"] as const,
	userServiceNowSetupStatus: () => ["userServiceNowSetupStatus"] as const,
	userServiceNowPdiStatus: () => ["userServiceNowPdiStatus"] as const,
	userServiceNowSchemaStatus: () => ["userServiceNowSchemaStatus"] as const,
	userTeamsConfig: () => ["userTeamsConfig"] as const,
	storageFiles: () => ["storageFiles"] as const,
	userArtifacts: (userId: string) => ["userArtifacts", userId] as const,
	userNetlabServersByScope: (userId: string) =>
		["userNetlabServersByScope", userId] as const,
	notifications: (includeRead?: boolean, limit?: string) =>
		["notifications", includeRead ? "1" : "0", limit ?? ""] as const,
	syslogEvents: (limit?: string) => ["syslogEvents", limit ?? ""] as const,
	snmpTrapEvents: (limit?: string) => ["snmpTrapEvents", limit ?? ""] as const,
	userTemplates: (
		userId: string,
		kind: string,
		source: string,
		repo?: string,
		dir?: string,
	) => ["userTemplates", userId, kind, source, repo ?? "", dir ?? ""] as const,
	webhookEvents: (limit?: string) => ["webhookEvents", limit ?? ""] as const,
	notificationSettings: () => ["notificationSettings"] as const,
	userObservabilitySummary: () => ["userObservabilitySummary"] as const,
	userObservabilitySeries: (metric: string, window?: string) =>
		["userObservabilitySeries", metric, window ?? ""] as const,
	observabilitySummary: () => ["observabilitySummary"] as const,
	observabilitySeries: (metric: string, window?: string) =>
		["observabilitySeries", metric, window ?? ""] as const,
	observabilitySlowRequests: (
		window?: string,
		endpoint?: string,
		limit?: string,
	) =>
		[
			"observabilitySlowRequests",
			window ?? "",
			endpoint ?? "",
			limit ?? "",
		] as const,
	adminQuickDeployCatalog: () => ["adminQuickDeployCatalog"] as const,
	adminServiceNowGlobalConfig: () => ["adminServiceNowGlobalConfig"] as const,
	adminTeamsGlobalConfig: () => ["adminTeamsGlobalConfig"] as const,
	adminPlatformOverview: () => ["adminPlatformOverview"] as const,
	adminPlatformRuntimePolicy: () => ["adminPlatformRuntimePolicy"] as const,
	adminPlatformReservations: () => ["adminPlatformReservations"] as const,
	adminPlatformUserPolicy: (username: string) =>
		["adminPlatformUserPolicy", username] as const,
	adminForwardTenantRebuildRuns: (username: string) =>
		["adminForwardTenantRebuildRuns", username] as const,
	adminRbacUsers: () => ["adminRbacUsers"] as const,
	adminConfig: () => ["adminConfig"] as const,
	adminAuthSettings: () => ["adminAuthSettings"] as const,
	adminOidcSettings: () => ["adminOidcSettings"] as const,
	adminApiCatalog: () => ["adminApiCatalog"] as const,
	adminUserApiPermissions: (username: string) =>
		["adminUserApiPermissions", username] as const,
	adminAudit: (limit?: string) => ["adminAudit", limit ?? ""] as const,
	adminImpersonateStatus: () => ["adminImpersonateStatus"] as const,
	registryRepos: (q: string) => ["registryRepos", q] as const,
	registryTags: (repo: string, q: string) => ["registryTags", repo, q] as const,
	forwardAnalyticsChecks: (userId: string) =>
		["forwardAnalyticsChecks", userId] as const,
	forwardAnalyticsPacks: (userId: string) =>
		["forwardAnalyticsPacks", userId] as const,
	forwardAnalyticsSnapshots: (userId: string, networkId: string) =>
		["forwardAnalyticsSnapshots", userId, networkId] as const,
	forwardAnalyticsRecertCampaigns: (userId: string, status?: string) =>
		["forwardAnalyticsRecertCampaigns", userId, status ?? ""] as const,
	forwardAnalyticsRecertCampaign: (userId: string, campaignId: string) =>
		["forwardAnalyticsRecertCampaign", userId, campaignId] as const,
	forwardAnalyticsRecertAssignments: (
		userId: string,
		campaignId?: string,
		status?: string,
		assignee?: string,
	) =>
		[
			"forwardAnalyticsRecertAssignments",
			userId,
			campaignId ?? "",
			status ?? "",
			assignee ?? "",
		] as const,
	currentPlatformPolicy: () => ["currentPlatformPolicy"] as const,
	forwardAnalyticsExceptions: (
		userId: string,
		forwardNetworkId?: string,
		status?: string,
	) =>
		[
			"forwardAnalyticsExceptions",
			userId,
			forwardNetworkId ?? "",
			status ?? "",
		] as const,
	forwardAnalyticsZones: (userId: string, forwardNetworkId: string) =>
		["forwardAnalyticsZones", userId, forwardNetworkId] as const,
	forwardAnalyticsRuns: (
		userId: string,
		forwardNetworkId?: string,
		packId?: string,
		status?: string,
	) =>
		[
			"forwardAnalyticsRuns",
			userId,
			forwardNetworkId ?? "",
			packId ?? "",
			status ?? "",
		] as const,
	forwardAnalyticsRun: (userId: string, runId: string) =>
		["forwardAnalyticsRun", userId, runId] as const,
	forwardAnalyticsRunFindings: (
		userId: string,
		runId: string,
		checkId?: string,
	) => ["forwardAnalyticsRunFindings", userId, runId, checkId ?? ""] as const,
	forwardAnalyticsFindings: (
		userId: string,
		forwardNetworkId?: string,
		checkId?: string,
		status?: string,
	) =>
		[
			"forwardAnalyticsFindings",
			userId,
			forwardNetworkId ?? "",
			checkId ?? "",
			status ?? "",
		] as const,
};
