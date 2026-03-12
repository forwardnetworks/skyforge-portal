import { parseRFC3339 } from "@/components/capacity/deployment-capacity-utils";
import type { ReactElement } from "react";

export const missingCapacityCell = <span className="text-muted-foreground text-xs">—</span>;

export function isUtilCapacityMetric(metric: string): boolean {
	return metric.startsWith("util_");
}

type ForecastCrossingInfo = {
	readonly isoDate: string;
	readonly days: number;
};

export function getForecastCrossingInfo(
	forecastCrossingTs?: string,
): ForecastCrossingInfo | null {
	if (!forecastCrossingTs) {
		return null;
	}
	const date = parseRFC3339(forecastCrossingTs);
	if (!date) {
		return null;
	}
	return {
		isoDate: forecastCrossingTs.slice(0, 10),
		days: Math.round((date.getTime() - Date.now()) / (24 * 3600 * 1000)),
	};
}

export function renderForecastCrossingCell(
	forecastCrossingTs?: string,
): ReactElement {
	const info = getForecastCrossingInfo(forecastCrossingTs);
	if (!info) {
		return missingCapacityCell;
	}
	return (
		<div className="text-xs">
			<div className="font-mono">{info.isoDate}</div>
			<div className="text-muted-foreground">{info.days}d</div>
		</div>
	);
}

export function renderForecastDaysCell(
	forecastCrossingTs?: string,
): ReactElement {
	const info = getForecastCrossingInfo(forecastCrossingTs);
	if (!info) {
		return missingCapacityCell;
	}
	return <span className="text-xs">{info.days}</span>;
}
