import { AlertTriangle } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";

export type PlatformWarningView = {
	code?: string;
	severity?: string;
	summary?: string;
	recommendedAction?: string;
};

export function PlatformWarningsCard(props: {
	title?: string;
	description?: string;
	warnings?: PlatformWarningView[] | null;
}) {
	const warnings = (props.warnings ?? []).filter((item) => item && item.summary);
	if (warnings.length === 0) {
		return null;
	}
	return (
		<Card className="border-amber-500/40 bg-amber-500/5">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<AlertTriangle className="h-4 w-4" />
					{props.title ?? "Platform warnings"}
				</CardTitle>
				{props.description ? (
					<CardDescription>{props.description}</CardDescription>
				) : null}
			</CardHeader>
			<CardContent className="space-y-3 text-sm">
				{warnings.map((warning) => (
					<div key={warning.code ?? warning.summary} className="rounded-md border border-border/60 bg-background/70 p-3">
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant={warning.severity === "error" ? "destructive" : "secondary"}>
								{warning.severity ?? "warning"}
							</Badge>
							{warning.code ? (
								<span className="font-mono text-xs text-muted-foreground">
									{warning.code}
								</span>
							) : null}
						</div>
						<div className="mt-2 font-medium">{warning.summary}</div>
						{warning.recommendedAction ? (
							<div className="mt-1 text-xs text-muted-foreground">
								{warning.recommendedAction}
							</div>
						) : null}
					</div>
				))}
			</CardContent>
		</Card>
	);
}
