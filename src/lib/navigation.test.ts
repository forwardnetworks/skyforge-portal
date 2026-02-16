import { describe, expect, it } from "vitest";
import {
	type NavFeatures,
	type NavItem,
	getNavigationSections,
	isNavItemActive,
} from "./navigation";

function flattenItems(features?: NavFeatures, isAdmin = false): NavItem[] {
	return getNavigationSections({ features, isAdmin }).flatMap(
		(section) => section.items,
	);
}

function getItemById(items: NavItem[], id: string): NavItem {
	const item = items.find((candidate) => candidate.id === id);
	if (!item) throw new Error(`expected nav item ${id} to exist`);
	return item;
}

describe("navigation model", () => {
	it("hides forward nav entries when forward is disabled", () => {
		const items = flattenItems({
			forwardEnabled: false,
			elasticEnabled: false,
		});
		expect(items.some((item) => item.id === "forward-collector")).toBe(false);
		expect(items.some((item) => item.id === "forward-onprem")).toBe(false);
		expect(items.some((item) => item.id === "fwd")).toBe(false);
		expect(items.some((item) => item.id === "policy-compliance")).toBe(false);
	});

	it("shows forward on-prem entry when forward is enabled", () => {
		const items = flattenItems({
			forwardEnabled: true,
		});
		expect(items.some((item) => item.id === "forward-onprem")).toBe(true);
		const assuranceHub = getItemById(items, "fwd");
		expect(assuranceHub.href).toBe("/dashboard/fwd");
	});

	it("hides admin-only entries for non-admin users", () => {
		const nonAdmin = flattenItems(
			{
				coderEnabled: true,
			},
			false,
		);
		expect(nonAdmin.some((item) => item.id === "coder-admin")).toBe(false);
		expect(nonAdmin.some((item) => item.id === "admin-settings")).toBe(false);
		expect(nonAdmin.some((item) => item.id === "governance")).toBe(false);
	});

	it("matches forward network detail routes as active", () => {
		const items = flattenItems({ forwardEnabled: true });
		const forwardNetworks = getItemById(items, "fwd");
		expect(
			isNavItemActive(
				"/dashboard/fwd/prod-network/assurance-studio",
				forwardNetworks,
			),
		).toBe(true);
		expect(
			isNavItemActive("/dashboard/fwd/prod-network/capacity", forwardNetworks),
		).toBe(true);
		expect(isNavItemActive("/dashboard/deployments", forwardNetworks)).toBe(
			false,
		);
	});
});
