import { describe, expect, it } from "vitest";
import {
	DEFAULT_UI_EXPERIENCE_MODE,
	isAdvancedOnlyPathname,
	isSimpleUIExperienceMode,
	normalizeUIExperienceMode,
} from "./ui-experience";

describe("ui experience helpers", () => {
	it("defaults unknown values to simple mode", () => {
		expect(DEFAULT_UI_EXPERIENCE_MODE).toBe("simple");
		expect(normalizeUIExperienceMode(undefined)).toBe("simple");
		expect(normalizeUIExperienceMode("")).toBe("simple");
		expect(normalizeUIExperienceMode("expert")).toBe("simple");
		expect(isSimpleUIExperienceMode("simple")).toBe(true);
		expect(isSimpleUIExperienceMode("advanced")).toBe(false);
	});

	it("recognizes advanced-only paths", () => {
		expect(isAdvancedOnlyPathname("/dashboard/observability")).toBe(true);
		expect(isAdvancedOnlyPathname("/dashboard/tools/netbox")).toBe(true);
		expect(isAdvancedOnlyPathname("/dashboard/deployments/new")).toBe(true);
		expect(isAdvancedOnlyPathname("/dashboard/deployments")).toBe(false);
		expect(isAdvancedOnlyPathname("/dashboard/reservations")).toBe(false);
	});
});
