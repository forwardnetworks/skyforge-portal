import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";

import { InfobloxConsoleView } from "@/components/infoblox-console-view";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { requireAdminRouteAccess } from "@/lib/admin-route";
import {
	getUIConfig,
	getUserInfobloxStatus,
	wakeUserInfoblox,
} from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export const Route = createFileRoute("/admin/infoblox/console")({
	beforeLoad: async ({ context }) => requireAdminRouteAccess(context),
	component: InfobloxConsolePage,
});

function InfobloxConsolePage() {
	const uiConfigQ = useQuery({
		queryKey: queryKeys.uiConfig(),
		queryFn: getUIConfig,
		retry: false,
		staleTime: 10_000,
	});
	const statusQ = useQuery({
		queryKey: ["infobloxStatus", "adminConsole"],
		queryFn: getUserInfobloxStatus,
		retry: false,
		staleTime: 10_000,
	});
	const wake = useMutation({
		mutationFn: wakeUserInfoblox,
		onSuccess: async (resp) => {
			toast.message(resp.message || "Wake requested");
			await statusQ.refetch();
		},
		onError: (error) => {
			toast.error("Failed to wake Infoblox", {
				description: error instanceof Error ? error.message : String(error),
			});
		},
	});

	const enabled = uiConfigQ.data?.features?.infobloxEnabled ?? false;
	const statusText = statusQ.data?.printableStatus ?? statusQ.data?.phase ?? "";
	const running = statusText.toLowerCase() === "running";

	if (!enabled) {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>Infoblox Console</CardTitle>
						<CardDescription>Infoblox integration is disabled.</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (statusQ.isLoading) {
		return (
			<div className="p-6 text-sm text-muted-foreground">
				Checking Infoblox VM status...
			</div>
		);
	}

	if (statusQ.isError || !statusQ.data) {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>Infoblox Console</CardTitle>
						<CardDescription>
							Failed to load Infoblox status. This usually means the VM is
							missing or not managed.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							onClick={() => statusQ.refetch()}
						>
							Retry
						</Button>
						<Button
							size="sm"
							onClick={() => wake.mutate()}
							disabled={wake.isPending}
						>
							{wake.isPending ? "Starting..." : "Start/Wake VM"}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!running) {
		return (
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle>Infoblox Console</CardTitle>
						<CardDescription>
							VM is not running (current status: {statusText || "unknown"}).
						</CardDescription>
					</CardHeader>
					<CardContent className="flex gap-2">
						<Button
							size="sm"
							onClick={() => wake.mutate()}
							disabled={wake.isPending}
						>
							{wake.isPending ? "Starting..." : "Start/Wake VM"}
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => statusQ.refetch()}
						>
							Refresh status
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-140px)] min-h-[560px] p-6">
			<InfobloxConsoleView className="h-full rounded-md border" />
		</div>
	);
}
