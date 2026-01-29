import { Button } from "@/components/ui/button";
import { getDeploymentNodeDescribe } from "@/lib/skyforge-api";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useMemo } from "react";

type Props = {
	workspaceId: string;
	deploymentId: string;
	nodeId: string;
	nodeKind?: string;
	nodeIp?: string;
	onClose?: () => void;
	className?: string;
};

export function NodeDescribeView({
	workspaceId,
	deploymentId,
	nodeId,
	nodeKind,
	nodeIp,
	onClose,
	className,
}: Props) {
	const title = useMemo(() => {
		const parts = [nodeId];
		if (nodeKind) parts.push(String(nodeKind));
		return parts.join(" • ");
	}, [nodeId, nodeKind]);

	const data = useQuery({
		queryKey: ["deploymentNodeDescribe", workspaceId, deploymentId, nodeId],
		enabled: !!workspaceId && !!deploymentId && !!nodeId,
		queryFn: async () =>
			getDeploymentNodeDescribe(workspaceId, deploymentId, nodeId),
		refetchOnWindowFocus: false,
		retry: 1,
	});

	return (
		<div className={`flex flex-col h-full w-full ${className ?? ""}`}>
			<div className="flex items-center justify-between gap-2 p-2 border-b bg-muted/40 text-xs">
				<div className="truncate flex items-center gap-2">
					<span className="font-mono font-medium">{title}</span>
					{nodeIp ? (
						<span className="font-mono text-muted-foreground">{nodeIp}</span>
					) : null}
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						className="h-7"
						onClick={() => data.refetch()}
						disabled={data.isFetching}
					>
						<RefreshCw
							className={
								data.isFetching ? "mr-2 h-3 w-3 animate-spin" : "mr-2 h-3 w-3"
							}
						/>
						Refresh
					</Button>
					{onClose ? (
						<Button variant="ghost" size="sm" className="h-7" onClick={onClose}>
							Close
						</Button>
					) : null}
				</div>
			</div>
			<div className="flex-1 overflow-auto bg-muted/10 p-4">
				<pre className="text-xs font-mono whitespace-pre-wrap">
					{data.isLoading
						? "Loading…"
						: data.isError
							? `Failed to load node status: ${String(data.error)}`
							: JSON.stringify(data.data ?? {}, null, 2)}
				</pre>
			</div>
		</div>
	);
}
