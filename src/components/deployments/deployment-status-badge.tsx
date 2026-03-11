import { Badge } from "@/components/ui/badge";

export function DeploymentStatusBadge({
	status,
	size = "default",
}: {
	status: string;
	size?: "default" | "xs";
}) {
	let variant: "default" | "secondary" | "destructive" | "outline" =
		"secondary";
	const s = status.toLowerCase();
	const label = s === "crashloopbackoff" ? "crashloop" : status;
	if (
		[
			"running",
			"active",
			"healthy",
			"succeeded",
			"success",
			"queued",
			"bringing up",
			"shutting down",
			"destroying",
		].includes(s)
	)
		variant = "default";
	if (["failed", "error", "crashloopbackoff"].includes(s))
		variant = "destructive";
	return (
		<Badge
			variant={variant}
			className={`capitalize ${size === "xs" ? "px-1.5 py-0 text-[10px] h-5" : ""}`}
		>
			{label}
		</Badge>
	);
}
