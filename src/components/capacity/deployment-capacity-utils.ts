export function jsonPretty(value: unknown): string {
	try {
		return JSON.stringify(value, null, 2);
	} catch {
		return String(value);
	}
}

export function downloadText(
	filename: string,
	contentType: string,
	content: string,
) {
	const blob = new Blob([content], { type: contentType });
	const url = URL.createObjectURL(blob);
	try {
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		a.click();
	} finally {
		URL.revokeObjectURL(url);
	}
}

export function csvEscape(value: unknown): string {
	const s = value === null || value === undefined ? "" : String(value);
	if (
		s.includes('"') ||
		s.includes(",") ||
		s.includes("\n") ||
		s.includes("\r")
	) {
		return `"${s.replaceAll('"', '""')}"`;
	}
	return s;
}

export function toCSV(headers: string[], rows: Array<Array<unknown>>): string {
	const lines = [headers.map(csvEscape).join(",")];
	for (const r of rows) lines.push(r.map(csvEscape).join(","));
	return `${lines.join("\n")}\n`;
}

export function parseRFC3339(s: string | undefined): Date | null {
	if (!s) return null;
	const t = Date.parse(s);
	return Number.isFinite(t) ? new Date(t) : null;
}

export function fmtPct01(v: number | undefined): string {
	if (v === undefined) return "—";
	if (!Number.isFinite(v)) return "—";
	return `${(v * 100).toFixed(1)}%`;
}

export function fmtNum(v: number | undefined, digits = 3): string {
	if (v === undefined) return "—";
	if (!Number.isFinite(v)) return "—";
	return v.toFixed(digits);
}

export function fmtSpeedMbps(speedMbps: number | null | undefined): string {
	const n = Number(speedMbps ?? 0);
	if (!Number.isFinite(n) || n <= 0) return "—";
	if (n >= 100_000) return `${(n / 1000).toFixed(0)}G`;
	if (n >= 10_000) return `${(n / 1000).toFixed(0)}G`;
	if (n >= 1000) return `${(n / 1000).toFixed(1)}G`;
	return `${n}M`;
}

export function quantile(values: number[], q: number): number | null {
	if (!values.length) return null;
	const cp = [...values]
		.filter((v) => Number.isFinite(v))
		.sort((a, b) => a - b);
	if (!cp.length) return null;
	if (q <= 0) return cp[0] ?? null;
	if (q >= 1) return cp[cp.length - 1] ?? null;
	const pos = q * (cp.length - 1);
	const lo = Math.floor(pos);
	const hi = Math.ceil(pos);
	if (lo === hi) return cp[lo] ?? null;
	const frac = pos - lo;
	return (cp[lo] ?? 0) * (1 - frac) + (cp[hi] ?? 0) * frac;
}

export function metricToInterfaceType(
	metric: string,
): "UTILIZATION" | "ERROR" | "PACKET_LOSS" {
	if (metric.startsWith("util_")) return "UTILIZATION";
	if (metric.includes("packet_loss")) return "PACKET_LOSS";
	return "ERROR";
}

export function metricToDeviceType(metric: string): "CPU" | "MEMORY" {
	if (metric.includes("memory")) return "MEMORY";
	return "CPU";
}
