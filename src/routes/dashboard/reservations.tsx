import { createFileRoute } from "@tanstack/react-router";
import { PlatformReservationsPageContent } from "../../components/platform-reservations-page-content";
import { usePlatformReservationsPage } from "../../hooks/use-platform-reservations-page";

export const Route = createFileRoute("/dashboard/reservations")({
	component: PlatformReservationsPage,
});

function PlatformReservationsPage() {
	const page = usePlatformReservationsPage();
	return <PlatformReservationsPageContent page={page} />;
}
