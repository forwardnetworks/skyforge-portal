// @vitest-environment node

import { zipSync, strToU8 } from "fflate";
import { describe, expect, it } from "vitest";

import {
	readImportedTopologyArchiveData,
	readImportedTopologyUpload,
} from "./lab-designer-import-archive";

describe("readImportedTopologyUpload", () => {
	it("extracts topology and sidecar files from a zip archive", async () => {
		const zipBytes = zipSync({
			"bundle/topology.clab.yml": strToU8(
				"name: demo\ntopology:\n  nodes:\n    r1:\n      startup-config: configs/r1.cfg\n",
			),
			"bundle/configs/r1.cfg": strToU8("hostname r1\n"),
			"bundle/readme.md": strToU8("# demo\n"),
		});

		const out = readImportedTopologyArchiveData(
			zipBytes.buffer.slice(
				zipBytes.byteOffset,
				zipBytes.byteOffset + zipBytes.byteLength,
			),
			"demo.zip",
			"containerlab",
		);

		expect(out.filename).toBe("bundle/topology.clab.yml");
		expect(out.topologyYAML).toContain("startup-config: configs/r1.cfg");
		expect(out.displayName).toContain("demo.zip -> bundle/topology.clab.yml + 2 sidecars");
		expect(out.sidecarFiles).toEqual({
			"bundle/configs/r1.cfg": "hostname r1\n",
			"bundle/readme.md": "# demo\n",
		});
	});

	it("passes through plain text topology files", async () => {
		const file = new File(["name: demo\nnodes: {}\n"], "demo.clab.yml", {
			type: "text/yaml",
		});

		const out = await readImportedTopologyUpload(file, "auto");

		expect(out.filename).toBe("demo.clab.yml");
		expect(out.displayName).toBe("demo.clab.yml");
		expect(out.sidecarFiles).toBeUndefined();
	});
});
