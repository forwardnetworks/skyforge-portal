import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LabDesignerImportDialog } from "./lab-designer-import-dialog";

describe("LabDesignerImportDialog", () => {
	it("submits generic import using default containerlab source", () => {
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
			/>,
		);

		fireEvent.change(screen.getByPlaceholderText("Paste topology YAML here..."), {
			target: { value: "name: test\ntopology:\n  nodes: {}\n" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Convert + Import" }));

		expect(onImportTopology).toHaveBeenCalledWith({
			source: "containerlab",
			yaml: "name: test\ntopology:\n  nodes: {}\n",
		});
	});

	it("shows last import result summary", () => {
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
				}}
				onImportTopology={vi.fn()}
			/>,
		);

		expect(screen.getByText("Last import result")).toBeInTheDocument();
		expect(screen.getByText("Source: containerlab")).toBeInTheDocument();
		expect(
			screen.getByText("Issues: 0 errors, 1 warnings, 0 info"),
		).toBeInTheDocument();
		expect(screen.getByText("Ready")).toBeInTheDocument();
	});

	it("shows blocking status and unsupported features when source is not enabled", () => {
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
					convertedYAML: "",
					issues: [
						{
							severity: "error",
							code: "source-not-enabled",
							message: "Import source is planned but not enabled yet",
						},
					],
					imageMappings: [],
					unsupportedFeatures: ["source parser unavailable"],
					blocking: true,
				}}
				onImportTopology={vi.fn()}
			/>,
		);

		expect(screen.getByText("Blocking")).toBeInTheDocument();
		expect(
			screen.getByText("Unsupported features: source parser unavailable"),
		).toBeInTheDocument();
	});

	it("shows manual follow-up hints for conversion warnings", () => {
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
					convertedYAML: "name: imported",
					issues: [
						{
							severity: "warning",
							code: "multi-access-link-expanded",
							message: "Network lan10 has 3 endpoints; expanded to star links",
						},
						{
							severity: "warning",
							code: "link-endpoints-skipped",
							message:
								"Network lan10 skipped 1 endpoint(s) from unsupported or unmapped nodes",
						},
						{
							severity: "warning",
							code: "management-network-ignored",
							message:
								"Ignored 1 management endpoint(s) with network_id=0",
						},
					],
					imageMappings: [],
					unsupportedFeatures: [],
					blocking: false,
				}}
				onImportTopology={vi.fn()}
			/>,
		);

		expect(screen.getByText("Manual follow-up")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Review expanded multi-access links and adjust interface pairings if the original topology used shared segments.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Review links with skipped endpoints and reconnect any external attachments manually in the canvas.",
			),
		).toBeInTheDocument();
		expect(
			screen.getByText(
				"Management-only attachments were ignored during import; add equivalent management connectivity manually if required.",
			),
		).toBeInTheDocument();
	});
});
