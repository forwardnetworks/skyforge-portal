import type { ReactNode } from "react";

export function formatGrowthError(error: unknown): ReactNode {
	if (error instanceof Error) return error.message;
	return String(error);
}

export function renderGrowthDeltaPercent(
	delta: number | null | undefined,
	formatPercent01: (value: number | undefined) => string,
) {
	if (delta === null || delta === undefined) {
		return <span className="text-muted-foreground text-xs">—</span>;
	}
	return (
		<span
			className={
				delta > 0 ? "text-foreground font-medium" : "text-muted-foreground"
			}
		>
			{delta >= 0 ? "+" : ""}
			{formatPercent01(delta)}
		</span>
	);
}
