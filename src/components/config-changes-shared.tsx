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
		value: "structured-patch",
		label: "Structured Patch",
		executable: true,
		description:
			"Safe executable lane. RFC 6902 JSON Patch over topology.yml, repackaged into the existing netlab-c9s bundle path.",
		defaultSpecJson: '{\n  "devices": ["leaf-1"],\n  "operations": [\n    {\n      "op": "replace",\n      "path": "/nodes/leaf-1/config/0",\n      "value": "hostname leaf-1"\n    }\n  ]\n}',
	},
	{
		value: "netlab-model",
		label: "Netlab Model",
		executable: true,
		description:
			"Safe executable lane. Model-backed change that reuses the existing template-backed netlab-c9s workflow.",
		defaultSpecJson: '{\n  "templateSource": "blueprints",\n  "template": "BGP/Default-NH/topology.yml",\n  "environment": {\n    "DEVICE": "eos"\n  }\n}',
	},
	{
		value: "config-snippet",
		label: "Config Snippet",
		executable: true,
		description:
			"Executable path. Compiles into generated per-device startup-config sidecars and a patched topology bundle for the same netlab-c9s seam.",
		defaultSpecJson: '{\n  "devices": ["leaf-1"],\n  "snippet": "ip access-list demo\\npermit ip any any"\n}',
	},
	{
		value: "ansible-playbook",
		label: "Ansible Playbook",
		executable: true,
		description:
			"Executable path. Bundles a deterministic post-apply Ansible playbook hook into the same netlab-c9s seam.",
		defaultSpecJson: '{\n  "devices": ["leaf-1"],\n  "playbook": "---\\n- hosts: all\\n  gather_facts: false\\n  tasks: []\\n"\n}',
	},
	{
		value: "shell-script",
		label: "Shell Script",
		executable: true,
		description:
			"Executable path. Bundles a bounded post-apply shell hook into the same topology/bundle-backed netlab-c9s runtime contract.",
		defaultSpecJson: '{\n  "devices": ["leaf-1"],\n  "script": "#!/bin/sh\\necho hello\\n"\n}',
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
