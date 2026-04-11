import { describe, expect, it } from "vitest";
import { buildLocalLoginUrl, sanitizeNextPath } from "./skyforge-config";

describe("sanitizeNextPath", () => {
	it("keeps dashboard targets", () => {
		expect(sanitizeNextPath("/dashboard/labs/designer?foo=1#pane")).toBe(
			"/dashboard/labs/designer?foo=1#pane",
		);
	});

	it("falls back for login and auth paths", () => {
		expect(sanitizeNextPath("/login/local?next=%2Fdashboard", "/dashboard")).toBe(
			"/dashboard",
		);
		expect(sanitizeNextPath("/api/auth/oidc/login?next=%2Fdashboard", "/")).toBe(
			"/",
		);
	});

	it("rejects non-root-relative values", () => {
		expect(sanitizeNextPath("https://example.com/pwn", "/dashboard")).toBe(
			"/dashboard",
		);
		expect(sanitizeNextPath("dashboard", "/dashboard")).toBe("/dashboard");
	});
});

describe("buildLocalLoginUrl", () => {
	it("sanitizes recursive next routes", () => {
		expect(buildLocalLoginUrl("/login/local?next=%2Flogin%2Flocal")).toBe(
			"/login/local?next=%2F",
		);
	});
});
