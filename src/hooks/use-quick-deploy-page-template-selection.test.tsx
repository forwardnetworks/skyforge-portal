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
});
