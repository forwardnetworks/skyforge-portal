import { SKYFORGE_PROXY_ROOT, SKYFORGE_API, buildLoginUrl } from "./skyforge-config";
import { apiFetch } from "./http";
import type { components, operations } from "./openapi.gen";

export type ISO8601 = string;

export type JSONValue = null | boolean | number | string | JSONValue[] | { [key: string]: JSONValue };
export type JSONMap = Record<string, JSONValue>;

export type ExternalTemplateRepo = components["schemas"]["skyforge.ExternalTemplateRepo"];
export type SkyforgeWorkspace = components["schemas"]["skyforge.SkyforgeWorkspace"];

// NOTE: OpenAPI schema may lag behind the live dashboard/deployment view (e.g. activeTaskId/queueDepth).
// This type reflects the fields Skyforge currently emits in the dashboard snapshot and related APIs.
export type WorkspaceDeployment = {
  id: string;
  workspaceId: string;
  name: string;
  type: "terraform" | "netlab" | "netlab-c9s" | "labpp" | "containerlab" | "clabernetes" | string;
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

// Dashboard snapshot is delivered via SSE (`/api/dashboard/events`) and is not described in OpenAPI.
export type DashboardSnapshot = {
  refreshedAt: ISO8601;
  workspaces: SkyforgeWorkspace[];
  deployments: WorkspaceDeployment[];
  runs: JSONMap[];
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

export type ListEveServersResponse =
  operations["GET:skyforge.ListEveServers"]["responses"][200]["content"]["application/json"];

export async function listEveServers(): Promise<ListEveServersResponse> {
  return apiFetch<ListEveServersResponse>("/api/eve/servers");
}

export type ListNetlabServersResponse =
  operations["GET:skyforge.ListNetlabServers"]["responses"][200]["content"]["application/json"];

export async function listNetlabServers(): Promise<ListNetlabServersResponse> {
  return apiFetch<ListNetlabServersResponse>("/api/netlab/servers");
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

export async function getWorkspaceLabppTemplates(
  workspaceId: string,
  query?: TemplatesQuery
): Promise<WorkspaceTemplatesResponse> {
  const params = new URLSearchParams();
  if (query?.source) params.set("source", query.source);
  if (query?.repo) params.set("repo", query.repo);
  if (query?.dir) params.set("dir", query.dir);
  const qs = params.toString();
  return apiFetch<WorkspaceTemplatesResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/labpp/templates${qs ? `?${qs}` : ""}`
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

export type PlatformHealth = {
  generatedAt?: ISO8601;
  checks?: Array<{
    id?: string;
    name?: string;
    status?: string;
    message?: string;
    details?: JSONMap;
  }>;
};

export async function getPlatformHealth(): Promise<PlatformHealth> {
  const resp = await fetch("/data/platform-health.json", { credentials: "include" });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`health fetch failed (${resp.status}): ${text}`);
  }
  return (await resp.json()) as PlatformHealth;
}
