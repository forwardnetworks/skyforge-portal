import { cn } from "@/lib/utils";
import { useMemo } from "react";

export type LinePoint = { x: string; y: number };

function clamp(n: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, n));
}

export function SimpleLineChart({
	points,
	className,
	strokeClassName = "stroke-foreground",
	fillClassName = "fill-muted/30",
}: {
	points: LinePoint[];
	className?: string;
	strokeClassName?: string;
	fillClassName?: string;
}) {
	const { path, area } = useMemo(() => {
		if (!points.length) return { path: "", area: "" };
		const ys = points.map((p) => p.y).filter((v) => Number.isFinite(v));
		const minY = ys.length ? Math.min(...ys) : 0;
		const maxY = ys.length ? Math.max(...ys) : 1;
		const span = maxY - minY || 1;
		const W = 100;
		const H = 40;
		const coords = points.map((p, idx) => {
			const x = points.length <= 1 ? 0 : (idx / (points.length - 1)) * W;
			const y = H - ((p.y - minY) / span) * H;
			return { x, y: clamp(y, 0, H) };
		});
		const d = coords
			.map(
				(c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`,
			)
			.join(" ");
		const a = `${d} L ${W} ${H} L 0 ${H} Z`;
		return { path: d, area: a };
	}, [points]);

	if (!points.length) {
		return (
			<div
				className={cn(
					"flex h-24 items-center justify-center rounded-md border text-xs text-muted-foreground",
					className,
				)}
			>
				No data
			</div>
		);
	}

	return (
		<svg
			viewBox="0 0 100 40"
			preserveAspectRatio="none"
			className={cn("h-24 w-full rounded-md border bg-background", className)}
			role="img"
			aria-label="Trend chart"
		>
			<title>Trend chart</title>
			<path d={area} className={cn(fillClassName)} />
			<path
				d={path}
				className={cn("fill-none stroke-[1.25]", strokeClassName)}
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	);
}
