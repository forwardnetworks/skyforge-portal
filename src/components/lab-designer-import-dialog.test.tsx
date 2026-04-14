import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LabDesignerImportDialog } from "./lab-designer-import-dialog";

describe("LabDesignerImportDialog", () => {
	it("submits external import with uploaded file and auto-detect source", async () => {
		const onImportTopology = vi.fn();
		render(
			<LabDesignerImportDialog
				open
				onOpenChange={vi.fn()}
				userId="user-1"
				importSource="user"
				onImportSourceChange={vi.fn()}
				importDir="kne/designer"
				onImportDirChange={vi.fn()}
				importFile=""
				onImportFileChange={vi.fn()}
				templates={[]}
				templatesLoading={false}
				templatesError={false}
				templatePreview=""
				templatePreviewLoading={false}
				importPending={false}
				onImport={vi.fn()}
				importTopologyPending={false}
				lastImportResult={null}
				onImportTopology={onImportTopology}
				onApplyImportedTopology={vi.fn()}
				canvasHasContent={false}
			/>,
		);

		const fileInput = screen.getByTestId(
			"external-topology-file",
		) as HTMLInputElement;
		const file = new File(["name: test\ntopology:\n  nodes: {}\n"], "sample.clab.yml", {
			type: "text/yaml",
		});
		fireEvent.change(fileInput, { target: { files: [file] } });

		await waitFor(() => {
			expect(screen.getByText(/sample\.clab\.yml/i)).toBeInTheDocument();
		});
		fireEvent.click(screen.getByRole("button", { name: "Convert" }));

		await waitFor(() => {
			expect(onImportTopology).toHaveBeenCalledWith({
				source: undefined,
				yaml: "name: test\ntopology:\n  nodes: {}\n",
				filename: "sample.clab.yml",
			});
		});
	});

	it("shows review state and applies imported topology on confirm", () => {
		const onApplyImportedTopology = vi.fn();
		render(
			<LabDesignerImportDialog
				open
				onOpenChange={vi.fn()}
				userId="user-1"
				importSource="user"
				onImportSourceChange={vi.fn()}
				importDir="kne/designer"
				onImportDirChange={vi.fn()}
				importFile=""
				onImportFileChange={vi.fn()}
				templates={[]}
				templatesLoading={false}
				templatesError={false}
				templatePreview=""
				templatePreviewLoading={false}
				importPending={false}
				onImport={vi.fn()}
				importTopologyPending={false}
				lastImportResult={{
					userId: "user-1",
					source: "containerlab",
					detectedSource: "containerlab",
					convertedYAML: "name: imported",
					issues: [
						{
							severity: "warning",
							code: "validation-warning",
							message: "Link endpoint normalized",
						},
					],
					imageMappings: [
						{
							node: "r1",
							source: "ghcr.io/example/r1:latest",
							matched: true,
						},
					],
					unsupportedFeatures: [],
					blocking: false,
					canImport: true,
					stats: {
						nodes: 2,
						links: 1,
						placeholderNodes: 1,
						warnings: 1,
						errors: 0,
					},
				}}
				onImportTopology={vi.fn()}
				onApplyImportedTopology={onApplyImportedTopology}
				canvasHasContent
			/>,
		);

		expect(screen.getByText("Review converted topology")).toBeInTheDocument();
		expect(screen.getByText("Detected source: containerlab")).toBeInTheDocument();
		expect(screen.getByText("Placeholders: 1")).toBeInTheDocument();
		expect(screen.getByText("Importing will replace the current canvas contents.")).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Replace canvas" }));
		expect(onApplyImportedTopology).toHaveBeenCalledWith("name: imported");
	});

	it("keeps apply disabled when import result is not importable", () => {
		render(
			<LabDesignerImportDialog
				open
				onOpenChange={vi.fn()}
				userId="user-1"
				importSource="user"
				onImportSourceChange={vi.fn()}
				importDir="kne/designer"
				onImportDirChange={vi.fn()}
				importFile=""
				onImportFileChange={vi.fn()}
				templates={[]}
				templatesLoading={false}
				templatesError={false}
				templatePreview=""
				templatePreviewLoading={false}
				importPending={false}
				onImport={vi.fn()}
				importTopologyPending={false}
				lastImportResult={{
					userId: "user-1",
					source: "eve-ng",
					detectedSource: "eve-ng",
					convertedYAML: "",
					issues: [
						{
							severity: "error",
							code: "invalid-source",
							message: "invalid EVE-NG XML",
						},
					],
					imageMappings: [],
					unsupportedFeatures: ["unsupported feature"],
					blocking: true,
					canImport: false,
					stats: {
						nodes: 0,
						links: 0,
						placeholderNodes: 0,
						warnings: 0,
						errors: 1,
					},
				}}
				onImportTopology={vi.fn()}
				onApplyImportedTopology={vi.fn()}
				canvasHasContent={false}
			/>,
		);

		expect(screen.getByText("Unsupported features: unsupported feature")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Import topology" })).toBeDisabled();
	});
});
