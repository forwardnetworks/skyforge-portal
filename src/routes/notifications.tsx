import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPageContent } from "../components/notifications-page-content";
import { useNotificationsPage } from "../hooks/use-notifications-page";

export const Route = createFileRoute("/notifications")({
	component: NotificationsPage,
});

function NotificationsPage() {
	const page = useNotificationsPage();
	return <NotificationsPageContent page={page} />;
}
