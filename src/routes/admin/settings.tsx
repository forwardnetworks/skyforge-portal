import { createFileRoute, redirect } from "@tanstack/react-router";
import {
	AdminAuditTab,
	AdminOverviewTab,
	AdminTasksTab,
	AdminUsersTab,
} from "../../components/admin-settings-tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useAdminSettingsPage } from "../../hooks/use-admin-settings-page";
import { requireAdminRouteAccess } from "../../lib/admin-route";
import { requireAdvancedRouteAccess } from "../../lib/ui-experience-route";
import {
	buildAdminAuditTabProps,
	buildAdminOverviewTabProps,
	buildAdminTasksTabProps,
	buildAdminUsersTabProps,
} from "./-admin-settings-tab-props";

export const Route = createFileRoute("/admin/settings")({
	beforeLoad: async ({ context }) => {
		await requireAdvancedRouteAccess(context);
		await requireAdminRouteAccess(context);
		throw redirect({ to: "/settings", search: { tab: "admin" } });
	},
	component: AdminSettingsPage,
});

export function AdminSettingsPage() {
	const page = useAdminSettingsPage();
	const overviewTabProps = buildAdminOverviewTabProps(page);
	const auditTabProps = buildAdminAuditTabProps(page);
	const tasksTabProps = buildAdminTasksTabProps(page);
	const usersTabProps = buildAdminUsersTabProps(page);

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>System settings</CardTitle>
					<CardDescription>Admin-only settings for Skyforge.</CardDescription>
				</CardHeader>
			</Card>

			{!page.isAdmin && (
				<Card variant="danger">
					<CardContent className="pt-6">
						<div className="text-center font-medium">
							Admin access required.
						</div>
					</CardContent>
				</Card>
			)}

			{page.isAdmin && (
				<Tabs defaultValue="overview">
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="audit">Audit</TabsTrigger>
						<TabsTrigger value="tasks">Tasks</TabsTrigger>
						<TabsTrigger value="users">Users</TabsTrigger>
					</TabsList>

					<AdminOverviewTab {...overviewTabProps} />

					<AdminAuditTab {...auditTabProps} />

					<AdminTasksTab {...tasksTabProps} />

					<AdminUsersTab {...usersTabProps} />
				</Tabs>
			)}
		</div>
	);
}
