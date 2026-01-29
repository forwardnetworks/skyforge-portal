import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../components/ui/card";
import { queryKeys } from "../../lib/query-keys";

export const Route = createFileRoute("/admin/settings")({
	component: AdminSettingsPage,
});

function AdminSettingsPage() {
	const queryClient = useQueryClient();
	const session = queryClient.getQueryData<any>(queryKeys.session());
	const isAdmin = !!session?.isAdmin;

	return (
		<div className="space-y-6 p-6">
			<Card variant="glass">
				<CardHeader>
					<CardTitle>System settings</CardTitle>
					<CardDescription>Admin-only settings for Skyforge.</CardDescription>
				</CardHeader>
			</Card>

			{!isAdmin && (
				<Card variant="danger">
					<CardContent className="pt-6">
						<div className="text-center font-medium">
							Admin access required.
						</div>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardContent className="pt-6">
					<p className="text-sm text-muted-foreground">
						This build uses Server-Sent Events (SSE) for live updates; polling
						configuration has been removed.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
