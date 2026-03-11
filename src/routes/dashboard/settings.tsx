import { createFileRoute, redirect } from "@tanstack/react-router";
import { UserSettingsContent } from "../../components/user-settings-content";
import { useUserSettingsPage } from "../../hooks/use-user-settings-page";

export const Route = createFileRoute("/dashboard/settings")({
	beforeLoad: () => {
		throw redirect({ to: "/settings", search: { tab: "profile" } });
	},
	component: UserSettingsPage,
});

export function UserSettingsPage() {
	const page = useUserSettingsPage();

	return (
		<div className="w-full space-y-6 p-4 sm:p-6 xl:p-8">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">My Settings</h1>
				<p className="text-sm text-muted-foreground">
					Defaults that pre-fill new deployments. These do not change existing
					deployments.
				</p>
			</div>

			<UserSettingsContent page={page} />
		</div>
	);
}
