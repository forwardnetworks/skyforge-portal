import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Eye, FolderPlus, Inbox, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkspaceArtifactFolder,
  deleteWorkspaceArtifactObject,
  downloadWorkspaceArtifact,
  getWorkspaces,
  listWorkspaceArtifacts,
  putWorkspaceArtifactObject
} from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";

export const Route = createFileRoute("/dashboard/s3")({
  component: S3Page
});

function S3Page() {
  const workspaces = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
    staleTime: 30_000
  });

  const workspaceOptions = workspaces.data?.workspaces ?? [];
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [prefix, setPrefix] = useState("");

  useEffect(() => {
    if (workspaceOptions.length === 0) return;
    const stored = window.localStorage.getItem("skyforge.lastWorkspaceId.s3") ?? "";
    const initial = workspaceOptions.some((w) => w.id === stored) ? stored : (workspaceOptions[0]?.id ?? "");
    setSelectedWorkspaceId((prev) => prev || initial);
  }, [workspaceOptions]);

  const artifacts = useQuery({
    queryKey: queryKeys.workspaceArtifacts(selectedWorkspaceId),
    queryFn: async () => listWorkspaceArtifacts(selectedWorkspaceId, { prefix: prefix || undefined }),
    staleTime: 10_000,
    enabled: !!selectedWorkspaceId
  });

  const list = artifacts.data?.items ?? [];

  const toolbar = (
    <div className="p-4 border-b flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium">Workspace</div>
        <Select
          value={selectedWorkspaceId}
          onValueChange={(id) => {
            setSelectedWorkspaceId(id);
            window.localStorage.setItem("skyforge.lastWorkspaceId.s3", id);
          }}
          disabled={workspaceOptions.length === 0}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            {workspaceOptions.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name} ({w.slug})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          placeholder="Prefix (e.g. topology/)"
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          className="w-[260px]"
        />
        <Button variant="outline" size="sm" onClick={() => artifacts.refetch()} disabled={!selectedWorkspaceId}>
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            if (!selectedWorkspaceId) return;
            const folder = window.prompt("Folder prefix (e.g. uploads/)");
            if (!folder) return;
            try {
              await createWorkspaceArtifactFolder(selectedWorkspaceId, folder);
              toast.success("Folder created");
              await artifacts.refetch();
            } catch (e) {
              toast.error("Create folder failed", { description: (e as Error).message });
            }
          }}
          disabled={!selectedWorkspaceId}
        >
          <FolderPlus className="mr-2 h-3 w-3" />
          Folder
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!selectedWorkspaceId) return;
            const input = document.createElement("input");
            input.type = "file";
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;
              void (async () => {
                try {
                  const buf = new Uint8Array(await file.arrayBuffer());
                  // Avoid `btoa` string size limits by chunking.
                  let b64 = "";
                  const chunkSize = 32 * 1024;
                  for (let i = 0; i < buf.length; i += chunkSize) {
                    const chunk = buf.subarray(i, i + chunkSize);
                    b64 += btoa(String.fromCharCode(...chunk));
                  }
                  const key = (prefix || "") + file.name;
                  await putWorkspaceArtifactObject(selectedWorkspaceId, {
                    key,
                    contentBase64: b64,
                    contentType: file.type || "application/octet-stream"
                  });
                  toast.success("Uploaded", { description: key });
                  await artifacts.refetch();
                } catch (e) {
                  toast.error("Upload failed", { description: (e as Error).message });
                }
              })();
            };
            input.click();
          }}
          disabled={!selectedWorkspaceId}
        >
          <Upload className="mr-2 h-3 w-3" />
          Upload
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>S3</CardTitle>
          <CardDescription>Workspace artifacts and generated files (backed by the platform object store).</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          {workspaces.isLoading || artifacts.isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div>
              {toolbar}
              {workspaces.isError || artifacts.isError ? (
                <div className="p-8 text-center text-destructive">Failed to list objects.</div>
              ) : list.length === 0 ? (
                <div className="p-6">
                  <EmptyState icon={Inbox} title="No objects found" description="No artifacts found for this workspace." />
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Object</TableHead>
                        <TableHead className="w-[260px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((item) => (
                        <TableRow key={item.key}>
                          <TableCell className="font-mono text-xs">{item.key}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {item.key.toLowerCase().endsWith(".json") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      const resp = await downloadWorkspaceArtifact(selectedWorkspaceId, item.key);
                                      const raw = atob(resp.fileData);
                                      const bin = new Uint8Array(raw.length);
                                      for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);
                                      const txt = new TextDecoder().decode(bin);
                                      const pretty = JSON.stringify(JSON.parse(txt), null, 2);
                                      const blob = new Blob([pretty], { type: "application/json" });
                                      const url = URL.createObjectURL(blob);
                                      window.open(url, "_blank", "noopener,noreferrer");
                                      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
                                    } catch (e) {
                                      toast.error("View failed", { description: (e as Error).message });
                                    }
                                  }}
                                >
                                  <Eye className="mr-2 h-3 w-3" />
                                  View
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const resp = await downloadWorkspaceArtifact(selectedWorkspaceId, item.key);
                                    const raw = atob(resp.fileData);
                                    const bin = new Uint8Array(raw.length);
                                    for (let i = 0; i < raw.length; i++) bin[i] = raw.charCodeAt(i);
                                    const blob = new Blob([bin]);
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = item.key.split("/").pop() || "artifact";
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    URL.revokeObjectURL(url);
                                  } catch (e) {
                                    toast.error("Download failed", { description: (e as Error).message });
                                  }
                                }}
                              >
                                <Download className="mr-2 h-3 w-3" />
                                Download
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm(`Delete ${item.key}?`)) return;
                                  try {
                                    await deleteWorkspaceArtifactObject(selectedWorkspaceId, item.key);
                                    toast.success("Deleted", { description: item.key });
                                    await artifacts.refetch();
                                  } catch (e) {
                                    toast.error("Delete failed", { description: (e as Error).message });
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-3 w-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
