import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { addEdge, Background, Controls, MiniMap, ReactFlow, useEdgesState, useNodesState, type Edge, type Node, type NodeProps, Handle, Position } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RegistryImagePicker } from "@/components/registry-image-picker";
import { designToContainerlabYaml, type LabDesign } from "@/lib/containerlab-yaml";
import { Cpu, Copy, Download, ExternalLink, FolderOpen, LayoutGrid, Link2, Plus, Rocket, Save, Server } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createClabernetesDeploymentFromTemplate,
  createContainerlabDeploymentFromTemplate,
  getWorkspaces,
  getDeploymentTopology,
  getWorkspaceContainerlabTemplate,
  getWorkspaceContainerlabTemplates,
  listWorkspaceNetlabServers,
  saveContainerlabTopologyYAML,
} from "@/lib/skyforge-api";
import { queryKeys } from "@/lib/query-keys";
import type { ReactFlowInstance } from "@xyflow/react";
import { z } from "zod";

const designerSearchSchema = z.object({
  workspaceId: z.string().optional().catch(""),
  importDeploymentId: z.string().optional().catch(""),
});

export const Route = createFileRoute("/dashboard/labs/designer")({
  validateSearch: (search) => designerSearchSchema.parse(search),
  component: LabDesignerPage,
});

type DesignNodeData = {
  label: string;
  kind: string;
  image: string;
};

type DesignNode = Node<DesignNodeData>;

type SavedConfigRef = {
  workspaceId: string;
  templatesDir: string;
  template: string;
  filePath: string;
  branch: string;
};

function DesignerNode(props: NodeProps<DesignNode>) {
  const kind = String(props.data?.kind ?? "");
  const label = String(props.data?.label ?? props.id);
  const isHost = kind.toLowerCase().includes("linux") || kind.toLowerCase().includes("host");
  const Icon = isHost ? Server : Cpu;
  const accent = isHost ? "border-emerald-500/60" : "border-sky-500/60";

  return (
    <div
      className={[
        "rounded-xl border bg-background/95 px-3 py-2 shadow-sm min-w-[140px]",
        props.selected ? "ring-2 ring-primary/60" : "",
        accent,
      ].join(" ")}
    >
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
      <div className="flex items-start gap-2">
        <div className="mt-0.5 rounded-md border bg-muted p-1.5">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="font-medium leading-tight truncate">{label}</div>
          <div className="text-[11px] text-muted-foreground truncate">{kind || "node"}</div>
        </div>
      </div>
    </div>
  );
}

function LabDesignerPage() {
  const search = Route.useSearch();
  const storageKey = "skyforge.labDesigner.v1";
  const rfRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const [labName, setLabName] = useState("lab");
  const [workspaceId, setWorkspaceId] = useState("");
  const [runtime, setRuntime] = useState<"clabernetes" | "containerlab">("clabernetes");
  const [netlabServer, setNetlabServer] = useState("");
  const [useSavedConfig, setUseSavedConfig] = useState(true);
  const [lastSaved, setLastSaved] = useState<SavedConfigRef | null>(null);
  const [templatesDir, setTemplatesDir] = useState("containerlab/designer");
  const [templateFile, setTemplateFile] = useState("");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [paletteSearch, setPaletteSearch] = useState("");
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<DesignNode, Edge> | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const [linkMode, setLinkMode] = useState(false);
  const [pendingLinkSource, setPendingLinkSource] = useState<string>("");
  const [yamlMode, setYamlMode] = useState<"generated" | "custom">("generated");
  const [customYaml, setCustomYaml] = useState<string>("");
  const [importOpen, setImportOpen] = useState(false);
  const [importSource, setImportSource] = useState<"workspace" | "blueprints">("blueprints");
  const [importDir, setImportDir] = useState("containerlab");
  const [importFile, setImportFile] = useState("");
  const [openDeploymentOnCreate, setOpenDeploymentOnCreate] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState<DesignNode>([
    {
      id: "r1",
      position: { x: 80, y: 80 },
      data: { label: "r1", kind: "linux", image: "" },
      type: "designerNode",
    },
  ]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  const design: LabDesign = useMemo(() => {
    return {
      name: labName,
      nodes: nodes.map((n) => ({
        id: String(n.id),
        label: String(n.data?.label ?? n.id),
        kind: String((n.data as any)?.kind ?? ""),
        image: String((n.data as any)?.image ?? ""),
        position: { x: n.position.x, y: n.position.y },
      })),
      links: edges.map((e) => ({ id: String(e.id), source: String(e.source), target: String(e.target) })),
    };
  }, [edges, labName, nodes]);

  const { yaml, warnings } = useMemo(() => designToContainerlabYaml(design), [design]);
  const effectiveYaml = useMemo(() => {
    if (yamlMode === "custom") return String(customYaml ?? "");
    return yaml;
  }, [customYaml, yaml, yamlMode]);

  const effectiveTemplatesDir = useMemo(() => {
    const d = String(templatesDir ?? "").trim().replace(/^\/+|\/+$/g, "");
    return d || "containerlab/designer";
  }, [templatesDir]);

  const effectiveTemplateFile = useMemo(() => {
    const raw = String(templateFile ?? "").trim();
    const base = raw || `${labName || "lab"}.clab.yml`;
    if (base.endsWith(".yml") || base.endsWith(".yaml")) return base;
    return `${base}.yml`;
  }, [labName, templateFile]);

  useEffect(() => {
    if (!importOpen || !workspaceId) return;
    const key = `skyforge.labDesigner.importPrefs.${workspaceId}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as any;
      if (parsed?.source === "workspace" || parsed?.source === "blueprints") setImportSource(parsed.source);
      if (typeof parsed?.dir === "string") setImportDir(parsed.dir);
    } catch {
      // ignore
    }
  }, [importOpen, workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    const key = `skyforge.labDesigner.importPrefs.${workspaceId}`;
    try {
      window.localStorage.setItem(key, JSON.stringify({ source: importSource, dir: importDir }));
    } catch {
      // ignore
    }
  }, [importDir, importSource, workspaceId]);

  const addNode = () => {
    const base = "n";
    let i = nodes.length + 1;
    let id = `${base}${i}`;
    const used = new Set(nodes.map((n) => n.id));
    while (used.has(id)) {
      i++;
      id = `${base}${i}`;
    }
    const pos = { x: 120 + nodes.length * 40, y: 120 + nodes.length * 30 };
    const next: Node<DesignNodeData> = { id, position: pos, data: { label: id, kind: "linux", image: "" }, type: "designerNode" };
    setNodes((prev) => [...prev, next]);
    setSelectedNodeId(id);
  };

  const autoLayout = () => {
    const count = nodes.length;
    if (!count) return;
    const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
    const cellW = 260;
    const cellH = 180;
    const startX = 120;
    const startY = 120;
    setNodes((prev) =>
      prev.map((n, idx) => ({
        ...n,
        position: {
          x: startX + (idx % cols) * cellW,
          y: startY + Math.floor(idx / cols) * cellH,
        },
      }))
    );
    requestAnimationFrame(() => rfInstance?.fitView({ padding: 0.15, duration: 300 }));
  };

  const exportYaml = () => {
    const blob = new Blob([effectiveYaml], { type: "text/yaml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${labName || "lab"}.clab.yml`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5_000);
  };

  // Optional: import an existing running deployment topology into the canvas.
  useEffect(() => {
    const ws = String(search.workspaceId ?? "").trim();
    const depId = String(search.importDeploymentId ?? "").trim();
    if (!ws || !depId) return;
    setWorkspaceId(ws);
    setUseSavedConfig(false);
    setLastSaved(null);

    let cancelled = false;
    (async () => {
      try {
        const topo = await getDeploymentTopology(ws, depId);
        if (cancelled) return;
        const nextNodes: Array<Node<DesignNodeData>> = (topo.nodes ?? []).map((n, idx) => ({
          id: String(n.id),
          position: { x: 120 + (idx % 4) * 260, y: 120 + Math.floor(idx / 4) * 180 },
          data: { label: String(n.label || n.id), kind: String(n.kind || ""), image: "" },
          type: "designerNode",
        }));
        const nextEdges: Array<Edge> = (topo.edges ?? []).map((e) => ({
          id: String(e.id),
          source: String(e.source),
          target: String(e.target),
          label: e.label || `${e.source} ↔ ${e.target}`,
        }));

        if (!nextNodes.length) throw new Error("No nodes found in deployment topology");
        setNodes(nextNodes);
        setEdges(nextEdges);
        setSelectedNodeId(String(nextNodes[0].id));
        toast.success("Imported running topology", { description: `Deployment ${depId}` });
        requestAnimationFrame(() => rfInstance?.fitView({ padding: 0.15, duration: 250 }));
      } catch (e) {
        if (cancelled) return;
        toast.error("Failed to import deployment topology", { description: (e as Error).message });
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.importDeploymentId, search.workspaceId]);

  const saveDraft = () => {
    try {
      const payload = { labName, workspaceId, runtime, netlabServer, useSavedConfig, lastSaved, nodes, edges };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      toast.success("Draft saved");
    } catch (e) {
      toast.error("Failed to save draft", { description: (e as Error).message });
    }
  };

  const loadDraft = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        toast.message("No saved draft");
        return;
      }
      const parsed = JSON.parse(raw) as any;
      if (typeof parsed?.labName === "string") setLabName(parsed.labName);
      if (typeof parsed?.workspaceId === "string") setWorkspaceId(parsed.workspaceId);
      if (parsed?.runtime === "clabernetes" || parsed?.runtime === "containerlab") setRuntime(parsed.runtime);
      if (typeof parsed?.netlabServer === "string") setNetlabServer(parsed.netlabServer);
      if (typeof parsed?.useSavedConfig === "boolean") setUseSavedConfig(parsed.useSavedConfig);
      if (parsed?.lastSaved && typeof parsed.lastSaved === "object") setLastSaved(parsed.lastSaved);
      if (Array.isArray(parsed?.nodes)) setNodes(parsed.nodes);
      if (Array.isArray(parsed?.edges)) setEdges(parsed.edges);
      toast.success("Draft loaded");
    } catch (e) {
      toast.error("Failed to load draft", { description: (e as Error).message });
    }
  };

  const workspacesQ = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
    retry: false,
    staleTime: 30_000,
  });

  const netlabServersQ = useQuery({
    queryKey: workspaceId ? queryKeys.workspaceNetlabServers(workspaceId) : ["workspaceNetlabServers", "none"],
    queryFn: async () => listWorkspaceNetlabServers(workspaceId),
    enabled: Boolean(workspaceId) && runtime === "containerlab",
    retry: false,
    staleTime: 30_000,
  });

  const templatesQ = useQuery({
    queryKey: workspaceId ? ["containerlabTemplates", workspaceId, importSource, importDir] : ["containerlabTemplates", "none"],
    queryFn: async () =>
      getWorkspaceContainerlabTemplates(workspaceId, {
        source: importSource,
        dir: importDir,
      }),
    enabled: Boolean(workspaceId) && importOpen,
    retry: false,
    staleTime: 30_000,
  });

  const templatePreviewQ = useQuery({
    queryKey: workspaceId ? ["containerlabTemplate", workspaceId, importSource, importDir, importFile] : ["containerlabTemplate", "none"],
    queryFn: async () => {
      if (!workspaceId) throw new Error("missing workspace");
      if (!importFile) return null;
      return getWorkspaceContainerlabTemplate(workspaceId, { source: importSource, dir: importDir, file: importFile });
    },
    enabled: Boolean(workspaceId) && importOpen && Boolean(importFile),
    retry: false,
    staleTime: 30_000,
  });

  const createDeployment = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("Select a workspace");
      if (!effectiveYaml.trim()) throw new Error("YAML is empty");
      if (!/^\s*topology\s*:/m.test(effectiveYaml)) {
        throw new Error("YAML must contain a top-level 'topology:' section");
      }
      if (effectiveTemplatesDir !== "containerlab" && !effectiveTemplatesDir.startsWith("containerlab/")) {
        throw new Error("Repo path must be under containerlab/");
      }

      const canUseSaved = useSavedConfig && lastSaved?.workspaceId === workspaceId;
      const saved =
        canUseSaved
          ? lastSaved
          : await saveContainerlabTopologyYAML(workspaceId, {
              name: labName,
              topologyYAML: effectiveYaml,
              templatesDir: effectiveTemplatesDir,
              template: effectiveTemplateFile,
            }).then((resp) => {
              const next: SavedConfigRef = {
                workspaceId: resp.workspaceId,
                templatesDir: resp.templatesDir,
                template: resp.template,
                filePath: resp.filePath,
                branch: resp.branch,
              };
              setLastSaved(next);
              return next;
            });

      if (runtime === "containerlab") {
        if (!netlabServer) throw new Error("Select a netlab server");
        return createContainerlabDeploymentFromTemplate(workspaceId, {
          name: labName,
          netlabServer,
          templateSource: "workspace",
          templatesDir: saved.templatesDir,
          template: saved.template,
          autoDeploy: true,
        });
      }

      return createClabernetesDeploymentFromTemplate(workspaceId, {
        name: labName,
        templateSource: "workspace",
        templatesDir: saved.templatesDir,
        template: saved.template,
        autoDeploy: true,
      });
    },
    onSuccess: async (resp) => {
      toast.success("Deployment created", { description: resp.deployment?.name ?? labName });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardSnapshot() });
      const id = resp.deployment?.id;
      if (openDeploymentOnCreate && id) {
        window.open(`/dashboard/deployments/${id}`, "_blank", "noopener,noreferrer");
      }
    },
    onError: (e) => toast.error("Create deployment failed", { description: (e as Error).message }),
  });

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("Select a workspace");
      if (!effectiveYaml.trim()) throw new Error("YAML is empty");
      if (!/^\s*topology\s*:/m.test(effectiveYaml)) {
        throw new Error("YAML must contain a top-level 'topology:' section");
      }
      if (effectiveTemplatesDir !== "containerlab" && !effectiveTemplatesDir.startsWith("containerlab/")) {
        throw new Error("Repo path must be under containerlab/");
      }
      return saveContainerlabTopologyYAML(workspaceId, {
        name: labName,
        topologyYAML: effectiveYaml,
        templatesDir: effectiveTemplatesDir,
        template: effectiveTemplateFile,
      });
    },
    onSuccess: (resp) => {
      setLastSaved({
        workspaceId: resp.workspaceId,
        templatesDir: resp.templatesDir,
        template: resp.template,
        filePath: resp.filePath,
        branch: resp.branch,
      });
      toast.success("Saved to repo", { description: `${resp.filePath} (${resp.branch})` });
    },
    onError: (e) => toast.error("Save failed", { description: (e as Error).message }),
  });

  const importTemplate = useMutation({
    mutationFn: async () => {
      if (!workspaceId) throw new Error("Select a workspace");
      const file = importFile.trim();
      if (!file) throw new Error("Select a template");
      return getWorkspaceContainerlabTemplate(workspaceId, { source: importSource, dir: importDir, file });
    },
    onSuccess: (resp) => {
      setYamlMode("custom");
      setCustomYaml(resp.yaml);
      setImportOpen(false);
      toast.success("Template imported", { description: resp.path });
    },
    onError: (e) => toast.error("Import failed", { description: (e as Error).message }),
  });

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    if (!rfRef.current || !rfInstance) return;
    const kind = event.dataTransfer.getData("application/x-skyforge-kind");
    if (!kind) return;

    const rect = rfRef.current.getBoundingClientRect();
    const position = rfInstance.screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });

    const idBase = kind === "linux" ? "h" : kind === "cisco" ? "c" : kind === "arista" ? "a" : "n";
    let i = nodes.length + 1;
    let id = `${idBase}${i}`;
    const used = new Set(nodes.map((n) => n.id));
    while (used.has(id)) {
      i++;
      id = `${idBase}${i}`;
    }
    const next: Node<DesignNodeData> = {
      id,
      position,
      data: { label: id, kind, image: "" },
      type: "designerNode",
    };
    setNodes((prev) => [...prev, next]);
    setSelectedNodeId(id);
  };

  const openMapInNewTab = async () => {
    if (!workspaceId) {
      toast.error("Select a workspace first");
      return;
    }
    try {
      const canUseSaved = lastSaved?.workspaceId === workspaceId;
      const saved = canUseSaved
        ? lastSaved
        : await saveContainerlabTopologyYAML(workspaceId, {
            name: labName,
            topologyYAML: effectiveYaml,
            templatesDir: effectiveTemplatesDir,
            template: effectiveTemplateFile,
          }).then((resp) => {
            const next: SavedConfigRef = {
              workspaceId: resp.workspaceId,
              templatesDir: resp.templatesDir,
              template: resp.template,
              filePath: resp.filePath,
              branch: resp.branch,
            };
            setLastSaved(next);
            return next;
          });

      const qs = new URLSearchParams();
      qs.set("workspaceId", workspaceId);
      qs.set("source", "workspace");
      qs.set("dir", saved.templatesDir);
      qs.set("file", saved.template);
      const url = `/dashboard/labs/map?${qs.toString()}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error("Failed to open map", { description: (e as Error).message });
    }
  };

  const onCanvasKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toUpperCase?.() ?? "";
    if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
    if (event.key !== "Delete" && event.key !== "Backspace") return;
    const selectedNodeIds = new Set(nodes.filter((n) => (n as any).selected).map((n) => String(n.id)));
    const selectedEdgeIds = new Set(edges.filter((e) => (e as any).selected).map((e) => String(e.id)));
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;
    event.preventDefault();
    setNodes((prev) => prev.filter((n) => !selectedNodeIds.has(String(n.id))));
    setEdges((prev) =>
      prev.filter((e) => {
        if (selectedEdgeIds.has(String(e.id))) return false;
        if (selectedNodeIds.has(String(e.source)) || selectedNodeIds.has(String(e.target))) return false;
        return true;
      })
    );
  };

  const nodeTypes = useMemo(() => ({ designerNode: DesignerNode }), []);

  return (
    <div className="h-full w-full p-4 flex flex-col gap-4 min-h-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="text-2xl font-bold tracking-tight">Lab Designer</div>
          <div className="text-sm text-muted-foreground">Drag nodes, wire links, generate Containerlab YAML, and deploy.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)} disabled={!workspaceId}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Import template
          </Button>
          <Button variant="outline" size="sm" onClick={loadDraft}>
            Load draft
          </Button>
          <Button variant="outline" size="sm" onClick={saveDraft}>
            Save draft
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Save config
          </Button>
          <Button variant="outline" size="sm" onClick={exportYaml}>
            <Download className="mr-2 h-4 w-4" />
            Download YAML
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_420px] flex-1 min-h-0">
        <Card className="flex flex-col min-h-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Topology</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setSnapToGrid((v) => !v)}>
                  {snapToGrid ? "Snap: on" : "Snap: off"}
                </Button>
                <Button
                  size="sm"
                  variant={linkMode ? "default" : "outline"}
                  onClick={() => {
                    setLinkMode((v) => {
                      const next = !v;
                      if (!next) setPendingLinkSource("");
                      return next;
                    });
                  }}
                  title="Create links by clicking a source node, then a target node"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  {linkMode ? "Link: on" : "Link: off"}
                </Button>
                <Button size="sm" variant="outline" onClick={autoLayout} disabled={nodes.length < 2}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Auto-layout
                </Button>
                <Button size="sm" variant="outline" onClick={addNode}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add node
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <div className="flex h-full w-full border rounded-xl overflow-hidden bg-background/50">
              <div className="w-[180px] border-r bg-background p-3">
                <div className="text-xs font-semibold text-muted-foreground">Palette</div>
                <div className="mt-2">
                  <Input value={paletteSearch} onChange={(e) => setPaletteSearch(e.target.value)} placeholder="Search…" className="h-8" />
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { kind: "linux", label: "Linux host", category: "Hosts" },
                    { kind: "cisco", label: "Cisco device", category: "Network" },
                    { kind: "arista", label: "Arista device", category: "Network" },
                  ]
                    .filter((p) => {
                      const q = paletteSearch.trim().toLowerCase();
                      if (!q) return true;
                      return `${p.label} ${p.kind} ${p.category}`.toLowerCase().includes(q);
                    })
                    .map((p) => (
                    <div
                      key={p.kind}
                      className="cursor-grab select-none rounded-lg border bg-background px-3 py-2 text-sm hover:bg-accent"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("application/x-skyforge-kind", p.kind)}
                      title="Drag onto canvas"
                    >
                      {p.label}
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="flex-1 outline-none relative"
                ref={rfRef}
                onDrop={onDrop}
                onDragOver={onDragOver}
                tabIndex={0}
                onKeyDown={onCanvasKeyDown}
                onMouseDown={(e) => (e.currentTarget as HTMLDivElement).focus()}
              >
                {linkMode ? (
                  <div className="absolute z-10 m-3 rounded-lg border bg-background/80 px-3 py-2 text-xs text-muted-foreground backdrop-blur">
                    {pendingLinkSource ? (
                      <>
                        Link mode: select target for <span className="font-mono text-foreground">{pendingLinkSource}</span>
                      </>
                    ) : (
                      <>Link mode: click a source node, then click a target node</>
                    )}
                  </div>
                ) : null}
                <ReactFlow<Node<DesignNodeData>, Edge>
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={(c) => {
                    const label = c.source && c.target ? `${c.source} ↔ ${c.target}` : undefined;
                    setEdges((eds) => addEdge({ ...c, label }, eds));
                  }}
                  fitView
                  onNodeClick={(_, n) => {
                    const id = String(n.id);
                    if (linkMode) {
                      if (!pendingLinkSource) {
                        setPendingLinkSource(id);
                        return;
                      }
                      if (pendingLinkSource === id) {
                        setPendingLinkSource("");
                        return;
                      }
                      const edgeId = `e-${pendingLinkSource}-${id}-${Date.now()}`;
                      setEdges((prev) =>
                        addEdge(
                          { id: edgeId, source: pendingLinkSource, target: id, label: `${pendingLinkSource} ↔ ${id}` },
                          prev
                        )
                      );
                      setPendingLinkSource("");
                      return;
                    }
                    setSelectedNodeId(id);
                  }}
                  onInit={setRfInstance}
                  snapToGrid={snapToGrid}
                  snapGrid={[12, 12]}
                  nodeTypes={nodeTypes}
                >
                  <Controls />
                  <MiniMap zoomable pannable className="bg-background border rounded-lg" />
                  <Background gap={12} size={1} />
                </ReactFlow>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lab</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Lab name</Label>
                <Input value={labName} onChange={(e) => setLabName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Workspace</Label>
                <Select value={workspaceId} onValueChange={(v) => setWorkspaceId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={workspacesQ.isLoading ? "Loading…" : "Select workspace…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspacesQ.data?.workspaces ?? []).map((w: any) => (
                      <SelectItem key={String(w.id)} value={String(w.id)}>
                        {String(w.name ?? w.slug ?? w.id)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Runtime</Label>
                <Select value={runtime} onValueChange={(v) => setRuntime(v as any)} disabled={!workspaceId}>
                  <SelectTrigger>
                    <SelectValue placeholder={!workspaceId ? "Select workspace first…" : "Select runtime…"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clabernetes">Clabernetes (in-cluster)</SelectItem>
                    <SelectItem value="containerlab">Containerlab (BYOS)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Repo path</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={templatesDir} onChange={(e) => setTemplatesDir(e.target.value)} placeholder="containerlab/designer" />
                  <Input value={templateFile} onChange={(e) => setTemplateFile(e.target.value)} placeholder={`${labName || "lab"}.clab.yml`} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard?.writeText(`${effectiveTemplatesDir}/${effectiveTemplateFile}`);
                      toast.success("Copied path");
                    }}
                    disabled={!workspaceId}
                  >
                    Copy path
                  </Button>
                  <Button size="sm" variant="outline" onClick={openMapInNewTab} disabled={!workspaceId}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open map
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {effectiveTemplatesDir}/{effectiveTemplateFile}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">Use saved config</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {lastSaved?.workspaceId === workspaceId ? `${lastSaved.filePath} (${lastSaved.branch})` : "Auto-saves before deploy"}
                  </div>
                </div>
                <Switch checked={useSavedConfig} onCheckedChange={(v) => setUseSavedConfig(Boolean(v))} />
              </div>
              <div className="space-y-1">
                <Label>Netlab server</Label>
                <Select
                  value={netlabServer}
                  onValueChange={(v) => setNetlabServer(v)}
                  disabled={!workspaceId || runtime !== "containerlab"}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        runtime !== "containerlab"
                          ? "Not required for clabernetes…"
                          : !workspaceId
                            ? "Select workspace first…"
                            : netlabServersQ.isLoading
                              ? "Loading…"
                              : "Select server…"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(netlabServersQ.data?.servers ?? []).map((s: any) => (
                      <SelectItem key={String(s.id)} value={`ws:${String(s.id)}`}>
                        {String(s.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button
                  className="w-full"
                  disabled={createDeployment.isPending}
                  onClick={() => createDeployment.mutate()}
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  {createDeployment.isPending ? "Creating…" : "Create deployment + deploy"}
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">Open deployment on create</div>
                  <div className="text-xs text-muted-foreground">Keeps the Designer open in this tab.</div>
                </div>
                <Switch checked={openDeploymentOnCreate} onCheckedChange={(v) => setOpenDeploymentOnCreate(Boolean(v))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Node</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedNode ? (
                <div className="text-sm text-muted-foreground">Click a node to edit.</div>
              ) : (
                <>
                  <div className="space-y-1">
                    <Label>Name</Label>
                    <Input
                      value={String(selectedNode.data?.label ?? selectedNode.id)}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: v } } : n)));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Kind</Label>
                    <Input
                      value={String((selectedNode.data as any)?.kind ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, kind: v } } : n)));
                      }}
                      placeholder="linux, ceos, ..."
                    />
                  </div>
                  <RegistryImagePicker
                    value={String((selectedNode.data as any)?.image ?? "")}
                    onChange={(image) => {
                      setNodes((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, image } } : n)));
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle>YAML</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void navigator.clipboard?.writeText(effectiveYaml);
                      toast.success("Copied YAML");
                    }}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={yamlMode === "generated" ? "default" : "outline"}
                  onClick={() => setYamlMode("generated")}
                >
                  Generated
                </Button>
                <Button
                  size="sm"
                  variant={yamlMode === "custom" ? "default" : "outline"}
                  onClick={() => {
                    setYamlMode("custom");
                    if (!customYaml.trim()) setCustomYaml(effectiveYaml);
                  }}
                >
                  Custom
                </Button>
              </div>
              {warnings.length ? (
                <div className="rounded-md border bg-amber-500/10 text-amber-900 dark:text-amber-200 px-3 py-2 text-xs">
                  {warnings.slice(0, 6).map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </div>
              ) : null}
              <Textarea
                value={yamlMode === "custom" ? customYaml : yaml}
                onChange={(e) => setCustomYaml(e.target.value)}
                readOnly={yamlMode !== "custom"}
                className="font-mono text-xs h-[320px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={importOpen} onOpenChange={(v) => setImportOpen(v)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import template</DialogTitle>
            <DialogDescription>Load an existing containerlab YAML from templates/blueprints into the editor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Source</Label>
                <Select
                  value={importSource}
                  onValueChange={(v) => {
                    const next = v as "workspace" | "blueprints";
                    setImportSource(next);
                    setImportDir(next === "workspace" ? "containerlab/designer" : "containerlab");
                    setImportFile("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blueprints">Blueprints</SelectItem>
                    <SelectItem value="workspace">Workspace repo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Directory</Label>
                <Input value={importDir} onChange={(e) => setImportDir(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Template</Label>
              <Select value={importFile} onValueChange={(v) => setImportFile(v)} disabled={!workspaceId}>
                <SelectTrigger>
                  <SelectValue placeholder={templatesQ.isLoading ? "Loading…" : "Select template…"} />
                </SelectTrigger>
                <SelectContent>
                  {(templatesQ.data?.templates ?? []).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templatesQ.isError ? <div className="text-xs text-destructive">Failed to list templates</div> : null}
            </div>

            <div className="space-y-1">
              <Label>Preview</Label>
              <Textarea
                value={templatePreviewQ.data?.yaml ?? ""}
                readOnly
                placeholder={importFile ? (templatePreviewQ.isLoading ? "Loading preview…" : "No preview") : "Select a template to preview…"}
                className="font-mono text-xs h-[220px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => importTemplate.mutate()} disabled={importTemplate.isPending || !importFile}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
