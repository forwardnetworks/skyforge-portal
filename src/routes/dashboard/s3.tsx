import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Inbox } from "lucide-react";
import { listStorageFiles, SKYFORGE_PROXY_ROOT } from "../../lib/skyforge-api";
import { queryKeys } from "../../lib/query-keys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";

export const Route = createFileRoute("/dashboard/s3")({
  component: S3Page
});

function S3Page() {
  const files = useQuery({
    queryKey: queryKeys.storageFiles(),
    queryFn: listStorageFiles,
    staleTime: 10_000
  });

  const list = files.data?.files ?? [];

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
          {files.isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : files.isError ? (
            <div className="p-8 text-center text-destructive">Failed to list objects.</div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No objects found"
              description="The storage bucket is currently empty."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Object</TableHead>
                  <TableHead className="w-[100px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((name) => (
                  <TableRow key={name}>
                    <TableCell className="font-mono text-xs">{name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`${SKYFORGE_PROXY_ROOT}/storage/download/${encodeURIComponent(name)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Download
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
