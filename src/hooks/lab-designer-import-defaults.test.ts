import {
	defaultLabDesignerImportDir,
	normalizeLabDesignerImportDir,
} from "./lab-designer-import-defaults";
import { describe, expect, it } from "vitest";

describe("lab-designer-import-defaults", () => {
	it("uses netlab for blueprint imports and kne/designer for user imports", () => {
		expect(defaultLabDesignerImportDir("blueprints")).toBe("netlab");
		expect(defaultLabDesignerImportDir("user")).toBe("kne/designer");
	});

	it("normalizes stale blueprint import dirs", () => {
		expect(normalizeLabDesignerImportDir("blueprints", "")).toBe("netlab");
		expect(normalizeLabDesignerImportDir("blueprints", "kne")).toBe("netlab");
		expect(normalizeLabDesignerImportDir("blueprints", "blueprints/netlab")).toBe(
			"netlab",
		);
	});

	it("normalizes stale user import dirs without overriding explicit custom dirs", () => {
		expect(normalizeLabDesignerImportDir("user", "")).toBe("kne/designer");
		expect(normalizeLabDesignerImportDir("user", "kne")).toBe("kne/designer");
		expect(normalizeLabDesignerImportDir("user", "custom/templates")).toBe(
			"custom/templates",
		);
	});
});
