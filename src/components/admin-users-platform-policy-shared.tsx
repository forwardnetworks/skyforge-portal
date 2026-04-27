export const platformProfiles = [
	"viewer",
	"demo-user",
	"lab-user",
	"sandbox-user",
	"trainer",
	"integration-user",
	"admin",
] as const;

export type PlatformPolicyProfile = (typeof platformProfiles)[number];

export const profileDescriptions: Record<PlatformPolicyProfile, string> = {
	viewer: "Read-only access to curated platform surfaces.",
	"demo-user": "Constrained demo profile for read-only-style access.",
	"lab-user":
		"Schedule and run curated labs without custom or admin privileges.",
	"sandbox-user": "Launch custom labs and retain sandbox state.",
	trainer: "Provision training environments with broader persistence.",
	"integration-user": "Operate integrations without full admin access.",
	admin: "Full platform policy and operational control.",
};

export const resourceClasses = [
	"small",
	"standard",
	"heavy",
	"demo-foundry",
] as const;
export type PlatformResourceClass = (typeof resourceClasses)[number];

export const resourceClassDescriptions: Record<PlatformResourceClass, string> =
	{
		small: "Lower-cost labs for quick demos and validation.",
		standard: "General-purpose demos with moderate compute profiles.",
		heavy: "Large integrations or multi-device demos needing extra CPU.",
		"demo-foundry":
			"Full Demo Foundry workloads with persistence and analytics.",
	};

export function formatPlatformMode(value: string | null | undefined): string {
	if (!value) return "unreported";
	return value.replace(/[-_]/g, " ");
}

export function PolicyStat(props: { label: string; value: string | number }) {
	return (
		<div className="rounded-lg border border-border/60 bg-background/60 p-3">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{props.label}
			</div>
			<div className="mt-1 text-lg font-semibold">{props.value}</div>
		</div>
	);
}

export function FieldHelp(props: { error?: string; help: string }) {
	if (props.error) {
		return <div className="text-xs text-destructive">{props.error}</div>;
	}
	return <div className="text-xs text-muted-foreground">{props.help}</div>;
}
