import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { getSession } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { sessionIsAdmin } from "../lib/rbac";
import { AdminSettingsPage } from "./admin/settings";
import { UserSettingsPage } from "./dashboard/settings";

const settingsSearchSchema = z.object({
	tab: z.enum(["profile", "admin", "governance"]).optional().catch("profile"),
});

export const Route = createFileRoute("/settings")({
	validateSearch: (search) => settingsSearchSchema.parse(search),
	component: SettingsHubPage,
});

function SettingsHubPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const sessionQ = useQuery({
		queryKey: queryKeys.session(),
		queryFn: getSession,
		staleTime: 30_000,
		retry: false,
	});
	const isAdmin = sessionIsAdmin(sessionQ.data);
	const currentTab = search.tab ?? "profile";
	const activeTab = isAdmin ? currentTab : "profile";

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>Settings</CardTitle>
					<CardDescription>
						Unified settings hub for personal defaults, integrations, and admin controls.
					</CardDescription>
				</CardHeader>
			</Card>

			<Tabs
				value={activeTab}
				onValueChange={(value) => {
					void navigate({ to: "/settings", search: { tab: value as "profile" | "admin" | "governance" } });
				}}
			>
				<TabsList>
					<TabsTrigger value="profile">Profile</TabsTrigger>
					{isAdmin ? <TabsTrigger value="admin">Users & Access</TabsTrigger> : null}
					{isAdmin ? <TabsTrigger value="governance">Governance</TabsTrigger> : null}
				</TabsList>
				<TabsContent value="profile" className="space-y-6">
					<UserSettingsPage />
				</TabsContent>
				{isAdmin ? (
					<TabsContent value="admin" className="space-y-6">
						<AdminSettingsPage />
					</TabsContent>
				) : null}
				{isAdmin ? (
					<TabsContent value="governance" className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle>Governance</CardTitle>
								<CardDescription>
									Open the governance workspace for cost, policy, and usage controls.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Button
									onClick={() => {
										void navigate({ to: "/admin/governance" });
									}}
								>
									Open Governance
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				) : null}
			</Tabs>
		</div>
	);
}
