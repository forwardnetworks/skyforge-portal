import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../../../components/ui/select";
import {
	getDeploymentLifetimePolicy,
	getQuickDeployCatalog,
	runQuickDeploy,
} from "../../../lib/api-client";
import { queryKeys } from "../../../lib/query-keys";

export const Route = createFileRoute("/dashboard/deployments/quick")({
	component: QuickDeployPage,
});

function formatEstimate(vcpu: number, ramGiB: number): string {
	const cpu = Number.isFinite(vcpu) ? vcpu.toFixed(1) : "0.0";
	const ram = Number.isFinite(ramGiB) ? ramGiB.toFixed(1) : "0.0";
	return `${cpu} vCPU • ${ram} GiB RAM`;
}

function QuickDeployPage() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();
	const catalogQ = useQuery({
		queryKey: ["quick-deploy", "catalog"],
		queryFn: getQuickDeployCatalog,
		staleTime: 60_000,
		retry: false,
	});
	const lifetimePolicyQ = useQuery({
		queryKey: queryKeys.deploymentLifetimePolicy(),
		queryFn: getDeploymentLifetimePolicy,
		staleTime: 60_000,
		retry: false,
	});

	const [leaseHours, setLeaseHours] = useState("24");

	useEffect(() => {
		const fallback = String(
			lifetimePolicyQ.data?.defaultHours ??
				catalogQ.data?.defaultLeaseHours ??
				24,
		);
		setLeaseHours((current) => current || fallback);
	}, [catalogQ.data?.defaultLeaseHours, lifetimePolicyQ.data?.defaultHours]);

	const deployMutation = useMutation({
		mutationFn: async (template: string) =>
			runQuickDeploy({
				template,
				leaseHours: Number.parseInt(leaseHours, 10) || 4,
			}),
		onSuccess: async (result) => {
			if (result.noOp) {
				toast.message("Deployment already in desired state", {
					description: result.deploymentName,
				});
			} else {
				toast.success("Quick deployment queued", {
					description: result.deploymentName,
				});
			}
			await queryClient.invalidateQueries({
				queryKey: queryKeys.dashboardSnapshot(),
			});
			await navigate({
				to: "/dashboard/deployments/$deploymentId",
				params: { deploymentId: result.deploymentId },
				search: { tab: "logs" } as any,
			});
		},
		onError: (err) =>
			toast.error("Quick deploy failed", {
				description: err instanceof Error ? err.message : String(err),
			}),
	});

	const templates = catalogQ.data?.templates ?? [];
	const leaseOptions =
		lifetimePolicyQ.data?.allowedHours &&
		lifetimePolicyQ.data.allowedHours.length > 0
			? lifetimePolicyQ.data.allowedHours
			: catalogQ.data?.leaseOptions && catalogQ.data.leaseOptions.length > 0
				? catalogQ.data.leaseOptions
				: [4, 8, 24, 72];
	const loadError =
		catalogQ.error instanceof Error
			? catalogQ.error.message
			: catalogQ.error
				? String(catalogQ.error)
				: "";

	return (
		<div className="mx-auto w-full max-w-6xl space-y-6 p-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold tracking-tight">Quick Deploy</h1>
				<p className="text-sm text-muted-foreground">
					One-click curated labs using the in-app Forward cluster and managed
					credentials.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Lease Duration</CardTitle>
					<CardDescription>
						Labs are automatically lease-bound and can be extended later from
						the Deployments page.
					</CardDescription>
				</CardHeader>
				<CardContent className="max-w-xs">
					<div className="space-y-2">
						<Label>Duration</Label>
						<Select value={leaseHours} onValueChange={setLeaseHours}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{leaseOptions.map((hours) => (
									<SelectItem key={String(hours)} value={String(hours)}>
										{hours} hours
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{catalogQ.isError ? (
					<Card className="md:col-span-2 xl:col-span-3">
						<CardHeader>
							<CardTitle>Quick Deploy Unavailable</CardTitle>
							<CardDescription>
								{loadError ||
									"Quick Deploy is not enabled for this environment."}
							</CardDescription>
						</CardHeader>
					</Card>
				) : null}
				{templates.map((entry) => (
					<Card key={entry.id} className="flex h-full flex-col">
						<CardHeader>
							<CardTitle>{entry.name}</CardTitle>
							<CardDescription>{entry.description}</CardDescription>
						</CardHeader>
						<CardContent className="mt-auto space-y-3">
							<div className="text-xs">
								<div className="font-medium text-foreground">
									{entry.estimate?.supported
										? formatEstimate(
												Number(entry.estimate.vcpu ?? 0),
												Number(entry.estimate.ramGiB ?? 0),
											)
										: "Resource estimate unavailable"}
								</div>
								{entry.estimate?.reason ? (
									<div className="text-muted-foreground">
										{entry.estimate.reason}
									</div>
								) : null}
							</div>
							<p className="text-xs text-muted-foreground">{entry.template}</p>
							<Button
								className="w-full"
								onClick={() => deployMutation.mutate(entry.template)}
								disabled={catalogQ.isLoading || deployMutation.isPending}
							>
								{deployMutation.isPending ? "Deploying..." : "Deploy"}
							</Button>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
