import { Badge } from "./ui/badge";

export type ConfigChangeSourceOption = {
	value: string;
	label: string;
	executable: boolean;
	description: string;
	defaultSpecJson: string;
};

export const configChangeSourceOptions: ConfigChangeSourceOption[] = [
	{
		value: "change-plan",
		label: "Change Plan",
		executable: true,
		description:
			"Forward-backed change control plan. Render, approve, execute, and verify through one durable workflow instead of direct push primitives.",
		defaultSpecJson:
			'{\n  "name": "edge-routing-change",\n  "description": "promote validated edge routing intent",\n  "deploy": {\n    "backend": "netlab-kne",\n    "templateSource": "blueprints",\n    "template": "BGP/Default-NH/topology.yml",\n    "environment": {\n      "DEVICE": "eos"\n    }\n  },\n  "verify": {\n    "backend": "forward",\n    "networkId": "network-123",\n    "checks": ["Critical reachability"],\n    "diffCategories": ["devices", "checks"]\n  }\n}',
	},
];

export function defaultConfigChangeSpecJson(sourceKind: string): string {
	const match = configChangeSourceOptions.find((item) => item.value === sourceKind);
	return match?.defaultSpecJson ?? configChangeSourceOptions[0]!.defaultSpecJson;
}

export function ConfigField({
	label,
	value,
	badgeVariant,
	mono,
}: {
	label: string;
	value: string;
	badgeVariant?: "default" | "secondary" | "destructive" | "outline";
	mono?: boolean;
}) {
	return (
		<div className="space-y-1">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			{badgeVariant ? (
				<Badge variant={badgeVariant}>{value}</Badge>
			) : (
				<div className={mono ? "font-mono text-sm break-all" : "text-sm"}>
					{value}
				</div>
			)}
		</div>
	);
}

export function statusVariant(
	status: string,
): "default" | "secondary" | "destructive" | "outline" {
	const normalized = status.trim().toLowerCase();
	if (
		normalized === "failed" ||
		normalized === "cancelled" ||
		normalized === "rolled-back"
	) {
		return "destructive";
	}
	if (
		normalized === "approved" ||
		normalized === "rendered" ||
		normalized === "succeeded"
	) {
		return "default";
	}
	if (normalized === "awaiting-approval" || normalized === "queued") {
		return "outline";
	}
	return "secondary";
}
