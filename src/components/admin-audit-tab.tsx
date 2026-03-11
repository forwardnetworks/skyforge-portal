import type { AdminAuditTabProps } from "./admin-settings-tab-types";
import { Badge } from "./ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { DataTable } from "./ui/data-table";
import { Input } from "./ui/input";
import { TabsContent } from "./ui/tabs";
export function AdminAuditTab(props: AdminAuditTabProps) {
	return (
		<TabsContent value="audit" className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Audit log</CardTitle>
					<CardDescription>Recent admin and user actions.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Limit</span>
							<Input
								className="w-28"
								value={props.auditLimit}
								onChange={(e) => props.onAuditLimitChange(e.target.value)}
							/>
						</div>
						<Badge variant="outline">{props.auditTimestamp ?? "—"}</Badge>
					</div>
					<DataTable
						rows={props.auditEvents ?? []}
						columns={props.auditColumns}
						getRowId={(row) => String(row.id)}
						isLoading={props.auditLoading}
						emptyText="No audit events."
						minWidthClassName="min-w-[1100px]"
					/>
				</CardContent>
			</Card>
		</TabsContent>
	);
}
