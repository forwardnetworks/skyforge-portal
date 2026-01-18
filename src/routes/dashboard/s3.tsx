import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Inbox } from "lucide-react";
import { getWorkspaces, downloadWorkspaceArtifact, listWorkspaceArtifacts } from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

export const Route = createFileRoute("/dashboard/s3")({
  component: S3Page
});

function S3Page() {
  const workspaces = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
    staleTime: 30_000
  });

  const selectedWorkspaceId = useMemo(() => workspaces.data?.workspaces?.[0]?.id ?? "", [workspaces.data?.workspaces]);

  const artifacts = useQuery({
    queryKey: queryKeys.workspaceArtifacts(selectedWorkspaceId),
    queryFn: async () => listWorkspaceArtifacts(selectedWorkspaceId),
    staleTime: 10_000,
    enabled: !!selectedWorkspaceId
  });

  const list = artifacts.data?.items ?? [];

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
          ) : workspaces.isError || artifacts.isError ? (
            <div className="p-8 text-center text-destructive">Failed to list objects.</div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No objects found"
              description="No artifacts found for this workspace."
            />
          ) : (
            <div>
              <div className="p-4 border-b flex items-center gap-3">
                <div className="text-sm font-medium">Workspace</div>
                <Select value={selectedWorkspaceId} disabled>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Select workspace" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspaces.data?.workspaces ?? []).map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Object</TableHead>
                    <TableHead className="w-[120px] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="font-mono text-xs">{item.key}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const resp = await downloadWorkspaceArtifact(selectedWorkspaceId, item.key);
                            const blob = new Blob([Uint8Array.from(atob(resp.fileData), (c) => c.charCodeAt(0))]);
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = item.key.split("/").pop() || "artifact";
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                          }}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
