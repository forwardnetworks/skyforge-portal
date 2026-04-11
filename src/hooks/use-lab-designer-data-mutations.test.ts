import { describe, expect, it } from "vitest";
import {
	buildDesignerSidecarStateForSave,
	extractPreservedDesignerSidecarFields,
} from "./use-lab-designer-data-mutations";

describe("designer sidecar helpers", () => {
	it("extracts unknown sidecar fields for round-trip preservation", () => {
		const preserved = extractPreservedDesignerSidecarFields({
			version: 1,
			labName: "lab",
			defaultKind: "ceos",
			nodes: [],
			edges: [],
			viewport: { x: 1, y: 2, zoom: 1.2 },
			annotations: [{ id: "a1" }],
			groups: [{ id: "g1" }],
			customLayoutHints: { compact: true },
		});

		expect(preserved.groups).toBeUndefined();
		expect(preserved.customLayoutHints).toEqual({ compact: true });
		expect(preserved.version).toBeUndefined();
		expect(preserved.annotations).toBeUndefined();
	});

	it("builds save payload with preserved fields and current canonical fields", () => {
		const payload = buildDesignerSidecarStateForSave({
			labName: "new-lab",
			defaultKind: "vr-n9kv",
			viewport: { x: 10, y: 20, zoom: 0.9 },
			nodes: [{ id: "r1", x: 10, y: 20 }],
			edges: [{ id: "e1", source: "r1", target: "r2" }],
			preserved: {
				customLayoutHints: { compact: true },
			},
			annotations: [{ id: "a2", title: "A", text: "txt", x: 1, y: 2 }],
			groups: [{ id: "g2", label: "Group", nodeIds: ["r1"] }],
		});

		expect(payload.customLayoutHints).toEqual({ compact: true });
		expect(payload.annotations).toEqual([
			{ id: "a2", title: "A", text: "txt", x: 1, y: 2 },
		]);
		expect(payload.groups).toEqual([{ id: "g2", label: "Group", nodeIds: ["r1"] }]);
		expect(payload.labName).toBe("new-lab");
		expect(payload.defaultKind).toBe("vr-n9kv");
		expect(payload.version).toBe(1);
		expect(Array.isArray(payload.nodes)).toBe(true);
		expect(Array.isArray(payload.edges)).toBe(true);
	});
});
