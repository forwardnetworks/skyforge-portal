import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LabDesignerCanvasOverlays } from "./lab-designer-canvas-overlays";

describe("LabDesignerCanvasOverlays", () => {
	it("renders projected annotations and active group counts", () => {
		render(
			<LabDesignerCanvasOverlays
				viewport={{ x: 10, y: 20, zoom: 2 }}
				nodes={[
					{
						id: "r1",
						position: { x: 0, y: 0 },
						data: { label: "r1", kind: "linux", image: "" },
						type: "designerNode",
					} as any,
				]}
				annotations={[
					{
						id: "a1",
						title: "Todo",
						text: "Check uplink",
						x: 40,
						y: 30,
					},
				]}
				groups={[
					{
						id: "g1",
						label: "Core",
						nodeIds: ["r1", "r2"],
					},
				]}
			/>,
		);

		expect(screen.getByTestId("designer-group-overlay")).toBeInTheDocument();
		expect(screen.getByText("Core")).toBeInTheDocument();
		expect(screen.getByText("(1/2)")).toBeInTheDocument();

		const annotation = screen.getByTestId("designer-annotation-overlay");
		expect(annotation).toHaveTextContent("Todo");
		expect(annotation).toHaveTextContent("Check uplink");
		expect(annotation).toHaveStyle({ left: "90px", top: "80px" });
	});
});
