import { describe, expect, it } from "vitest";
import { buildPaletteBaseItems } from "./use-lab-designer-derived";

describe("buildPaletteBaseItems", () => {
	it("returns enabled catalog rows only", () => {
		const items = buildPaletteBaseItems({
			registryCatalogImages: [
				{
					repository: "ghcr.io/example/kubevirt/juniper_vsrx",
					kind: "vsrx",
					role: "firewall",
					defaultTag: "26.4.0-03",
					enabled: true,
				},
				{
					repository: "ghcr.io/example/kubevirt/vr-n9kv",
					kind: "vr-n9kv",
					role: "switch",
					defaultTag: "latest",
					enabled: false,
				},
			],
			registryRepos: [
				"ghcr.io/example/kubevirt/juniper_vsrx",
				"ghcr.io/example/kubevirt/vr-n9kv",
				"ghcr.io/example/kubevirt/juniper_vjunos-router",
			],
		});

		expect(
			items.some(
				(item) => item.repo === "ghcr.io/example/kubevirt/juniper_vsrx",
			),
		).toBe(true);
		expect(
			items.some(
				(item) =>
					item.repo === "ghcr.io/example/kubevirt/juniper_vjunos-router",
			),
		).toBe(false);
		expect(
			items.some((item) => item.repo === "ghcr.io/example/kubevirt/vr-n9kv"),
		).toBe(false);
	});

	it("returns an empty palette when no catalog rows are enabled", () => {
		const items = buildPaletteBaseItems({
			registryCatalogImages: [],
			registryRepos: [],
		});

		expect(items).toEqual([]);
	});
});
