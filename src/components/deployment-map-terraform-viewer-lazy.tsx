import type { DeploymentMap } from "@/lib/api-client";
import { lazy, Suspense } from "react";
import { Skeleton } from "./ui/skeleton";

const DeploymentMapTerraformViewerImpl = lazy(async () => {
	const mod = await import("./deployment-map-terraform-viewer");
	return { default: mod.DeploymentMapTerraformViewer };
});

export function DeploymentMapTerraformViewerLazy(props: {
	map: DeploymentMap;
	deploymentId: string;
}) {
	return (
		<Suspense
			fallback={
				<div className="h-full min-h-[560px]">
					<Skeleton className="h-full w-full rounded-xl" />
				</div>
			}
		>
			<DeploymentMapTerraformViewerImpl {...props} />
		</Suspense>
	);
}
