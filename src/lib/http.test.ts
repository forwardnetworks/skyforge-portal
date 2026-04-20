import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	ApiError,
	apiFetch,
	resetUnauthorizedRedirectStateForTests,
} from "./http";
import { setRuntimeAuthMode } from "./skyforge-config";

describe("apiFetch unauthorized handling", () => {
	const originalLocation = window.location;

	beforeEach(() => {
		resetUnauthorizedRedirectStateForTests();
		setRuntimeAuthMode("oidc");
		vi.restoreAllMocks();
		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				pathname: "/dashboard/deployments",
				search: "?tab=active",
				replace: vi.fn(),
			},
		});
	});

	afterEach(() => {
		resetUnauthorizedRedirectStateForTests();
		setRuntimeAuthMode(null);
		Object.defineProperty(window, "location", {
			configurable: true,
			value: originalLocation,
		});
	});

	it("redirects in auto mode on protected routes", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response("expired", { status: 401 }))
			.mockResolvedValueOnce(new Response("", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(apiFetch("/api/tooling/catalog")).rejects.toBeInstanceOf(ApiError);
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchMock).toHaveBeenNthCalledWith(
			1,
			"/api/tooling/catalog",
			expect.objectContaining({
				credentials: "include",
				headers: { "Content-Type": "application/json" },
			}),
		);
		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/auth/logout",
			expect.objectContaining({
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			}),
		);
		expect(window.location.replace).toHaveBeenCalledWith(
			"/api/auth/oidc/login?next=%2Fdashboard%2Fdeployments%3Ftab%3Dactive",
		);
	});

	it("redirects when authRedirect is explicitly always", async () => {
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response("expired", { status: 401 }))
			.mockResolvedValueOnce(new Response("", { status: 200 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(
			apiFetch("/api/tooling/catalog", { authRedirect: "always" }),
		).rejects.toBeInstanceOf(ApiError);
		await Promise.resolve();
		await Promise.resolve();

		expect(fetchMock).toHaveBeenNthCalledWith(
			2,
			"/api/auth/logout",
			expect.objectContaining({
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: "{}",
			}),
		);
		expect(window.location.replace).toHaveBeenCalledWith(
			"/api/auth/oidc/login?next=%2Fdashboard%2Fdeployments%3Ftab%3Dactive",
		);
	});

	it("does not redirect when already on a login route", async () => {
		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				pathname: "/login/local",
				search: "?next=%2Fdashboard",
				replace: vi.fn(),
			},
		});
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response("expired", { status: 401 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(apiFetch("/api/tooling/catalog")).rejects.toBeInstanceOf(ApiError);
		await Promise.resolve();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(window.location.replace).not.toHaveBeenCalled();
	});

	it("does not redirect in auto mode on non-protected routes", async () => {
		Object.defineProperty(window, "location", {
			configurable: true,
			value: {
				pathname: "/",
				search: "",
				replace: vi.fn(),
			},
		});
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response("expired", { status: 401 }));
		vi.stubGlobal("fetch", fetchMock);

		await expect(apiFetch("/api/tooling/catalog")).rejects.toBeInstanceOf(ApiError);
		await Promise.resolve();

		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(window.location.replace).not.toHaveBeenCalled();
	});
});
