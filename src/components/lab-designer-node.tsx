import type { DesignNode } from "@/components/lab-designer-types";
import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Cpu, Server, Shield } from "lucide-react";

export function DesignerNode(props: NodeProps<DesignNode>) {
	const kind = String(props.data?.kind ?? "");
	const label = String(props.data?.label ?? props.id);
	const kindLower = kind.toLowerCase();
	const isFirewall =
		kindLower.includes("forti") ||
		kindLower.includes("vsrx") ||
		kindLower.includes("srx") ||
		kindLower.includes("asa") ||
		kindLower.includes("pan");
	const isHost = kindLower.includes("linux") || kindLower.includes("host");
	const Icon = isFirewall ? Shield : isHost ? Server : Cpu;
	const accent = isFirewall
		? "border-amber-500/60"
		: isHost
			? "border-emerald-500/60"
			: "border-sky-500/60";

	return (
		<div
			data-selected={props.selected ? "true" : "false"}
			className={[
				"rounded-xl border bg-background/95 px-3 py-2 shadow-sm min-w-[140px] transition-shadow",
				props.selected ? "ring-2 ring-primary/70 shadow-md" : "",
				accent,
			].join(" ")}
		>
			<Handle type="target" position={Position.Top} />
			<Handle type="target" position={Position.Left} />
			<Handle type="source" position={Position.Right} />
			<Handle type="source" position={Position.Bottom} />
			<div className="flex items-start gap-2">
				<div className="mt-0.5 rounded-md border bg-muted p-1.5">
					<Icon className="h-4 w-4" />
				</div>
				<div className="min-w-0">
					<div className="font-medium leading-tight truncate flex items-center gap-2">
						<span className="truncate">{label}</span>
						{props.selected ? (
							<span className="rounded-full border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
								Selected
							</span>
						) : null}
					</div>
					<div className="text-[11px] text-muted-foreground truncate">
						{kind || "node"}
					</div>
				</div>
			</div>
		</div>
	);
}
