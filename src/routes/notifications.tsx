import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MoreHorizontal, Bell, Check, Trash2, Inbox } from "lucide-react";
import { getSession, getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, deleteNotification } from "../lib/skyforge-api";
import type { NotificationRecord } from "../lib/skyforge-api";
import { queryKeys } from "../lib/query-keys";
import { useNotificationsEvents, type NotificationsSnapshot } from "../lib/notifications-events";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button, buttonVariants } from "../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { TableWrapper } from "../components/ui/table-wrapper";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { toast } from "sonner";
import { Checkbox } from "../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage
});

function NotificationsPage() {
  const [includeRead, setIncludeRead] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = "50";

  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: queryKeys.session(), queryFn: getSession, staleTime: 30_000, retry: false });
  const username = session.data?.username ?? "";

  useNotificationsEvents(!!username, includeRead, limit);

  const notifications = useQuery<NotificationsSnapshot>({
    queryKey: queryKeys.notifications(includeRead, limit),
    enabled: !!username,
    queryFn: async () => {
      const resp = await getUserNotifications(username, { include_read: includeRead ? "true" : "false", limit });
      return { notifications: resp.notifications ?? [] };
    },
    staleTime: Infinity,
    initialData: { notifications: [] }
  });

  const list = useMemo(() => notifications.data?.notifications ?? [], [notifications.data?.notifications]);
  const unreadCount = useMemo(() => list.filter((n: NotificationRecord) => !n.is_read).length, [list]);

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelected(new Set(list.map((n) => String(n.id))));
    } else {
      setSelected(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selected);
    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setSelected(next);
  };

  const handleBulkMarkRead = async () => {
    try {
      const promises = Array.from(selected).map((id) => markNotificationAsRead(id));
      await Promise.all(promises);
      toast.success(`${selected.size} notifications marked as read`);
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications(includeRead, limit) });
    } catch (e) {
      toast.error("Failed to mark selection as read", { description: (e as Error).message });
    }
  };

  const handleBulkDelete = async () => {
    try {
      const promises = Array.from(selected).map((id) => deleteNotification(id));
      await Promise.all(promises);
      toast.success(`${selected.size} notifications deleted`);
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications(includeRead, limit) });
    } catch (e) {
      toast.error("Failed to delete selection", { description: (e as Error).message });
    }
  };

  // Single action handlers
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(username);
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark notifications as read", { description: (e as Error).message });
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      toast.success("Notification marked as read");
    } catch (e) {
      toast.error("Failed to mark notification as read", { description: (e as Error).message });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotification(deleteTarget);
      toast.success("Notification deleted");
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (e) {
      toast.error("Failed to delete notification", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>
                  Stay updated with platform events and system alerts.
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-read"
                  checked={includeRead}
                  onCheckedChange={setIncludeRead}
                />
                <Label htmlFor="show-read" className="cursor-pointer">Show read</Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={!username || unreadCount === 0}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-full border bg-background/95 p-2 px-6 shadow-xl backdrop-blur animate-in slide-in-from-bottom-10 fade-in duration-300">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="ghost" onClick={handleBulkMarkRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark read
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Cancel
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {notifications.isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : notifications.isError ? (
            <div className="p-8 text-center text-destructive">Failed to load notifications.</div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No notifications"
              description={includeRead ? "You don't have any notifications at the moment." : "You've read all your notifications!"}
            />
          ) : (
            <TableWrapper className="border-none">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox 
                        checked={list.length > 0 && selected.size === list.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[180px]">Time</TableHead>
                    <TableHead>Title & Message</TableHead>
                    <TableHead className="w-[120px]">Category</TableHead>
                    <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((n: NotificationRecord) => {
                    const id = String(n.id);
                    const isSelected = selected.has(id);
                    
                    return (
                      <TableRow 
                        key={id} 
                        className={n.is_read ? "opacity-60 grayscale-[0.5]" : ""}
                        data-state={isSelected ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectOne(id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                          {n.created_at ?? ""}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{n.title ?? ""}</div>
                          {n.message ? <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.message}</div> : null}
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
                            {n.category ?? "System"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!n.is_read && (
                                <DropdownMenuItem onClick={() => handleMarkRead(id)}>
                                  <Check className="mr-2 h-4 w-4" />
                                  <span>Mark as read</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setDeleteTarget(id);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableWrapper>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}