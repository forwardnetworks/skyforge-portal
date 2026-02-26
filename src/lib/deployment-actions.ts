export type DeploymentActionKind = "create" | "start" | "stop" | "destroy";

export type DeploymentActionMeta = {
	noOp: boolean;
	reason: string;
};

export function readDeploymentActionMeta(resp: {
	noOp?: unknown;
	reason?: unknown;
}): DeploymentActionMeta {
	return {
		noOp: Boolean(resp.noOp),
		reason: String(resp.reason ?? "").trim(),
	};
}

export function noOpMessageForDeploymentAction(
	action: DeploymentActionKind,
	reason: string,
): string {
	if (reason === "in_flight_duplicate") return "Action already in progress";
	if (reason === "cooldown_suppressed")
		return "Action suppressed briefly to prevent duplicate jobs";
	if (
		(action === "create" || action === "start") &&
		reason === "already_present"
	)
		return "Deployment is already active";
	if (
		(action === "stop" || action === "destroy") &&
		reason === "already_absent"
	)
		return "Deployment is already stopped";
	return "No action required";
}
