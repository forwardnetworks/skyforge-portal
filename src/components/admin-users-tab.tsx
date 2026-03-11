import type { AdminUsersTabProps } from "./admin-settings-tab-types";
import { AdminUsersApiPermissionsCard } from "./admin-users-api-permissions-card";
import { AdminUsersManagementCard } from "./admin-users-management-card";
import { AdminUsersPurgeCard } from "./admin-users-purge-card";
import { AdminUsersRbacCard } from "./admin-users-rbac-card";
import { TabsContent } from "./ui/tabs";

export function AdminUsersTab(props: AdminUsersTabProps) {
	return (
		<TabsContent value="users" className="space-y-6">
			<AdminUsersManagementCard {...props} />
			<AdminUsersRbacCard {...props} />
			<AdminUsersApiPermissionsCard {...props} />
			<AdminUsersPurgeCard {...props} />
		</TabsContent>
	);
}
