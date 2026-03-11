import { NodeDescribeView } from "@/components/node-describe-view";
import { NodeLogsView } from "@/components/node-logs-view";
import { TerminalView } from "@/components/terminal-view";
import type { DeploymentDetailPageState } from "@/hooks/use-deployment-detail-page";

export function DeploymentDetailStandaloneView(props: {
	page: DeploymentDetailPageState;
	action?: string;
	node?: string;
}) {
	const { page, action, node } = props;
	const { deployment, userId, deploymentId } = page;
	if (!action || !node || !deployment) return null;
	if (action === "terminal") {
		return (
			<div className="h-screen w-screen bg-zinc-950 flex flex-col">
				<TerminalView
					userId={userId}
					deploymentId={deploymentId}
					nodeId={node}
					className="flex-1"
				/>
			</div>
		);
	}
	if (action === "logs") {
		return (
			<div className="h-screen w-screen bg-background flex flex-col">
				<NodeLogsView
					userId={userId}
					deploymentId={deploymentId}
					nodeId={node}
					className="flex-1"
				/>
			</div>
		);
	}
	if (action === "describe") {
		return (
			<div className="h-screen w-screen bg-background flex flex-col">
				<NodeDescribeView
					userId={userId}
					deploymentId={deploymentId}
					nodeId={node}
					className="flex-1"
				/>
			</div>
		);
	}
	return null;
}
