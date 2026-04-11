import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LabDesignerEdgeMenu } from "./lab-designer-edge-menu";

describe("LabDesignerEdgeMenu", () => {
	it("keeps edge label and edge.data.label in sync on rename", () => {
		const closeMenus = vi.fn();
		const setSelectedEdgeId = vi.fn();
		const setSelectedNodeId = vi.fn();
		const setInspectorTab = vi.fn();
		const ensureInspectorVisible = vi.fn();
		const setEdges = vi.fn((updater: any) => {
			const next = updater([
				{
					id: "e1",
					source: "r1",
					target: "r2",
					label: "old",
					data: { label: "old" },
				},
			]);
			expect(next[0].label).toBe("new-label");
			expect(next[0].data?.label).toBe("new-label");
		});
		const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("new-label");

		render(
			<LabDesignerEdgeMenu
				edgeMenu={{ x: 10, y: 10, edgeId: "e1" }}
				edges={[
					{
						id: "e1",
						source: "r1",
						target: "r2",
						label: "old",
						data: { label: "old" },
					},
				]}
				setEdges={setEdges}
				closeMenus={closeMenus}
				selectedEdgeId=""
				setSelectedEdgeId={setSelectedEdgeId}
				setSelectedNodeId={setSelectedNodeId}
				setInspectorTab={setInspectorTab}
				ensureInspectorVisible={ensureInspectorVisible}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Rename…" }));

		expect(promptSpy).toHaveBeenCalled();
		expect(setEdges).toHaveBeenCalled();
		expect(closeMenus).toHaveBeenCalled();
		promptSpy.mockRestore();
	});

	it("opens link inspector on edit", () => {
		const closeMenus = vi.fn();
		const setSelectedEdgeId = vi.fn();
		const setSelectedNodeId = vi.fn();
		const setInspectorTab = vi.fn();
		const ensureInspectorVisible = vi.fn();

		render(
			<LabDesignerEdgeMenu
				edgeMenu={{ x: 10, y: 10, edgeId: "e1" }}
				edges={[
					{
						id: "e1",
						source: "r1",
						target: "r2",
						label: "old",
						data: { label: "old" },
					},
				]}
				setEdges={vi.fn()}
				closeMenus={closeMenus}
				selectedEdgeId=""
				setSelectedEdgeId={setSelectedEdgeId}
				setSelectedNodeId={setSelectedNodeId}
				setInspectorTab={setInspectorTab}
				ensureInspectorVisible={ensureInspectorVisible}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Edit…" }));

		expect(setSelectedEdgeId).toHaveBeenCalledWith("e1");
		expect(setSelectedNodeId).toHaveBeenCalledWith("");
		expect(ensureInspectorVisible).toHaveBeenCalled();
		expect(setInspectorTab).toHaveBeenCalledWith("link");
		expect(closeMenus).toHaveBeenCalled();
	});
});
