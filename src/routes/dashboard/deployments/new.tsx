import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWorkspaceDeployment,
  getWorkspaces,
  getWorkspaceContainerlabTemplates,
  getWorkspaceLabppTemplates,
  getWorkspaceNetlabTemplates,
  listEveServers,
  listNetlabServers,
  type CreateWorkspaceDeploymentRequest,
  type ExternalTemplateRepo,
  type SkyforgeWorkspace,
  type WorkspaceTemplatesResponse
} from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";

export const Route = createFileRoute("/dashboard/deployments/new")({
  component: CreateDeploymentPage
});

type DeploymentKind = "netlab" | "labpp" | "containerlab" | "clabernetes" | "terraform";

type TemplateSource = "workspace" | "blueprints" | "external";

function CreateDeploymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const workspacesQ = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
    staleTime: 30_000
  });
  const workspaces = (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[];

  const [workspaceId, setWorkspaceId] = useState<string>("");
  const selectedWorkspaceId = useMemo(() => {
    if (workspaceId && workspaces.some((w) => w.id === workspaceId)) return workspaceId;
    return workspaces[0]?.id ?? "";
  }, [workspaceId, workspaces]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === selectedWorkspaceId) ?? null,
    [selectedWorkspaceId, workspaces]
  );

  const [kind, setKind] = useState<DeploymentKind>("netlab");
  const [source, setSource] = useState<TemplateSource>("blueprints");
  const [templateRepoId, setTemplateRepoId] = useState<string>("");
  const [template, setTemplate] = useState<string>("");

  const eveServersQ = useQuery({
    queryKey: queryKeys.eveServers(),
    queryFn: listEveServers,
    staleTime: 30_000
  });
  const netlabServersQ = useQuery({
    queryKey: queryKeys.netlabServers(),
    queryFn: listNetlabServers,
    staleTime: 30_000
  });

  const [eveServer, setEveServer] = useState<string>("");
  const [netlabServer, setNetlabServer] = useState<string>("");

  const effectiveSource: TemplateSource = useMemo(() => {
    if (kind === "netlab") return source === "workspace" ? "workspace" : "blueprints";
    if (kind === "labpp") return source === "workspace" ? "workspace" : "blueprints";
    if (kind === "containerlab" || kind === "clabernetes") return source;
    return "workspace";
  }, [kind, source]);

  const templatesQ = useQuery<WorkspaceTemplatesResponse>({
    queryKey: queryKeys.workspaceTemplates(
      selectedWorkspaceId,
      kind,
      effectiveSource,
      templateRepoId || undefined,
      undefined
    ),
    enabled: !!selectedWorkspaceId,
    queryFn: async () => {
      const query: { source?: string; repo?: string } = { source: effectiveSource };
      if (effectiveSource === "external" && templateRepoId) query.repo = templateRepoId;

      switch (kind) {
        case "netlab":
          return getWorkspaceNetlabTemplates(selectedWorkspaceId, query);
        case "labpp":
          return getWorkspaceLabppTemplates(selectedWorkspaceId, query);
        case "containerlab":
        case "clabernetes":
          return getWorkspaceContainerlabTemplates(selectedWorkspaceId, query);
        default:
          return getWorkspaceNetlabTemplates(selectedWorkspaceId, query);
      }
    },
    staleTime: 10_000
  });

  const templates = templatesQ.data?.templates ?? [];

  const deploymentName = useMemo(() => {
    const base = (template || kind).split("/").pop() || kind;
    const ts = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "")
      .slice(0, 15);
    return `${base}-${ts}`;
  }, [template, kind]);

  const externalRepos = ((selectedWorkspace?.externalTemplateRepos ?? []) as ExternalTemplateRepo[]).filter(
    (r) => !!r && typeof r.id === "string" && typeof r.repo === "string"
  );
  const externalAllowed = !!selectedWorkspace?.allowExternalTemplateRepos && externalRepos.length > 0;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedWorkspaceId) throw new Error("workspace is required");
      if (!template) throw new Error("template is required");

      const config: Record<string, unknown> = {
        template
      };

      if (kind === "netlab" || kind === "containerlab") {
        const v = (netlabServer || selectedWorkspace?.netlabServer || "").trim();
        if (!v) throw new Error("netlab server is required");
        config.netlabServer = v;
        config.templateSource = effectiveSource;
        if (effectiveSource === "external" && templateRepoId) config.templateRepo = templateRepoId;
        if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
      }

      if (kind === "labpp") {
        const v = (eveServer || selectedWorkspace?.eveServer || "").trim();
        if (!v) throw new Error("EVE server is required");
        config.eveServer = v;
      }

      if (kind === "clabernetes") {
        config.templateSource = effectiveSource;
        if (effectiveSource === "external" && templateRepoId) config.templateRepo = templateRepoId;
        if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
      }

      const body: CreateWorkspaceDeploymentRequest = {
        name: deploymentName,
        type: kind,
        config: config as any
      };
      return createWorkspaceDeployment(selectedWorkspaceId, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSnapshot() });
      await navigate({ to: "/dashboard/deployments" });
    }
  });

  const eveOptions = eveServersQ.data?.servers ?? [];
  const netlabOptions = netlabServersQ.data?.servers ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Create deployment</div>
            <div className="mt-1 text-sm text-zinc-400">Dropdown-only create flow (TanStack portal).</div>
          </div>
          <button
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white"
            onClick={() => navigate({ to: "/dashboard/deployments" })}
          >
            Cancel
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Workspace">
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={selectedWorkspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              disabled={workspaces.length === 0}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.slug})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Provider">
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={kind}
              onChange={(e) => {
                setKind(e.target.value as DeploymentKind);
                setTemplate("");
              }}
            >
              <option value="netlab">Netlab</option>
              <option value="labpp">LabPP</option>
              <option value="containerlab">Containerlab</option>
              <option value="clabernetes">Clabernetes</option>
            </select>
          </Field>

          <Field label="Template source">
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={effectiveSource}
              onChange={(e) => {
                setSource(e.target.value as TemplateSource);
                setTemplateRepoId("");
                setTemplate("");
              }}
            >
              <option value="workspace">Workspace repo</option>
              <option value="blueprints">Blueprints</option>
              <option value="external" disabled={!externalAllowed || (kind !== "containerlab" && kind !== "clabernetes")}>
                External repo
              </option>
            </select>
            {!externalAllowed && (kind === "containerlab" || kind === "clabernetes") ? (
              <div className="mt-1 text-xs text-zinc-500">External repos disabled or not configured for this workspace.</div>
            ) : null}
          </Field>

          <Field label="External repo" hidden={effectiveSource !== "external"}>
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={templateRepoId}
              onChange={(e) => {
                setTemplateRepoId(e.target.value);
                setTemplate("");
              }}
            >
              <option value="">Select repo…</option>
              {externalRepos.map((r: ExternalTemplateRepo) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.repo})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Netlab server" hidden={kind !== "netlab" && kind !== "containerlab"}>
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={netlabServer || selectedWorkspace?.netlabServer || ""}
              onChange={(e) => setNetlabServer(e.target.value)}
            >
              <option value="">Select server…</option>
              {netlabOptions.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.sshHost})
                </option>
              ))}
            </select>
            {netlabServersQ.isLoading ? <div className="mt-1 text-xs text-zinc-500">Loading servers…</div> : null}
          </Field>

          <Field label="EVE server" hidden={kind !== "labpp"}>
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={eveServer || selectedWorkspace?.eveServer || ""}
              onChange={(e) => setEveServer(e.target.value)}
            >
              <option value="">Select server…</option>
              {eveOptions.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} ({s.apiUrl})
                </option>
              ))}
            </select>
            {eveServersQ.isLoading ? <div className="mt-1 text-xs text-zinc-500">Loading servers…</div> : null}
          </Field>

          <Field label="Template">
            <select
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              disabled={templatesQ.isLoading || templates.length === 0}
            >
              <option value="">{templatesQ.isLoading ? "Loading…" : templates.length ? "Select template…" : "No templates"}</option>
              {templates.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {templatesQ.isError ? <div className="mt-1 text-xs text-red-300">Failed to load templates.</div> : null}
          </Field>

          <Field label="Deployment name">
            <select className="w-full rounded-md border border-zinc-700 bg-zinc-950 px-2 py-2 text-sm text-zinc-100" value={deploymentName} disabled>
              <option value={deploymentName}>{deploymentName}</option>
            </select>
            <div className="mt-1 text-xs text-zinc-500">Auto-generated from the selected template.</div>
          </Field>
        </div>

        {mutation.isError ? (
          <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
            {(mutation.error as Error)?.message || "Create failed."}
          </div>
        ) : null}

        <div className="mt-5 flex gap-3">
          <button
            className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={mutation.isPending || !selectedWorkspaceId || !template}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating…" : "Create"}
          </button>
          <button
            className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300 hover:border-zinc-600 hover:text-white"
            onClick={() => navigate({ to: "/dashboard/deployments" })}
            disabled={mutation.isPending}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

function Field(props: { label: string; hidden?: boolean; children: React.ReactNode }) {
  if (props.hidden) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-zinc-400">{props.label}</div>
      {props.children}
    </div>
  );
}
