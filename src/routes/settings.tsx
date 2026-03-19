import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "../components/ui/tabs";
import { useCatalogRouteAccess } from "../hooks/use-catalog-route-access";
import { AdminSettingsPage } from "./admin/settings";
import { UserSettingsPage } from "./dashboard/settings";

const settingsSearchSchema = z.object({
	tab: z.enum(["profile", "admin"]).optional().catch("profile"),
});

export const Route = createFileRoute("/settings")({
	validateSearch: (search) => settingsSearchSchema.parse(search),
	component: SettingsHubPage,
});

function SettingsHubPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const routeAccess = useCatalogRouteAccess();
	const currentTab = search.tab ?? "profile";
	const canAccessAdminTab = routeAccess.canAccessRoute("/admin/settings");
	const activeTab = canAccessAdminTab ? currentTab : "profile";

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>Settings</CardTitle>
					<CardDescription>
						Unified settings hub for personal defaults, integrations, and admin
						controls.
					</CardDescription>
				</CardHeader>
			</Card>

			<Tabs
				value={activeTab}
				onValueChange={(value) => {
					void navigate({
						to: "/settings",
						search: { tab: value as "profile" | "admin" },
					});
				}}
			>
				<TabsList>
					<TabsTrigger value="profile">Profile</TabsTrigger>
					{canAccessAdminTab ? (
						<TabsTrigger value="admin">Users & Access</TabsTrigger>
					) : null}
				</TabsList>
				<TabsContent value="profile" className="space-y-6">
					<UserSettingsPage />
				</TabsContent>
				{canAccessAdminTab ? (
					<TabsContent value="admin" className="space-y-6">
						<AdminSettingsPage />
					</TabsContent>
				) : null}
			</Tabs>
		</div>
	);
}
