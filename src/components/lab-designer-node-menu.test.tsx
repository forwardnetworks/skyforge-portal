import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LabDesignerNodeMenu } from "./lab-designer-node-menu";

describe("LabDesignerNodeMenu", () => {
	it("selects node, clears edge selection, and opens node inspector on edit", () => {
		const closeMenus = vi.fn();
		const setSelectedNodeId = vi.fn();
		const setSelectedEdgeId = vi.fn();
		const setInspectorTab = vi.fn();
		const ensureInspectorVisible = vi.fn();

		render(
			<LabDesignerNodeMenu
				nodeMenu={{ x: 10, y: 10, nodeId: "r1" }}
				nodes={[
					{
						id: "r1",
						position: { x: 0, y: 0 },
						type: "designerNode",
						data: { label: "r1", kind: "ceos", image: "", interfaces: [] },
					},
				]}
				edges={[]}
				closeMenus={closeMenus}
				setSelectedNodeId={setSelectedNodeId}
				importDeploymentId=""
				openImportedTool={vi.fn()}
				renameNode={vi.fn()}
				setNodes={vi.fn()}
				setEdges={vi.fn()}
				selectedNodeId=""
				selectedEdgeId="e1"
				setLinkMode={vi.fn()}
				setPendingLinkSource={vi.fn()}
				setSelectedEdgeId={setSelectedEdgeId}
				setInspectorTab={setInspectorTab}
				ensureInspectorVisible={ensureInspectorVisible}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Edit…" }));

		expect(setSelectedNodeId).toHaveBeenCalledWith("r1");
		expect(setSelectedEdgeId).toHaveBeenCalledWith("");
		expect(ensureInspectorVisible).toHaveBeenCalled();
		expect(setInspectorTab).toHaveBeenCalledWith("node");
		expect(closeMenus).toHaveBeenCalled();
	});
});
