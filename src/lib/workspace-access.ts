import type { SessionResponseEnvelope, SkyforgeWorkspace } from "./skyforge-api";

export type WorkspaceAccess = "admin" | "owner" | "editor" | "viewer" | "none";

export function workspaceAccess(session: SessionResponseEnvelope | undefined, w: SkyforgeWorkspace | null): WorkspaceAccess {
  if (!w) return "none";
  const username = String(session?.username ?? "").trim();
  const isAdmin = !!session?.isAdmin;
  if (isAdmin) return "admin";
  if (!username) return "none";

  if (String(w.createdBy ?? "").toLowerCase() === username.toLowerCase()) return "owner";
  if ((w.owners ?? []).some((u) => String(u).toLowerCase() === username.toLowerCase())) return "owner";
  if ((w.editors ?? []).some((u) => String(u).toLowerCase() === username.toLowerCase())) return "editor";
  if ((w.viewers ?? []).some((u) => String(u).toLowerCase() === username.toLowerCase())) return "viewer";
  if (w.isPublic) return "viewer";

  return "none";
}

export function canEditWorkspace(access: WorkspaceAccess): boolean {
  return access === "admin" || access === "owner" || access === "editor";
}

export function canDeleteWorkspace(access: WorkspaceAccess): boolean {
  return access === "admin" || access === "owner";
}

