export const queryKeys = {
  session: () => ["session"] as const,
  dashboardSnapshot: () => ["dashboardSnapshot"] as const,
  platformHealth: () => ["platformHealth"] as const,
  runLogs: (runId: string) => ["runLogs", runId] as const,
  workspaces: () => ["workspaces"] as const,
  storageFiles: () => ["storageFiles"] as const,
  eveServers: () => ["eveServers"] as const,
  netlabServers: () => ["netlabServers"] as const,
  workspaceTemplates: (workspaceId: string, kind: string, source: string, repo?: string, dir?: string) =>
    ["workspaceTemplates", workspaceId, kind, source, repo ?? "", dir ?? ""] as const,
  pkiRoot: () => ["pkiRoot"] as const,
  pkiCerts: () => ["pkiCerts"] as const,
  pkiSshRoot: () => ["pkiSshRoot"] as const,
  pkiSshCerts: () => ["pkiSshCerts"] as const,
  webhookEvents: (limit?: string) => ["webhookEvents", limit ?? ""] as const,
  notificationSettings: () => ["notificationSettings"] as const,
  governanceSummary: () => ["governanceSummary"] as const,
  governanceResources: (limit?: string) => ["governanceResources", limit ?? ""] as const,
  governanceCosts: (limit?: string) => ["governanceCosts", limit ?? ""] as const,
  governanceUsage: (limit?: string) => ["governanceUsage", limit ?? ""] as const
};
