import { createLabDesignerDndActions } from "@/hooks/use-lab-designer-dnd-actions";
import { labDesignerPaletteMimeType } from "@/hooks/lab-designer-action-types";
import { describe, expect, it, vi } from "vitest";

describe("createLabDesignerDndActions", () => {
	it("uses viewport coordinates for drop position mapping", async () => {
		const screenToFlowPosition = vi.fn().mockReturnValue({ x: 123, y: 456 });
		const setNodes = vi.fn((updater: any) => {
			const next = updater([]);
			expect(next[0].position).toEqual({ x: 123, y: 456 });
		});

		const actions = createLabDesignerDndActions({
			queryClient: {} as any,
			rfRef: {
				current: {
					getBoundingClientRect: () => ({ left: 1000, top: 1000 }) as DOMRect,
				} as HTMLDivElement,
			},
			rfInstance: { screenToFlowPosition } as any,
			nodes: [],
			edges: [],
			setNodes,
			setSelectedNodeId: vi.fn(),
			setSelectedEdgeId: vi.fn(),
			setInspectorTab: vi.fn(),
			markWarningsVisible: vi.fn(),
		} as any);

		const payload = JSON.stringify({
			kind: "linux",
			role: "host",
			image: "ghcr.io/example/linux:latest",
		});
		const event = {
			preventDefault: vi.fn(),
			clientX: 320,
			clientY: 240,
			dataTransfer: {
				getData: (mime: string) =>
					mime === labDesignerPaletteMimeType ? payload : "",
			},
		} as any;

		await actions.onDrop(event);

		expect(screenToFlowPosition).toHaveBeenCalledWith({ x: 320, y: 240 });
		expect(setNodes).toHaveBeenCalled();
	});
});
