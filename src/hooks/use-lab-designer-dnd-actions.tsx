import type { DesignNodeData } from "@/components/lab-designer-types";
import { resolveRepoTag } from "@/hooks/lab-designer-utils";
import type { Node } from "@xyflow/react";
import type { DragEvent } from "react";
import {
	type LabDesignerActionsOptions,
	type LabDesignerPaletteItem,
	labDesignerPaletteMimeType,
} from "./lab-designer-action-types";

export function createLabDesignerDndActions(opts: LabDesignerActionsOptions) {
	const onDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	};

	const onDrop = async (event: DragEvent) => {
		event.preventDefault();
		if (!opts.rfRef.current || !opts.rfInstance) return;
		const payload =
			event.dataTransfer.getData(labDesignerPaletteMimeType) ||
			event.dataTransfer.getData("text/plain");
		const parsed: LabDesignerPaletteItem | null = payload
			? (() => {
					try {
						return JSON.parse(payload) as LabDesignerPaletteItem;
					} catch {
						return null;
					}
				})()
			: null;
		const kind = parsed?.kind;
		if (!kind) return;

		const rect = opts.rfRef.current.getBoundingClientRect();
		const position = opts.rfInstance.screenToFlowPosition({
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		});

		const role = parsed?.role;
		const idBase =
			role === "host"
				? "h"
				: role === "router"
					? "r"
					: role === "switch"
						? "s"
						: role === "firewall"
							? "f"
							: kind === "linux"
								? "h"
								: "n";
		let i = opts.nodes.length + 1;
		let id = `${idBase}${i}`;
		const used = new Set(opts.nodes.map((n) => n.id));
		while (used.has(id)) {
			i++;
			id = `${idBase}${i}`;
		}

		const repo = String(parsed?.repo ?? "").trim();
		const explicitImage = String(parsed?.image ?? "").trim();
		const fallbackTag = String(parsed?.defaultTag ?? "").trim();
		const tag =
			fallbackTag ||
			(repo
				? await resolveRepoTag({ repo, queryClient: opts.queryClient })
				: "");
		const image = explicitImage || (repo ? `${repo}:${tag}` : "");

		const next: Node<DesignNodeData> = {
			id,
			position,
			data: { label: id, kind, image, interfaces: [] },
			type: "designerNode",
		};
		opts.markWarningsVisible();
		opts.setNodes((prev) => [...prev, next]);
		opts.setSelectedNodeId(id);
		opts.setInspectorTab("node");
	};

	return {
		onDragOver,
		onDrop,
	};
}
