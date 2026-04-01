import { describe, expect, it } from "vitest";
import {
	getAvailableSettingsSections,
	normalizeSettingsSection,
} from "./settings-sections";

describe("settings section helpers", () => {
	it("hides admin sections for user-only sessions", () => {
		const sections = getAvailableSettingsSections(false);
		expect(sections.map((section) => section.id)).toEqual(["profile"]);
	});

	it("exposes all sections for admin-capable sessions", () => {
		const sections = getAvailableSettingsSections(true);
		expect(sections.map((section) => section.id)).toEqual([
			"profile",
			"identity",
			"integrations",
			"forward",
			"runtime",
			"users",
			"maintenance",
		]);
	});

	it("maps the legacy admin tab to the users section", () => {
		expect(
			normalizeSettingsSection({
				legacyTab: "admin",
				canAccessAdminSections: true,
			}),
		).toBe("users");
	});

	it("falls back to profile when a user cannot access an admin section", () => {
		expect(
			normalizeSettingsSection({
				section: "runtime",
				canAccessAdminSections: false,
			}),
		).toBe("profile");
	});
});
