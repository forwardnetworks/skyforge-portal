import type { CapacityRollupRow } from "@/lib/api-client";
import { useMemo } from "react";

export function useDeploymentCapacityOverview(args: {
	rollups: CapacityRollupRow[];
}) {
	const { rollups } = args;

	return useMemo(() => {
		const util = rollups.filter((row) => row.metric.startsWith("util_"));
		const threshold = 0.85;
		const above = util.filter((row) => (row.max ?? 0) >= threshold).length;
		const soonest = util
			.map((row) => ({ ts: row.forecastCrossingTs ?? "", row }))
			.filter((entry) => entry.ts)
			.sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts))[0]?.row;
		return { above, soonest };
	}, [rollups]);
}
