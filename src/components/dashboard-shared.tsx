import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function formatCount(value: number | undefined): string {
	return (value ?? 0).toLocaleString();
}

export function titleize(value: string): string {
	return value.replace(/[-_]/g, " ");
}

export function formatMode(value: string | null | undefined): string {
	if (!value) return "unreported";
	return titleize(value);
}

export function dashboardModeGuidanceEntryID(mode: string | undefined): string {
	switch (mode) {
		case "curated-demo":
			return "dashboard-advanced-posture-mode-curated-demo";
		case "training":
			return "dashboard-advanced-posture-mode-training";
		case "sandbox":
			return "dashboard-advanced-posture-mode-sandbox";
		case "persistent-integration":
			return "dashboard-advanced-posture-mode-persistent-integration";
		case "admin-advanced":
			return "dashboard-advanced-posture-mode-admin-advanced";
		default:
			return "dashboard-advanced-posture-mode-unresolved";
	}
}

export function MetricCard(props: {
	title: string;
	value: string;
	description: string;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">{props.title}</CardTitle>
				<CardDescription>{props.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="text-3xl font-semibold tracking-tight">{props.value}</div>
			</CardContent>
		</Card>
	);
}

export function QuotaTile(props: {
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-lg border border-border/60 bg-background/60 p-3">
			<div className="text-xs uppercase tracking-wide text-muted-foreground">
				{props.label}
			</div>
			<div className="mt-1 text-lg font-semibold">{props.value}</div>
		</div>
	);
}

export function StatusBadge(props: { text: string }) {
	return <Badge variant="outline">{titleize(props.text)}</Badge>;
}
