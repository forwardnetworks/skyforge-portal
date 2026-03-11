import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { TerminalSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getUserInfobloxStatus, wakeUserInfoblox } from "@/lib/api-client";
import { embeddedToolHref } from "@/lib/embedded-tools";

export const Route = createFileRoute("/dashboard/infoblox")({
	component: InfobloxPage,
});

function InfobloxPage() {
	const statusQ = useQuery({
		queryKey: ["infobloxStatus", "dashboardDetail"],
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

	const status = statusQ.data?.ready
		? "Ready"
		: statusQ.data?.printableStatus || "Not ready";

	return (
		<div className="space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold">Infoblox</h1>
				<p className="text-sm text-muted-foreground">
					KubeVirt-backed NIOS appliance status and troubleshooting controls.
				</p>
			</div>

			<Card variant="glass">
				<CardHeader>
					<CardTitle>Status</CardTitle>
					<CardDescription>Current VM and service readiness.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3 text-sm">
					<div className="text-muted-foreground">
						{statusQ.isLoading ? "Loading..." : status}
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							size="sm"
							onClick={() => wake.mutate()}
							disabled={wake.isPending}
						>
							{wake.isPending ? "Starting..." : "Wake VM"}
						</Button>
						<Button asChild size="sm" variant="secondary">
							<Link to={embeddedToolHref("infoblox")}>Open UI</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link to="/admin/infoblox/console">
								Console <TerminalSquare className="ml-1 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
