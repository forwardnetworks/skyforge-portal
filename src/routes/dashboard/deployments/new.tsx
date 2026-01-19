import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  createWorkspaceDeployment,
  getWorkspaces,
  getWorkspaceContainerlabTemplates,
  getWorkspaceNetlabTemplates,
  listForwardCollectors,
  listWorkspaceNetlabServers,
  type CreateWorkspaceDeploymentRequest,
  type DashboardSnapshot,
  type ExternalTemplateRepo,
  type ForwardCollectorSummary,
  type SkyforgeWorkspace,
  type WorkspaceTemplatesResponse
} from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";
import { useDashboardEvents } from "../../../lib/dashboard-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../components/ui/tooltip";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";

const deploymentsSearchSchema = z.object({
  workspace: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/deployments/new")({
  validateSearch: (search) => deploymentsSearchSchema.parse(search),
  component: CreateDeploymentPage
});

type DeploymentKind = "netlab-c9s" | "netlab" | "containerlab" | "clabernetes" | "terraform";
type TemplateSource = "workspace" | "blueprints" | "external";

const formSchema = z
  .object({
    workspaceId: z.string().min(1, "Workspace is required"),
    name: z.string().min(1, "Deployment name is required").max(100),
    kind: z.enum(["netlab-c9s", "netlab", "containerlab", "clabernetes", "terraform"]),
    source: z.enum(["workspace", "blueprints", "external"]),
    templateRepoId: z.string().optional(),
    template: z.string().min(1, "Template is required"),
    netlabServer: z.string().optional(),
    forwardEnabled: z.boolean().default(false),
    forwardCollectorUsername: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.forwardEnabled && !String(value.forwardCollectorUsername ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Collector selection is required when Forward is enabled",
        path: ["forwardCollectorUsername"],
      });
    }
  });

function CreateDeploymentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { workspace } = Route.useSearch();

  useDashboardEvents(true);
  const dash = useQuery<DashboardSnapshot | null>({
    queryKey: queryKeys.dashboardSnapshot(),
    queryFn: async () => null,
    initialData: null,
    retry: false,
    staleTime: Infinity,
  });

  const workspacesQ = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
    staleTime: 30_000
  });
  const workspaces = (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      workspaceId: workspace || "",
      name: "",
      kind: "netlab-c9s",
      source: "blueprints",
      templateRepoId: "",
      template: "",
      netlabServer: "",
      forwardEnabled: false,
      forwardCollectorUsername: "",
    },
  });

  const { watch, setValue } = form;
  const watchWorkspaceId = watch("workspaceId");
  const watchKind = watch("kind");
  const watchSource = watch("source");
  const watchTemplateRepoId = watch("templateRepoId");
  const watchTemplate = watch("template");
  const watchForwardEnabled = watch("forwardEnabled");
  const templatesUpdatedAt = dash.data?.templatesIndexUpdatedAt ?? "";

  // Sync workspaceId when workspaces load if not already set or passed via URL
  useEffect(() => {
    if (!watchWorkspaceId && workspaces.length > 0) {
      setValue("workspaceId", workspaces[0].id);
    }
  }, [watchWorkspaceId, workspaces, setValue]);

  // Auto-generate name when template or kind changes
  useEffect(() => {
    const base = (watchTemplate || watchKind).split("/").pop() || watchKind;
    const ts = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\..+/, "")
      .slice(0, 15);
    const generated = `${base}-${ts}`;
    setValue("name", generated);
  }, [watchTemplate, watchKind, setValue]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((w) => w.id === watchWorkspaceId) ?? null,
    [watchWorkspaceId, workspaces]
  );

  const netlabServersQ = useQuery({
    queryKey: queryKeys.workspaceNetlabServers(watchWorkspaceId),
    queryFn: async () => listWorkspaceNetlabServers(watchWorkspaceId),
    enabled: !!watchWorkspaceId,
    staleTime: 30_000
  });

  const effectiveSource: TemplateSource = useMemo(() => {
    if (watchKind === "netlab" || watchKind === "netlab-c9s") return watchSource === "workspace" ? "workspace" : "blueprints";
    if (watchKind === "containerlab" || watchKind === "clabernetes") return watchSource;
    return "workspace";
  }, [watchKind, watchSource]);

  const templatesQ = useQuery<WorkspaceTemplatesResponse>({
    queryKey: queryKeys.workspaceTemplates(
      watchWorkspaceId,
      watchKind,
      effectiveSource,
      watchTemplateRepoId || undefined,
      undefined
    ),
    enabled: !!watchWorkspaceId,
    queryFn: async () => {
      const query: { source?: string; repo?: string } = { source: effectiveSource };
      if (effectiveSource === "external" && watchTemplateRepoId) query.repo = watchTemplateRepoId;

      switch (watchKind) {
        case "netlab":
        case "netlab-c9s":
          return getWorkspaceNetlabTemplates(watchWorkspaceId, query);
        case "containerlab":
        case "clabernetes":
          return getWorkspaceContainerlabTemplates(watchWorkspaceId, query);
        default:
          return getWorkspaceNetlabTemplates(watchWorkspaceId, query);
      }
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!templatesUpdatedAt) return;
    void queryClient.invalidateQueries({ queryKey: ["workspaceTemplates"] });
  }, [templatesUpdatedAt, queryClient]);

  const templates = templatesQ.data?.templates ?? [];

  const externalRepos = ((selectedWorkspace?.externalTemplateRepos ?? []) as ExternalTemplateRepo[]).filter(
    (r) => !!r && typeof r.id === "string" && typeof r.repo === "string"
  );
  const externalAllowed = !!selectedWorkspace?.allowExternalTemplateRepos && externalRepos.length > 0;

  const forwardCollectorsQ = useQuery({
    queryKey: queryKeys.forwardCollectors(),
    queryFn: listForwardCollectors,
    enabled: watchForwardEnabled,
    staleTime: 30_000,
    retry: false,
  });
  const forwardCollectors = (forwardCollectorsQ.data?.collectors ?? []) as ForwardCollectorSummary[];

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const config: Record<string, unknown> = {
        template: values.template
      };

      if (values.kind === "netlab" || values.kind === "containerlab") {
        const v = (values.netlabServer || selectedWorkspace?.netlabServer || "").trim();
        if (!v) throw new Error("netlab server is required");
        config.netlabServer = v;
        config.templateSource = effectiveSource;
        if (effectiveSource === "external" && values.templateRepoId) config.templateRepo = values.templateRepoId;
        if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
      }

      if (values.kind === "netlab-c9s") {
        config.templateSource = effectiveSource;
        if (effectiveSource === "external" && values.templateRepoId) config.templateRepo = values.templateRepoId;
        if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
      }

      if (values.kind === "clabernetes") {
        config.templateSource = effectiveSource;
        if (effectiveSource === "external" && values.templateRepoId) config.templateRepo = values.templateRepoId;
        if (templatesQ.data?.dir) config.templatesDir = templatesQ.data.dir;
      }

      if (values.forwardEnabled) {
        config.forwardEnabled = true;
        config.forwardCollectorUsername = String(values.forwardCollectorUsername ?? "").trim();
      }

      const body: CreateWorkspaceDeploymentRequest = {
        name: values.name,
        type: values.kind,
        config: config as any
      };
      return createWorkspaceDeployment(values.workspaceId, body);
    },
    onSuccess: async (_, variables) => {
      toast.success("Deployment created successfully", {
        description: `${variables.name} is now queued for provisioning.`
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSnapshot() });
      await navigate({ to: "/dashboard/deployments", search: { workspace: variables.workspaceId } });
    },
    onError: (error) => {
      toast.error("Failed to create deployment", {
        description: (error as Error).message
      });
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    mutation.mutate(values);
  }

  const netlabOptions = netlabServersQ.data?.servers ?? [];

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Create deployment</CardTitle>
              <CardDescription>Configure and launch a new infrastructure deployment.</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/dashboard/deployments", search: { workspace: watchWorkspaceId } })}
            >
              Cancel
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="workspaceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workspace</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select workspace" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workspaces.map((w) => (
                            <SelectItem key={w.id} value={w.id}>
                              {w.name} ({w.slug})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="kind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("template", "");
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                        </FormControl>
                      <SelectContent>
                          <SelectItem value="netlab-c9s">Netlab</SelectItem>
                          <SelectItem value="netlab">Netlab (BYOS)</SelectItem>
                          <SelectItem value="containerlab">Containerlab (BYOS)</SelectItem>
                          <SelectItem value="clabernetes">Containerlab</SelectItem>
                          <SelectItem value="terraform">Terraform</SelectItem>
                      </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Template source
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Git repository or URL containing deployment templates</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("templateRepoId", "");
                          form.setValue("template", "");
                        }} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select source" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="workspace">Workspace repo</SelectItem>
                          <SelectItem value="blueprints">Blueprints</SelectItem>
                          <SelectItem 
                            value="external" 
                            disabled={!externalAllowed || (watchKind !== "containerlab" && watchKind !== "clabernetes")}
                          >
                            External repo
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {!externalAllowed && (watchKind === "containerlab" || watchKind === "clabernetes") && (
                        <FormDescription>External repos disabled or not configured for this workspace.</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {effectiveSource === "external" && (
                  <FormField
                    control={form.control}
                    name="templateRepoId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External repo</FormLabel>
                        <Select 
                          onValueChange={(val) => {
                            field.onChange(val);
                            form.setValue("template", "");
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select repo…" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {externalRepos.map((r: ExternalTemplateRepo) => (
                              <SelectItem key={r.id} value={r.id}>
                                {r.name} ({r.repo})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(watchKind === "netlab" || watchKind === "containerlab") && (
                  <FormField
                    control={form.control}
                    name="netlabServer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Netlab server</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || selectedWorkspace?.netlabServer || ""}
                          value={field.value || selectedWorkspace?.netlabServer || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select server…" />
                            </SelectTrigger>
                          </FormControl>
                            <SelectContent>
                              {netlabOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {netlabServersQ.isLoading && <FormDescription>Loading servers…</FormDescription>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="template"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={templatesQ.isLoading || templates.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={templatesQ.isLoading ? "Loading…" : templates.length ? "Select template…" : "No templates"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {templatesQ.isError && <div className="text-xs text-destructive">Failed to load templates.</div>}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deployment name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Deployment"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Custom name for this specific deployment instance.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Forward Networks</CardTitle>
                  <CardDescription>Optional: sync discovered device IPs into Forward for collection.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="forwardEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div className="space-y-1">
                          <FormLabel>Enable Forward collection</FormLabel>
                          <FormDescription>Requires configuring your Collector in the left sidebar first.</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchForwardEnabled ? (
                    <FormField
                      control={form.control}
                      name="forwardCollectorUsername"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Collector</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={String(field.value ?? "")}
                            disabled={forwardCollectorsQ.isLoading || forwardCollectorsQ.isError}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    forwardCollectorsQ.isLoading
                                      ? "Loading…"
                                      : forwardCollectorsQ.isError
                                        ? "Configure Collector first"
                                        : "Select collector…"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {forwardCollectors.map((c) => (
                                <SelectItem key={c.id || c.username} value={c.username}>
                                  {c.name} ({c.username})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}
                </CardContent>
              </Card>

              {mutation.isError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive border border-destructive/20">
                  {(mutation.error as Error)?.message || "Create failed."}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mutation.isPending ? "Creating…" : "Create Deployment"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate({ to: "/dashboard/deployments", search: { workspace: watchWorkspaceId } })}
                  disabled={mutation.isPending}
                >
                  Back
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
