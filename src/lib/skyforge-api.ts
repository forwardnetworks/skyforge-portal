import { SKYFORGE_PROXY_ROOT, SKYFORGE_API, buildLoginUrl } from "./skyforge-config";
import { apiFetch } from "./http";
import type { components, operations } from "./openapi.gen";

export type ISO8601 = string;

export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };
export type JSONMap = Record<string, JSONValue>;

export type ExternalTemplateRepo = components["schemas"]["skyforge.ExternalTemplateRepo"];
export type SkyforgeWorkspace = components["schemas"]["skyforge.SkyforgeWorkspace"];
export type NotificationRecord = components["schemas"]["skyforge.NotificationRecord"];

// NOTE: OpenAPI schema may lag behind the live dashboard/deployment view (e.g. activeTaskId/queueDepth).
// This type reflects the fields Skyforge currently emits in the dashboard snapshot and related APIs.
export type WorkspaceDeployment = {
  id: string;
  workspaceId: string;
  name: string;
  type: "terraform" | "netlab" | "netlab-c9s" | "containerlab" | "clabernetes" | string;
  config: JSONMap;
  createdBy?: string;
  createdAt?: ISO8601;
  updatedAt?: ISO8601;
  lastTaskWorkspaceId?: number;
  lastTaskId?: number;
  lastStatus?: string;
  lastStartedAt?: ISO8601;
  lastFinishedAt?: ISO8601;
  activeTaskId?: number;
  activeTaskStatus?: string;
  queueDepth?: number;
};

export type DeploymentTopology = {
  generatedAt: ISO8601;
  source: string;
  artifactKey?: string;
  nodes: Array<{
    id: string;
    label: string;
    kind?: string;
    mgmtIp?: string;
    status?: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceIf?: string;
    targetIf?: string;
    label?: string;
  }>;
};

export type LinkImpairmentRequest = {
  edgeId: string;
  action: "set" | "clear";
  delayMs?: number;
  jitterMs?: number;
  lossPct?: number;
  rateKbps?: number;
};

export type LinkImpairmentResponse = {
  appliedAt: ISO8601;
  edge: DeploymentTopology["edges"][number];
  results: Array<{
    node: string;
    namespace: string;
    pod: string;
    container: string;
    ifName: string;
    command: string;
    stdout?: string;
    stderr?: string;
    error?: string;
  }>;
};

export type ForwardCollectorSummary = {
  id: string;
  name: string;
  username: string;
};

export type ListForwardCollectorsResponse = {
  collectors: ForwardCollectorSummary[];
};

// Dashboard snapshot is delivered via SSE (`/api/dashboard/events`) and is not described in OpenAPI.
export type DashboardSnapshot = {
  refreshedAt: ISO8601;
  workspaces: SkyforgeWorkspace[];
  deployments: WorkspaceDeployment[];
  runs: JSONMap[];
  templatesIndexUpdatedAt?: ISO8601;
  awsSsoStatus?: {
    configured: boolean;
    connected: boolean;
    expiresAt?: ISO8601;
    lastAuthenticatedAt?: ISO8601;
  };
};

export { buildLoginUrl, SKYFORGE_API, SKYFORGE_PROXY_ROOT };

export type SessionResponseEnvelope =
  operations["GET:skyforge.Session"]["responses"][200]["content"]["application/json"];

export async function getSession(): Promise<SessionResponseEnvelope> {
  return apiFetch<SessionResponseEnvelope>("/api/session");
}

export async function logout(): Promise<void> {
  const resp = await fetch(`${SKYFORGE_PROXY_ROOT}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`logout failed (${resp.status}): ${text}`);
  }
}

export type GetWorkspacesResponse =
  operations["GET:skyforge.GetWorkspaces"]["responses"][200]["content"]["application/json"];

export async function getWorkspaces(): Promise<GetWorkspacesResponse> {
  return apiFetch<GetWorkspacesResponse>("/api/workspaces");
}

export type GetUserNotificationsResponse =
  operations["GET:skyforge.GetUserNotifications"]["responses"][200]["content"]["application/json"];
export async function getUserNotifications(userID: string, params?: { include_read?: string; limit?: string }): Promise<GetUserNotificationsResponse> {
  const qs = new URLSearchParams();
  if (params?.include_read) qs.set("include_read", params.include_read);
  if (params?.limit) qs.set("limit", params.limit);
  const suffix = qs.toString();
  return apiFetch<GetUserNotificationsResponse>(`/notifications/for-user/${encodeURIComponent(userID)}${suffix ? `?${suffix}` : ""}`);
}

export type MarkAllNotificationsAsReadResponse =
  operations["PUT:skyforge.MarkAllNotificationsAsRead"]["responses"][200]["content"]["application/json"];
export async function markAllNotificationsAsRead(userID: string): Promise<MarkAllNotificationsAsReadResponse> {
  return apiFetch<MarkAllNotificationsAsReadResponse>(`/notifications/for-user/${encodeURIComponent(userID)}/read-all`, { method: "PUT" });
}

export type MarkNotificationAsReadResponse =
  operations["PUT:skyforge.MarkNotificationAsRead"]["responses"][200]["content"]["application/json"];
export async function markNotificationAsRead(id: string): Promise<MarkNotificationAsReadResponse> {
  return apiFetch<MarkNotificationAsReadResponse>(`/notifications/single/${encodeURIComponent(id)}/read`, { method: "PUT" });
}

export type DeleteNotificationResponse =
  operations["DELETE:skyforge.DeleteNotification"]["responses"][200]["content"]["application/json"];
export async function deleteNotification(id: string): Promise<DeleteNotificationResponse> {
  return apiFetch<DeleteNotificationResponse>(`/notifications/single/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export type ListWorkspaceNetlabServersResponse =
  operations["GET:skyforge.ListWorkspaceNetlabServers"]["responses"][200]["content"]["application/json"];

export async function listWorkspaceNetlabServers(workspaceId: string): Promise<ListWorkspaceNetlabServersResponse> {
  return apiFetch<ListWorkspaceNetlabServersResponse>(`/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/servers`);
}

export async function listForwardCollectors(): Promise<ListForwardCollectorsResponse> {
  return apiFetch<ListForwardCollectorsResponse>("/api/forward/collectors");
}

export type UpdateDeploymentForwardConfigRequest = {
  enabled: boolean;
  collectorUsername?: string;
};

export type UpdateDeploymentForwardConfigResponse = {
  workspaceId: string;
  deploymentId: string;
  enabled: boolean;
  collectorUsername?: string;
  forwardNetworkId?: string;
  forwardSnapshotUrl?: string;
};

export async function updateDeploymentForwardConfig(
  workspaceId: string,
  deploymentId: string,
  body: UpdateDeploymentForwardConfigRequest
): Promise<UpdateDeploymentForwardConfigResponse> {
  return apiFetch<UpdateDeploymentForwardConfigResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/forward`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export type SyncDeploymentForwardResponse = {
  workspaceId: string;
  deploymentId: string;
  run: JSONMap;
};

export async function syncDeploymentForward(workspaceId: string, deploymentId: string): Promise<SyncDeploymentForwardResponse> {
  return apiFetch<SyncDeploymentForwardResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/forward/sync`,
    { method: "POST", body: "{}" }
  );
}

export async function setDeploymentLinkImpairment(
  workspaceId: string,
  deploymentId: string,
  body: LinkImpairmentRequest
): Promise<LinkImpairmentResponse> {
  return apiFetch<LinkImpairmentResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/links/impair`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

type TemplatesQuery = {
  source?: "workspace" | "blueprints" | "custom" | "external" | string;
  repo?: string;
  dir?: string;
};

export type WorkspaceTemplatesResponse = {
  workspaceId: string;
  repo: string;
  branch: string;
  dir: string;
  templates: string[];
  headSha?: string;
  cached?: boolean;
  updatedAt?: ISO8601;
};

export async function getWorkspaceNetlabTemplates(
  workspaceId: string,
  query?: TemplatesQuery
): Promise<WorkspaceTemplatesResponse> {
  const params = new URLSearchParams();
  if (query?.source) params.set("source", query.source);
  if (query?.repo) params.set("repo", query.repo);
  if (query?.dir) params.set("dir", query.dir);
  const qs = params.toString();
  return apiFetch<WorkspaceTemplatesResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/netlab/templates${qs ? `?${qs}` : ""}`
  );
}

export async function getWorkspaceContainerlabTemplates(
  workspaceId: string,
  query?: TemplatesQuery
): Promise<WorkspaceTemplatesResponse> {
  const params = new URLSearchParams();
  if (query?.source) params.set("source", query.source);
  if (query?.repo) params.set("repo", query.repo);
  if (query?.dir) params.set("dir", query.dir);
  const qs = params.toString();
  return apiFetch<WorkspaceTemplatesResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/containerlab/templates${qs ? `?${qs}` : ""}`
  );
}

export type CreateWorkspaceDeploymentRequest = NonNullable<
  operations["POST:skyforge.CreateWorkspaceDeployment"]["requestBody"]
>["content"]["application/json"];
export type CreateWorkspaceDeploymentResponse =
  operations["POST:skyforge.CreateWorkspaceDeployment"]["responses"][200]["content"]["application/json"];

export async function createWorkspaceDeployment(
  workspaceId: string,
  body: CreateWorkspaceDeploymentRequest
): Promise<CreateWorkspaceDeploymentResponse> {
  return apiFetch<CreateWorkspaceDeploymentResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export type CreateWorkspaceRequest = NonNullable<
  operations["POST:skyforge.CreateWorkspace"]["requestBody"]
>["content"]["application/json"];

export type CreateWorkspaceResponse =
  operations["POST:skyforge.CreateWorkspace"]["responses"][200]["content"]["application/json"];

export async function createWorkspace(
  body: CreateWorkspaceRequest
): Promise<CreateWorkspaceResponse> {
  return apiFetch<CreateWorkspaceResponse>(
    "/api/workspaces",
    { method: "POST", body: JSON.stringify(body) }
  );
}

export type UpdateWorkspaceMembersRequest = NonNullable<
  operations["PUT:skyforge.UpdateWorkspaceMembers"]["requestBody"]
>["content"]["application/json"];
export type UpdateWorkspaceMembersResponse =
  operations["PUT:skyforge.UpdateWorkspaceMembers"]["responses"][200]["content"]["application/json"];
export async function updateWorkspaceMembers(workspaceId: string, body: UpdateWorkspaceMembersRequest): Promise<UpdateWorkspaceMembersResponse> {
  return apiFetch<UpdateWorkspaceMembersResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/members`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export async function getDeploymentTopology(workspaceId: string, deploymentId: string): Promise<DeploymentTopology> {
  return apiFetch<DeploymentTopology>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/topology`
  );
}

export type DeleteWorkspaceResponse =
  operations["DELETE:skyforge.DeleteWorkspace"]["responses"][200]["content"]["application/json"];
export async function deleteWorkspace(workspaceId: string, params: { confirm: string; force?: boolean } ): Promise<DeleteWorkspaceResponse> {
  const qs = new URLSearchParams();
  qs.set("confirm", params.confirm);
  if (params.force) qs.set("force", "true");
  return apiFetch<DeleteWorkspaceResponse>(`/api/workspaces/${encodeURIComponent(workspaceId)}?${qs.toString()}`, { method: "DELETE" });
}

export type UserForwardCollectorResponse = {
  baseUrl?: string;
  skipTlsVerify?: boolean;
  username?: string;
  collectorId?: string;
  collectorUsername?: string;
  authorizationKey?: string;
  runtime?: {
    namespace?: string;
    deploymentName?: string;
    podName?: string;
    podPhase?: string;
    ready?: boolean;
    startTime?: ISO8601;
    image?: string;
    imageId?: string;
    remoteDigest?: string;
    updateAvailable?: boolean;
    updateStatus?: string;
    logsCommandHint?: string;
  };
  updatedAt?: ISO8601;
};

export type PutUserForwardCollectorRequest = {
  baseUrl?: string;
  skipTlsVerify?: boolean;
  username?: string;
  password?: string;
};

export async function getUserForwardCollector(): Promise<UserForwardCollectorResponse> {
  return apiFetch<UserForwardCollectorResponse>("/api/forward/collector");
}

export async function putUserForwardCollector(body: PutUserForwardCollectorRequest): Promise<UserForwardCollectorResponse> {
  return apiFetch<UserForwardCollectorResponse>("/api/forward/collector", { method: "PUT", body: JSON.stringify(body) });
}

export async function resetUserForwardCollector(): Promise<UserForwardCollectorResponse> {
  return apiFetch<UserForwardCollectorResponse>("/api/forward/collector/reset", { method: "POST", body: "{}" });
}

export async function clearUserForwardCollector(): Promise<void> {
  await apiFetch<unknown>("/api/forward/collector", { method: "DELETE" });
}

export type UserCollectorRuntimeResponse = {
  runtime?: {
    namespace?: string;
    deploymentName?: string;
    podName?: string;
    podPhase?: string;
    ready?: boolean;
    startTime?: ISO8601;
    image?: string;
    imageId?: string;
    remoteDigest?: string;
    updateAvailable?: boolean;
    updateStatus?: string;
    logsCommandHint?: string;
  };
};

export async function getUserCollectorRuntime(): Promise<UserCollectorRuntimeResponse> {
  return apiFetch<UserCollectorRuntimeResponse>("/api/forward/collector/runtime");
}

export async function restartUserCollector(): Promise<UserCollectorRuntimeResponse> {
  return apiFetch<UserCollectorRuntimeResponse>("/api/forward/collector/restart", { method: "POST", body: "{}" });
}

export type UpdateWorkspaceSettingsRequest = NonNullable<
  operations["PUT:skyforge.UpdateWorkspaceSettings"]["requestBody"]
>["content"]["application/json"];
export type UpdateWorkspaceSettingsResponse =
  operations["PUT:skyforge.UpdateWorkspaceSettings"]["responses"][200]["content"]["application/json"];
export async function updateWorkspaceSettings(workspaceId: string, body: UpdateWorkspaceSettingsRequest): Promise<UpdateWorkspaceSettingsResponse> {
  return apiFetch<UpdateWorkspaceSettingsResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/settings`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export type GetWorkspaceForwardConfigResponse =
  operations["GET:skyforge.GetWorkspaceForwardConfig"]["responses"][200]["content"]["application/json"];
export async function getWorkspaceForwardConfig(workspaceId: string): Promise<GetWorkspaceForwardConfigResponse> {
  return apiFetch<GetWorkspaceForwardConfigResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/forward`
  );
}

export type PutWorkspaceForwardConfigRequest = NonNullable<
  operations["PUT:skyforge.PutWorkspaceForwardConfig"]["requestBody"]
>["content"]["application/json"];
export type PutWorkspaceForwardConfigResponse =
  operations["PUT:skyforge.PutWorkspaceForwardConfig"]["responses"][200]["content"]["application/json"];
export async function putWorkspaceForwardConfig(workspaceId: string, body: PutWorkspaceForwardConfigRequest): Promise<PutWorkspaceForwardConfigResponse> {
  return apiFetch<PutWorkspaceForwardConfigResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/forward`,
    { method: "PUT", body: JSON.stringify(body) }
  );
}

export type ListWorkspaceForwardCollectorsResponse =
  operations["GET:skyforge.GetWorkspaceForwardCollectors"]["responses"][200]["content"]["application/json"];
export async function listWorkspaceForwardCollectors(workspaceId: string): Promise<ListWorkspaceForwardCollectorsResponse> {
  return apiFetch<ListWorkspaceForwardCollectorsResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/integrations/forward/collectors`
  );
}

export type ListWorkspaceArtifactsResponse =
  operations["GET:skyforge.ListWorkspaceArtifacts"]["responses"][200]["content"]["application/json"];
export async function listWorkspaceArtifacts(
  workspaceId: string,
  params?: { prefix?: string; limit?: string }
): Promise<ListWorkspaceArtifactsResponse> {
  const qs = new URLSearchParams();
  if (params?.prefix) qs.set("prefix", params.prefix);
  if (params?.limit) qs.set("limit", params.limit);
  const suffix = qs.toString();
  return apiFetch<ListWorkspaceArtifactsResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts${suffix ? `?${suffix}` : ""}`
  );
}

export type DownloadWorkspaceArtifactResponse =
  operations["GET:skyforge.DownloadWorkspaceArtifact"]["responses"][200]["content"]["application/json"];
export async function downloadWorkspaceArtifact(
  workspaceId: string,
  key: string
): Promise<DownloadWorkspaceArtifactResponse> {
  const qs = new URLSearchParams({ key });
  return apiFetch<DownloadWorkspaceArtifactResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/artifacts/download?${qs.toString()}`
  );
}

export type StorageListResponse = operations["GET:storage.List"]["responses"][200]["content"]["application/json"];

export async function listStorageFiles(): Promise<StorageListResponse> {
  return apiFetch<StorageListResponse>("/storage.List");
}

export type PKIRootResponse = operations["GET:skyforge.GetPKIRoot"]["responses"][200]["content"]["application/json"];
export async function getPKIRoot(): Promise<PKIRootResponse> {
  return apiFetch<PKIRootResponse>("/api/pki/root");
}

export type PKISSHRootResponse =
  operations["GET:skyforge.GetPKISSHRoot"]["responses"][200]["content"]["application/json"];
export async function getPKISSHRoot(): Promise<PKISSHRootResponse> {
  return apiFetch<PKISSHRootResponse>("/api/pki/ssh/root");
}

export type PKICertsResponse =
  operations["GET:skyforge.ListPKICerts"]["responses"][200]["content"]["application/json"];
export async function listPKICerts(): Promise<PKICertsResponse> {
  return apiFetch<PKICertsResponse>("/api/pki/certs");
}

export type PKISSHCertsResponse =
  operations["GET:skyforge.ListPKISSHCerts"]["responses"][200]["content"]["application/json"];
export async function listPKISSHCerts(): Promise<PKISSHCertsResponse> {
  return apiFetch<PKISSHCertsResponse>("/api/pki/ssh/certs");
}

export type IssuePKICertRequest = NonNullable<operations["POST:skyforge.IssuePKICert"]["requestBody"]>["content"]["application/json"];
export type IssuePKICertResponse =
  operations["POST:skyforge.IssuePKICert"]["responses"][200]["content"]["application/json"];
export async function issuePKICert(body: IssuePKICertRequest): Promise<IssuePKICertResponse> {
  return apiFetch<IssuePKICertResponse>("/api/pki/issue", { method: "POST", body: JSON.stringify(body) });
}

export type IssuePKISSHCertRequest = NonNullable<operations["POST:skyforge.IssuePKISSHCert"]["requestBody"]>["content"]["application/json"];
export type IssuePKISSHCertResponse =
  operations["POST:skyforge.IssuePKISSHCert"]["responses"][200]["content"]["application/json"];
export async function issuePKISSHCert(body: IssuePKISSHCertRequest): Promise<IssuePKISSHCertResponse> {
  return apiFetch<IssuePKISSHCertResponse>("/api/pki/ssh/issue", { method: "POST", body: JSON.stringify(body) });
}

export type ListWebhookEventsResponse =
  operations["GET:skyforge.ListWebhookEvents"]["responses"][200]["content"]["application/json"];
export async function listWebhookEvents(params?: { limit?: string; before_id?: string }): Promise<ListWebhookEventsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", params.limit);
  if (params?.before_id) qs.set("before_id", params.before_id);
  const suffix = qs.toString();
  return apiFetch<ListWebhookEventsResponse>(`/api/webhooks/events${suffix ? `?${suffix}` : ""}`);
}

export type ListSyslogEventsResponse =
  operations["GET:skyforge.ListSyslogEvents"]["responses"][200]["content"]["application/json"];
export async function listSyslogEvents(params?: {
  limit?: string;
  before_id?: string;
  source_ip?: string;
  unassigned?: string;
}): Promise<ListSyslogEventsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", params.limit);
  if (params?.before_id) qs.set("before_id", params.before_id);
  if (params?.source_ip) qs.set("source_ip", params.source_ip);
  if (params?.unassigned) qs.set("unassigned", params.unassigned);
  const suffix = qs.toString();
  return apiFetch<ListSyslogEventsResponse>(`/api/syslog/events${suffix ? `?${suffix}` : ""}`);
}

export type ListSnmpTrapEventsResponse =
  operations["GET:skyforge.ListSnmpTrapEvents"]["responses"][200]["content"]["application/json"];
export async function listSnmpTrapEvents(params?: { limit?: string; before_id?: string }): Promise<ListSnmpTrapEventsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", params.limit);
  if (params?.before_id) qs.set("before_id", params.before_id);
  const suffix = qs.toString();
  return apiFetch<ListSnmpTrapEventsResponse>(`/api/snmp/traps/events${suffix ? `?${suffix}` : ""}`);
}

export type NotificationSettingsResponse =
  operations["GET:skyforge.GetNotificationSettings"]["responses"][200]["content"]["application/json"];
export async function getNotificationSettings(): Promise<NotificationSettingsResponse> {
  return apiFetch<NotificationSettingsResponse>("/system/settings/notifications");
}

export type UpdateNotificationSettingsRequest = NonNullable<
  operations["PUT:skyforge.UpdateNotificationSettings"]["requestBody"]
>["content"]["application/json"];
export type UpdateNotificationSettingsResponse =
  operations["PUT:skyforge.UpdateNotificationSettings"]["responses"][200]["content"]["application/json"];
export async function updateNotificationSettings(
  body: UpdateNotificationSettingsRequest
): Promise<UpdateNotificationSettingsResponse> {
  return apiFetch<UpdateNotificationSettingsResponse>("/system/settings/notifications", {
    method: "PUT",
    body: JSON.stringify(body)
  });
}

export type GovernanceSummaryResponse =
  operations["GET:skyforge.GetGovernanceSummary"]["responses"][200]["content"]["application/json"];
export async function getGovernanceSummary(): Promise<GovernanceSummaryResponse> {
  return apiFetch<GovernanceSummaryResponse>("/api/admin/governance/summary");
}

export type GovernanceResourcesResponse =
  operations["GET:skyforge.ListGovernanceResources"]["responses"][200]["content"]["application/json"];
export async function listGovernanceResources(params?: { limit?: string }): Promise<GovernanceResourcesResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", params.limit);
  const suffix = qs.toString();
  return apiFetch<GovernanceResourcesResponse>(`/api/admin/governance/resources${suffix ? `?${suffix}` : ""}`);
}

export type GovernanceCostsResponse =
  operations["GET:skyforge.ListGovernanceCosts"]["responses"][200]["content"]["application/json"];
export async function listGovernanceCosts(params?: { limit?: string }): Promise<GovernanceCostsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", params.limit);
  const suffix = qs.toString();
  return apiFetch<GovernanceCostsResponse>(`/api/admin/governance/costs${suffix ? `?${suffix}` : ""}`);
}

export type GovernanceUsageResponse =
  operations["GET:skyforge.ListGovernanceUsage"]["responses"][200]["content"]["application/json"];
export async function listGovernanceUsage(params?: { limit?: string }): Promise<GovernanceUsageResponse> {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", params.limit);
  const suffix = qs.toString();
  return apiFetch<GovernanceUsageResponse>(`/api/admin/governance/usage${suffix ? `?${suffix}` : ""}`);
}

export async function syncGovernanceSources(): Promise<void> {
  await apiFetch<unknown>("/api/admin/governance/sync", { method: "POST", body: "{}" });
}

export async function startDeployment(workspaceId: string, deploymentId: string): Promise<JSONMap> {
  return apiFetch<JSONMap>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/start`,
    {
    method: "POST",
    body: "{}"
    }
  );
}

export async function stopDeployment(workspaceId: string, deploymentId: string): Promise<JSONMap> {
  return apiFetch<JSONMap>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/stop`,
    {
    method: "POST",
    body: "{}"
    }
  );
}

export async function destroyDeployment(workspaceId: string, deploymentId: string): Promise<JSONMap> {
  return apiFetch<JSONMap>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}/destroy`,
    {
    method: "POST",
    body: "{}"
    }
  );
}

export async function deleteDeployment(workspaceId: string, deploymentId: string): Promise<JSONMap> {
  return apiFetch<JSONMap>(`/api/workspaces/${encodeURIComponent(workspaceId)}/deployments/${encodeURIComponent(deploymentId)}`, {
    method: "DELETE",
  });
}

export type UIConfigResponse = operations["GET:skyforge.GetUIConfig"]["responses"][200]["content"]["application/json"];
export async function getUIConfig(): Promise<UIConfigResponse> {
  return apiFetch<UIConfigResponse>("/api/ui/config");
}

export type StatusSummaryResponse = operations["GET:skyforge.StatusSummary"]["responses"][200]["content"]["application/json"] & {
  deploymentsTotal?: number;
  deploymentsActive?: number;
};
export async function getStatusSummary(): Promise<StatusSummaryResponse> {
  return apiFetch<StatusSummaryResponse>("/status/summary");
}
