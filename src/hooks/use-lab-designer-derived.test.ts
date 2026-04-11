import { describe, expect, it } from "vitest";
import { buildPaletteBaseItems } from "./use-lab-designer-derived";

describe("buildPaletteBaseItems", () => {
	it("merges enabled catalog rows with discovered registry repos", () => {
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

		expect(items.some((item) => item.repo === "ghcr.io/example/kubevirt/juniper_vsrx")).toBe(true);
		expect(items.some((item) => item.repo === "ghcr.io/example/kubevirt/juniper_vjunos-router")).toBe(true);
		expect(items.some((item) => item.repo === "ghcr.io/example/kubevirt/vr-n9kv")).toBe(false);
	});

	it("falls back to built-in palette items when registry is empty", () => {
		const items = buildPaletteBaseItems({
			registryCatalogImages: [],
			registryRepos: [],
		});

		expect(items.length).toBeGreaterThan(0);
		expect(items.some((item) => item.id === "builtin:linux")).toBe(true);
	});
});
