import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useQuickDeployTemplateSelection } from "./use-quick-deploy-page-template-selection";

describe("useQuickDeployTemplateSelection", () => {
	it("does not loop when the catalog is still loading", () => {
		const { result } = renderHook(() =>
			useQuickDeployTemplateSelection({
				requestedMode: "",
				primaryOperatingMode: "",
				allTemplates: [],
				lifetimeAllowedHours: undefined,
				catalogLeaseOptions: undefined,
				catalogError: undefined,
			}),
		);

		expect(result.current.selectedTags).toEqual([]);
		expect(result.current.availableTags).toEqual([]);
		expect(result.current.templates).toEqual([]);
	});

	it("hides untagged templates from the launch catalog", () => {
		const { result } = renderHook(() =>
			useQuickDeployTemplateSelection({
				requestedMode: "",
				primaryOperatingMode: "",
				allTemplates: [
					{
						id: "untagged",
						name: "Untagged",
						description: "",
						template: "labs/untagged/topology.yml",
						resourceClass: "standard",
						resetBaselineMode: "curated-reset",
					},
					{
						id: "training",
						name: "Training",
						description: "",
						template: "labs/training/topology.yml",
						tags: ["training"],
						resourceClass: "standard",
						resetBaselineMode: "curated-reset",
					},
				],
				lifetimeAllowedHours: undefined,
				catalogLeaseOptions: undefined,
				catalogError: undefined,
			}),
		);

		expect(result.current.availableTags).toEqual(["training"]);
		expect(result.current.templates.map((entry) => entry.id)).toEqual([
			"training",
		]);
	});
});
