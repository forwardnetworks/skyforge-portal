import type { TaskLogEntry } from "@/lib/run-events";
import { useEffect, useRef } from "react";

export function DeploymentRunOutput(props: { entries: TaskLogEntry[] }) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		el.scrollTop = el.scrollHeight;
	}, [props.entries.length]);

	if (props.entries.length === 0) {
		return <div className="text-zinc-500">Waiting for output…</div>;
	}

	return (
		<div
			ref={containerRef}
			className="max-h-[65vh] overflow-auto whitespace-pre-wrap"
		>
			{props.entries.map((e, idx) => (
				<div key={`${e.time}-${idx}`}>
					<span className="text-zinc-500 select-none">
						{e.time ? `${e.time} ` : ""}
					</span>
					<span>{e.output}</span>
				</div>
			))}
		</div>
	);
}
