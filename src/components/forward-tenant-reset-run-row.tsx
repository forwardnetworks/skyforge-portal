import { Badge } from "./ui/badge";

type ForwardTenantResetRun = {
	id?: string;
	mode?: string;
	status?: string;
	updatedAt?: string;
	createdAt?: string;
	requestedBy?: string;
	reason?: string;
};

function formatResetRunTime(value?: string): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(date);
}

function tenantResetBadgeVariant(
	status?: string,
): "secondary" | "default" | "destructive" | "outline" {
	switch (status) {
		case "ready":
			return "default";
		case "failed":
			return "destructive";
		case "requested":
		case "draining":
		case "deleting":
		case "reprovisioning":
		case "validating":
			return "secondary";
		default:
			return "outline";
	}
}

export function ForwardTenantResetRunRow(props: { run: ForwardTenantResetRun }) {
	const { run } = props;
	const displayName = run.mode || "—";
	const requestedBy = run.requestedBy || "—";
	const runTime = formatResetRunTime(run.updatedAt || run.createdAt);

	return (
		<div className="rounded border p-3">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<div className="text-sm font-medium">{displayName}</div>
					<Badge variant={tenantResetBadgeVariant(run.status)}>{run.status}</Badge>
				</div>
				<div className="text-xs text-muted-foreground">{runTime}</div>
			</div>
			<div className="mt-2 text-xs text-muted-foreground">
				Requested by {requestedBy}
				{run.reason ? ` • ${run.reason}` : ""}
			</div>
		</div>
	);
}
