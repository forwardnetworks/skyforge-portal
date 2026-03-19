import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge } from "../components/ui/badge";
import type { DataTableColumn } from "../components/ui/data-table";
import { type AdminAuditResponse, getAdminAudit } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";

export function useAdminSettingsAudit() {
	const [auditLimit, setAuditLimit] = useState("200");
	const auditQ = useQuery({
		queryKey: queryKeys.adminAudit(auditLimit),
		queryFn: () => getAdminAudit({ limit: auditLimit }),
		staleTime: 15_000,
		retry: false,
	});

	const auditColumns = useMemo<
		DataTableColumn<AdminAuditResponse["events"][number]>[]
	>(
		() => [
			{
				id: "createdAt",
				header: "Time",
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.createdAt}
					</span>
				),
				width: 220,
			},
			{
				id: "actor",
				header: "Actor",
				cell: (row) => (
					<div className="flex items-center gap-2">
						<span className="font-medium">{row.actorUsername}</span>
						{row.actorIsAdmin ? <Badge variant="secondary">admin</Badge> : null}
						{row.impersonatedUsername ? (
							<Badge variant="outline">as {row.impersonatedUsername}</Badge>
						) : null}
					</div>
				),
				width: 260,
			},
			{ id: "action", header: "Action", cell: (row) => row.action, width: 260 },
			{
				id: "userId",
				header: "User Scope",
				cell: (row) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.userId}
					</span>
				),
				width: 220,
			},
			{
				id: "details",
				header: "Details",
				cell: (row) => (
					<span className="text-xs text-muted-foreground">{row.details}</span>
				),
			},
		],
		[],
	);

	return { auditLimit, setAuditLimit, auditQ, auditColumns };
}
