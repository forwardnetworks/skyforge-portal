import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listWorkspaceVariableGroups,
  createWorkspaceVariableGroup,
  updateWorkspaceVariableGroup,
  deleteWorkspaceVariableGroup,
  type WorkspaceVariableGroup,
  type WorkspaceVariableGroupListResponse,
  type WorkspaceVariableGroupUpsertRequest,
} from "../lib/skyforge-api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Plus, Trash2, Edit2, Save, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { NETLAB_ENV_KEYS, isNetlabMultilineKey, netlabValuePresets } from "../lib/netlab-env";

type Props = {
  workspaceId: string;
  allowEdit: boolean;
};

export function WorkspaceVariableGroups({ workspaceId, allowEdit }: Props) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<WorkspaceVariableGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceVariableGroup | null>(null);

  const groupsQ = useQuery<WorkspaceVariableGroupListResponse>({
    queryKey: ["workspaceVariableGroups", workspaceId],
    queryFn: async () => listWorkspaceVariableGroups(workspaceId),
    staleTime: 30_000,
  });

  const groups = groupsQ.data?.groups ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (groupId: number) => deleteWorkspaceVariableGroup(workspaceId, groupId),
    onSuccess: () => {
      toast.success("Variable group deleted");
      queryClient.invalidateQueries({ queryKey: ["workspaceVariableGroups", workspaceId] });
      setDeleteTarget(null);
    },
    onError: (e) => toast.error("Failed to delete group", { description: (e as Error).message }),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Variable Groups</CardTitle>
            <CardDescription>
              Define sets of environment variables that can be injected into deployments.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            disabled={!allowEdit}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Group
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {groupsQ.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading groups…</div>
        ) : groups.length === 0 ? (
          <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
            No variable groups defined.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g: WorkspaceVariableGroup) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {Object.keys(g.variables ?? {}).length} variables
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingGroup(g)}
                          disabled={!allowEdit}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(g)}
                          disabled={!allowEdit}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <VariableGroupDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        workspaceId={workspaceId}
        allowEdit={allowEdit}
        mode="create"
      />

      {editingGroup && (
        <VariableGroupDialog
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          workspaceId={workspaceId}
          allowEdit={allowEdit}
          mode="edit"
          initialData={editingGroup}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete variable group?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function VariableGroupDialog({
  open,
  onOpenChange,
  workspaceId,
  allowEdit,
  mode,
  initialData,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  allowEdit: boolean;
  mode: "create" | "edit";
  initialData?: WorkspaceVariableGroup;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialData?.name ?? "");
  const [helpOpen, setHelpOpen] = useState(false);
  const [vars, setVars] = useState<{ key: string; value: string }[]>(() => {
    if (!initialData?.variables) return [{ key: "", value: "" }];
    return Object.entries(initialData.variables).map(([key, value]) => ({ key, value }));
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const variables: Record<string, string> = {};
      for (const v of vars) {
        if (v.key.trim()) {
          variables[v.key.trim()] = v.value;
        }
      }
      const payload: WorkspaceVariableGroupUpsertRequest = {
        name: name.trim(),
        variables,
      };

      if (mode === "create") {
        return createWorkspaceVariableGroup(workspaceId, payload);
      } else {
        if (!initialData) throw new Error("Missing initial data for edit");
        return updateWorkspaceVariableGroup(workspaceId, initialData.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Group created" : "Group updated");
      queryClient.invalidateQueries({ queryKey: ["workspaceVariableGroups", workspaceId] });
      onOpenChange(false);
      if (mode === "create") {
        setName("");
        setVars([{ key: "", value: "" }]);
      }
    },
    onError: (e) => toast.error("Failed to save group", { description: (e as Error).message }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Variable Group" : "Edit Variable Group"}</DialogTitle>
          <DialogDescription>
            Define environment variables as key-value pairs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Group Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Vars"
              disabled={!allowEdit}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variables</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setHelpOpen(true)}>
                  Supported vars
                </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setVars([...vars, { key: "", value: "" }])}
                disabled={!allowEdit}
              >
                <Plus className="mr-2 h-3 w-3" /> Add Variable
              </Button>
              </div>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-2">
              {vars.map((v, idx) => {
                const currentKey = String(v.key ?? "").trim();
                const isKnown = NETLAB_ENV_KEYS.some((k) => k.key === currentKey);
                const selectValue = isKnown ? currentKey : "__custom__";
                const isMultiline = isNetlabMultilineKey(currentKey);
                const presets = netlabValuePresets(currentKey);

                const updateVar = (patch: Partial<{ key: string; value: string }>) => {
                  setVars((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], ...patch };
                    return next;
                  });
                };

                const removeVar = () => {
                  setVars((prev) => {
                    const next = prev.filter((_, i) => i !== idx);
                    return next.length ? next : [{ key: "", value: "" }];
                  });
                };

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs text-muted-foreground">Key</Label>
                      <Select
                        value={selectValue}
                        onValueChange={(val) => updateVar({ key: val === "__custom__" ? "" : val })}
                        disabled={!allowEdit}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select key…" />
                        </SelectTrigger>
                        <SelectContent>
                          {NETLAB_ENV_KEYS.map((k) => (
                            <SelectItem key={k.key} value={k.key}>
                              {k.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="__custom__">Custom…</SelectItem>
                        </SelectContent>
                      </Select>
                      {selectValue === "__custom__" && (
                        <Input
                          placeholder="KEY"
                          value={v.key}
                          onChange={(e) => updateVar({ key: e.target.value })}
                          className="font-mono text-xs"
                          disabled={!allowEdit}
                        />
                      )}
                    </div>

                    <div className="col-span-6 space-y-1">
                      <Label className="text-xs text-muted-foreground">Value</Label>
                      {isMultiline ? (
                        <Textarea
                          value={v.value}
                          onChange={(e) => updateVar({ value: e.target.value })}
                          placeholder={"One `key=value` per line.\nExample:\naddressing.p2p.ipv4=198.18.0.0/16"}
                          className="font-mono text-xs min-h-[120px]"
                          disabled={!allowEdit}
                        />
                      ) : presets ? (
                        <div className="space-y-2">
                          {(() => {
                            const currentValue = String(v.value ?? "").trim();
                            const isPreset = presets.some((p) => p.value === currentValue);
                            const valueSelect = currentValue ? (isPreset ? currentValue : "__custom__") : "none";
                            return (
                              <>
                                <Select
                                  value={valueSelect}
                                  onValueChange={(val) => {
                                    if (val === "none") updateVar({ value: "" });
                                    else if (val === "__custom__") updateVar({ value: isPreset ? "" : currentValue });
                                    else updateVar({ value: val });
                                  }}
                                  disabled={!allowEdit}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select value…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {presets.map((p) => (
                                      <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="__custom__">Custom…</SelectItem>
                                  </SelectContent>
                                </Select>
                                {valueSelect === "__custom__" && (
                                  <Input
                                    placeholder="VALUE"
                                    value={v.value}
                                    onChange={(e) => updateVar({ value: e.target.value })}
                                    className="font-mono text-xs"
                                    disabled={!allowEdit}
                                  />
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <Input
                          placeholder="VALUE"
                          value={v.value}
                          onChange={(e) => updateVar({ value: e.target.value })}
                          className="font-mono text-xs"
                          disabled={!allowEdit}
                        />
                      )}
                    </div>

                    <div className="col-span-1 flex justify-end pt-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={removeVar}
                        disabled={!allowEdit}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!allowEdit || mutation.isPending || !name.trim()}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Group
          </Button>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={helpOpen} onOpenChange={setHelpOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supported NETLAB_ variables</AlertDialogTitle>
            <AlertDialogDescription>
              These are the most useful Netlab defaults you can override via environment variables (plus Skyforge’s
              multiline `SKYFORGE_NETLAB_SET_OVERRIDES`).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[50vh] overflow-auto rounded-md border bg-muted/30 p-3 font-mono text-xs">
            {NETLAB_ENV_KEYS.map((k) => (
              <div key={k.key} className="flex gap-2">
                <span className="text-foreground">{k.key}</span>
                <span className="text-muted-foreground">— {k.label}</span>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction>Close</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
