import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getSession, getWorkspaces, type SkyforgeWorkspace } from "../../../lib/skyforge-api";
import { queryKeys } from "../../../lib/query-keys";
import { canEditWorkspace, workspaceAccess } from "../../../lib/workspace-access";
import { Button, buttonVariants } from "../../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { Skeleton } from "../../../components/ui/skeleton";
import { Settings, Plus, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/dashboard/workspaces/")({
  component: WorkspacesIndexPage,
});

function WorkspacesIndexPage() {
  const session = useQuery({ queryKey: queryKeys.session(), queryFn: getSession, staleTime: 30_000, retry: false });
  const workspacesQ = useQuery({
    queryKey: queryKeys.workspaces(),
    queryFn: getWorkspaces,
  });

  const workspaces = (workspacesQ.data?.workspaces ?? []) as SkyforgeWorkspace[];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
          <p className="text-muted-foreground text-sm">Create and configure workspaces.</p>
        </div>
        <Link to="/dashboard/workspaces/new" className={buttonVariants({ variant: "default" })}>
          <Plus className="h-4 w-4 mr-2" />
          Create workspace
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All workspaces</CardTitle>
          <CardDescription>Workspaces you can access.</CardDescription>
        </CardHeader>
        <CardContent>
          {workspacesQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : workspacesQ.isError ? (
            <div className="text-sm text-destructive">Failed to load workspaces.</div>
          ) : workspaces.length === 0 ? (
            <div className="text-sm text-muted-foreground">No workspaces yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Visibility</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workspaces.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell className="text-muted-foreground">{w.slug}</TableCell>
                    <TableCell>
                      <Badge variant={w.isPublic ? "default" : "secondary"}>{w.isPublic ? "Public" : "Private"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to="/dashboard/deployments"
                          search={{ workspace: w.id }}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Deployments
                        </Link>
                        <Link
                          to="/dashboard/workspaces/$workspaceId"
                          params={{ workspaceId: w.id }}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                          aria-disabled={!canEditWorkspace(workspaceAccess(session.data, w))}
                          tabIndex={!canEditWorkspace(workspaceAccess(session.data, w)) ? -1 : 0}
                          onClick={(e) => {
                            if (!canEditWorkspace(workspaceAccess(session.data, w))) e.preventDefault();
                          }}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Link>
                      </div>
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
