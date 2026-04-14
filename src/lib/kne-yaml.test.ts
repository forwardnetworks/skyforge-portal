import { describe, expect, it } from "vitest";
import { kneYamlToDesign, designToKneYaml } from "./kne-yaml";

describe("kne yaml designer model", () => {
	it("round-trips canonical KNE nodes without legacy containerlab runtime", () => {
		const source = `
name: fabric
provider: kne
nodes:
  leaf1:
    vendor: arista
    model: ceos
    config:
      image: ghcr.io/example/ceos:latest
      startupConfig: configs/leaf1.cfg
    mgmt:
      ipv4: 172.20.20.11
  spine1:
    vendor: arista
    model: ceos
    runtime: KUBEVIRT_VM
    config:
      image: ghcr.io/example/ceos:latest
links:
  - leaf1:
      ifname: eth1
    spine1:
      ifname: eth7
    mtu: 9000
    name: uplink
`;

		const parsed = kneYamlToDesign(source);
		expect(parsed.design.defaultKind).toBe("");
		expect(parsed.design.nodes[0]?.mgmtIpv4).toBe("172.20.20.11");
		expect(parsed.design.nodes[0]?.startupConfig).toEqual({
			mode: "path",
			path: "configs/leaf1.cfg",
		});
		expect(parsed.design.nodes[1]?.runtime).toBe("KUBEVIRT_VM");
		expect(parsed.design.links[0]).toMatchObject({
			source: "leaf1",
			target: "spine1",
			sourceIf: "eth1",
			targetIf: "eth7",
			mtu: 9000,
			label: "uplink",
		});

		const rendered = designToKneYaml(parsed.design);
		expect(rendered.yaml).toContain("provider: kne");
		expect(rendered.yaml).toContain("vendor: arista");
		expect(rendered.yaml).toContain("model: ceos");
		expect(rendered.yaml).toContain("startupConfig: configs/leaf1.cfg");
		expect(rendered.yaml).toContain("runtime: KUBEVIRT_VM");
		expect(rendered.yaml).not.toContain("runtime: containerlab");
		expect(rendered.yaml).toContain("ifname: eth1");
		expect(rendered.yaml).toContain("ifname: eth7");
		expect(rendered.yaml).toContain("mtu: 9000");
	});
});
